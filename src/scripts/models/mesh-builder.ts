import { Size } from "../types/size";
import { Mesh } from "./mesh";
import { Vector3 } from "./vector3";

const indices = [
	0, 1, 2,
	0, 2, 3,
];

export class MeshBuilder {

	private vertices: number[] = [];
	private normals: number[] = [];
	private uvs: number[] = [];
	private indices: number[] = [];

	constructor(private gl: WebGLContext) { }

	public addQuad(offset: number[], vertices: readonly number[], normals: readonly number[], uvs: readonly number[]) {
		this.normals.push(...normals);
		this.uvs.push(...uvs);

		const indexOffset = this.vertices.length / 3;
		this.indices.push(...indices.map(i => i + indexOffset));
		this.vertices.push(...vertices.map((v, i) => v + offset[i % 3]));
	}

	public build(): Mesh {
		return new Mesh(
			this.gl,
			new Float32Array(this.vertices),
			new Float32Array(this.uvs),
			new Float32Array(this.normals),
			new Uint16Array(this.indices)
		);
	}

}