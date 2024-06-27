import { AWorkerBinding } from "./aworker-binding";
import { Chunk } from "../models/terrain/chunk";
import { ChunkManager } from "../models/terrain/chunk-manager";
import { Vector2 } from "../models/math/vector2";
import { WorkerMessage } from "../types/worker-message";
import { Log } from "../utils/log";
import { ChunkMesh } from "../models/terrain/chunk-mesh";
import { Array3D } from "../models/math/array3d";

export class TerrainGeneratorBinding extends AWorkerBinding {

	constructor() {
		super("terrain");
	}

	public generateChunk(x: number, z: number) {
		this.postMessage({ type: "generate", data: { x, z } });
	}

	public generateBatch(chunks: Array<Vector2>) {
		for (const chunk of chunks) {
			this.generateChunk(chunk.x, chunk.y);
		}
	}

	protected onMessageReceived<T>(message: WorkerMessage<T>) {
		switch (message.type) {
			case "chunk":
				// Since message.data is serialized, use Object.assign to convert it back to a Chunk
				const chunk = message.data as Chunk;
				Object.setPrototypeOf(chunk, Chunk.prototype);
				Object.setPrototypeOf(chunk.voxels, Array3D.prototype);
				Object.setPrototypeOf(chunk.mesh, ChunkMesh.prototype);
				ChunkManager.loadChunk(chunk);
				break;

			default:
				Log.error("TerrainGeneratorBinding", "Unknown message type", message.type);
				break;
		}
	}

}