import { debug } from './../../../node_modules/@types/node/util.d';
import { Dictionary } from "../types/dictionary";
import { Chunk } from "./chunk";
import { Rectangle } from "./rectangle";
import { TerrainGenerator } from "./terrain-generator";
import { Vector2 } from "./vector2";
import { Vector3 } from "./vector3";
import { Log } from '../utils/log';
import { SETTINGS } from '../settings';

export abstract class ChunkManager {

	public static chunks: Dictionary<Chunk> = {};
	public static activeChunks: Array<Chunk> = [];

	public static hash(x: number, z: number): string {
		return `${x}|${z}`;
	}

	public static updateActiveChunks(tiledPosition: Vector2) {
		// Log.debug("ChunkManager", "Updating active chunks... at " + tiledPosition.toString());
		const rect = new Rectangle(
			tiledPosition.x - SETTINGS.RENDER_DISTANCE / 2,
			tiledPosition.y - SETTINGS.RENDER_DISTANCE / 2,
			SETTINGS.RENDER_DISTANCE,
			SETTINGS.RENDER_DISTANCE
		);

		let generated = 0;

		const list: Array<Chunk> = [];
		// On a rect
		for (let x = rect.x; x < rect.x + rect.width; x++) {
			for (let z = rect.y; z < rect.y + rect.height; z++) {
				if (!this.chunks[this.hash(x, z)]) {
					generated++;

					if (generated > 1) continue;
				}

				const chunk = this.getChunk(x, z);
				list.push(chunk);
			}
		}

		this.activeChunks = list;
	}

	public static getChunk(x: number, z: number): Chunk {
		const key = this.hash(x, z);
		let chunk = this.chunks[key];
		if (!chunk) {
			chunk = TerrainGenerator.generateChunk(new Vector2(x, z));
			this.chunks[key] = chunk;
		}

		return chunk;
	}

	public static setChunk(x: number, z: number, chunk: Chunk) {
		this.chunks[this.hash(x, z)] = chunk;
	}

	public static deleteChunk(x: number, z: number) {
		delete this.chunks[this.hash(x, z)];
	}

	public static clear() {
		this.chunks = {};
	}

}