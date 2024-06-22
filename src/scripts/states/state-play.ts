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
		const movementSpeed = 5;
		const rotationSpeed = 20;

		this.camera.pitch -= InputHandler.getLookVertical() * deltaTime * rotationSpeed;
		this.camera.pitch = Math.clamp(this.camera.pitch, -89, 89);
		this.camera.yaw += InputHandler.getLookHorizontal() * deltaTime * rotationSpeed;

		const movementY = InputHandler.getMovementVertical();
		const movementX = InputHandler.getMovementHorizontal();

		if (movementY !== 0) {
			const forward = this.camera.forward;
			this.camera.position[0] -= forward[0] * deltaTime * movementSpeed * movementY;
			this.camera.position[1] -= forward[1] * deltaTime * movementSpeed * movementY;
			this.camera.position[2] -= forward[2] * deltaTime * movementSpeed * movementY;
		}

		if (movementX !== 0) {
			const right = this.camera.right;
			this.camera.position[0] += right[0] * deltaTime * movementSpeed * movementX;
			this.camera.position[1] += right[1] * deltaTime * movementSpeed * movementX;
			this.camera.position[2] += right[2] * deltaTime * movementSpeed * movementX;
		}

		if (InputHandler.isCrouching()) {
			this.camera.position[1] -= deltaTime * movementSpeed;
		}
		if (InputHandler.isJumping()) {
			this.camera.position[1] += deltaTime * movementSpeed;
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