import { Optional } from './../types/optional';
import { Cube, CubeFace } from "./shapes/cube";
import { MeshBuilder } from "./mesh-builder";
import { Vector3 } from "./vector3";
import { createNoise2D, NoiseFunction2D } from 'simplex-noise';
import Alea from 'alea';
import { CHUNK_HEIGHT, CHUNK_SIZE } from '../constants';
import { Vector2 } from './vector2';
import { Chunk } from './chunk';

// Declare the sides
const sideUp = new Vector3(0, 1, 0);
const sideDown = new Vector3(0, -1, 0);
const sideLeft = new Vector3(-1, 0, 0);
const sideRight = new Vector3(1, 0, 0);
const sideFront = new Vector3(0, 0, 1);
const sideBack = new Vector3(0, 0, -1);

export enum Biome {
	PLAINS = 0,
	DESERT = 1,
	SNOW = 2,
	MOUNTAINS = 3,
}

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

export class NoiseGenerator {

	private generators: NoiseFunction2D[];

	constructor(seed: string, octaves: number, private scale: number, private min: number, private max: number) {
		this.generators = [];
		for (let i = 0; i < octaves; i++) {
			this.generators.push(createNoise2D(Alea(seed + i)));
		}
	}

	public get(x: number, z: number) {
		// The more generators we have, the more detailed higher frequency noise we get
		// Apply weights to the noise, each octave is half the amplitude of the previous one
		let result = 0;
		let amplitude = 1;
		let frequency = 1;
		let maxAmplitude = 0;
		for (const generator of this.generators) {
			result += generator(x / this.scale * frequency, z / this.scale * frequency) * amplitude;
			maxAmplitude += amplitude;
			amplitude /= 2;
			frequency *= 2;
		}

		// Normalize the result
		result = (result / maxAmplitude + 1) / 2;
		return result * (this.max - this.min) + this.min;
	}
}

export abstract class TerrainGenerator {

	// TODO: Move to worker
	private static readonly seed = "myseed" + Math.random();
	private static readonly altitudeNoiseGenerator = new NoiseGenerator(`${this.seed}-altitude`, 4, 100, 0, 1);
	private static readonly moistureNoiseGenerator = new NoiseGenerator(`${this.seed}-moisture`, 1, 50, 0, 100);
	private static readonly temperatureNoiseGenerator = new NoiseGenerator(`${this.seed}-temperature`, 1, 100, 20, 50);


	public static generateChunk(position: Vector2): Chunk {
		// Log.debug("TerrainGenerator", "Generating chunk... at " + position.toString());
		const meshBuilder = new MeshBuilder();

		// Generate the cubes
		const cubes = this.generateCubeTypes(position);

		// TODO: Separate the generation and meshing into two different processes

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

	private static getFace(direction: Vector3, face: CubeFace): CubeFace {
		if (face === CubeFace.GRASS) {
			if (direction === sideUp) return CubeFace.GRASS;
			if (direction === sideDown) return CubeFace.DIRT;
			return CubeFace.GRASS_SIDE;
		}

		return face;
	}

	private static addFace(meshBuilder: MeshBuilder, position: number[], direction: Vector3, face: CubeFace) {
		const uvs = Cube.getUV(this.getFace(direction, face));
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

	private static getAltitudeAt(x: number, z: number, biome: Biome) {
		const altitude = this.altitudeNoiseGenerator.get(x, z);
		const range = { min: CHUNK_HEIGHT * 0.11, max: CHUNK_HEIGHT * 0.5 };
		switch (biome) {
			case Biome.DESERT:
				range.min = 4;
				range.max = 7;
				break;
			case Biome.MOUNTAINS:
				range.min = 4;
				range.max = 32;
				break;
			case Biome.SNOW:
				range.min = 4;
				range.max = 15;
				break;
			case Biome.PLAINS:
				range.min = 4;
				range.max = 12;
				break;
		}

		return altitude * (range.max - range.min) + range.min;
	}

	private static getBiomeAt(x: number, z: number): Biome {
		const moisture = this.moistureNoiseGenerator.get(x, z);
		const temperature = this.temperatureNoiseGenerator.get(x, z);

		// if (temperature < 25) return Biome.SNOW;
		if (moisture > 80 && temperature > 25) return Biome.MOUNTAINS;
		if (temperature > 30 && moisture < 40) return Biome.DESERT;
		return Biome.PLAINS;
	}

	private static generateCubeTypes(position: Vector2): Array3D<Optional<CubeFace>> {
		const list: Array3D<Optional<CubeFace>> = new Array3D(CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_SIZE);

		const stoneLevel = 3;
		let lastAltitude = -1;

		for (let x = 0; x < CHUNK_SIZE; x++) {
			for (let z = 0; z < CHUNK_SIZE; z++) {
				const tileX = x + Math.ceil(position.x * CHUNK_SIZE);
				const tileY = z + Math.ceil(position.y * CHUNK_SIZE);
				const biome = this.getBiomeAt(tileX, tileY);
				let altitude = this.getAltitudeAt(tileX, tileY, biome);

				// Transition between altitudes
				if (lastAltitude !== -1) {
					const target = altitude;
					altitude = Math.round((lastAltitude + altitude) / 2);
					lastAltitude = target;
				} else {
					lastAltitude = altitude;
				}

				for (let y = 0; y < CHUNK_HEIGHT; y++) {
					if (y < stoneLevel) {
						list.set(x, y, z, CubeFace.STONE);
					} else if (y < altitude) {
						switch (biome) {
							case Biome.PLAINS:
								if (y >= altitude - 1) {
									list.set(x, y, z, CubeFace.GRASS);
								}  else {
									list.set(x, y, z, CubeFace.DIRT);
								}
								break;
							case Biome.DESERT:
								list.set(x, y, z, CubeFace.SAND);
								break;
							case Biome.MOUNTAINS:
								if (y > altitude * 0.9) {
									list.set(x, y, z, CubeFace.SNOW);
								} else if (y < altitude / 2) {
									list.set(x, y, z, CubeFace.STONE);
								} else {
									list.set(x, y, z, CubeFace.DIRT);
								}
								break;
							case Biome.SNOW:
								list.set(x, y, z, CubeFace.SNOW);
								break;
						}
					} else {
						list.set(x, y, z, null);
					}
				}
			}

			lastAltitude = -1;
		}

		return list;
	}

}