import { CHUNK_SIZE } from "../../constants";
import { Biome } from "../../enums/biome";
import { VoxelType } from "../../enums/voxel-type";
import { Chunk } from "../terrain/chunk";
import { VoxelGrid } from "../math/voxel-grid";
import { NoiseGenerator } from "../math/noise-generator";
import { Vector2 } from "../math/vector2";
import { Optional } from "../../types/optional";

export namespace TerrainGenerator {

	const altitudeNoiseGenerators = {
		[Biome.Plains]: new NoiseGenerator(`altitude-plains`, 4, 100, 0, 1),
		[Biome.Desert]: new NoiseGenerator(`altitude-desert`, 4, 100, 0, 1),
		[Biome.Mountains]: new NoiseGenerator(`altitude-mountains`, 4, 100, 0, 1),
		[Biome.Snow]: new NoiseGenerator(`altitude-snow`, 4, 100, 0, 1),
	};

	const moistureNoiseGenerator = new NoiseGenerator(`moisture`, 1, 500, 0, 100);
	const temperatureNoiseGenerator = new NoiseGenerator(`temperature`, 1, 1000, 20, 50);

	function getBiomeAt(x: number, z: number): Biome {
		const moisture = moistureNoiseGenerator.get(x, z);
		const temperature = temperatureNoiseGenerator.get(x, z);

		if (temperature < 25) return Biome.Snow;
		if (moisture > 80 && temperature > 25) return Biome.Mountains;
		if (temperature > 30 && moisture < 40) return Biome.Desert;
		return Biome.Plains;
	}

	function getAltitudeAt(x: number, z: number, biome: Biome): number {
		const noise = altitudeNoiseGenerators[biome].get(x, z);
		let min = 0;
		let max = 0;

		switch (biome) {
			case Biome.Desert:
				min = 4;
				max = 7;
				break;
			case Biome.Mountains:
				min = 4;
				max = 32;
				break;
			case Biome.Snow:
				min = 4;
				max = 15;
				break;
			case Biome.Plains:
				min = 4;
				max = 12;
				break;
			default:
				throw new Error(`Unknown biome: ${biome}`);
		}

		return noise * (max - min) + min;
	}

	function mixBiomes(x: number, z: number, biomeTarget: Biome, biomeSource: Biome, mix: number): number {
		const altitudeA = getAltitudeAt(x, z, biomeTarget);
		const altitudeB = getAltitudeAt(x, z, biomeSource);

		// Dither the mix value
		mix = Math.max(0, Math.min(1, mix));
		mix = Math.floor(mix * 10) / 10;

		return altitudeA * mix + altitudeB * (1 - mix);
	}

	function getVoxelAt(x: number, y: number, z: number, altitude: number, biome: Biome): Optional<VoxelType> {
		const STONE_LEVEL = 3;
		if (y === 0 || (y < STONE_LEVEL && Math.random() <= 0.9)) return VoxelType.Stone;

		if (y > altitude) return VoxelType.Air;

		switch (biome) {
			case Biome.Plains:
				if (y >= altitude - 1) return VoxelType.Grass;
				return VoxelType.Dirt;

			case Biome.Desert:
				return VoxelType.Sand;

			case Biome.Mountains:
				if (y > altitude * 0.9) return VoxelType.Snow;
				if (y < altitude / 2) return VoxelType.Stone;
				return VoxelType.Dirt;

			case Biome.Snow:
				return VoxelType.Snow;
		}
	}

	export function generateChunkVoxels(pos: Vector2): Chunk {
		const voxels = new VoxelGrid();

		for (let x = 0; x < CHUNK_SIZE; x++) {
			for (let z = 0; z < CHUNK_SIZE; z++) {
				// Get the world position
				const tileX = x + Math.ceil(pos.x * CHUNK_SIZE);
				const tileZ = z + Math.ceil(pos.y * CHUNK_SIZE);

				// Get the biome
				const biome = getBiomeAt(tileX, tileZ);
				const altitude = getAltitudeAt(tileX, tileZ, biome);// TODO: Mix biomes

				for (let y = 0; y <= altitude; y++) {
					const voxel = getVoxelAt(x, y, z, altitude, biome);
					voxels.set(x, y, z, voxel);
				}
			}
		}

		return new Chunk(pos, voxels);
	}

}