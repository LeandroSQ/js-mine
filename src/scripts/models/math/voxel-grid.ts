import { CHUNK_HEIGHT, CHUNK_SIZE } from "../../constants";
import { VoxelType } from "../../enums/voxel-type";
import { Optional } from "../../types/optional";
import { Vector3 } from "./vector3";

export class VoxelGrid {

	private data: Uint8Array;

	constructor(data?: Uint8Array) {
		if (data) this.data = data;
		else this.data = new Uint8Array(this.width * this.height * this.depth);
	}

	public get width() { return CHUNK_SIZE; }
	public get depth() { return CHUNK_SIZE; }
	public get height() { return CHUNK_HEIGHT; }

	public get(x: number | Vector3, y?: number, z?: number): Optional<VoxelType> {
		if (x instanceof Vector3) return this.get(x.x, x.y, x.z);
		if (x < 0 || x >= this.width || y! < 0 || y! >= this.height || z! < 0 || z! >= this.depth) return null;

		return this.data[x + y! * this.width + z! * this.width * this.height] as Optional<VoxelType>;
	}

	public set(x: number | Vector3, y: number | Optional<VoxelType>, z?: number, value?: Optional<VoxelType>) {
		if (x instanceof Vector3) return this.set(x.x, x.y, x.z, y as VoxelType);
		if (x < 0 || x >= this.width || y as number < 0 || y as number >= this.height || z! < 0 || z! >= this.depth) return null;

		this.data[x + (y as number)! * this.width + z! * this.width * this.height] = value! as number;
	}

	public static pack(source: VoxelGrid): Uint8Array {
		return source.data;
		/* const buffer = new Uint8Array(source.width * source.height * source.depth);
		for (let x = 0; x < source.width; x++) {
			for (let y = 0; y < source.height; y++) {
				for (let z = 0; z < source.depth; z++) {
					const value = source.get(x, y, z);
					if (value) buffer[x + y * source.width + z * source.width * source.height] = value;
				}
			}
		}

		return buffer; */
	}

	public static unpack(buffer: Uint8Array): VoxelGrid {
		return new VoxelGrid(buffer);
		/* const result = new Array3D<VoxelType>(width, height, depth);
		for (let x = 0; x < width; x++) {
			for (let y = 0; y < height; y++) {
				for (let z = 0; z < depth; z++) {
					const index = x + y * width + z * width * height;
					result.data[index] = buffer[index];
				}
			}
		}

		return result; */
	}

}