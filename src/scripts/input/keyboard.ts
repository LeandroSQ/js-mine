import debounce from "debounce";
import { LONG_PRESS } from "../constants";
import { Key } from "../enums/key";
import { Dictionary } from "../types/dictionary";
import { InputState } from "../types/input-state";
import { Optional } from "../types/optional";
import { Log } from "../utils/log";
import { InputHandler } from "./input-handler";

export namespace KeyboardInput {

	const VERBOSE_KEYBOARD = DEBUG && false;

	const keyState: Dictionary<InputState> = {};
	let inputElement: HTMLInputElement;
	let keyboardCaptureListener: Optional<KeyboardCaptureListener> = null;

	// #region API
	export type KeyboardCaptureListener = (text: string, selectionStart: number, selectionEnd: number) => void;

	export function isCaptured() {
		return keyboardCaptureListener !== null;
	}

	export function setInput(text: string, selectionStart: number, selectionEnd: number) {
		inputElement.value = text;
		inputElement.setSelectionRange(selectionStart, selectionEnd);
	}

	export function clearInput() {
		inputElement.value = "";
		inputElement.focus();
	}

	export function focus() {
		if (isCaptured()) inputElement.focus();
	}

	export function startCapture(listener: KeyboardCaptureListener) {
		if (VERBOSE_KEYBOARD) Log.debug("Input", "Keyboard capture started!");
		keyboardCaptureListener = listener;
		inputElement.focus();
	}

	export function releaseCapture() {
		if (VERBOSE_KEYBOARD) Log.debug("Input", "Keyboard capture ended!");
		keyboardCaptureListener = null;
		inputElement.blur();
		inputElement.value = "";
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
	function onInput(event?: InputEvent) {
		const text = inputElement.value;
		const selectionStart = inputElement.selectionStart;
		const selectionEnd = inputElement.selectionEnd;

		keyboardCaptureListener?.call(this, text, selectionStart, selectionEnd);

		if (VERBOSE_KEYBOARD) Log.debug("Input", `Key press: ${text} (${selectionStart} - ${selectionEnd})`);
	}

	function onKeyDown(event: KeyboardEvent) {
		if (isCaptured()) onInput();

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
		if (isCaptured()) onInput();

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
		// Wish there was a better way to do this, but IME is a pain
		// And composition events only really work on `contenteditable` elements
		// So there is no way to capture input events without an input element :/
		inputElement = document.createElement("input");
		inputElement.type = "text";
		inputElement.style.position = "absolute";
		inputElement.style.left = "0px";
		inputElement.style.top = "300px";
		inputElement.style.width = "200px";
		inputElement.style.height = "20px";
		inputElement.style.zIndex = "-1";
		inputElement.style.pointerEvents = "none";
		document.body.appendChild(inputElement);
		inputElement.addEventListener("input", onInput.bind(this));

		window.addEventListener("keydown", onKeyDown.bind(this));
		window.addEventListener("keyup", onKeyUp.bind(this));
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