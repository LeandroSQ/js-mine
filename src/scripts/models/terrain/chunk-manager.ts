import { TerrainGeneratorBinding } from './../../jobs/terrain.binding';
import { SETTINGS } from "../../settings";
import { Dictionary } from "../../types/dictionary";
import { Optional } from "../../types/optional";
import { Vector2 } from "../math/vector2";
import { Chunk } from "./chunk";
import { TerrainGenerator } from './terrain-generator';
import { TerrainMeshBuilder } from './terrain-mesh-builder';
import { ChunkMesh } from './chunk-mesh';
import { Analytics } from '../../debug/analytics';
import { Gizmo3D } from '../../debug/gizmo3d';
import { vec4 } from 'gl-matrix';

export namespace ChunkManager {

	// TODO: Test with multiple workers
	const workerPool: Array<TerrainGeneratorBinding> = Array.from({ length: SETTINGS.TERRAIN_GENERATION_WORKER_COUNT }, () => new TerrainGeneratorBinding());
	let workerIndex = 0;
	const pendingGeneration: Dictionary<Vector2> = {};
	const pendingMeshGeneration: Dictionary<Chunk> = {};

	export let loadedChunkCount = 0;
	export const chunks: Dictionary<Chunk> = {};
	export let activeChunks: Array<Chunk> = [];

	function getWorker(meshing = false) {
		return workerPool[workerIndex++ % workerPool.length];

		if (meshing) return workerPool[0];

		if (workerPool.length === 1) return workerPool[0];
		return workerPool[workerIndex++ % (workerPool.length - 1) + 1];
	}

	function hash(x: number, z: number): string {
		return `${x}|${z}`;
	}

	function generatePendingChunks(positions: Array<Vector2>) {
		if (SETTINGS.TERRAIN_GENERATION_ON_MAIN_THREAD) {
			for (const position of positions) {
				const chunk = TerrainGenerator.generateChunkVoxels(position);
				const builder = new TerrainMeshBuilder(position, chunk, null, null, null, null);
				builder.generateMesh();
				ChunkManager.loadChunkTerrain(chunk);
				ChunkManager.loadChunkMesh(position.x, position.y, chunk.mesh!);
			}
		} else {
			// Distribute the pending generation to the workers
			for (let i = 0; i < positions.length; i++) {
				const position = positions[i];
				getWorker().generateChunkTerrain(position.x, position.y);
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

	export function reloadChunks() {
		for (const key in chunks) delete chunks[key];
		activeChunks = [];
		loadedChunkCount = 0;
		for (const key in pendingGeneration) delete pendingGeneration[key];
		for (const key in pendingMeshGeneration) delete pendingMeshGeneration[key];
	}

	export function updateActiveChunks(localPosition: Vector2) {
		const radius = SETTINGS.RENDER_DISTANCE / 2;

		const newActiveChunks: Array<Chunk> = [];
		const newPendingGeneration: Array<{ position: Vector2, distance: number; }> = [];
		for (let x = localPosition.x - radius; x < localPosition.x + radius; x++) {
			for (let z = localPosition.y - radius; z < localPosition.y + radius; z++) {
				const position = new Vector2(x, z);
				const distance = Vector2.distanceSquared(localPosition, position);
				if (distance < radius) {
					const key = hash(x, z);
					if (chunks.hasOwnProperty(key)) {// Chunk already generated, add it to the active chunks
						newActiveChunks.push(chunks[key]);
					} else if (!pendingGeneration.hasOwnProperty(key)) {// Only enqueue if not already pending
						pendingGeneration[key] = position;
						newPendingGeneration.push({ position, distance });
					}
				}
			}
		}

		newPendingGeneration.sort((a, b) => a.distance - b.distance);

		// Unload the chunks that are no longer active
		unloadChunks(newActiveChunks);

		// Generate the missing chunks
		generatePendingChunks(newPendingGeneration.map(x => x.position));

		activeChunks = newActiveChunks;
	}

	export function getChunk(localPosition: Vector2): Optional<Chunk> {
		const key = hash(localPosition.x, localPosition.y);
		return chunks[key];
	}

	export function getNeighboringChunks(localPosition: Vector2): Array<Optional<Chunk>> {
		return [
			getChunk(new Vector2(localPosition.x, localPosition.y - 1)),
			getChunk(new Vector2(localPosition.x + 1, localPosition.y)),
			getChunk(new Vector2(localPosition.x, localPosition.y + 1)),
			getChunk(new Vector2(localPosition.x - 1, localPosition.y))
		];
	}

	export function loadChunkTerrain(chunk: Chunk) {
		const key = hash(chunk.localPosition.x, chunk.localPosition.y);
		chunks[key] = chunk;
		delete pendingGeneration[key];

		if (!SETTINGS.TERRAIN_GENERATION_ON_MAIN_THREAD) {
			getWorker(true).generateChunkMesh(chunk.localPosition.x, chunk.localPosition.y, chunk, getNeighboringChunks(chunk.localPosition));
		}
	}

	export function loadChunkMesh(x: number, z: number, mesh: ChunkMesh, depth: number = 0) {
		Analytics.notifyChunkUpdate();
		const key = hash(x, z);
		delete pendingMeshGeneration[key];
		if (chunks.hasOwnProperty(key)) {

			if (depth < 1) {
				const neighbors = getNeighboringChunks(new Vector2(x, z));
				for (const neighbor of neighbors) {
					if (neighbor) {
						const neighborKey = hash(neighbor.localPosition.x, neighbor.localPosition.y);
						if (!pendingMeshGeneration.hasOwnProperty(neighborKey)) {
							pendingMeshGeneration[neighborKey] = chunks[key];
							getWorker(true).generateChunkMesh(neighbor.localPosition.x, neighbor.localPosition.y, neighbor, getNeighboringChunks(neighbor.localPosition), depth + 1);
						}
					}
				}
			}

			chunks[key].mesh = mesh;
			loadedChunkCount++;

			const p = chunks[key].globalCenterPosition;
			p[1] = 14;
			Gizmo3D.sphere(p, 1, vec4.fromValues(1, 1, 1, 1));
		}
	}
}