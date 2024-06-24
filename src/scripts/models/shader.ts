import { Optional } from "./../types/optional";
import { FileUtils } from "../utils/file";
import { Log } from "../utils/log";
import { Dictionary } from "../types/dictionary";

export type BufferDataType = Float32Array | Uint16Array | Uint8Array | Int16Array | Int8Array | Uint32Array | Int32Array;
export type BufferDataTypeConstructor = typeof Float32Array | typeof Uint16Array | typeof Uint8Array | typeof Int16Array | typeof Int8Array | typeof Uint32Array | typeof Int32Array;

export type ShaderUniform = {
	location: WebGLUniformLocation,
	type: GLenum
}

export type ShaderBuffer = {
	buffer: WebGLBuffer,
	type: BufferDataTypeConstructor,
	attribute: string,
	target: GLenum,
	usage: GLenum
}

export type ShaderBufferDefinition = {
	data?: BufferDataType | BufferDataTypeConstructor,
	attribute?: string,
	target?: WebGLRenderingContext["ARRAY_BUFFER"] | WebGLRenderingContext["ELEMENT_ARRAY_BUFFER"],
	usage?: WebGLRenderingContext["STATIC_DRAW"] | WebGLRenderingContext["DYNAMIC_DRAW"] | WebGLRenderingContext["STREAM_DRAW"],
	type?: GLenum
};

export type ShaderOptions = {
	source: {
		vertex: string,
		fragment: string
	},
	attributes?: string[],
	uniforms: string[],
	buffers: Dictionary<BufferDataType | BufferDataTypeConstructor | ShaderBufferDefinition>
}

/**
 * Some quality-of-life wrappers around WebGL shaders
 * This makes sooooo much easier to work with shaders
 */
export class Shader {

	private static SPLIT = false;

	private static readonly cache = new Map<string, WebGLShader>();

	private program: Optional<WebGLProgram> = null;

	private buffers: Dictionary<ShaderBuffer> = {};
	private attributes: Dictionary<GLuint> = {};
	private uniforms: Dictionary<ShaderUniform> = {};

	constructor(private gl: WebGLRenderingContext, private name: string) { }

	private preprocessShader(source: string): string {
		let begin = source.indexOf("#version");
		begin = source.indexOf("\n", begin) + 1;

		if (Shader.SPLIT) source = source.insertAt(begin, "\n#define SPLIT\n")

		return source;
	}

	private async loadShader(type: number, url: string): Promise<WebGLShader> {
		Log.info(`Shader-${this.name}`, `Loading shader: ${url}...`);
		if (Shader.cache.has(url)) {
			Log.debug(`Shader-${this.name}`, `Shader cached!`);
			return Shader.cache.get(url)!;
		}

		const source = this.preprocessShader(await FileUtils.load(`shaders/${url}.glsl`));
		const shader = this.gl.createShader(type);
		if (!shader) throw new Error("Could not create shader");

		Log.debug(`Shader-${this.name}`, `Compiling shader: ${url}...`);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);
		if (!this.gl.getShaderParameter(shader, GL.COMPILE_STATUS)) {
			const info = this.gl.getShaderInfoLog(shader);
			this.gl.deleteShader(shader);
			throw new Error(`Could not compile '${url}' for shader '${this.name}': ${info}`);
		}

		Shader.cache.set(url, shader);

		return shader;
	}

    async setup(options: ShaderOptions) {
		await this.setupProgram(options.source.vertex, options.source.fragment);

		this.setupAttributes(options);
		this.setupUniforms(options.uniforms);
		this.setupBuffers(options.buffers);
	}

	private async setupProgram(vertex: string, fragment: string) {
		Log.info(`Shader-${this.name}`, "Loading shader...");
		const vertexShader = await this.loadShader(GL.VERTEX_SHADER, vertex);
		const fragmentShader = await this.loadShader(GL.FRAGMENT_SHADER, fragment);

		Log.debug(`Shader-${this.name}`, "Linking shader program...");
		const program = this.gl.createProgram();
		if (!program) throw new Error(`Could not create shader program for shader '${this.name}'`);

		this.gl.attachShader(program, vertexShader);
		this.gl.attachShader(program, fragmentShader);
		this.gl.linkProgram(program);

		if (!this.gl.getProgramParameter(program, GL.LINK_STATUS)) {
			const info = this.gl.getProgramInfoLog(program);
			this.gl.deleteProgram(program);
			throw new Error(`Could not link shader program for shader '${this.name}': ${info}`);
		}

		this.program = program;
	}

	private setupAttributes(options: ShaderOptions) {
		if (!this.program) throw new Error(`Shader '${this.name}' program not loaded`);

		// Map all the attributes
		const list: string[] = [];
		if (options.attributes) list.push(...options.attributes);
		Object.values(options.buffers)
			  .map(x => typeof x === "object" ? (x as ShaderBufferDefinition).attribute : null)
			  .filter(x => x)
			.forEach(x => list.push(x as string));

		// Not really necessary, since the layout is defined in the shader but it doesn't hurt
		this.attributes = {};
		for (const attribute of list) {
            if (this.attributes.hasOwnProperty(attribute)) continue;

            const location = this.gl.getAttribLocation(this.program, attribute);
            if (location === -1) throw new Error(`Could not find attribute '${attribute}' on shader '${this.name}'`);

            this.attributes[attribute] = location;
		}
	}

	private setupUniforms(uniforms: string[]) {
		if (!this.program) throw new Error(`Shader '${this.name}' program not loaded`);

		// Firefox doesn't really like to have the uniforms in the same order as Chrome-based browsers
		// So I'll just go over all the active uniforms and then later check if there's a typo, for compatibility there
		const activeUniforms = this.gl.getProgramParameter(this.program, GL.ACTIVE_UNIFORMS);
		if (!activeUniforms) throw new Error(`Could not get active uniforms for shader '${this.name}'`);

		this.uniforms = {};
		for (let i = 0; i < activeUniforms; i++) {
			const info = this.gl.getActiveUniform(this.program, i);
			if (!info) throw new Error(`Could not get active uniform '${i}' on shader '${this.name}'`);

			const location = this.gl.getUniformLocation(this.program, info.name);
			if (!location) throw new Error(`Could not get location of uniform '${info.name}' on shader '${this.name}'`);

			if (!uniforms.includes(info.name)) throw Error(`Uniform '${info.name}' is not being used on shader '${this.name}'`);

			this.uniforms[info.name] = { location, type: info.type };
		}

		for (const uniform of uniforms) {
			if (!this.uniforms.hasOwnProperty(uniform)) throw new Error(`Could not find uniform '${uniform}' on shader '${this.name}'`);
		}
	}

	private setupBuffers(buffers: Dictionary<BufferDataType | BufferDataTypeConstructor | ShaderBufferDefinition>) {
		if (!this.program) throw new Error(`Shader '${this.name}' program not loaded`);

		this.buffers = {};
		for (const name in buffers) {
			if (!buffers.hasOwnProperty(name)) continue;
			let data = buffers[name];

			const buffer = this.gl.createBuffer();
			if (!buffer) throw new Error("Could not create buffer");

			// Define defaults
			let target: GLenum = GL.ARRAY_BUFFER;
			let usage: GLenum = GL.STATIC_DRAW;
			let type: Optional<BufferDataTypeConstructor> = null;
			let attribute = name;
			let value: Optional<BufferDataType> = null;

			// Decode the options object
			if (typeof data === "object") {// Buffer Data Type Definition
				const obj = data as ShaderBufferDefinition;
				if (obj.attribute) attribute = obj.attribute;
				if (obj.target) target = obj.target;
				if (obj.usage) usage = obj.usage;
				if (obj.data) data = obj.data;
			}

			// If data provided
			if (data instanceof Float32Array || data instanceof Uint16Array || data instanceof Uint8Array || data instanceof Int16Array || data instanceof Int8Array || data instanceof Uint32Array || data instanceof Int32Array) {
				value = data as BufferDataType;
			} else if (typeof data === "function") {// Buffer Data Type Constructor
				type = data as BufferDataTypeConstructor;
			}

			this.gl.bindBuffer(target, buffer);
			if (value) {
				// Try to determine the type from the data
				if (!type) type = value.constructor as BufferDataTypeConstructor;

				// Set the buffer data
				this.gl.bufferData(target, value, usage);
			}

			if (!type) throw new Error(`Could not determine buffer data type for buffer '${name}' on shader '${this.name}'`);

			this.buffers[name] = {
				buffer,
				type,
				attribute,
				target,
				usage
			}
		}
	}

	public bindBuffer(name: string, data: Optional<BufferDataType> = null) {
		const buffer = this.buffers[name];
		if (!buffer) throw new Error(`Could not find buffer '${name}' on shader '${this.name}'`);

		this.gl.bindBuffer(buffer.target, buffer.buffer);
		if (data) {
			this.gl.bufferData(buffer.target, data, buffer.usage);
		}
	}

	public setUniform(name: string, value: number | Float32List) {
		if (!this.program) throw new Error(`Shader '${this.name}' program not loaded`);

		const uniform = this.uniforms[name];
		if (!uniform) throw new Error(`Could not find uniform '${name}' on shader '${this.name}'`);

		switch (uniform.type) {
			case GL.FLOAT:
				this.gl.uniform1f(uniform.location, value as number);
				break;
			case GL.FLOAT_VEC2:
				this.gl.uniform2fv(uniform.location, value as Float32List);
				break;
			case GL.FLOAT_VEC3:
				this.gl.uniform3fv(uniform.location, value as Float32List);
				break;
			case GL.FLOAT_VEC4:
				this.gl.uniform4fv(uniform.location, value as Float32List);
				break;
			case GL.FLOAT_MAT4:
				this.gl.uniformMatrix4fv(uniform.location, false, value as Float32List);
				break;
			case GL.SAMPLER_2D:
				this.gl.uniform1i(uniform.location, value as number);
				break;
			default:
				throw new Error(`Uniform type '${uniform.type}' not supported`);
		}
	}

	private extractAttributeInfo(attribute: string, location: GLint): { type: GLenum, size: GLint; } {
		if (!this.program) throw new Error(`Shader '${this.name}' program not loaded`);

		const info = this.gl.getActiveAttrib(this.program, location);
		if (!info) throw new Error(`Could not get attribute info for '${attribute}' on shader '${this.name}'`);

		const size = {
			[GL.FLOAT]: 1,
			[GL.FLOAT_VEC2]: 2,
			[GL.FLOAT_VEC3]: 3,
			[GL.FLOAT_VEC4]: 4
		}[info.type] as number;

		const type = {
			[GL.FLOAT]: GL.FLOAT,
			[GL.FLOAT_VEC2]: GL.FLOAT,
			[GL.FLOAT_VEC3]: GL.FLOAT,
			[GL.FLOAT_VEC4]: GL.FLOAT
		}[info.type] as GLenum;

		return { type, size };
	}

	bind() {
		if (!this.program) throw new Error(`Shader '${this.name}' program not loaded`);

		for (const attribute in this.attributes) {
			if (!this.attributes.hasOwnProperty(attribute)) continue;

			const location = this.attributes[attribute];

			const relatedBuffer = Object.values(this.buffers).find(x => x.attribute === attribute);
			if (!relatedBuffer) throw new Error(`Could not find buffer '${attribute}' on shader '${this.name}'`);

			this.gl.bindBuffer(relatedBuffer.target, relatedBuffer.buffer);

			const { type, size } = this.extractAttributeInfo(attribute, location);
			this.gl.vertexAttribPointer(location, size, type, false, 0, 0);

			this.gl.enableVertexAttribArray(location);
		}

		this.gl.useProgram(this.program);
	}

}