import "../types/global.d.ts";
import "../core/extensions/math.ts";
import { Vector2 } from './../models/math/vector2';
import { TerrainGenerator } from "../models/terrain/terrain-generator";
import { TerrainMeshBuilder } from "../models/terrain/terrain-mesh-builder";
import { WorkerMessage } from "../types/worker-message";
import { Chunk } from '../models/terrain/chunk';
import { VoxelGrid } from '../models/math/voxel-grid.js';
import { ChunkDTO } from '../types/chunk-dto';

namespace TerrainGeneratorWorker {

	export function setup() {
		self.onmessage = onMessage.bind(this);
	}

	function generateChunkTerrain(request: WorkerMessage<{ x: number, z: number; }>) {
		const pos = new Vector2(request.data.x, request.data.z);

		// Generate the chunk data
		const chunk = TerrainGenerator.generateChunkVoxels(pos);
		const chunkData = VoxelGrid.pack(chunk.voxels);

		// Send the chunk data back
		self.postMessage({ type: "terrain", data: { voxels: chunkData, x: request.data.x, z: request.data.z } });
	}

	function generateChunkMesh(request: WorkerMessage<{ chunk: ChunkDTO, neighbors: Array<ChunkDTO>, depth: number; }>) {
		// Unpack current chunk
		const pos = new Vector2(request.data.chunk.x, request.data.chunk.z);
		const chunk = new Chunk(
			pos,
			VoxelGrid.unpack(request.data.chunk.voxels),
			null
		);

		// Unpack neighbors
		const [north, east, south, west] = request.data.neighbors.map(neighbor => {
			if (!neighbor) return null;
			return new Chunk(
				new Vector2(neighbor.x, neighbor.z),
				VoxelGrid.unpack(neighbor.voxels)
			);
		});

		// Generate the chunk mesh
		const builder = new TerrainMeshBuilder(pos, chunk, west, east, south, north);
		builder.generateMesh();

		// Send the chunk mesh back
		self.postMessage({ type: "mesh", data: { x: pos.x, z: pos.y, mesh: chunk.mesh!, depth: request.data.depth } });
	}

	function onMessage(e: MessageEvent) {
		switch (e.data.type) {
			case "terrain":
				generateChunkTerrain(e.data as WorkerMessage<{ x: number, z: number; }>);
				break;

			case "mesh":
				generateChunkMesh(e.data as WorkerMessage<{ chunk: ChunkDTO, neighbors: Array<ChunkDTO>, depth: number; }>);
				break;

			default:
				console.error("TerrainGeneratorWorker", "Unknown message type", e.data.type);
				break;
		}
	}

}

TerrainGeneratorWorker.setup();