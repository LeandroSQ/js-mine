import { Optional } from './../types/optional';
import { mat4, vec3 } from "gl-matrix";
import { Size } from "../types/size";
import { Cube, CubeFace } from "./cube";
import { MeshBuilder } from "./mesh-builder";
import { Vector3 } from "./vector3";
import { Mesh } from './mesh';

// Declare the sides
const sideUp = new Vector3(0, 1, 0);
const sideDown = new Vector3(0, -1, 0);
const sideLeft = new Vector3(-1, 0, 0);
const sideRight = new Vector3(1, 0, 0);
const sideFront = new Vector3(0, 0, 1);
const sideBack = new Vector3(0, 0, -1);

export class Array3D<T> {

	private data: Array<T>;

	constructor(public width: number, public height: number, public depth: number) {
		this.data = new Array(width * height * depth);
	}

	public get(x: number | Vector3, y?: number, z?: number): Optional<T> {
		if (x instanceof Vector3) return this.get(x.x, x.y, x.z);
		if (x < 0 || x >= this.width || y! < 0 || y! >= this.height || z! < 0 || z! >= this.depth) return null;

		return this.data[x + y! * this.width + z! * this.width * this.height];
	}

	public set(x: number | Vector3, y: number | T, z?: number, value?: T) {
		if (x instanceof Vector3) return this.set(x.x, x.y, x.z, y as T);
		if (x < 0 || x >= this.width || y as number < 0 || y as number >= this.height || z! < 0 || z! >= this.depth) return null;

		this.data[x + (y as number)! * this.width + z! * this.width * this.height] = value!;
	}

}

export abstract class TerrainGenerator {

	public static generate(gl: WebGLContext, size: number, position: Vector3): Mesh {
		const meshBuilder = new MeshBuilder(gl);

		// Generate the cubes
		const cubes = this.generateCubeTypes(size);

		// Generate the mesh
		for (let x = 0; x < size; x++) {
			for (let y = 0; y < size; y++) {
				for (let z = 0; z < size; z++) {
					const type = cubes.get(x, y, z);
					if (type) {
						const pos = new Vector3(x, y, z);
						const arr = pos.toArray();

						const top = cubes.get(pos.add(sideUp));
						const bottom = cubes.get(pos.add(sideDown));
						const left = cubes.get(pos.add(sideLeft));
						const right = cubes.get(pos.add(sideRight));
						const front = cubes.get(pos.add(sideFront));
						const back = cubes.get(pos.add(sideBack));

						// Check if the cube is surrounded by air on any side, if so, add a face
						if (!front) this.addFace(meshBuilder, arr, sideFront, type);
						if (!back) this.addFace(meshBuilder, arr, sideBack, type);
						if (!top) this.addFace(meshBuilder, arr, sideUp, type);
						if (!bottom) this.addFace(meshBuilder, arr, sideDown, type);
						if (!right) this.addFace(meshBuilder, arr, sideRight, type);
						if (!left) this.addFace(meshBuilder, arr, sideLeft, type);
					}
				}
			}
		}

		return meshBuilder.build();
	}

	private static addFace(meshBuilder: MeshBuilder, position: number[], direction: Vector3, face: CubeFace) {
		const uvs = Cube.getUV(face);
		if (direction === sideUp) {
			meshBuilder.addQuad(position, Cube.topFaceVertices, Cube.topFaceNormals, uvs);
		} else if (direction === sideDown) {
			meshBuilder.addQuad(position, Cube.bottomFaceVertices, Cube.bottomFaceNormals, uvs);
		} else if (direction === sideLeft) {
			meshBuilder.addQuad(position, Cube.leftFaceVertices, Cube.leftFaceNormals, uvs);
		} else if (direction === sideRight) {
			meshBuilder.addQuad(position, Cube.rightFaceVertices, Cube.rightFaceNormals, uvs);
		} else if (direction === sideFront) {
			meshBuilder.addQuad(position, Cube.frontFaceVertices, Cube.frontFaceNormals, uvs);
		} else if (direction === sideBack) {
			meshBuilder.addQuad(position, Cube.backFaceVertices, Cube.backFaceNormals, uvs);
		} else {
			throw new Error("Invalid direction");
		}
	}

	private static generateCubeTypes(size: number): Array3D<Optional<CubeFace>> {
		const list: Array3D<Optional<CubeFace>> = new Array3D(size, size, size);

		for (let x = 0; x < size; x++) {
			for (let y = 0; y < size; y++) {
				for (let z = 0; z < size; z++) {
					if (y < size / 3) {
						list.set(x, y, z, CubeFace.STONE);
					} else if (y < size / 2 && Math.sin(x + y * 1000 + z + Math.random()) < 0.25) {
						list.set(x, y, z, CubeFace.DIRT);
					} else {
						list.set(x, y, z, null);
					}
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
					const cube = new Cube(gl, CubeFace.GRASS, CubeFace.GRASS_SIDE, CubeFace.DIRT);
					list.push(cube);
				}
			}
		}

		await Promise.all(list.map(cube => cube.setup()));

		for (let x = 0; x < size; x++) {
			for (let y = 0; y < height; y++) {
				for (let z = 0; z < size; z++) {
					const cube = list[x + y * size + z * size * height];
					const pos = vec3.fromValues(x, y, z);
					vec3.add(pos, pos, [-size / 2, 3, -size]);
					vec3.scale(pos, pos, 2);

					mat4.translate(cube.matrix, cube.matrix, pos);
				}
			}
		}

		return list;
	}

}