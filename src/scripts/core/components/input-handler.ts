import { GAMEPAD_LINEARITY, GAMEPAD_DEADZONE, GAMEPAD_LOOK_SENSITIVITY, LONG_PRESS } from "../../constants";
import { Vector2 } from "../../models/vector2";
import { Log } from "../../utils/log";
import { Dictionary } from "../../types/dictionary";
import { GamepadInputState, InputState } from "../../types/input-state";
import { Key } from "../../enums/key";
import { MouseButton } from "../../enums/mouse-button";
import { Optional } from "../../types/optional";
import { GamepadButton } from "../../enums/gamepad-button";
import { GamepadAxis } from "../../enums/gamepad-axis";
import { Gizmo } from "../../utils/gizmo";

export abstract class InputHandler {

	private static invalidated = false;
	private static readonly VERBOSE_KEYBOARD = DEBUG && false as const;
	private static readonly VERBOSE_MOUSE = DEBUG && false as const;
	private static readonly VERBOSE_GAMEPAD = DEBUG && false as const;

	public static get isDirty() {
		return this.invalidated;
	}

	// #region Keyboard
	private static keys: Dictionary<InputState> = {};

	// #region API
	public static isKeyDown(...keys: Key[]): boolean {
		return keys.some(key => this.keys[key]?.active);
	}

	public static isKeyUp(...keys: Key[]): boolean {
		return keys.some(key => !this.keys[key]?.active);
	}

	public static isKeyJustPressed(...keys: Key[]): boolean {
		return keys.some(key => this.keys[key]?.justPressed);
	}

	public static isKeyJustReleased(...keys: Key[]): boolean {
		return keys.some(key => this.keys[key]?.justReleased);
	}

	public static isKeyLongPressed(...keys: Key[]): boolean {
		return keys.some(key => this.keys[key]?.longPress);
	}

	public static isKeyShortPressed(...keys: Key[]): boolean {
		return keys.some(key => this.keys[key]?.shortPress);
	}
	// #endregion

	// #region Event handlers
	private static onKeyDown(event: KeyboardEvent) {
		if (event.repeat) return;
		if (!Object.values(Key).includes(event.key as Key)) return;

		if (this.VERBOSE_KEYBOARD) Log.debug("Input", `Key down: ${event.key}`);

		this.keys[event.key] = {
			active: true,
			lastChange: Date.now(),
			lastTrigger: Date.now(),

			justPressed: true,
			justReleased: false,
			longPress: false,
			shortPress: false
		};

		this.invalidated = true;
	}

	private static onKeyUp(event: KeyboardEvent) {
		if (event.repeat) return;
		if (!Object.values(Key).includes(event.key as Key)) return;

		if (this.VERBOSE_KEYBOARD) Log.debug("Input", `Key up: ${event.key}`);

		const obj = this.keys[event.key];
		if (!obj) return;
		obj.active = false;
		obj.lastChange = Date.now();
		obj.justPressed = false;
		obj.justReleased = true;
		const elapsed = obj.lastChange - obj.lastTrigger;
		obj.longPress = elapsed >= LONG_PRESS;
		obj.shortPress = !obj.longPress;

		this.invalidated = true;
	}

	private static updateKeyboard() {
		for (const key in this.keys) {
			if (!this.keys.hasOwnProperty(key)) continue;

			const obj = this.keys[key];
			obj.justReleased = false;
			obj.justPressed = false;
			obj.shortPress = false;
			obj.longPress = obj.active && Date.now() - obj.lastChange >= LONG_PRESS;
		}
	}
	// #endregion
	// #endregion

	// #region Mouse and pointers
	public static readonly mouse = Vector2.zero;
	public static readonly mouseDelta = Vector2.zero;
	public static readonly mouseButtons: Dictionary<InputState> = {};
	public static mouseWheelDelta = 0;

	private static readonly POINTER_LOCK_REQUEST_INTERVAL = 1000 as const;
	private static lastPointerLockTime = 0;
	private static lastPointerLockTimeoutHandle = -1;

	// #region API
	public static isMouseButtonDown(...buttons: MouseButton[]): boolean {
		return buttons.some(button => this.mouseButtons[button]?.active);
	}

	public static isMouseButtonUp(...buttons: MouseButton[]): boolean {
		return buttons.some(button => !this.mouseButtons[button] || !this.keys[button].active);
	}

	public static isMouseButtonJustPressed(...buttons: MouseButton[]): boolean {
		return buttons.some(button => this.mouseButtons[button]?.justPressed);
	}

	public static isMouseButtonJustReleased(...buttons: MouseButton[]): boolean {
		return buttons.some(button => this.mouseButtons[button]?.justReleased);
	}

	public static isMouseButtonLongPressed(...buttons: MouseButton[]): boolean {
		return buttons.some(button => this.mouseButtons[button]?.longPress);
	}

	public static isMouseButtonShortPressed(...buttons: MouseButton[]): boolean {
		return buttons.some(button => this.mouseButtons[button]?.shortPress);
	}
	// #endregion

	// #region Event handlers
	private static onMouseMove(event: MouseEvent) {
		if (this.VERBOSE_MOUSE) Log.debug("Input", `Mouse move: ${event.clientX}, ${event.clientY}`);

		this.mouseDelta.x = event.movementX;
		this.mouseDelta.y = event.movementY;

		this.mouse.x = event.clientX - ((event.target as HTMLElement)?.offsetLeft ?? 0);
		this.mouse.y = event.clientY - ((event.target as HTMLElement)?.offsetTop ?? 0);
	}

	private static onMouseDown(event: MouseEvent) {
		if (!Object.values(MouseButton).includes(event.button as MouseButton)) return;

		if (this.VERBOSE_MOUSE) Log.debug("Input", `Mouse down: ${event.button}`);

		this.mouseButtons[event.button] = {
			active: true,
			lastChange: Date.now(),
			lastTrigger: Date.now(),

			justPressed: true,
			justReleased: false,
			longPress: false,
			shortPress: false
		};

		this.handlePointerLock();

		this.invalidated = true;
	}

	private static onMouseUp(event: MouseEvent) {
		if (!Object.values(MouseButton).includes(event.button as MouseButton)) return;

		if (this.VERBOSE_MOUSE) Log.debug("Input", `Mouse up: ${event.button}`);

		const obj = this.mouseButtons[event.button];
		if (!obj) return;
		obj.active = false;
		obj.lastChange = Date.now();
		obj.justPressed = false;
		obj.justReleased = true;
		const elapsed = obj.lastChange - obj.lastTrigger;
		obj.longPress = elapsed >= LONG_PRESS;
		obj.shortPress = !obj.longPress;

		this.invalidated = true;
	}

	private static onPointerDown(element: HTMLElement, event: PointerEvent) {
		if (!Object.values(MouseButton).includes(event.button as MouseButton)) return;

		// Only really consider pointer capture if we didn't lock it before
		if (!document.pointerLockElement) element.setPointerCapture(event.pointerId);

		this.onMouseDown(event);
	}

	private static onPointerUp(element: HTMLElement, event: PointerEvent) {
		if (!Object.values(MouseButton).includes(event.button as MouseButton)) return;

		// Only really consider pointer capture if we didn't lock it before
		if (!document.pointerLockElement) element.releasePointerCapture(event.pointerId);

		this.onMouseUp(event);
	}

	private static onMouseWheel(event: WheelEvent) {
		this.mouseWheelDelta = event.deltaY;
	}

	private static handlePointerLock() {
		// On the first mouse click, request pointer lock
		if (document.pointerLockElement) return;

		// Schedule another attempt if the last one was too recent
		if (Date.now() - this.lastPointerLockTime < this.POINTER_LOCK_REQUEST_INTERVAL) {
			if (this.lastPointerLockTimeoutHandle < 0) {
				Log.debug("Input", "Scheduling another pointer lock attempt");
				this.lastPointerLockTimeoutHandle = setTimeout(this.handlePointerLock.bind(this), this.POINTER_LOCK_REQUEST_INTERVAL) as unknown as number;
			}
			return;
		}

		if (this.lastPointerLockTimeoutHandle >= 0) {
			clearTimeout(this.lastPointerLockTimeoutHandle);
			this.lastPointerLockTimeoutHandle = -1;
		}

		const options = {
			unadjustedMovement: true // Disable mouse acceleration
		} as const;

		// Some really strange API, in some browsers is void, others returns a promise
		// In some accepts options, in others doesn't
		try {
			this.lastPointerLockTime = Date.now();
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

	private static updateMouse() {
		for (const button in this.mouseButtons) {
			if (!this.mouseButtons.hasOwnProperty(button)) continue;

			const obj = this.mouseButtons[button];
			obj.justReleased = false;
			obj.justPressed = false;
			obj.shortPress = false;
			obj.longPress = obj.active && Date.now() - obj.lastChange >= LONG_PRESS;
		}

		this.mouseDelta.x = 0;
		this.mouseDelta.y = 0;
		this.mouseWheelDelta = 0;
	}
	// #endregion
	// #endregion

	// #region Gamepad
	private static gamepad: Optional<Gamepad> = null;
	private static readonly gamepadButtons: Dictionary<GamepadInputState> = {};
	private static readonly gamepadAxes: Dictionary<number> = {};
	private static isFirstGamepadConnection = true;
	private static gamepadPollingIntervalHandle = -1;

	// #region API
	public static isGamepadButtonDown(...buttons: GamepadButton[]): boolean {
		return buttons.some(button => this.gamepadButtons[button]?.active === true);
	}

	public static isGamepadButtonUp(...buttons: GamepadButton[]): boolean {
		return buttons.some(button => this.gamepadButtons[button]?.active === true);
	}

	public static isGamepadButtonJustPressed(...buttons: GamepadButton[]): boolean {
		return buttons.some(button => this.gamepadButtons[button]?.justPressed === true);
	}

	public static isGamepadButtonJustReleased(...buttons: GamepadButton[]): boolean {
		return buttons.some(button => this.gamepadButtons[button]?.justReleased === true);
	}

	public static isGamepadButtonLongPressed(...buttons: GamepadButton[]): boolean {
		return buttons.some(button => this.gamepadButtons[button]?.longPress === true);
	}

	public static isGamepadButtonShortPressed(...buttons: GamepadButton[]): boolean {
		return buttons.some(button => this.gamepadButtons[button]?.shortPress === true);
	}
	// #endregion

	// #region Event handlers
	private static onGamepadConnected(event: GamepadEvent) {
		if (this.VERBOSE_GAMEPAD) Log.info("Input", `Gamepad connected: ${event.gamepad.id}`);
		this.gamepad = event.gamepad;

		if (this.isFirstGamepadConnection) {
			this.isFirstGamepadConnection = false;
			this.invalidated = true;
		}
	}

	private static onGamepadDisconnected(event: GamepadEvent) {
		if (this.VERBOSE_GAMEPAD) Log.info("Input", `Gamepad disconnected: ${event.gamepad.id}`);
		this.gamepad = null;
	}

	private static onGamepadPoll() {
		const gamepad = navigator.getGamepads().find(x => x);
		if (!gamepad) return;

		if (this.VERBOSE_GAMEPAD) Log.debug("Input", `Gamepad found: ${gamepad.id}`);
		this.gamepad = gamepad;

		if (this.isFirstGamepadConnection) {
			this.isFirstGamepadConnection = false;
			this.invalidated = true;
		}

		clearInterval(this.gamepadPollingIntervalHandle);
	}

	private static requestGamepadPoll() {
		this.gamepadPollingIntervalHandle = setInterval(this.onGamepadPoll.bind(this), 500) as unknown as number;
	}

	private static pollForConnectedGamepad() {
		const gamepad = navigator.getGamepads().find(x => x && x.id === this.gamepad?.id);
		if (gamepad) {
			this.gamepad = gamepad;
		} else {
			if (this.VERBOSE_GAMEPAD) Log.info("Input", `Gamepad disconnected: ${this.gamepad?.id}`);
			this.gamepad = null;
			this.requestGamepadPoll();
		}
	}

	private static updateGamepadButtons() {
		for (let i = 0; i < this.gamepad!.buttons.length; i++) {
			const button = this.gamepad!.buttons[i];
			const state = this.gamepadButtons[i];

			// Deadzone
			state.value = button.value;
			if (Math.abs(state.value) < GAMEPAD_DEADZONE) state.value = 0;
			else if (1.0 - Math.abs(state.value) < GAMEPAD_DEADZONE) state.value = Math.sign(state.value);
			// Non-linearity
			state.value = Math.pow(state.value, GAMEPAD_LINEARITY) * Math.sign(state.value);

			if (button.pressed !== state.active) {
				this.invalidated = true;
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

	private static updateGamepadAxes() {
		const pairs = [
			[GamepadAxis.LeftStickX, GamepadAxis.LeftStickY],
			[GamepadAxis.RightStickX, GamepadAxis.RightStickY]
		];

		for (const pair of pairs) {
			let value = new Vector2(this.gamepad!.axes[pair[0]], this.gamepad!.axes[pair[1]]);
			const magnitude = Math.pow(value.length, GAMEPAD_LINEARITY);
			const deadzone = Math.max(0, magnitude - GAMEPAD_DEADZONE) / (1.0 - GAMEPAD_DEADZONE);
			value = value.divide(magnitude).multiply(deadzone);

			// Detect changes
			if (this.gamepadAxes[pair[0]] !== value.x || this.gamepadAxes[pair[1]] !== value.y) {
				this.invalidated = true;
				this.gamepadAxes[pair[0]] = value.x;
				this.gamepadAxes[pair[1]] = value.y;
			}
		}
	}

	// eslint-disable-next-line max-statements
	private static updateGamepads() {
		Gizmo.gamepad(new Vector2(window.innerWidth - 125, window.innerHeight - 100), this.gamepadButtons, this.gamepadAxes);
		if (!this.gamepad) return;

		// Check if this browser requires polling
        if (!("ongamepadconnected" in window)) this.pollForConnectedGamepad();

		// Gizmo.text(JSON.stringify(this.gamepadAxes), new Vector2(250, 250));
		this.updateGamepadButtons();
		this.updateGamepadAxes();
	}
	// #endregion
	// #endregion

	// #region Input mapping
    public static getMovementHorizontal() {
        let axis = 0;
        if (this.isKeyDown(Key.A, Key.ArrowLeft) || this.isGamepadButtonDown(GamepadButton.Left)) axis -= 1;
        if (this.isKeyDown(Key.D, Key.ArrowRight) || this.isGamepadButtonDown(GamepadButton.Right)) axis += 1;
		if (this.gamepad) axis = this.gamepadAxes[GamepadAxis.LeftStickX];

        return axis;
    }

    public static getMovementVertical() {
        let axis = 0;
        if (this.isKeyDown(Key.W, Key.ArrowUp) || this.isGamepadButtonDown(GamepadButton.Up)) axis -= 1;
        if (this.isKeyDown(Key.S, Key.ArrowDown) || this.isGamepadButtonDown(GamepadButton.Down)) axis += 1;
        if (this.gamepad) axis = this.gamepadAxes[GamepadAxis.LeftStickY];

        return axis;
    }

	public static getLookHorizontal() {
		if (this.mouseDelta.x !== 0) return this.mouseDelta.x;
		if (this.gamepad) return this.gamepadAxes[GamepadAxis.RightStickX] * GAMEPAD_LOOK_SENSITIVITY;

		return 0;
	}

	public static getLookVertical() {
		if (this.mouseDelta.y !== 0) return this.mouseDelta.y;
		if (this.gamepad) return this.gamepadAxes[GamepadAxis.RightStickY] * GAMEPAD_LOOK_SENSITIVITY;

		return 0;
	}

	public static isJumping() {
		return this.isKeyDown(Key.Space, Key.ArrowUp)
			|| this.isGamepadButtonDown(GamepadButton.A, GamepadButton.Up);
	}

	public static isCrouching() {
		return this.isKeyDown(Key.Shift)
			|| this.isGamepadButtonDown(GamepadButton.Down, GamepadButton.B);
	}

	public static isRecording() {
		return this.isKeyJustReleased(Key.R);
	}

	public static isSwitchingCameras() {
		return this.isKeyJustReleased(Key.C);
	}
	// #endregion

	public static vibrate() {
		if (navigator.vibrate) navigator.vibrate(200);
		if (this.gamepad?.vibrationActuator) {
			this.gamepad.vibrationActuator.playEffect("dual-rumble", {
				duration: 100,
				strongMagnitude: 0.5,
				weakMagnitude: 0.25
			});

		}
	}

	public static setup() {
		const element = document.body;

		// Keyboard
		window.addEventListener("keydown", this.onKeyDown.bind(this));
		window.addEventListener("keyup", this.onKeyUp.bind(this));

		// Mouse
		this.mouse.x = window.innerWidth / 2;
		this.mouse.y = window.innerHeight / 2;
		element.addEventListener("click", this.onMouseMove.bind(this));
		element.addEventListener("mousemove", this.onMouseMove.bind(this));
		element.addEventListener("mousedown", this.onMouseDown.bind(this));
		element.addEventListener("mouseup", this.onMouseUp.bind(this));
		element.addEventListener("wheel", this.onMouseWheel.bind(this));
		element.oncontextmenu = (e) => {
			e.preventDefault();
			e.stopPropagation();
			return false;
		};

		// Pointer
		element.addEventListener("pointermove", this.onMouseMove.bind(this));
		element.addEventListener("pointerdown", this.onPointerDown.bind(this, element));
		element.addEventListener("pointerup", this.onPointerUp.bind(this, element));

		// Gamepad
		if ("getGamepads" in navigator) {
			if ("ongamepadconnected" in window) {
				window.addEventListener("gamepadconnected", this.onGamepadConnected.bind(this));
				window.addEventListener("gamepaddisconnected", this.onGamepadDisconnected.bind(this));
			} else {
				// Chrome doesn't support the gamepadconnected event
				this.requestGamepadPoll();
            }

            for (const axis of Object.values(GamepadAxis)) {
                this.gamepadAxes[axis] = 0;
            }

			for (const button of Object.values(GamepadButton)) {
				this.gamepadButtons[button] = {
					active: false,
					lastChange: Date.now(),
					lastTrigger: Date.now(),

					justPressed: false,
					justReleased: false,
					longPress: false,
					shortPress: false
				};
			}
		}
	}

	public static update() {
		this.invalidated = false;
		this.updateKeyboard();
		this.updateGamepads();
		this.updateMouse();
	}

}