import { mat4 } from 'gl-matrix';
import { Shader } from "./shader";
import { Texture } from './texture';

export class Mesh {

	private shader: Shader;
	private static texture: Texture;
	public matrix: mat4;

	constructor(
		private gl: WebGLContext,
		private vertices: Float32Array,
		private uvs: Float32Array,
		private normals: Float32Array,
		private indices: Uint16Array
	) { }

	public async setup() {
		// All blocks will share the same texture, for now
		if (!Mesh.texture) {
			Mesh.texture = new Texture(this.gl);
			await Mesh.texture.load("terrain");
		}

		// Setup the shader
		this.shader = new Shader(this.gl, "mesh");
		await this.shader.setup({
			source: {
				vertex: "vertex",
				fragment: "fragment"
			},
			uniforms: ["u_modelView", "u_projection", "u_texture"],
			buffers: {
				vertex: {
					data: this.vertices,
					attribute: "a_position"
				},
				uv: {
					data: this.uvs,
					attribute: "a_texcoord"
				},
				normal: {
					data: this.normals,
					attribute: "a_normal"
				},
				index: {
					data: this.indices,
					target: GL.ELEMENT_ARRAY_BUFFER,
				}
			}
		});

		// Create the model matrix
		this.matrix = mat4.create();
		mat4.translate(this.matrix, this.matrix, [0.0, 0.0, -6.0]);
	}

	public render(projection: mat4, view: mat4) {
		this.shader.bind();
		Mesh.texture.bind();

		// Rotate
		const modelMatrix = mat4.create();/*  mat4.create();
		const rad = Date.now() / 1000;
		mat4.translate(modelMatrix, modelMatrix, [0.0, 0.0, -6.0]);
		mat4.rotate(modelMatrix, modelMatrix, rad, [0.0, 1.0, 0.0]);
		mat4.rotate(modelMatrix, modelMatrix, rad, [1.0, 0.0, 0.0]); */

		mat4.copy(modelMatrix, this.matrix);

		// Apply view to model
		mat4.multiply(modelMatrix, view, modelMatrix);

		// Set the matrix
		this.shader.setUniform("u_modelView", modelMatrix);
		this.shader.setUniform("u_projection", projection);
		this.shader.setUniform("u_texture", 0);

		// Draw the mesh
		this.shader.bindBuffer("index", this.indices);
		this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
	}

}