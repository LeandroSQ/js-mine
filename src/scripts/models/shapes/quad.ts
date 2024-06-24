export abstract class Quad {

	public static readonly vertices = new Float32Array([
		// Top left
		-1.0, 1.0, 0.0,
		// Bottom left
		-1.0, -1.0, 0.0,
		// Bottom right
		1.0, -1.0, 0.0,
		// Top right
		1.0, 1.0, 0.0
	]);

	public static readonly indices = new Uint16Array([
		// Top left triangle
		0, 1, 2,
		// Bottom right triangle
		0, 2, 3
	]);

	public static readonly textureCoordinates = new Float32Array([
		// Top left
		0.0, 0.0,
		// Bottom left
		0.0, 1.0,
		// Bottom right
		1.0, 1.0,
		// Top right
		1.0, 0.0
	]);

}