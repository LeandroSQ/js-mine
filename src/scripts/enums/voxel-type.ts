import { Direction } from './direction';
import { VoxelTexture } from './voxel-texture';

export enum VoxelType {
	Air,
	Dirt,
	Grass,
	Sand,
	Stone,
	Snow
};

export namespace VoxelType {

	// TODO: Move this to a class, and have each type implement a method to get the UV
	export function toUV(type: VoxelType, side: Direction): number[] {
		let texture;

		switch (type) {
			case VoxelType.Dirt:
				texture = VoxelTexture.Dirt;
				break;
			case VoxelType.Grass:
				switch (side) {
					case Direction.Up:
						texture = VoxelTexture.Grass;
						break;
					case Direction.Down:
						texture = VoxelTexture.Dirt;
						break;
					default:
						texture = VoxelTexture.GrassSide
						break;
				}
				break;
			case VoxelType.Sand:
				texture = VoxelTexture.Sand;
				break;
			case VoxelType.Stone:
				texture = VoxelTexture.Stone;
				break;
			case VoxelType.Snow:
				texture = VoxelTexture.Snow;
				break;
		}

		return VoxelTexture.toUV(texture);
	}

}