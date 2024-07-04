export class Vector2 {

	public x: number;
	public y: number;

	constructor(x: number, y: number | undefined = undefined) {
		this.x = x;

		if (y === undefined) this.y = x;
		else this.y = y;
	}

	public dot(vector: Vector2): number {
		return this.x * vector.x + this.y * vector.y;
	}

	public add(vector: Vector2): Vector2 {
		return new Vector2(this.x + vector.x, this.y + vector.y);
	}

	public subtract(vector: Vector2): Vector2 {
		return new Vector2(this.x - vector.x, this.y - vector.y);
	}

	public multiply(scalar: number): Vector2 {
		return new Vector2(this.x * scalar, this.y * scalar);
	}

	public divide(divisor: number): Vector2 {
		return new Vector2(this.x / divisor, this.y / divisor);
	}

	public normalize(): Vector2 {
		const length = this.length;

		return new Vector2(this.x / length, this.y / length);
	}

	public clone(): Vector2 {
		return new Vector2(this.x, this.y);
	}

	public static distanceSquared(a: Vector2, b: Vector2): number {
		return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
	}

	public static distance(a: Vector2, b: Vector2): number {
		return Math.sqrt(this.distanceSquared(a, b));
	}

	public static random(scalar: number): Vector2 {
		return new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiply(scalar);
	}

	public get length(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	public static get zero() {
		return new Vector2(0, 0);
	}

	public toString(): string {
		return `{ ${this.x}, ${this.y} }`;
	}

}
