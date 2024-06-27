import { LONG_PRESS } from "../constants";
import { Key } from "../enums/key";
import { Dictionary } from "../types/dictionary";
import { InputState } from "../types/input-state";
import { Optional } from "../types/optional";
import { Log } from "../utils/log";
import { InputHandler } from "./input-handler";

export namespace KeyboardInput {

	const VERBOSE_KEYBOARD = DEBUG && true;

	const keyState: Dictionary<InputState> = {};
	let keyboardCaptureListener: Optional<KeyboardCaptureListener> = null;

	// #region API
	export type KeyboardCaptureListener = (e: KeyboardEvent) => void;

	export function isCaptured() {
		return keyboardCaptureListener !== null;
	}

	export function startCapture(listener: KeyboardCaptureListener) {
		if (VERBOSE_KEYBOARD) Log.debug("Input", "Keyboard capture started!");
		keyboardCaptureListener = listener;
	}

	export function releaseCapture() {
		if (VERBOSE_KEYBOARD) Log.debug("Input", "Keyboard capture ended!");
		keyboardCaptureListener = null;
	}

	export function isKeyDown(...keys: Key[]): boolean {
		return keys.some(key => keyState[key]?.active);
	}

	export function isKeyUp(...keys: Key[]): boolean {
		return keys.some(key => !keyState[key]?.active);
	}

	export function isKeyJustPressed(...keys: Key[]): boolean {
		return keys.some(key => keyState[key]?.justPressed);
	}

	export function isKeyJustReleased(...keys: Key[]): boolean {
		return keys.some(key => keyState[key]?.justReleased);
	}

	export function isKeyLongPressed(...keys: Key[]): boolean {
		return keys.some(key => keyState[key]?.longPress);
	}

	export function isKeyShortPressed(...keys: Key[]): boolean {
		return keys.some(key => keyState[key]?.shortPress);
	}
	// #endregion

	// #region Event handlers
	function onKeyPress(event: KeyboardEvent) {
		if (VERBOSE_KEYBOARD) Log.debug("Input", `Key press: ${event.key} (${event.code})`);
		console.log(event);
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key && event.key !== "Dead" && event.key !== "Unidentified") {
			keyboardCaptureListener?.call(null, event);
		}

		if (event.repeat) return;

		if (!Object.values(Key).includes(event.code as Key)) return;

		if (VERBOSE_KEYBOARD) Log.debug("Input", `Key down: ${event.key} (${event.code})`);

		keyState[event.code] = {
			active: true,
			lastChange: Date.now(),
			lastTrigger: Date.now(),

			justPressed: true,
			justReleased: false,
			longPress: false,
			shortPress: false
		};

		InputHandler.isDirty = true;
	}

	function onKeyUp(event: KeyboardEvent) {
		if (event.repeat) return;

		if (VERBOSE_KEYBOARD) Log.debug("Input", `Key up: ${event.key} (${event.code})`);
		if (!Object.values(Key).includes(event.code as Key)) return;

		const obj = keyState[event.code];
		if (!obj) return;
		obj.active = false;
		obj.lastChange = Date.now();
		obj.justPressed = false;
		obj.justReleased = true;
		const elapsed = obj.lastChange - obj.lastTrigger;
		obj.longPress = elapsed >= LONG_PRESS;
		obj.shortPress = !obj.longPress;

		InputHandler.isDirty = true;
	}
	// #endregion

	export function setup() {
		window.addEventListener("keydown", onKeyDown.bind(this));
		window.addEventListener("keyup", onKeyUp.bind(this));
		window.addEventListener("keypress", onKeyPress.bind(this));
	}

	export function update() {
		for (const key in keyState) {
			if (!keyState.hasOwnProperty(key)) continue;

			const obj = keyState[key];
			obj.justReleased = false;
			obj.justPressed = false;
			obj.shortPress = false;
			obj.longPress = obj.active && Date.now() - obj.lastChange >= LONG_PRESS;
		}
	}

}