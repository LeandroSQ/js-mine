import { Main } from "../main";
import { AState } from "../types/state";
import { Log } from "../utils/log";
import { Cursor } from "../utils/cursor";
import { CursorType } from "../enums/cursor-type";
import { InputHandler } from "../core/components/input-handler";
import { Key } from "../enums/key";
import { Gizmo } from "../utils/gizmo";
import { Vector2 } from "../models/vector2";
import { TextAlign } from "../enums/text-align";

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
		const rotationSpeed = 10;
		const translationSpeed = 0.5;

		if (InputHandler.mouseDelta.y !== 0) {
			this.camera.pitch += InputHandler.mouseDelta.y * deltaTime * rotationSpeed;
			this.camera.pitch = Math.clamp(this.camera.pitch, -89, 89);
		}

		if (InputHandler.mouseDelta.x !== 0) {
			this.camera.yaw -= InputHandler.mouseDelta.x * deltaTime * rotationSpeed;
		}

		if (InputHandler.isKeyDown(Key.ArrowUp)) {
			const forward = this.camera.forward;
			this.camera.position[0] += forward[0] * deltaTime * speed;
			this.camera.position[1] += forward[1] * deltaTime * speed;
			this.camera.position[2] += forward[2] * deltaTime * speed;
		}

		if (InputHandler.isKeyDown(Key.ArrowDown)) {
			const forward = this.camera.forward;
			this.camera.position[0] -= forward[0] * deltaTime * speed;
			this.camera.position[1] -= forward[1] * deltaTime * speed;
			this.camera.position[2] -= forward[2] * deltaTime * speed;
		}

		if (InputHandler.isKeyDown(Key.ArrowLeft)) {
			const right = this.camera.right;
			this.camera.position[0] += right[0] * deltaTime * speed;
			this.camera.position[1] += right[1] * deltaTime * speed;
			this.camera.position[2] += right[2] * deltaTime * speed;
		}

		if (InputHandler.isKeyDown(Key.ArrowRight)) {
			const right = this.camera.right;
			this.camera.position[0] -= right[0] * deltaTime * speed;
			this.camera.position[1] -= right[1] * deltaTime * speed;
			this.camera.position[2] -= right[2] * deltaTime * speed;
		}

		Gizmo.text("Position", new Vector2(this.width / 2, this.height - 80), "gray", TextAlign.Center);
		Gizmo.text(
			`{ ${this.camera.position[0].toFixed(2)}, ${this.camera.position[1].toFixed(2)}, ${this.camera.position[2].toFixed(2)} }`,
			new Vector2(this.width / 2, this.height - 60),
			"white",
			TextAlign.Center
		);
		Gizmo.text("Rotation", new Vector2(this.width / 2, this.height - 40), "gray", TextAlign.Center);
		Gizmo.text(
			`{ ${this.camera.pitch.toFixed(2)}, ${this.camera.yaw.toFixed(2)}, ${this.camera.roll.toFixed(2)} }`,
			new Vector2(this.width / 2, this.height - 20),
			"white",
			TextAlign.Center
		);
	}

	render(ctx: CanvasRenderingContext2D): void {
		// Ignore
	}

}