export class Vector3 {

	public x: number;
	public y: number;
	public z: number;

	constructor(x: number, y: number | undefined = undefined, z: number | undefined = undefined) {
		this.x = x;

		if (y === undefined) this.y = x;
		else this.y = y;

		if (z === undefined) this.z = x;
		else this.z = z;
	}

	public dot(vector: Vector3): number {
		return this.x * vector.x + this.y * vector.y + this.z * vector.z;
	}

	public add(vector: Vector3): Vector3 {
		return new Vector3(this.x + vector.x, this.y + vector.y, this.z + vector.z);
	}

	public subtract(vector: Vector3): Vector3 {
		return new Vector3(this.x - vector.x, this.y - vector.y, this.z - vector.z);
	}

	public multiply(scalar: number): Vector3 {
		return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
	}

	public divide(scalar: number): Vector3 {
		if (scalar === 0) {
			throw new Error("Cannot divide by zero.");
		}

		return new Vector3(this.x / scalar, this.y / scalar, this.z / scalar);
	}

	public get length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}

	public normalize(): Vector3 {
		const length = this.length;

		return new Vector3(this.x / length, this.y / length, this.z / length);
	}

	public clone(): Vector3 {
		return new Vector3(this.x, this.y, this.z);
	}

	public static distance(a: Vector3, b: Vector3): number {
		return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
	}

	public static random(scalar: number): Vector3 {
		return new Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiply(scalar);
	}

	public static get zero() {
		return new Vector3(0, 0, 0);
	}

	public toString(): string {
		return `{ ${this.x}, ${this.y}, ${this.z} }`;
	}

}