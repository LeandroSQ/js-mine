import { mat4, vec3 } from "gl-matrix";
import { VoxelType } from "../../enums/voxel-type";
import { VoxelGrid } from "../math/voxel-grid";
import { Vector2 } from "../math/vector2";
import { CHUNK_SIZE } from "../../constants";
import { Optional } from "../../types/optional";
import { ChunkMesh } from "./chunk-mesh";
import { Vector3 } from "../math/vector3";

export class Chunk {

	constructor(
		public localPosition: Vector2,
		public voxels: VoxelGrid,
		public mesh: Optional<ChunkMesh> = null
	) { }

	public get globalPosition() {
		return vec3.fromValues(this.localPosition.x * CHUNK_SIZE, 0, this.localPosition.y * CHUNK_SIZE);
	}

	public get globalCenterPosition() {
		return vec3.fromValues(this.localPosition.x * CHUNK_SIZE + CHUNK_SIZE / 2, 0, this.localPosition.y * CHUNK_SIZE + CHUNK_SIZE / 2);
	}

	public getVoxelAt(x: number | Vector3, y?: number, z?: number): Optional<VoxelType> {
		return this.voxels.get(x, y, z);
	}

	public getVoxelAtGlobalPosition(x: number | Vector3, y?: number, z?: number): Optional<VoxelType> {
		if (x instanceof Vector3) return this.getVoxelAtGlobalPosition(x.x, x.y, x.z);
		else if (y === undefined || z === undefined) throw new Error("Invalid arguments");

		const globalPosition = this.globalPosition;
		const localX = x - globalPosition[0];
		const localZ = z - globalPosition[2];
		return this.voxels.get(localX, y, localZ);
	}

	public render(gl: WebGLRenderingContext, projection: mat4, view: mat4) {
		this.mesh?.render(gl, this.globalPosition, projection, view);
	}

}