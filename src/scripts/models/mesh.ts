import { mat4 } from 'gl-matrix';
import { Shader } from "./shader";
import { Texture } from './texture';
import { Vector3 } from './math/vector3';

export class Mesh {

	private shader: Shader;

	constructor(
		private gl: WebGLContext,
		public position: Vector3,
		private vertices: Float32Array,
		private uvs: Float32Array,
		private normals: Float32Array,
		private indices: Uint16Array
	) { }

	public async setup() {
		// All blocks will share the same texture, for now
		if (!Texture.terrain) {
			Texture.terrain = new Texture(this.gl);
			await Texture.terrain.load("terrain");
		}

		// Setup the shader
		this.shader = new Shader(this.gl, "geometry");
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

		// mat4.translate(this.matrix, this.matrix, [-8.0, -10, -8.0]);
	}

	public render(projection: mat4, view: mat4) {
		this.shader.bind();
		Texture.terrain.bind();

		// Rotate
		const modelMatrix = mat4.create();
		mat4.translate(modelMatrix, modelMatrix, this.position.toMatrixVec3());

		// Apply view to model
		mat4.multiply(modelMatrix, view, modelMatrix);

		// Set the matrix
		this.shader.setUniform("u_modelView", modelMatrix);
		this.shader.setUniform("u_projection", projection);
		this.shader.setUniform("u_texture", 0);// TODO: Check if this can be moved to setup

		// Draw the mesh
		this.shader.bindBuffer("index", this.indices);// TODO: Check if this can be moved to setup
		this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
	}

}