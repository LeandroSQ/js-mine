import { DensityCanvas } from "../core/components/density-canvas";
import { Main } from "../main";
import { Size } from "../types/size";

export class GUIRenderer {

	public canvas = new DensityCanvas("gui-canvas");
	private isDirty = true;

	constructor(private main: Main) {}

	public get element() {
		return this.canvas.element;
	}

	public get context() {
		return this.canvas.context;
	}

	public invalidate() {
		this.isDirty = true;
	}

	public setup() {
		// Attach the canvas element to DOM
		this.canvas.attachToElement(document.body);
	}

	public setSize(size: Size) {
		this.canvas.setSize(size.width, size.height);
	}

	public clear() {
		this.canvas.clear();
	}

	public render() {
		if (!this.isDirty) return;

		this.clear();

		// TODO: Render GUI

		this.isDirty = false;
	}

}