import { mat4, vec3, vec4 } from "gl-matrix";
import { Shader } from "../models/shader";
import { Quad } from "../models/shapes/quad";
import { Camera } from "../models/camera";
import { Cube } from "../models/shapes/cube";

interface IGizmo3D {

	render(gl: WebGLContext, projection: mat4, view: mat4): void;

}

class GizmoMesh {

	public shader: Shader;

	constructor(
		private name: string,
		public vertices?: Float32Array,
		public indices?: Uint16Array
	) { }

	async setup(gl: WebGLContext) {
		// Setup the shader
		this.shader = new Shader(gl, "gizmo-" + this.name);
		await this.shader.setup({
			source: {
				vertex: "gizmo/vertex",
				fragment: "gizmo/fragment"
			},
			uniforms: ["u_color", "u_model", "u_view", "u_projection"],
			buffers: {
				vertex: {
					data: this.vertices ?? Float32Array,
					attribute: "a_position"
				},
				index: {
					data: this.indices ?? Uint16Array,
					target: GL.ELEMENT_ARRAY_BUFFER
				}
			}
		});
	}

	bind(gl: WebGLContext, color: vec4, model: mat4, view: mat4, projection: mat4) {
		this.shader.bind();
		this.shader.setUniform("u_color", color);
		this.shader.setUniform("u_model", model);
		this.shader.setUniform("u_view", view);
		this.shader.setUniform("u_projection", projection);

		this.shader.bindBuffer("index");
	}

}

class BoxGizmo3D implements IGizmo3D {

	private static mesh: GizmoMesh;
	private modelMatrix = mat4.create();

	constructor(private position: vec3, private size: vec3, private rotation: vec3, private color: vec4, private fill: boolean) {
		mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
		mat4.scale(this.modelMatrix, this.modelMatrix, this.size);
		mat4.rotateX(this.modelMatrix, this.modelMatrix, this.rotation[0]);
		mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotation[1]);
		mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.rotation[2]);
	}

	static async setup(gl: WebGLContext) {
		this.mesh = new GizmoMesh("box", Cube.vertices, Cube.indices);
		await this.mesh.setup(gl);
	}

	render(gl: WebGLContext, projection: mat4, view: mat4) {
		BoxGizmo3D.mesh.bind(gl, this.color, this.modelMatrix, view, projection);
		gl.drawElements(this.fill ? GL.TRIANGLES : GL.LINE_STRIP, BoxGizmo3D.mesh.indices!.length, GL.UNSIGNED_SHORT, 0);
	}

}

class QuadGizmo3D implements IGizmo3D {

	private static mesh: GizmoMesh;
	private modelMatrix = mat4.create();

	constructor(private position: vec3, private size: vec3, private color: vec4, private fill: boolean) {
		mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
		mat4.scale(this.modelMatrix, this.modelMatrix, this.size);
	}

	static async setup(gl: WebGLContext) {
		this.mesh = new GizmoMesh("quad", Quad.vertices, Quad.indices);
		await this.mesh.setup(gl);
	}


	render(gl: WebGLContext, projection: mat4, view: mat4): void {
		QuadGizmo3D.mesh.bind(gl, this.color, this.modelMatrix, view, projection);
		gl.drawElements(this.fill ? GL.TRIANGLES : GL.LINE_LOOP, QuadGizmo3D.mesh.indices!.length, GL.UNSIGNED_SHORT, 0);
	}

}

class FrustumGizmo3D implements IGizmo3D {

	private static shader: Shader;
	private modelMatrix = mat4.create();
	private vertices: Float32Array;
	private indices: Uint16Array;

	constructor(camera: Camera, private color: vec4, private fill: boolean) {
		mat4.translate(this.modelMatrix, this.modelMatrix, camera.position);
		mat4.rotate(this.modelMatrix, this.modelMatrix, Math.toRadians(camera.pitch), [1, 0, 0]);
		mat4.rotate(this.modelMatrix, this.modelMatrix, Math.toRadians(camera.yaw), [0, 1, 0]);
		mat4.rotate(this.modelMatrix, this.modelMatrix, Math.toRadians(camera.roll), [0, 0, 1]);
		// mat4.rotateX(this.modelMatrix, this.modelMatrix, Math.toRadians(camera.yaw));
		// mat4.rotateY(this.modelMatrix, this.modelMatrix, Math.toRadians(camera.pitch));
		// mat4.rotateZ(this.modelMatrix, this.modelMatrix, Math.toRadians(camera.roll));
		const aspect = window.innerWidth / window.innerHeight;
		const near = camera.near;
		const far = camera.far;

		const tan = Math.tan(camera.fov / 2);
		const nearHeight = tan * near;
		const nearWidth = nearHeight * aspect;
		const farHeight = tan * far;
		const farWidth = farHeight * aspect;

		this.vertices = new Float32Array([
			// Near plane
			-nearWidth, -nearHeight, -near,
			nearWidth, -nearHeight, -near,
			nearWidth, nearHeight, -near,
			-nearWidth, nearHeight, -near,
			// Far plane
			-farWidth, -farHeight, -far,
			farWidth, -farHeight, -far,
			farWidth, farHeight, -far,
			-farWidth, farHeight, -far,
			// Connect near and far
			-nearWidth, -nearHeight, -near,
			-farWidth, -farHeight, -far,
			nearWidth, -nearHeight, -near,
			farWidth, -farHeight, -far,
			nearWidth, nearHeight, -near,
			farWidth, farHeight, -far,
			-nearWidth, nearHeight, -near,
			-farWidth, farHeight, -far

		]);
	}

	static async setup(gl: WebGLContext) {
		// Setup the shader
		this.shader = new Shader(gl, "gizmo-" + this.name);
		await this.shader.setup({
			source: {
				vertex: "gizmo/vertex",
				fragment: "gizmo/fragment"
			},
			uniforms: ["u_color", "u_model", "u_view", "u_projection"],
			buffers: {
				vertex: {
					data: Float32Array,
					attribute: "a_position"
				},
				index: {
					data: Uint16Array,
					target: GL.ELEMENT_ARRAY_BUFFER
				}
			}
		});
	}

	render(gl: WebGLContext, projection: mat4, view: mat4): void {
		const shader = FrustumGizmo3D.shader;
		shader.bind();
		shader.setUniform("u_color", this.color);
		shader.setUniform("u_model", this.modelMatrix);
		shader.setUniform("u_view", view);
		shader.setUniform("u_projection", projection);

		shader.bindBuffer("vertex", this.vertices);
		// shader.bindBuffer("index", this.indices);
		// gl.drawArrays(GL.LINE_LOOP, 0, this.indices.length);
		gl.drawArrays(GL.LINE_LOOP, 0, this.vertices.length / 3);
	}

}

class LineGizmo3D implements IGizmo3D {

	private static shader: Shader;
	private modelMatrix = mat4.create();
	private vertices: Float32Array;

	constructor(private start: vec3, private end: vec3, private color: vec4) {
		this.vertices = new Float32Array([
			...this.start,
			...this.end
		]);
	}

	static async setup(gl: WebGLContext) {
		// Setup the shader
		this.shader = new Shader(gl, "gizmo-line");
		await this.shader.setup({
			source: {
				vertex: "gizmo/vertex",
				fragment: "gizmo/fragment"
			},
			uniforms: ["u_color", "u_model", "u_view", "u_projection"],
			buffers: {
				vertex: {
					data: Float32Array,
					attribute: "a_position"
				}
			}
		});
	}

	render(gl: WebGLContext, projection: mat4, view: mat4): void {
		const shader = LineGizmo3D.shader;
		shader.bind();
		shader.setUniform("u_color", this.color);
		shader.setUniform("u_model", this.modelMatrix);
		shader.setUniform("u_view", view);
		shader.setUniform("u_projection", projection);

		shader.bindBuffer("vertex", this.vertices);
		gl.drawArrays(GL.LINES, 0, this.vertices.length / 3);
	}

}

class SphereGizmo3D implements IGizmo3D {

	private static mesh: GizmoMesh;
	private modelMatrix = mat4.create();
	private vertices: Float32Array;

	constructor(private position: vec3, private radius: number, private color: vec4, resolution: number, private fill: boolean) {
		mat4.translate(this.modelMatrix, this.modelMatrix, this.position);

		const vertices: number[] = [];
		for (let i = 0; i <= resolution; i++) {
			const theta = (i / resolution) * Math.PI;
			for (let j = 0; j <= resolution; j++) {
				const phi = (j / resolution) * 2 * Math.PI;
				const x = this.radius * Math.sin(theta) * Math.cos(phi);
				const y = this.radius * Math.sin(theta) * Math.sin(phi);
				const z = this.radius * Math.cos(theta);
				vertices.push(x, y, z);
			}
		}

		this.vertices = new Float32Array(vertices);
	}

	static async setup(gl: WebGLContext) {
		this.mesh = new GizmoMesh("sphere");
		await this.mesh.setup(gl);
	}

	render(gl: WebGLContext, projection: mat4, view: mat4) {
		const shader = SphereGizmo3D.mesh.shader;
		shader.bind();
		shader.setUniform("u_color", this.color);
		shader.setUniform("u_model", this.modelMatrix);
		shader.setUniform("u_view", view);
		shader.setUniform("u_projection", projection);

		shader.bindBuffer("vertex", this.vertices);
		gl.drawArrays(this.fill ? GL.TRIANGLES : GL.LINE_STRIP, 0, this.vertices.length / 3);
	}

}

export abstract class Gizmo3D {

	private static list: Array<IGizmo3D> = [];

	public static async setup(gl: WebGLContext) {
		if (!DEBUG) return;

		await BoxGizmo3D.setup(gl);
		await QuadGizmo3D.setup(gl);
		await LineGizmo3D.setup(gl);
		await SphereGizmo3D.setup(gl);
		await FrustumGizmo3D.setup(gl);
	}

	public static render(gl: WebGLContext, projection: mat4, view: mat4) {
		if (!DEBUG) return;

		for (const gizmo of this.list) gizmo.render(gl, projection, view);
	}

	public static clear() {
		if (!DEBUG) return;

		this.list = [];
	}

	public static box(position: vec3, size: vec3, rotation: vec3, color: vec4, fill = false) {
		if (!DEBUG) return;

		this.list.push(new BoxGizmo3D(position, size, rotation, color, fill));
	}

	public static quad(position: vec3, size: vec3, color: vec4, fill = false) {
		if (!DEBUG) return;

		this.list.push(new QuadGizmo3D(position, size, color, fill));
	}

	public static frustum(camera: Camera, color: vec4, fill = false) {
		if (!DEBUG) return;

		this.list.push(new FrustumGizmo3D(camera, color, fill));
	}

	public static line(start: vec3, end: vec3, color: vec4) {
		if (!DEBUG) return;

		this.list.push(new LineGizmo3D(start, end, color));
	}

	public static sphere(position: vec3, radius: number, color: vec4, resolution = 32, fill = false) {
		if (!DEBUG) return;

		this.list.push(new SphereGizmo3D(position, radius, color, resolution, fill));
	}

}