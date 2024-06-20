import { Size } from "../types/size";
import { Vector3 } from "./vector3";

export class MeshBuilder {

	private vertices: number[] = [];
	private normals: number[] = [];
	private uvs: number[] = [];
	private indices: number[] = [];

	constructor(private gl: WebGLContext) { }

	public addQuad(vertices: number[], normals: number[], uvs: number[], indices: number[]) {
		const offset = this.vertices.length / 3;
		this.vertices.push(...vertices);
		this.normals.push(...normals);
		this.uvs.push(...uvs);
		this.indices.push(...indices.map(i => i + offset));
	}

	private createBuffer(data: number[]) {
		const buffer = this.gl.createBuffer();
		if (!buffer) throw new Error("Could not create buffer");
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);

		return buffer;
	}

	public build() {
		const vertexBuffer = this.createBuffer(this.vertices);
		const normalBuffer = this.createBuffer(this.normals);
		const uvBuffer = this.createBuffer(this.uvs);
		const indexBuffer = this.createBuffer(this.indices);

	}


}