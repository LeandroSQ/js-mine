import { mat4, vec3 } from "gl-matrix";
import { CHUNK_SIZE } from "../../constants";
import { Vector2 } from "../math/vector2";
import { Shader } from "../shader";
import { Texture } from "../texture";

export class ChunkMesh {

	private static shader: Shader;

	constructor(
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

	private get shader() {
		return ChunkMesh.shader;
	}

	public render(gl: WebGLContext, globalPosition: vec3, projection: mat4, view: mat4) {
		this.shader.bind();
		Texture.terrain.bind();

		// Model matrix
		const modelMatrix = mat4.create();
		mat4.translate(modelMatrix, modelMatrix, globalPosition);
		mat4.multiply(modelMatrix, view, modelMatrix);

		// Set the matrix
		this.shader.setUniform("u_modelView", modelMatrix);
		this.shader.setUniform("u_projection", projection);
		this.shader.setUniform("u_texture", 0);

		// Set the buffers
		this.shader.bindBuffer("vertex", this.vertices);
		this.shader.bindBuffer("uv", this.uvs);
		this.shader.bindBuffer("index", this.indices);
		this.shader.bindBuffer("normal", this.normals);

		// Draw the mesh
		gl.drawElements(GL.TRIANGLES, this.indices.length, GL.UNSIGNED_SHORT, 0);
	}

	public static async setup(gl: WebGLContext) {
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