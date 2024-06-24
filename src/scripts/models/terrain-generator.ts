import { Optional } from './../types/optional';
import { Cube, CubeFace } from "./shapes/cube";
import { MeshBuilder } from "./mesh-builder";
import { Vector3 } from "./vector3";
import { createNoise2D, NoiseFunction2D } from 'simplex-noise';
import Alea from 'alea';
import { CHUNK_HEIGHT, CHUNK_SIZE } from '../constants';
import { Vector2 } from './vector2';
import { Chunk } from './chunk';
import { Log } from '../utils/log';

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

	// TODO: Move to worker
	private static readonly seed = "myseed" + Math.random();
	private static readonly altitudeNoiseGenerator = createNoise2D(Alea(`${this.seed}-altitude`));
	private static readonly moistureNoiseGenerator = createNoise2D(Alea(`${this.seed}-moisture`));
	private static readonly temperatureNoiseGenerator = createNoise2D(Alea(`${this.seed}-temperature`));

	private static getNoise(x: number, z: number, generator: NoiseFunction2D, scale = 70, min = 0.0, max = 1.0): number {
		return generator(x / scale, z / scale) * (max - min) + min;
	}

	private static getAltitudeAt(x: number, z: number): number {
		return Math.floor(this.getNoise(x, z, this.altitudeNoiseGenerator, 100, 0.11 * CHUNK_HEIGHT, 0.5 * CHUNK_HEIGHT));
	}

	public static generateChunk(position: Vector2): Chunk {
		// Log.debug("TerrainGenerator", "Generating chunk... at " + position.toString());
		const meshBuilder = new MeshBuilder();

		// Generate the cubes
		const cubes = this.generateCubeTypes(position);

		// Generate the mesh
		for (let x = 0; x < CHUNK_SIZE; x++) {
			for (let y = 0; y < CHUNK_HEIGHT; y++) {
				for (let z = 0; z < CHUNK_SIZE; z++) {
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
						if (!bottom && y > 0) this.addFace(meshBuilder, arr, sideDown, type);
						if (!right) this.addFace(meshBuilder, arr, sideRight, type);
						if (!left) this.addFace(meshBuilder, arr, sideLeft, type);
					}
				}
			}
		}

		// TODO: Pre-translate the vertices so we don't have to create a new matrix every frame :p
		return meshBuilder.build(position);
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

	private static generateCubeTypes(position: Vector2): Array3D<Optional<CubeFace>> {
		const list: Array3D<Optional<CubeFace>> = new Array3D(CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_SIZE);

		const stoneLevel = 3;

		for (let x = 0; x < CHUNK_SIZE; x++) {
			for (let z = 0; z < CHUNK_SIZE; z++) {
				const tileX = x + Math.ceil(position.x * CHUNK_SIZE);
				const tileY = z + Math.ceil(position.y * CHUNK_SIZE);
				const altitude = this.getAltitudeAt(tileX, tileY);

				for (let y = 0; y < CHUNK_HEIGHT; y++) {
					if (y < stoneLevel) {
						list.set(x, y, z, CubeFace.STONE);
					} else if (y < altitude) {
						const moisture = this.getNoise(x, z, this.moistureNoiseGenerator, 100, 0.0, 100.0);
						const temperature = this.getNoise(x, z, this.temperatureNoiseGenerator, 100, 20.0, 50.0);

						if (moisture < 50 && temperature < 30) {
							list.set(x, y, z, CubeFace.SAND);
						} else if (temperature < 30) {
							list.set(x, y, z, CubeFace.GRASS);
						} else {
							list.set(x, y, z, CubeFace.SNOW);
						}
					} else {
						list.set(x, y, z, null);
					}
				}
			}
		}

		return list;
	}

}