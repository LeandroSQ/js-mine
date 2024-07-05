import { Main } from "../main";
import { AState } from "../types/state";
import { Log } from "../utils/log";
import { Cursor } from "../utils/cursor";
import { CursorType } from "../enums/cursor-type";
import { Gizmo } from "../debug/gizmo";
import { Vector2 } from "../models/math/vector2";
import { TextAlign } from "../enums/text-align";
import { vec3 } from "gl-matrix";
import { Rectangle } from "../models/math/rectangle";
import { ChunkManager } from "../models/terrain/chunk-manager";
import { Terminal } from "../utils/terminal";
import { InputHandler } from "../input/input-handler";

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

		// Load the initial chunks
		this.updateActiveChunks();
	}

	private updateActiveChunks() {
		ChunkManager.updateActiveChunks(this.main.playerCamera.tiledPosition);
	}

	private updateCameraRotation(deltaTime: number) {
		const rotationSpeed = 20;
		const maxPitch = 89;
		this.camera.pitch -= InputHandler.getLookVertical() * deltaTime * rotationSpeed;
		this.camera.pitch = Math.clamp(this.camera.pitch, -maxPitch, maxPitch);
		this.camera.yaw -= InputHandler.getLookHorizontal() * deltaTime * rotationSpeed;
	}

	private updateCameraMovement(deltaTime: number) {
		const movementSpeed = 5 * (InputHandler.isRunning() ? 20 : 1);
		const movementY = InputHandler.getMovementVertical();
		const movementX = InputHandler.getMovementHorizontal();
		/* if (movementX !== 0 || movementY !== 0) */ this.updateActiveChunks();
		if (movementY !== 0) {
			const forward = this.camera.forward;
			this.camera.position[0] -= forward[0] * deltaTime * movementSpeed * movementY;
			this.camera.position[1] -= forward[1] * deltaTime * movementSpeed * movementY;
			this.camera.position[2] -= forward[2] * deltaTime * movementSpeed * movementY;
		}
		if (movementX !== 0) {
			const right = this.camera.right;
			this.camera.position[0] -= right[0] * deltaTime * movementSpeed * movementX;
			this.camera.position[1] -= right[1] * deltaTime * movementSpeed * movementX;
			this.camera.position[2] -= right[2] * deltaTime * movementSpeed * movementX;
		}

		if (InputHandler.isCrouching()) {
			this.camera.position[1] -= deltaTime * movementSpeed;
		}
		if (InputHandler.isJumping()) {
			this.camera.position[1] += deltaTime * movementSpeed;
		}
	}

	private updateControls(deltaTime: number) {
		if (DEBUG && InputHandler.isSwitchingCameras()) {
			Log.debug("StatePlay", `Switching cameras... to ${this.main.useDebugCamera ? "player" : "debug"}`);
			this.main.useDebugCamera = !this.main.useDebugCamera;
			if (this.main.useDebugCamera) {
				// this.main.debugCamera.lookAt(this.main.playerCamera.position);
				vec3.copy(this.main.debugCamera.position, this.main.playerCamera.position);
				this.main.debugCamera.pitch = this.main.playerCamera.pitch;
				this.main.debugCamera.yaw = this.main.playerCamera.yaw;
				this.main.debugCamera.roll = this.main.playerCamera.roll;
			}
		}

		this.camera.update(deltaTime);

		this.updateCameraRotation(deltaTime);
		this.updateCameraMovement(deltaTime);
	}

	async update(deltaTime: number) {
		this.invalidate();

		this.updateControls(deltaTime);

		if (this.main.useDebugCamera) {
			const thickness = 10;
			Gizmo.outline(
				new Rectangle(thickness, thickness, this.width - thickness * 2, this.height - thickness * 2),
				"#ff0000",
				thickness
			);
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
	}

}