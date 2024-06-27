import { GAMEPAD_DEADZONE, GAMEPAD_LINEARITY, LONG_PRESS } from "../constants";
import { Gizmo } from "../debug/gizmo";
import { GamepadAxis } from "../enums/gamepad-axis";
import { Vector2 } from "../models/math/vector2";
import { Dictionary } from "../types/dictionary";
import { GamepadInputState } from "../types/input-state";
import { Optional } from "../types/optional";
import { Log } from "../utils/log";
import { GamepadButton } from "../enums/gamepad-button";
import { InputHandler } from "./input-handler";

export namespace GamepadInput {

	const VERBOSE_GAMEPAD = DEBUG && true;

	const gamepadButtons: Dictionary<GamepadInputState> = {};
	const gamepadAxes: Dictionary<number> = {};

	export let connectedGamepad: Optional<Gamepad> = null;

	let isFirstGamepadConnection = true;
	let gamepadPollingIntervalHandle = -1;

	// #region API
	export function isButtonDown(...buttons: GamepadButton[]): boolean {
		return buttons.some(button => gamepadButtons[button]?.active === true);
	}

	export function isButtonUp(...buttons: GamepadButton[]): boolean {
		return buttons.some(button => gamepadButtons[button]?.active === true);
	}

	export function isButtonJustPressed(...buttons: GamepadButton[]): boolean {
		return buttons.some(button => gamepadButtons[button]?.justPressed === true);
	}

	export function isButtonJustReleased(...buttons: GamepadButton[]): boolean {
		return buttons.some(button => gamepadButtons[button]?.justReleased === true);
	}

	export function isButtonLongPressed(...buttons: GamepadButton[]): boolean {
		return buttons.some(button => gamepadButtons[button]?.longPress === true);
	}

	export function isButtonShortPressed(...buttons: GamepadButton[]): boolean {
		return buttons.some(button => gamepadButtons[button]?.shortPress === true);
	}

	export function getAxis(axis: GamepadAxis): number {
		return gamepadAxes[axis];
	}
	// #endregion

	// #region Event handlers
	function onGamepadConnected(event: GamepadEvent) {
		if (VERBOSE_GAMEPAD) Log.info("Input", `Gamepad connected: ${event.gamepad.id}`);
		connectedGamepad = event.gamepad;

		if (isFirstGamepadConnection) {
			isFirstGamepadConnection = false;
			InputHandler.isDirty = true;
		}
	}

	function onGamepadDisconnected(event: GamepadEvent) {
		if (VERBOSE_GAMEPAD) Log.info("Input", `Gamepad disconnected: ${event.gamepad.id}`);
		connectedGamepad = null;
	}

	function onGamepadPoll() {
		const gamepad = navigator.getGamepads().find(x => x);
		if (!gamepad) return;

		if (VERBOSE_GAMEPAD) Log.debug("Input", `Gamepad found: ${gamepad.id}`);
		connectedGamepad = gamepad;

		if (isFirstGamepadConnection) {
			isFirstGamepadConnection = false;
			InputHandler.isDirty = true;
		}

		clearInterval(gamepadPollingIntervalHandle);
	}

	function requestGamepadPoll() {
		gamepadPollingIntervalHandle = setInterval(onGamepadPoll.bind(this), 500) as unknown as number;
	}

	function pollForConnectedGamepad() {
		const gamepad = navigator.getGamepads().find(x => x && x.id === connectedGamepad?.id);
		if (gamepad) {
			connectedGamepad = gamepad;
		} else {
			if (VERBOSE_GAMEPAD) Log.info("Input", `Gamepad disconnected: ${connectedGamepad?.id}`);
			connectedGamepad = null;
			requestGamepadPoll();
		}
	}

	function updateGamepadButtons() {
		for (let i = 0; i < connectedGamepad!.buttons.length; i++) {
			const button = connectedGamepad!.buttons[i];
			const state = gamepadButtons[i];

			// Deadzone
			state.value = button.value;
			if (Math.abs(state.value) < GAMEPAD_DEADZONE) state.value = 0;
			else if (1.0 - Math.abs(state.value) < GAMEPAD_DEADZONE) state.value = Math.sign(state.value);
			// Non-linearity
			state.value = Math.pow(state.value, GAMEPAD_LINEARITY) * Math.sign(state.value);

			if (button.pressed !== state.active) {
				InputHandler.isDirty = true;
				if (button.pressed) {// On button down
					state.active = true;
					state.lastChange = Date.now();
					state.justPressed = true;
					state.justReleased = false;
					state.lastTrigger = Date.now();
					state.longPress = false;
					state.shortPress = false;
				} else {// On button up
					state.active = false;
					state.lastChange = Date.now();
					state.justPressed = false;
					state.justReleased = true;
					const elapsed = state.lastChange - state.lastTrigger;
					state.longPress = elapsed >= LONG_PRESS;
					state.shortPress = !state.longPress;
				}
			} else {// Button state hasn't changed
				state.justReleased = false;
				state.justPressed = false;
				state.shortPress = false;
				state.longPress = state.active && Date.now() - state.lastChange >= LONG_PRESS;
			}
		}
	}

	function updateGamepadAxes() {
		const pairs = [
			[GamepadAxis.LeftStickX, GamepadAxis.LeftStickY],
			[GamepadAxis.RightStickX, GamepadAxis.RightStickY]
		];

		for (const pair of pairs) {
			let value = new Vector2(connectedGamepad!.axes[pair[0]], connectedGamepad!.axes[pair[1]]);
			const magnitude = Math.pow(value.length, GAMEPAD_LINEARITY);
			const deadzone = Math.max(0, magnitude - GAMEPAD_DEADZONE) / (1.0 - GAMEPAD_DEADZONE);
			value = value.divide(magnitude).multiply(deadzone);

			// Detect changes
			if (gamepadAxes[pair[0]] !== value.x || gamepadAxes[pair[1]] !== value.y) {
				InputHandler.isDirty = true;
				gamepadAxes[pair[0]] = value.x;
				gamepadAxes[pair[1]] = value.y;
			}
		}
	}

	// eslint-disable-next-line max-statements

	// #endregion

	export function setup() {
		if ("getGamepads" in navigator) {
			if ("ongamepadconnected" in window) {
				window.addEventListener("gamepadconnected", onGamepadConnected.bind(this));
				window.addEventListener("gamepaddisconnected", onGamepadDisconnected.bind(this));
			} else {
				// Chrome doesn't support the gamepadconnected event
				requestGamepadPoll();
			}

			for (const axis of Object.values(GamepadAxis)) {
				gamepadAxes[axis] = 0;
			}

			for (const button of Object.values(GamepadButton)) {
				gamepadButtons[button] = {
					active: false,
					lastChange: Date.now(),
					lastTrigger: Date.now(),

					justPressed: false,
					justReleased: false,
					longPress: false,
					shortPress: false,
					value: 0
				};
			}
		}
	}

	export function update() {
		Gizmo.gamepad(new Vector2(window.innerWidth - 125, window.innerHeight - 100), gamepadButtons, gamepadAxes);
		if (!connectedGamepad) return;

		// Check if this browser requires polling
		if (!("ongamepadconnected" in window)) pollForConnectedGamepad();

		// Gizmo.text(JSON.stringify(gamepadAxes), new Vector2(250, 250));
		updateGamepadButtons();
		updateGamepadAxes();
	}

}