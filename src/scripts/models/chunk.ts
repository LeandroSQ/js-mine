import { mat4, vec3 } from "gl-matrix";
import { Shader } from "./shader";
import { Texture } from "./texture";
import { Vector2 } from "./vector2";
import { CHUNK_SIZE } from "../constants";
import { Vector3 } from "./vector3";
import { Gizmo3D } from "../utils/gizmo3d";

export class Chunk {

	private static shader: Shader;

	constructor(
		public position: Vector2,
		private vertices: Float32Array,
		private uvs: Float32Array,
		private normals: Float32Array,
		private indices: Uint16Array
	) { }

	public get vertexCount() {
		return this.vertices.length / 3;
	}

	public get triangleCount() {
		return this.indices.length / 3;
	}

	public get globalPosition() {
		return vec3.fromValues(this.position.x * CHUNK_SIZE, 0, this.position.y * CHUNK_SIZE);
	}

	public get globalCenterPosition() {
		return vec3.fromValues(this.position.x * CHUNK_SIZE + CHUNK_SIZE / 2, 0, this.position.y * CHUNK_SIZE + CHUNK_SIZE / 2);
	}

	public render(gl: WebGLContext, projection: mat4, view: mat4) {
		Chunk.shader.bind();
		Texture.terrain.bind();

		// Rotate
		const position = vec3.fromValues(
			Math.ceil(this.position.x * CHUNK_SIZE),
			0,
			Math.ceil(this.position.y * CHUNK_SIZE)
		);
		const modelMatrix = mat4.create();
		mat4.translate(modelMatrix, modelMatrix, position);

		// Apply view to model
		mat4.multiply(modelMatrix, view, modelMatrix);

		// Set the matrix
		Chunk.shader.setUniform("u_modelView", modelMatrix);
		Chunk.shader.setUniform("u_projection", projection);
		Chunk.shader.setUniform("u_texture", 0);

		// Set the buffers
		Chunk.shader.bindBuffer("vertex", this.vertices);
		Chunk.shader.bindBuffer("uv", this.uvs);
		Chunk.shader.bindBuffer("index", this.indices);
		Chunk.shader.bindBuffer("normal", this.normals);

		// Draw the mesh
		gl.drawElements(GL.TRIANGLES, this.indices.length, GL.UNSIGNED_SHORT, 0);
	}

	public static async setup(gl: WebGLContext) {
		// All blocks will share the same texture, for now
		if (!Texture.terrain) {
			Texture.terrain = new Texture(gl);
			await Texture.terrain.load("terrain");
		}

		// Setup the shader
		this.shader = new Shader(gl, "geometry");
		await this.shader.setup({
			source: {
				vertex: "vertex",
				fragment: "fragment"
			},
			uniforms: ["u_modelView", "u_projection", "u_texture"],
			buffers: {
				vertex: {
					data: Float32Array,
					attribute: "a_position"
				},
				uv: {
					data: Float32Array,
					attribute: "a_texcoord"
				},
				normal: {
					data: Float32Array,
					attribute: "a_normal"
				},
				index: {
					data: Uint16Array,
					target: GL.ELEMENT_ARRAY_BUFFER,
				}
			}
		});
	}

}