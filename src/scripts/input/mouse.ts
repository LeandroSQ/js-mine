import { LONG_PRESS } from "../constants";
import { MouseButton } from "../enums/mouse-button";
import { Vector2 } from "../models/math/vector2";
import { Dictionary } from "../types/dictionary";
import { InputState } from "../types/input-state";
import { Log } from "../utils/log";
import { InputHandler } from "./input-handler";
import { KeyboardInput } from "./keyboard";

export namespace MouseInput {

	const VERBOSE_MOUSE = DEBUG && false;

	const REQUIRE_LOCK_TO_MOVE = true as const;
	const POINTER_LOCK_REQUEST_INTERVAL = 1000 as const;

	export const position = Vector2.zero;
	export const delta = Vector2.zero;
	export const buttons: Dictionary<InputState> = {};
	export let mouseWheelDelta = 0;

	let lastPointerLockTime = 0;
	let lastPointerLockTimeoutHandle = -1;

	// #region API
	export function isMouseButtonDown(...buttons: MouseButton[]): boolean {
		return buttons.some(button => MouseInput.buttons[button]?.active);
	}

	export function isMouseButtonUp(...buttons: MouseButton[]): boolean {
		return buttons.some(button => !MouseInput.buttons[button]);
	}

	export function isMouseButtonJustPressed(...buttons: MouseButton[]): boolean {
		return buttons.some(button => MouseInput.buttons[button]?.justPressed);
	}

	export function isMouseButtonJustReleased(...buttons: MouseButton[]): boolean {
		return buttons.some(button => MouseInput.buttons[button]?.justReleased);
	}

	export function isMouseButtonLongPressed(...buttons: MouseButton[]): boolean {
		return buttons.some(button => MouseInput.buttons[button]?.longPress);
	}

	export function isMouseButtonShortPressed(...buttons: MouseButton[]): boolean {
		return buttons.some(button => MouseInput.buttons[button]?.shortPress);
	}
	// #endregion

	// #region Event handlers
	function onMouseMove(event: MouseEvent) {
		KeyboardInput.focus();
		if (REQUIRE_LOCK_TO_MOVE && !document.pointerLockElement) return;

		if (VERBOSE_MOUSE) Log.debug("Input", `Mouse move: ${event.clientX}, ${event.clientY}`);

		delta.x = event.movementX;
		delta.y = event.movementY;

		position.x = event.clientX - ((event.target as HTMLElement)?.offsetLeft ?? 0);
		position.y = event.clientY - ((event.target as HTMLElement)?.offsetTop ?? 0);
	}

	function onMouseDown(event: MouseEvent) {
		KeyboardInput.focus();
		if (!Object.values(MouseButton).includes(event.button as MouseButton)) return;

		if (VERBOSE_MOUSE) Log.debug("Input", `Mouse down: ${event.button}`);

		buttons[event.button] = {
			active: true,
			lastChange: Date.now(),
			lastTrigger: Date.now(),

			justPressed: true,
			justReleased: false,
			longPress: false,
			shortPress: false
		};

		handlePointerLock();

		InputHandler.isDirty = true;
	}

	function onMouseUp(event: MouseEvent) {
		KeyboardInput.focus();
		if (!Object.values(MouseButton).includes(event.button as MouseButton)) return;

		if (VERBOSE_MOUSE) Log.debug("Input", `Mouse up: ${event.button}`);

		const obj = buttons[event.button];
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

	function onPointerDown(element: HTMLElement, event: PointerEvent) {
		if (!Object.values(MouseButton).includes(event.button as MouseButton)) return;

		// Only really consider pointer capture if we didn't lock it before
		if (!document.pointerLockElement) element.setPointerCapture(event.pointerId);

		onMouseDown(event);
	}

	function onPointerUp(element: HTMLElement, event: PointerEvent) {
		if (!Object.values(MouseButton).includes(event.button as MouseButton)) return;

		// Only really consider pointer capture if we didn't lock it before
		if (!document.pointerLockElement) element.releasePointerCapture(event.pointerId);

		onMouseUp(event);
	}

	function onMouseWheel(event: WheelEvent) {
		KeyboardInput.focus();
		if (VERBOSE_MOUSE) Log.debug("Input", `Mouse wheel: ${event.deltaY}`);

		mouseWheelDelta = event.deltaY;
	}

	function handlePointerLock() {
		// On the first mouse click, request pointer lock
		if (document.pointerLockElement) return;

		// Schedule another attempt if the last one was too recent
		if (Date.now() - lastPointerLockTime < POINTER_LOCK_REQUEST_INTERVAL) {
			if (lastPointerLockTimeoutHandle < 0) {
				Log.debug("Input", "Scheduling another pointer lock attempt");
				lastPointerLockTimeoutHandle = setTimeout(handlePointerLock.bind(this), POINTER_LOCK_REQUEST_INTERVAL) as unknown as number;
			}
			return;
		}

		if (lastPointerLockTimeoutHandle >= 0) {
			clearTimeout(lastPointerLockTimeoutHandle);
			lastPointerLockTimeoutHandle = -1;
		}

		const options = {
			unadjustedMovement: true // Disable mouse acceleration
		} as const;

		// Some really strange API, in some browsers is void, others returns a promise
		// In some accepts options, in others doesn't
		try {
			lastPointerLockTime = Date.now();
			const result: undefined | Promise<void> = (document.body).requestPointerLock(options) as undefined | Promise<void>;
			if (result) {
				result.then(() => {
					Log.debug("Input", "Pointer lock acquired (async)");
				})
					.catch(e => Log.error("Input", "Failed to acquire pointer lock", e));
			} else {
				Log.debug("Input", "Pointer lock acquired");
			}
		} catch (e) {
			Log.error("Input", "Failed to acquire pointer lock", e);
		}
	}
	// #endregion

	export function setup() {
		position.x = window.innerWidth / 2;
		position.y = window.innerHeight / 2;
		document.body.addEventListener("click", onMouseMove.bind(this));
		document.body.addEventListener("mousemove", onMouseMove.bind(this));
		document.body.addEventListener("mousedown", onMouseDown.bind(this));
		document.body.addEventListener("mouseup", onMouseUp.bind(this));
		document.body.addEventListener("wheel", onMouseWheel.bind(this));
		document.body.oncontextmenu = (e) => {
			e.preventDefault();
			e.stopPropagation();
			return false;
		};
	}

	export function update() {
		for (const button in buttons) {
			if (!buttons.hasOwnProperty(button)) continue;

			const obj = buttons[button];
			obj.justReleased = false;
			obj.justPressed = false;
			obj.shortPress = false;
			obj.longPress = obj.active && Date.now() - obj.lastChange >= LONG_PRESS;
		}

		delta.x = 0;
		delta.y = 0;
		mouseWheelDelta = 0;
	}

}