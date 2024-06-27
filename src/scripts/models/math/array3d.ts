import { Optional } from "../../types/optional";
import { Vector3 } from "./vector3";

export class Array3D<T> {

	private data: Array<T>;

	constructor(public width: number, public height: number, public depth: number) {
		this.data = new Array(width * height * depth);
	}

	public get(x: number | Vector3, y?: number, z?: number): Optional<T> {
		if (x instanceof Vector3) return this.get(x.x, x.y, x.z);
		if (x < 0 || x >= this.width || y! < 0 || y! >= this.height || z! < 0 || z! >= this.depth) return null;

		return this.data[x + y! * this.width + z! * this.width * this.height];
	}

	public set(x: number | Vector3, y: number | Optional<T>, z?: number, value?: Optional<T>) {
		if (x instanceof Vector3) return this.set(x.x, x.y, x.z, y as T);
		if (x < 0 || x >= this.width || y as number < 0 || y as number >= this.height || z! < 0 || z! >= this.depth) return null;

		this.data[x + (y as number)! * this.width + z! * this.width * this.height] = value!;
	}

}