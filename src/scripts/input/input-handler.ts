import { GAMEPAD_LOOK_SENSITIVITY } from "../constants";
import { GamepadAxis } from "../enums/gamepad-axis";
import { Key } from "../enums/key";
import { GamepadInput } from "./gamepad";
import { KeyboardInput } from "./keyboard";
import { MouseInput } from "./mouse";
import { GamepadButton } from "../enums/gamepad-button";

export namespace InputHandler {

	export let isDirty = false;

	// #region Input mapping
    export function getMovementHorizontal() {
		if (KeyboardInput.isCaptured()) return 0;
		let axis = 0;

		if (KeyboardInput.isKeyDown(Key.A, Key.ArrowLeft)
			|| GamepadInput.isButtonDown(GamepadButton.Left)) axis -= 1;

		if (KeyboardInput.isKeyDown(Key.D, Key.ArrowRight)
			|| GamepadInput.isButtonDown(GamepadButton.Right)) axis += 1;

		if (GamepadInput.connectedGamepad) axis = GamepadInput.getAxis(GamepadAxis.LeftStickX);

		return axis;
	}

    export function getMovementVertical() {
		if (KeyboardInput.isCaptured()) return 0;
		let axis = 0;

		if (KeyboardInput.isKeyDown(Key.W, Key.ArrowUp)
			|| GamepadInput.isButtonDown(GamepadButton.Up)) axis -= 1;

		if (KeyboardInput.isKeyDown(Key.S, Key.ArrowDown)
			|| GamepadInput.isButtonDown(GamepadButton.Down)) axis += 1;

		if (GamepadInput.connectedGamepad) axis = GamepadInput.getAxis(GamepadAxis.LeftStickY);

		return axis;
	}

	export function getLookHorizontal() {
		if (KeyboardInput.isCaptured()) return 0;

		if (MouseInput.delta.x !== 0) return MouseInput.delta.x;
		if (GamepadInput.connectedGamepad) return GamepadInput.getAxis(GamepadAxis.RightStickX) * GAMEPAD_LOOK_SENSITIVITY;

		return 0;
	}

	export function getLookVertical() {
		if (KeyboardInput.isCaptured()) return 0;

		if (MouseInput.delta.y !== 0) return MouseInput.delta.y;
		if (GamepadInput.connectedGamepad) return GamepadInput.getAxis(GamepadAxis.RightStickY) * GAMEPAD_LOOK_SENSITIVITY;

		return 0;
	}

	export function isJumping() {
		if (KeyboardInput.isCaptured()) return false;

		return KeyboardInput.isKeyDown(Key.Space, Key.ArrowUp)
			|| GamepadInput.isButtonDown(GamepadButton.A, GamepadButton.Up);
	}

	export function isCrouching() {
		if (KeyboardInput.isCaptured()) return false;

		return KeyboardInput.isKeyDown(Key.Shift)
			|| GamepadInput.isButtonDown(GamepadButton.Down, GamepadButton.B);
	}

	export function isRecording() {
		if (KeyboardInput.isCaptured()) return false;

		return KeyboardInput.isKeyJustReleased(Key.R);
	}

	export function isSwitchingCameras() {
		if (KeyboardInput.isCaptured()) return false;

		return KeyboardInput.isKeyJustReleased(Key.C);
	}

	export function isRunning(): boolean {
		if (KeyboardInput.isCaptured()) return false;

		return KeyboardInput.isKeyDown(Key.Ctrl)
			|| GamepadInput.isButtonDown(GamepadButton.RT);
	}

	export function isTogglingTerminal() {
		return KeyboardInput.isKeyJustPressed(Key.Quote);
	}
	// #endregion

	export function vibrate() {
		if (navigator.vibrate) navigator.vibrate(200);
		if (GamepadInput.connectedGamepad?.vibrationActuator) {
			GamepadInput.connectedGamepad.vibrationActuator.playEffect("dual-rumble", {
				duration: 100,
				strongMagnitude: 0.5,
				weakMagnitude: 0.25
			});

		}
	}

	export function setup() {
		KeyboardInput.setup();
		GamepadInput.setup();
		MouseInput.setup();
	}

	export function update() {
		isDirty = false;
		KeyboardInput.update();
		GamepadInput.update();
		MouseInput.update();
	}
}