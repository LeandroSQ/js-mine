import { SETTINGS } from "../settings";

function coordToIndex(col: number, row: number): number {
	return (row + 1) * 16 + col;
}

export enum VoxelTexture {
	Dirt = coordToIndex(2, 0),
	Grass = coordToIndex(0, 0),
	GrassSide = coordToIndex(3, 0),
	DiamondOre = coordToIndex(2, 3),
	Stone = coordToIndex(1, 0),
	Sand = coordToIndex(2, 1),
	Snow = coordToIndex(2, 4),
}

export namespace VoxelTexture {

	export function toUV(texture: VoxelTexture): number[] {
		const atlasSpriteCount = SETTINGS.TEXTURE_ATLAS_SIZE;
		const atlasSpriteSize = SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE;
		const atlasPadding = SETTINGS.TEXTURE_PADDING;

		// Decode texture index
		const row = Math.floor(texture / atlasSpriteCount);
		const col = texture % atlasSpriteCount;

		// Apply padding, if needed
		let paddingX = 0, paddingY = 0;
		if (atlasPadding > 0) {
			paddingX = atlasPadding / (atlasSpriteCount * atlasSpriteSize);
			paddingY = atlasPadding / (atlasSpriteCount * atlasSpriteSize);
		}

		// Calculate UV coordinates
		const startX = col / atlasSpriteCount + paddingX;
		const startY = (atlasSpriteCount - row) / atlasSpriteCount + paddingY;
		const endX = (col + 1) / atlasSpriteCount - paddingX;
		const endY = (atlasSpriteCount - row + 1) / atlasSpriteCount - paddingY;

		return [
			startX, startY,
			endX, startY,
			endX, endY,
			startX, endY,
		].map(x => Math.clamp(x, 0.0, 1.0));
	}

}