import { Mesh } from "./mesh";

const decode = (col: number, row: number): number => {
	return (row + 1) * 16 + col;
}

export enum CubeFace {
	DIRT = decode(2, 0),
	GRASS = decode(0, 0),
	GRASS_SIDE = decode(3, 0),
	DIAMOND_ORE = decode(2, 3)
};

export class Cube extends Mesh {

	// #region Vertices
	public static readonly frontFaceVertices = [
		-1.0, -1.0, 1.0,
		1.0, -1.0, 1.0,
		1.0, 1.0, 1.0,
		-1.0, 1.0, 1.0,
	] as const;

	public static readonly backFaceVertices = [
		1.0, -1.0, -1.0,
		-1.0, -1.0, -1.0,
		-1.0, 1.0, -1.0,
		1.0, 1.0, -1.0,
	] as const;

	public static readonly topFaceVertices = [
		-1.0, 1.0, -1.0,
		-1.0, 1.0, 1.0,
		1.0, 1.0, 1.0,
		1.0, 1.0, -1.0,
	] as const;

	public static readonly bottomFaceVertices = [
		-1.0, -1.0, -1.0,
		1.0, -1.0, -1.0,
		1.0, -1.0, 1.0,
		-1.0, -1.0, 1.0,
	] as const;

	public static readonly rightFaceVertices = [
		1.0, -1.0, 1.0,
		1.0, -1.0, -1.0,
		1.0, 1.0, -1.0,
		1.0, 1.0, 1.0,
	] as const;

	public static readonly leftFaceVertices = [
		-1.0, -1.0, -1.0,
		-1.0, -1.0, 1.0,
		-1.0, 1.0, 1.0,
		-1.0, 1.0, -1.0,
	] as const;

	public static readonly vertices = new Float32Array(
		[
			...this.frontFaceVertices,
			...this.backFaceVertices,
			...this.topFaceVertices,
			...this.bottomFaceVertices,
			...this.rightFaceVertices,
			...this.leftFaceVertices
		] as const
	);
	// #endregion

	// #region Indices
	public static readonly frontFaceIndices = [
		0, 1, 2,
		0, 2, 3,
	] as const;

	public static readonly backFaceIndices = [
		4, 5, 6,
		4, 6, 7,
	] as const;

	public static readonly topFaceIndices = [
		8, 9, 10,
		8, 10, 11,
	] as const;

	public static readonly bottomFaceIndices = [
		12, 13, 14,
		12, 14, 15,
	] as const;

	public static readonly rightFaceIndices = [
		16, 17, 18,
		16, 18, 19,
	] as const;

	public static readonly leftFaceIndices = [
		20, 21, 22,
		20, 22, 23
	] as const;

	public static readonly indices = new Uint16Array(
		[
			...this.frontFaceIndices,
			...this.backFaceIndices,
			...this.topFaceIndices,
			...this.bottomFaceIndices,
			...this.rightFaceIndices,
			...this.leftFaceIndices
		] as const
	);
	// #endregion

	// #region Normals
	public static readonly frontFaceNormals = [
		0.0, 0.0, 0.0,
		0.0, 1.0, 1.0,
		1.0, 1.0, 2.0,
		2.0, 2.0, 2.0,
	] as const;

	public static readonly backFaceNormals = [
		3.0, 3.0, 3.0,
		3.0, 4.0, 4.0,
		4.0, 4.0, 5.0,
		5.0, 5.0, 5.0,
	] as const;

	public static readonly topFaceNormals = [
		6.0, 6.0, 6.0,
		6.0, 7.0, 7.0,
		7.0, 7.0, 8.0,
		8.0, 8.0, 8.0,
	] as const;

	public static readonly bottomFaceNormals = [
		9.0, 9.0, 9.0,
		9.0, 10.0, 10.0,
		10.0, 10.0, 11.0,
		11.0, 11.0, 11.0,
	] as const;

	public static readonly rightFaceNormals = [
		12.0, 12.0, 12.0,
		12.0, 13.0, 13.0,
		13.0, 13.0, 14.0,
		14.0, 14.0, 14.0,
	] as const;

	public static readonly leftFaceNormals = [
		15.0, 15.0, 15.0,
		15.0, 16.0, 16.0,
		16.0, 16.0, 17.0,
		17.0, 17.0, 17.0,
	] as const;

	public static normals = new Float32Array(this.vertices.length).map((_, i) => Math.floor(i / 4));
	/* public static readonly normals = new Float32Array(
		[
			...this.frontFaceNormals,
			...this.backFaceNormals,
			...this.topFaceNormals,
			...this.bottomFaceNormals,
			...this.rightFaceNormals,
			...this.leftFaceNormals
		] as const
	); */
	// #endregion

	// #region UVs
	public static getUV(face: CubeFace) {
		const rows = 16, cols = 16;
		const row = Math.floor(face / cols);
		const col = face % cols;
		console.log(face, col, row);

		return [
			col       / rows, (rows - row) / cols,
			(col + 1) / rows, (rows - row) / cols,
			(col + 1) / rows, (rows - row + 1) / cols,
			col       / rows, (rows - row + 1) / cols,
		] as const;
	}
	// #endregion

	constructor(gl: WebGLContext, public topFace: CubeFace, public sideFace: CubeFace, public bottomFace: CubeFace) {
		const faces = [
			sideFace,   // Front
			sideFace,   // Back
			topFace,    // Top
			bottomFace, // Bottom
			sideFace,   // Right
			sideFace    // Left
		].map(Cube.getUV).flat();

		super(gl, Cube.vertices, new Float32Array(faces), Cube.normals, Cube.indices);
	}

}