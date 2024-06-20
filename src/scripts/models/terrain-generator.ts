import { mat4 } from "gl-matrix";
import { Size } from "../types/size";
import { Cube, CubeFace } from "./cube";
import { MeshBuilder } from "./mesh-builder";
import { Vector3 } from "./vector3";

export class Array3D<T> {

	private data: Array<T>;

	constructor(public width: number, public height: number, public depth: number) { }

	public get(x: number | Vector3, y: number, z: number): T {
		if (x instanceof Vector3) return this.get(x.x, x.y, x.z);
		return this.data[x + y * this.width + z * this.width * this.height];
	}

	public set(x: number | Vector3, y: number, z: number, value: T) {
		if (x instanceof Vector3) return this.set(x.x, x.y, x.z, value);
		this.data[x + y * this.width + z * this.width * this.height] = value;
	}

}

export abstract class TerrainGenerator {

	public static generate(gl: WebGLContext, size: number, position: Vector3) {
		const meshBuilder = new MeshBuilder(gl);

		// Generate the cubes
		const cubes = this.generateCubes(size);

		// Generate the mesh, occluding faces which are not visible

	}

	private static generateCubeTypes(size: number): Array3D<CubeFace> {
		const list: Array3D<CubeFace> = new Array3D(size, size, size);

		for (let x = 0; x < size; x++) {
			for (let y = 0; y < size; y++) {
				for (let z = 0; z < size; z++) {
					list.set(x, y, z, CubeFace.DIAMOND_ORE);
				}
			}
		}

		return list;
	}

	public static async generateCubes(gl: WebGLContext, size: number, height: number): Promise<Array<Cube>> {
		const list: Array<Cube> = [];

		for (let x = 0; x < size; x++) {
			for (let y = 0; y < height; y++) {
				for (let z = 0; z < size; z++) {
					const cube = new Cube(gl, CubeFace.DIAMOND_ORE, CubeFace.DIAMOND_ORE, CubeFace.DIAMOND_ORE);
					list.push(cube);
				}
			}
		}

		await Promise.all(list.map(cube => cube.setup()));

		for (let x = 0; x < size; x++) {
			for (let y = 0; y < height; y++) {
				for (let z = 0; z < size; z++) {
					const cube = list[x + y * size + z * size * height];
					mat4.translate(cube.matrix, cube.matrix, [x - size / 2, y + 3, z - size]);
				}
			}
		}

		return list;
	}

}