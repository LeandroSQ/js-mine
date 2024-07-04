import { Vector3 } from "../models/math/vector3";

export enum Direction {
	Up,
	Down,
	West,
	East,
	North,
	South
}

export namespace Direction {

	export function toVector(direction: Direction): Vector3 {
		switch (direction) {
			case Direction.Up: return Vector3.up;
			case Direction.Down: return Vector3.down;
			case Direction.West: return Vector3.left;
			case Direction.East: return Vector3.right;
			case Direction.North: return Vector3.forward;
			case Direction.South: return Vector3.back;
		}
	}
}
