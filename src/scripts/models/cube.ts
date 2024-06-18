export class Cube {

	public static vertices = new Float32Array(
		[
			// Front face
			-0.5, -0.5, 0.5,
			0.5, -0.5, 0.5,
			0.5, 0.5, 0.5,
			-0.5, 0.5, 0.5,
			// Back face
			0.5, -0.5, -0.5,
			-0.5, -0.5, -0.5,
			-0.5, 0.5, -0.5,
			0.5, 0.5, -0.5,
			// Top face
			-0.5, 0.5, -0.5,
			-0.5, 0.5, 0.5,
			0.5, 0.5, 0.5,
			0.5, 0.5, -0.5,
			// Bottom face
			-0.5, -0.5, -0.5,
			0.5, -0.5, -0.5,
			0.5, -0.5, 0.5,
			-0.5, -0.5, 0.5,
			// Right face
			0.5, -0.5, 0.5,
			0.5, -0.5, -0.5,
			0.5, 0.5, -0.5,
			0.5, 0.5, 0.5,
			// Left face
			-0.5, -0.5, -0.5,
			-0.5, -0.5, 0.5,
			-0.5, 0.5, 0.5,
			-0.5, 0.5, -0.5,
		] as const
	);

	public static indices = new Uint16Array(
		[
			// Front
			0, 1, 2,
			0, 2, 3,
			// Back
			4, 5, 6,
			4, 6, 7,
			// Top
			8, 9, 10,
			8, 10, 11,
			// Bottom
			12, 13, 14,
			12, 14, 15,
			// Right
			16, 17, 18,
			16, 18, 19,
			// Left
			20, 21, 22,
			20, 22, 23
		] as const
	);

	// 4 vertices, 1 normal per vertex, repeated 4 times
	public static normals = new Float32Array(this.vertices.length).map((_, i) => Math.floor(i / 4));

	// Same thing 8 times
	public static textureCoordinates = new Float32Array([
		// Front face
		1/4, 1/3,
		2/4, 1/3,
		2/4, 2/3,
		1/4, 2/3,

		// Back face
		1/4, 1/3,
		2/4, 1/3,
		2/4, 2/3,
		1/4, 2/3,

		// Top face
		1/4, 1.0,
		2/4, 1.0,
		2/4, 2/3,
		1/4, 2/3,

		// Bottom face
		1/4, 0.0,
		2/4, 0.0,
		2/4, 1/3,
		1/4, 1/3,

		// Right face
		1/4, 1/3,
		2/4, 1/3,
		2/4, 2/3,
		1/4, 2/3,

		// Left face
		1/4, 1/3,
		2/4, 1/3,
		2/4, 2/3,
		1/4, 2/3,
	]);
	/* public static textureCoordinates = new Float32Array(new Array(8).fill([
		0.0, 0.0, // Bottom left
		1.0, 0.0, // Bottom right
		1.0, 1.0, // Top right
		0.0, 1.0  // Top left
	]).flat()); */

}