/* eslint-disable complexity */
import { Vector2 } from "./vector2";

export class Rectangle {

	constructor(public x: number, public y: number, public width: number, public height: number) {}

	public translate(vector: Vector2): Rectangle {
		return new Rectangle(this.x + vector.x, this.y + vector.y, this.width, this.height);
	}

	public contains(x: number | Rectangle | Vector2, y: number | undefined = undefined) {
		if (x instanceof Vector2 && y === undefined) {
			return this.x <= x.x && this.x + this.width >= x.x && this.y <= x.y && this.y + this.height >= x.y;
		} else if (x instanceof Rectangle && y === undefined) {
			return this.x <= x.x && this.x + this.width >= x.x + x.width && this.y <= x.y && this.y + this.height >= x.y + x.height;
		} else if (typeof x === "number" && typeof y === "number") {
			return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
		} else {
			throw new Error("Invalid arguments");
		}
	}

	public intersects(other: Rectangle) {
		return this.x < other.x + other.width && this.x + this.width > other.x && this.y < other.y + other.height && this.y + this.height > other.y;
	}

	public intersection(other: Rectangle): Rectangle {
		const x = Math.max(this.x, other.x);
		const y = Math.max(this.y, other.y);
		const width = Math.min(this.x + this.width, other.x + other.width) - x;
		const height = Math.min(this.y + this.height, other.y + other.height) - y;

		return new Rectangle(x, y, width, height);
	}

	get size(): Vector2 {
		return new Vector2(this.width, this.height);
	}

	get position(): Vector2 {
		return new Vector2(this.x, this.y);
	}

	set position(value: Vector2) {
		this.x = value.x;
		this.y = value.y;
	}

	get center(): Vector2 {
		return new Vector2(this.x + this.width / 2, this.y + this.height / 2);
	}

	get left(): number {
		return this.x;
	}

	get right(): number {
		return this.x + this.width;
	}

	get top(): number {
		return this.y;
	}

	get bottom(): number {
		return this.y + this.height;
	}

	public clone(): Rectangle {
		return new Rectangle(this.x, this.y, this.width, this.height);
	}

	public equals(other: Rectangle) {
		return this.x === other.x && this.y === other.y && this.width === other.width && this.height === other.height;
	}

	public toString(): string {
		return `{ x: ${this.x}, y: ${this.y}, width: ${this.width}, height: ${this.height} }`;
	}

}
