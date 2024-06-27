import { TerrainGeneratorBinding } from './../../jobs/terrain.binding';
import { SETTINGS } from "../../settings";
import { Dictionary } from "../../types/dictionary";
import { Optional } from "../../types/optional";
import { Vector2 } from "../math/vector2";
import { Chunk } from "./chunk";
import { TerrainGenerator } from './terrain-generator';
import { TerrainMeshBuilder } from './terrain-mesh-builder';

export namespace ChunkManager {

	// TODO: Test with multiple workers
	const workerPool: Array<TerrainGeneratorBinding> = Array.from({ length: SETTINGS.TERRAIN_GENERATION_WORKER_COUNT }, () => new TerrainGeneratorBinding());
	const pendingGeneration: Dictionary<Vector2> = {};

	export let loadedChunkCount = 0;
	export const chunks: Dictionary<Chunk> = {};
	export let activeChunks: Array<Chunk> = [];

	function hash(x: number, z: number): string {
		return `${x}|${z}`;
	}

	function generatePendingChunks(positions: Array<Vector2>) {
		if (SETTINGS.TERRAIN_GENERATION_ON_MAIN_THREAD) {
			for (const position of positions) {
				const chunk = TerrainGenerator.generateChunkVoxels(position);
				const builder = new TerrainMeshBuilder(position, chunk, null, null, null, null);
				builder.generateMesh();
				ChunkManager.loadChunk(chunk);
			}
		} else {
			// Distribute the pending generation to the workers
			for (let i = 0; i < positions.length; i++) {
				const position = positions[i];
				const worker = workerPool[i % workerPool.length];
				worker.generateChunk(position.x, position.y);
			};
		}
	}

	function unloadChunks(newActiveChunks: Array<Chunk>) {
		for (const chunk of ChunkManager.activeChunks) {
			if (!newActiveChunks.includes(chunk)) {
				// TODO: Only delete the mesh?
				delete ChunkManager.chunks[hash(chunk.localPosition.x, chunk.localPosition.y)];
				loadedChunkCount--;
			}
		}
	}

	export function updateActiveChunks(localPosition: Vector2) {
		const radius = SETTINGS.RENDER_DISTANCE / 2;

		const newActiveChunks: Array<Chunk> = [];
		const newPendingGeneration: Array<Vector2> = [];
		for (let x = localPosition.x - radius; x < localPosition.x + radius; x++) {
			for (let z = localPosition.y - radius; z < localPosition.y + radius; z++) {
				if (Vector2.distance(localPosition, new Vector2(x, z)) < radius) {
					const key = hash(x, z);
					if (ChunkManager.chunks.hasOwnProperty(key)) {// Chunk already generated, add it to the active chunks
						newActiveChunks.push(ChunkManager.chunks[key]);
					} else if (!pendingGeneration.hasOwnProperty(key)) {// Only enqueue if not already pending
						pendingGeneration[key] = new Vector2(x, z);
						newPendingGeneration.push(new Vector2(x, z));
					}
				}
			}
		}

		// Unload the chunks that are no longer active
		unloadChunks(newActiveChunks);

		// Generate the missing chunks
		generatePendingChunks(newPendingGeneration);

		activeChunks = newActiveChunks;
	}

	export function getChunk(localPosition: Vector2): Optional<Chunk> {
		const key = hash(localPosition.x, localPosition.y);
		return chunks[key];
	}

	export function loadChunk(chunk: Chunk) {
		const key = hash(chunk.localPosition.x, chunk.localPosition.y);
		delete pendingGeneration[key];
		chunks[key] = chunk;
		loadedChunkCount++;
	}
}