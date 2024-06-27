import { Vector3 } from "../models/math/vector3";

export enum Direction {
	Up,
	Down,
	Left,
	Right,
	Forward,
	Back
}

export namespace Direction {

	export function toVector(direction: Direction): Vector3 {
		switch (direction) {
			case Direction.Up: return Vector3.up;
			case Direction.Down: return Vector3.down;
			case Direction.Left: return Vector3.left;
			case Direction.Right: return Vector3.right;
			case Direction.Forward: return Vector3.forward;
			case Direction.Back: return Vector3.back;
		}
	}
}
