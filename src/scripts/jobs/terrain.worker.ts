import { Vector2 } from './../models/math/vector2';
import { TerrainGenerator } from "../models/terrain/terrain-generator";
import { TerrainMeshBuilder } from "../models/terrain/terrain-mesh-builder";
import { WorkerMessage } from "../types/worker-message";

class TerrainGeneratorWorker {

	constructor() {
		self.onmessage = this.onMessage.bind(this);
	}

	private generateChunk(request: WorkerMessage<{ x: number, z: number; }>) {
		const pos = new Vector2(request.data.x, request.data.z);

		// Generate the chunk data
		const chunk = TerrainGenerator.generateChunkVoxels(pos);

		// TODO: Get the neighbors

		// Generate the chunk mesh
		const builder = new TerrainMeshBuilder(pos, chunk, null, null, null, null);
		builder.generateMesh();

		// Send the chunk data back
		self.postMessage({ type: "chunk", data: chunk });
	}

	private onMessage(e: MessageEvent) {
		switch (e.data.type) {
			case "generate":
				this.generateChunk(e.data as WorkerMessage<{ x: number, z: number; }>);
				break;

			default:
				console.error("TerrainGeneratorWorker", "Unknown message type", e.data.type);
				break;
		}
	}

}

new TerrainGeneratorWorker();