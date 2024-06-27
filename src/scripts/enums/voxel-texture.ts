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
		const rows = 16, cols = 16;
		const row = Math.floor(texture / cols);
		const col = texture % cols;

		return [
			col / rows, (rows - row) / cols,
			(col + 1) / rows, (rows - row) / cols,
			(col + 1) / rows, (rows - row + 1) / cols,
			col / rows, (rows - row + 1) / cols,
		] as const;
	}

}