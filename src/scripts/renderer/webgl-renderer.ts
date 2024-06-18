/* eslint-disable max-statements */
import { mat4 } from "gl-matrix";
import { Main } from "../main";
import { Cube } from "../models/cube";
import { Optional } from "../types/optional";
import { Size } from "../types/size";
import { FileUtils } from "../utils/file";
import { Log } from "../utils/log";
import { Theme } from "../utils/theme";
import { Color } from "../utils/color";
import { ImageUtils } from "../utils/image";

const GL = WebGLRenderingContext;

export class WebGLRenderer {

	public canvas: HTMLCanvasElement;
	public gl: WebGLRenderingContext | WebGL2RenderingContext;

	private shaderProgram: WebGLProgram;

	private isDirty = false;

	private textures = {
		diffuse: null as Optional<WebGLTexture>
	};

	private locations = {
		attributes: {
			position: 0 as GLuint,
			textureCoord: 1 as GLuint,
			normal: 2 as GLuint
		},
		uniforms: {
			projection: null as Optional<WebGLUniformLocation>,
			model: null as Optional<WebGLUniformLocation>,
			view: null as Optional<WebGLUniformLocation>,
			texture: null as Optional<WebGLUniformLocation>
		}
	};

	private buffers = {
		position: null as Optional<WebGLBuffer>,
		texture: null as Optional<WebGLBuffer>,
		normal: null as Optional<WebGLBuffer>,
		index: null as Optional<WebGLBuffer>
	};

	constructor(private main: Main) {  }

	// #region Utility
	public invalidate() {
		this.isDirty = true;
	}

	public setSize(size: Size) {
		Log.info("WebGLRenderer", "Setting size...");
		this.canvas.width = size.width;
		this.canvas.height = size.height;
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
	}
	// #endregion

	// #region Setup
	// #region Shaders
	private async loadShader(url: string, type: number) {
		Log.info("WebGLRenderer", `Loading shader: ${url}...`);
		const source = await FileUtils.load(url);
		const shader = this.gl.createShader(type);
		if (!shader) throw new Error("Could not create shader");

		Log.debug("WebGLRenderer", `Compiling shader: ${url}...`);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);
		if (!this.gl.getShaderParameter(shader, GL.COMPILE_STATUS)) {
			const info = this.gl.getShaderInfoLog(shader);
			this.gl.deleteShader(shader);
			throw new Error(`Could not compile shader '${url}': ${info}`);
		}

		return shader;
	}

	private async loadShaders() {
		Log.info("WebGLRenderer", "Loading shaders...");
		const vertexShader = await this.loadShader("shaders/vertex.glsl", GL.VERTEX_SHADER);
		const fragmentShader = await this.loadShader("shaders/fragment.glsl", GL.FRAGMENT_SHADER);
		this.gl.attachShader(this.shaderProgram, vertexShader);
		this.gl.attachShader(this.shaderProgram, fragmentShader);
	}

	private async setupShaderProgram() {
		Log.debug("WebGLRenderer", "Creating shader program...");
		const program = this.gl.createProgram();
		if (!program) throw new Error("Could not create shader program");
		this.shaderProgram = program;
		await this.loadShaders();
		this.gl.linkProgram(program);
		this.gl.validateProgram(program);
		if (!this.gl.getProgramParameter(program, GL.LINK_STATUS)) {
			const info = this.gl.getProgramInfoLog(program);
			this.gl.deleteProgram(program);
			throw new Error(`Could not link shader program: ${info}`);
		}
	}
	// #endregion

	// #region Buffers
	private createBuffer(): WebGLBuffer {
		const buffer = this.gl.createBuffer();
		if (!buffer) {
			this.gl.deleteBuffer(buffer);
			throw new Error("Could not create buffer");
		}

		return buffer;
	}

	private setupUniforms() {
		Log.debug("WebGLRenderer", "Getting uniform locations...");
		this.locations.uniforms.projection = this.gl.getUniformLocation(this.shaderProgram, "u_projection");
		this.locations.uniforms.model = this.gl.getUniformLocation(this.shaderProgram, "u_model");
		this.locations.uniforms.view = this.gl.getUniformLocation(this.shaderProgram, "u_view");
		this.locations.uniforms.texture = this.gl.getUniformLocation(this.shaderProgram, "u_texture");
	}

	private setupBuffers() {
		Log.info("WebGLRenderer", "Setting up buffers...");

		// Position
		Log.debug("WebGLRenderer", "Creating position buffer...");
		this.buffers.position = this.createBuffer();
		this.gl.bindBuffer(GL.ARRAY_BUFFER, this.buffers.position);
		this.gl.bufferData(GL.ARRAY_BUFFER, Cube.vertices, GL.STATIC_DRAW);

		// Normals
		Log.debug("WebGLRenderer", "Creating normal buffer...");
		this.buffers.normal = this.createBuffer();
		this.gl.bindBuffer(GL.ARRAY_BUFFER, this.buffers.normal);
		this.gl.bufferData(GL.ARRAY_BUFFER, Cube.normals, GL.STATIC_DRAW);

		// Indices
		Log.debug("WebGLRenderer", "Creating index buffer...");
		this.buffers.index = this.createBuffer();
		this.gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.buffers.index);
		this.gl.bufferData(GL.ELEMENT_ARRAY_BUFFER, Cube.indices, GL.STATIC_DRAW);

		// Texture
		Log.debug("WebGLRenderer", "Creating texture buffer...");
		this.buffers.texture = this.createBuffer();
		this.gl.bindBuffer(GL.ARRAY_BUFFER, this.buffers.texture);
		this.gl.bufferData(GL.ARRAY_BUFFER, Cube.textureCoordinates, GL.STATIC_DRAW);
	}
	// #endregion

	// #region Textures
	private async loadTexture(url: string) {
		Log.info("WebGLRenderer", `Loading texture: ${url}...`);
		const image = await ImageUtils.load(url);
		const texture = this.gl.createTexture();
		if (!texture) throw new Error("Could not create texture");

		this.gl.bindTexture(GL.TEXTURE_2D, texture);
		this.gl.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
		this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
		this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
		this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
		this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);

		return texture;
	}

	private async setupTextures() {
		Log.info("WebGLRenderer", "Setting up textures...");
		this.gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
		this.textures.diffuse = await this.loadTexture("texture1");
	}
	// #endregion

	private setupCanvas() {
		Log.debug("WebGLRenderer", "Creating canvas...");
		this.canvas = document.createElement("canvas");
		this.canvas.id = "webgl-canvas";
		const gl = this.canvas.getContext("webgl2") ?? this.canvas.getContext("webgl") ?? this.canvas.getContext("experimental-webgl");
		if (!gl) throw new Error("Could not get WebGL context");
		this.gl = gl as WebGLRenderingContext | WebGL2RenderingContext;

		document.body.appendChild(this.canvas);
	}

	async setup() {
		Log.info("WebGLRenderer", "Setting up...");

		this.setupCanvas();
		await this.setupShaderProgram();
		this.setupUniforms();
		this.setupBuffers();
		this.setupTextures();
	}
	// #endregion

	// #region Render
	private getModelMatrix() {
		const modelMatrix = mat4.create();
		const rad = this.main.globalTimer / 2;
		mat4.translate(modelMatrix, modelMatrix, [0.0, 0.0, -6.0]);
		mat4.rotate(modelMatrix, modelMatrix, rad, [0.0, 1.0, 0.0]);
		mat4.rotate(modelMatrix, modelMatrix, rad, [1.0, 0.0, 0.0]);

		return modelMatrix;
	}

	private bindAttributes() {
		// Position
		this.gl.bindBuffer(GL.ARRAY_BUFFER, this.buffers.position);
		this.gl.vertexAttribPointer(this.locations.attributes.position, 3, GL.FLOAT, false, 0, 0);// 3 floats per vertex
		this.gl.enableVertexAttribArray(this.locations.attributes.position);

		// Normals (which are an array of 1 32-bit unsigned integer per vertex)
		this.gl.bindBuffer(GL.ARRAY_BUFFER, this.buffers.normal);
		this.gl.vertexAttribPointer(this.locations.attributes.normal, 1, GL.FLOAT, false, 0, 0);// 1 float per vertex
		this.gl.enableVertexAttribArray(this.locations.attributes.normal);

		// Texture
		this.gl.bindBuffer(GL.ARRAY_BUFFER, this.buffers.texture);
		this.gl.vertexAttribPointer(this.locations.attributes.textureCoord, 2, GL.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(this.locations.attributes.textureCoord);
		this.gl.activeTexture(GL.TEXTURE0);
		this.gl.bindTexture(GL.TEXTURE_2D, this.textures.diffuse);
		this.gl.uniform1i(this.locations.uniforms.texture, 0);
	}

	private bindProjectionMatrix() {
		this.gl.uniformMatrix4fv(this.locations.uniforms.projection, false, this.main.camera.getProjectionMatrix(this.main.screen));
		this.gl.uniformMatrix4fv(this.locations.uniforms.view, false, this.main.camera.getViewMatrix());
		this.gl.uniformMatrix4fv(this.locations.uniforms.model, false, this.getModelMatrix());
	}

	public render() {
		if (!this.isDirty) return;
		this.isDirty = false;

		// Scene
		const color = Color.decode(Theme.background, true);
		this.gl.clearColor(color.r, color.g, color.b, 1.0);
		this.gl.clearDepth(1.0);
		this.gl.cullFace(GL.BACK);
		this.gl.enable(GL.DEPTH_TEST);
		this.gl.enable(GL.CULL_FACE);
		this.gl.depthFunc(GL.LEQUAL);
		this.gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

		// Setup
		this.bindAttributes();
		this.gl.useProgram(this.shaderProgram);
		this.bindProjectionMatrix();

		// Draw
		this.gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.buffers.index);
		this.gl.drawElements(GL.TRIANGLES, Cube.indices.length, GL.UNSIGNED_SHORT, 0);

		// Cleanup
		this.gl.disable(GL.CULL_FACE);
		this.gl.disable(GL.DEPTH_TEST);
	}
	// #endregion

}