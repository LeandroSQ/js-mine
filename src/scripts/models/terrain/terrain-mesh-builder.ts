import { Cube } from './../geometry/cube';
import { Vector3 } from './../math/vector3';
import { VoxelType } from "../../enums/voxel-type";
import { MeshBuilder } from "../mesh-builder";
import { Vector2 } from '../math/vector2';
import { CHUNK_HEIGHT, CHUNK_SIZE } from '../../constants';
import { Chunk } from '../terrain/chunk';
import { Optional } from '../../types/optional';
import { Direction } from '../../enums/direction';

export class TerrainMeshBuilder {

	private builder = new MeshBuilder();

	constructor(
		private position: Vector2,
		private chunk: Chunk,
		private leftNeighbor: Optional<Chunk>,
		private rightNeighbor: Optional<Chunk>,
		private frontNeighbor: Optional<Chunk>,
		private backNeighbor: Optional<Chunk>
	) { }

	/**
	 * @param position The chunk position (local coordinates)
	 * @param chunk The chunk data
	 * @param neighbors 4 neighboring chunks
	 * @returns
	 */
	public generateMesh() {
		for (let x = 0; x < CHUNK_SIZE; x++) {
			for (let y = 0; y < CHUNK_HEIGHT; y++) {
				for (let z = 0; z < CHUNK_SIZE; z++) {
					const voxel = this.chunk.getVoxelAt(x, y, z);
					if (!voxel) continue;// Ignore air blocks

					const pos = new Vector3(x, y, z);

					this.addFace(pos, Direction.Up, voxel);
					if (y > 0) this.addFace(pos, Direction.Down, voxel);
					this.addFace(pos, Direction.Left, voxel);
					this.addFace(pos, Direction.Right, voxel);
					this.addFace(pos, Direction.Forward, voxel);
					this.addFace(pos, Direction.Back, voxel);
				}
			}
		}

		this.chunk.mesh = this.builder.build(this.position);
	}

	private decodeFace(side: Direction): { vertices: readonly number[], normals: readonly number[]; } {
		switch (side) {
			case Direction.Up:
				return {
					vertices: Cube.topFaceVertices,
					normals: Cube.topFaceNormals
				};
			case Direction.Down:
				return {
					vertices: Cube.bottomFaceVertices,
					normals: Cube.bottomFaceNormals
				};
			case Direction.Left:
				return {
					vertices: Cube.leftFaceVertices,
					normals: Cube.leftFaceNormals
				};
			case Direction.Right:
				return {
					vertices: Cube.rightFaceVertices,
					normals: Cube.rightFaceNormals
				};
			case Direction.Forward:
				return {
					vertices: Cube.frontFaceVertices,
					normals: Cube.frontFaceNormals
				};
			case Direction.Back:
				return {
					vertices: Cube.backFaceVertices,
					normals: Cube.backFaceNormals
				};
			default:
				throw new Error("Invalid direction");
		}
	}

	private addFace(pos: Vector3, side: Direction, voxel: VoxelType) {
		const isBeingOccluded = this.isFaceObstructed(pos, side);
		if (isBeingOccluded) return;

		const { vertices, normals } = this.decodeFace(side);
		const uvs = VoxelType.toUV(voxel, side);

		this.builder.addQuad(pos.toArray(), vertices, normals, uvs)
	}

	private getNeighbor(side: Direction): Optional<Chunk> {
		switch (side) {
			case Direction.Right:
				return this.rightNeighbor;
			case Direction.Left:
				return this.leftNeighbor;
			case Direction.Forward:
				return this.frontNeighbor;
			case Direction.Back:
				return this.backNeighbor;
			default:
				return null;
		}
	}

	private isFaceObstructed(pos: Vector3, side: Direction): boolean {
		const adjacentVoxelPosition = pos.add(Direction.toVector(side));

		const adjacentVoxel = this.chunk.getVoxelAt(adjacentVoxelPosition);
		if (adjacentVoxel) return true;

		const neighbor = this.getNeighbor(side);
		if (!neighbor) return false;

		// Convert it into global position
		const tmp = this.position.multiply(CHUNK_SIZE).add(adjacentVoxelPosition);
		const worldPosition = new Vector3(tmp.x, pos.y, tmp.y);
		const neighborVoxel = neighbor.getVoxelAtGlobalPosition(worldPosition);
		if (neighborVoxel) return true;

		return false;

	}

}