import { AWorkerBinding } from "./aworker-binding";
import { Chunk } from "../models/terrain/chunk";
import { ChunkManager } from "../models/terrain/chunk-manager";
import { Vector2 } from "../models/math/vector2";
import { WorkerMessage } from "../types/worker-message";
import { Log } from "../utils/log";
import { ChunkMesh } from "../models/terrain/chunk-mesh";
import { VoxelGrid } from "../models/math/voxel-grid";
import { Optional } from "../types/optional";
import { ChunkDTO } from "../types/chunk-dto";

export class TerrainGeneratorBinding extends AWorkerBinding {

	constructor() {
		super("terrain");
	}

	public generateChunkTerrain(x: number, z: number) {
		this.postMessage({ type: "terrain", data: { x, z } });
	}

	public generateChunkMesh(x: number, z: number, chunk: Chunk, neighbors: Array<Optional<Chunk>>, depth: number = 0) {
		const voxels = VoxelGrid.pack(chunk.voxels);
		const neighborData = neighbors.map(neighbor => {
			if (!neighbor) return null;
			return { voxels: VoxelGrid.pack(neighbor.voxels), x: neighbor.localPosition.x, z: neighbor.localPosition.y };
		}) as Array<Optional<ChunkDTO>>;

		this.postMessage({
			type: "mesh",
			data: {
				chunk: { x, z, voxels },
				neighbors: neighborData,
				depth
			}
		});
	}

	public generateBatch(chunks: Array<Vector2>) {
		for (const chunk of chunks) {
			this.generateChunkTerrain(chunk.x, chunk.y);
		}
	}

	protected onMessageReceived<T>(message: WorkerMessage<T>) {
		switch (message.type) {
			case "terrain": {
				const terrainData = message.data as { voxels: Uint8Array, x: number, z: number; };
				const chunk = new Chunk(
					new Vector2(terrainData.x, terrainData.z),
					VoxelGrid.unpack(terrainData.voxels),
					null
				);
				ChunkManager.loadChunkTerrain(chunk);
				break;
			}

			case "mesh": {
				const meshData = message.data as { x: number, z: number, mesh: ChunkMesh, depth: number; };
				Object.setPrototypeOf(meshData.mesh, ChunkMesh.prototype);
				ChunkManager.loadChunkMesh(meshData.x, meshData.z, meshData.mesh, meshData.depth);
				break;
			}

			default:
				Log.error("TerrainGeneratorBinding", "Unknown message type", message.type);
				break;
		}
	}

}