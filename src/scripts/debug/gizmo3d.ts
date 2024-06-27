import { mat4, vec3, vec4 } from "gl-matrix";
import { Shader } from "../models/shader";
import { Quad } from "../models/geometry/quad";
import { Camera } from "../models/camera";
import { Cube } from "../models/geometry/cube";

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

	// TODO: Move this to Cube.ts
	private static readonly outlineVertices = new Float32Array([
		// Front face
		-0.5, -0.5, -0.5,  // Bottom-left
		0.5, -0.5, -0.5,   // Bottom-right
		0.5, 0.5, -0.5,    // Top-right
		-0.5, 0.5, -0.5,   // Top-left

		// Bottom face
		-0.5, -0.5, -0.5,  // Bottom-left-front
		0.5, -0.5, -0.5,   // Bottom-right-front
		0.5, -0.5, 0.5,    // Bottom-right-back
		-0.5, -0.5, 0.5,   // Bottom-left-back

		// Left face
		-0.5, -0.5, -0.5,  // Bottom-front
		-0.5, 0.5, -0.5,   // Top-front
		-0.5, 0.5, 0.5,    // Top-back
		-0.5, -0.5, 0.5,   // Bottom-back

		// Back face
		0.5, -0.5, 0.5,    // Bottom-right
		0.5, 0.5, 0.5,     // Top-right
		-0.5, 0.5, 0.5,    // Top-left
		-0.5, -0.5, 0.5,    // Bottom-left

		// right face
		0.5, -0.5, -0.5,  // Bottom-front
		0.5, 0.5, -0.5,   // Top-front
		0.5, 0.5, 0.5,    // Top-back
		0.5, -0.5, 0.5,   // Bottom-back
	]);
	private static mesh: GizmoMesh;
	private modelMatrix = mat4.create();
	private vertices: Float32Array;

	constructor(private position: vec3, private size: vec3, private rotation: vec3, private color: vec4, private fill: boolean) {
		mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
		mat4.scale(this.modelMatrix, this.modelMatrix, this.size);
		mat4.rotateX(this.modelMatrix, this.modelMatrix, this.rotation[0]);
		mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotation[1]);
		mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.rotation[2]);

		if (!this.fill) {
			this.vertices = new Float32Array(BoxGizmo3D.outlineVertices);
		}
	}

	static async setup(gl: WebGLContext) {
		this.mesh = new GizmoMesh("box", Cube.vertices, Cube.indices);
		await this.mesh.setup(gl);
	}

	render(gl: WebGLContext, projection: mat4, view: mat4) {
		BoxGizmo3D.mesh.bind(gl, this.color, this.modelMatrix, view, projection);
		if (this.fill) {
			BoxGizmo3D.mesh.shader.bindBuffer("vertex", Cube.vertices);
			gl.drawElements(GL.TRIANGLES, BoxGizmo3D.mesh.indices!.length, GL.UNSIGNED_SHORT, 0);
		} else {
			BoxGizmo3D.mesh.shader.bindBuffer("vertex", this.vertices);
			gl.drawArrays(this.fill ? GL.TRIANGLES : GL.LINE_LOOP, 0, this.vertices.length / 3);
		}
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
		const viewMatrix = camera.getViewMatrix();
		const projectionMatrix = camera.getProjectionMatrix();
		const viewProjectionMatrix = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix);
		const inverseViewProjectionMatrix = mat4.invert(mat4.create(), viewProjectionMatrix);

		// Frustum corners in clip space
		// TODO: Move this to Frustum.ts
		const clipSpaceCorners = [
			// Near plane
			vec4.fromValues(-1, -1, -1, 1),
			vec4.fromValues(1, -1, -1, 1),
			vec4.fromValues(1, 1, -1, 1),
			vec4.fromValues(-1, 1, -1, 1),
			// Far plane
			vec4.fromValues(-1, -1, 1, 1),
			vec4.fromValues(1, -1, 1, 1),
			vec4.fromValues(1, 1, 1, 1),
			vec4.fromValues(-1, 1, 1, 1)
		];

		// Frustum corners in world space
		const worldSpaceCorners = clipSpaceCorners.map(corner => {
			const worldSpaceCorner = vec4.transformMat4(vec4.create(), corner, inverseViewProjectionMatrix);
			vec4.scale(worldSpaceCorner, worldSpaceCorner, 1 / worldSpaceCorner[3]);
			// TODO: Check if this is correct
			return worldSpaceCorner;
		});

		this.vertices = new Float32Array([
			// Near plane
			...worldSpaceCorners[0],
			...worldSpaceCorners[1],
			...worldSpaceCorners[2],
			...worldSpaceCorners[3],
			// Far plane
			...worldSpaceCorners[4],
			...worldSpaceCorners[5],
			...worldSpaceCorners[6],
			...worldSpaceCorners[7]
		]);

		this.indices = new Uint16Array([
			0, 1, 2, 2, 3, 0, // Near plane
			4, 5, 6, 6, 7, 4, // Far plane
			0, 1, 5, 5, 4, 0, // Bottom plane
			2, 3, 7, 7, 6, 2, // Top plane
			0, 3, 7, 7, 4, 0, // Left plane
			1, 2, 6, 6, 5, 1  // Right plane
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
		shader.bindBuffer("index", this.indices);

		gl.drawElements(this.fill ? GL.TRIANGLES : GL.LINE_LOOP, this.indices.length, GL.UNSIGNED_SHORT, 0);
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