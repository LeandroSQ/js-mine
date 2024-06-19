import { Main } from "../main";
import { AState } from "../types/state";
import { Log } from "../utils/log";
import { Cursor } from "../utils/cursor";
import { CursorType } from "../enums/cursor-type";
import { InputHandler } from "../core/components/input-handler";
import { Key } from "../enums/key";
import { GIFUtils } from "../utils/gif";

export class StatePlay extends AState {

	constructor(public main: Main) {
		super();
	}

	// #region Utility
	public get width() {
		return this.main.screen.width;
	}

	public get height() {
		return this.main.screen.height;
	}

	public get camera() {
		return this.main.camera;
	}

	public invalidate() {
		this.main.invalidate();
	}
	// #endregion

	async setup() {
		Log.debug("StatePlay", "Setting up...");

		if (!DEBUG) Cursor.set(CursorType.Hidden);
	}

	async update(deltaTime: number) {
		this.invalidate();
		const speed = 2.5;

		if (InputHandler.isKeyDown(Key.ArrowLeft)) {
			this.camera.position[0] -= deltaTime * speed;
		}
		if (InputHandler.isKeyDown(Key.ArrowRight)) {
			this.camera.position[0] += deltaTime * speed;
		}
		if (InputHandler.isKeyDown(Key.ArrowUp)) {
			this.camera.position[1] += deltaTime * speed;
		}
		if (InputHandler.isKeyDown(Key.ArrowDown)) {
			this.camera.position[1] -= deltaTime * speed;
		}


	}

	render(ctx: CanvasRenderingContext2D): void {
		// Ignore
	}

}