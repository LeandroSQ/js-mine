/* eslint-disable max-statements */
import "./core/extensions";
import { Analytics } from "./debug/analytics";
import { Log } from "./utils/log";
import { AState } from "./types/state";
import { Gizmo } from "./debug/gizmo";
import { Cursor } from "./utils/cursor";
import { Theme } from "./utils/theme";
import { RECORDING_FRAME_RATE, RECORDING_VIEWPORT, SIMULATION_FREQUENCY, SIMULATION_SUBSTEPS, USE_ANIMATION_FRAME } from "./constants";
import { FontUtils } from "./utils/font";
import { StatePlay } from "./states/state-play";
import { GUIRenderer } from "./renderer/gui-renderer";
import { Size } from "./types/size";
import { WebGLRenderer } from "./renderer/webgl-renderer";
import { Camera } from "./models/camera";
import { GIFUtils } from "./utils/gif";
import { Vector2 } from "./models/math/vector2";
import { vec3 } from "gl-matrix";
import { Terminal } from "./debug/terminal";
import { InputHandler } from "./input/input-handler";
import { Texture } from "./models/texture";
import { SETTINGS } from "./settings";


const SKIP_WEBGL = false;

export class Main {

	// Graphics
	public screen: Size = { width: 0, height: 0 };
	public gui = new GUIRenderer(this);
	public gl = new WebGLRenderer(this);

	public playerCamera = new Camera();
	public debugCamera = new Camera();
	public useDebugCamera = false;
	public get camera() {
		return this.useDebugCamera ? this.debugCamera : this.playerCamera;
	}

	// Recording
	private isRecording = false;

	// Frame
	private handleAnimationFrameRequest = -1;
	private lastFrameTime = performance.now();

	// Misc
	public globalTimer = 0;

	// Game logic
	public state: AState;

	constructor() {
		Log.info("Main", "Starting up...");
		this.state = new StatePlay(this);

		this.attachHooks();
	}

	private attachHooks() {
		Log.info("Main", "Attaching hooks...");

		window.addLoadEventListener(this.onLoad.bind(this));
		window.addVisibilityChangeEventListener(this.onVisibilityChange.bind(this));
		window.addEventListener("resize", this.onResize.bind(this));
	}

	// #region Event listeners
	private async onLoad() {
		try {
			Log.debug("Main", "Window loaded");

			if (!SKIP_WEBGL) await this.gl.setup();
			this.gui.setup();

			// Setup canvas
			this.onResize();

			// Load modules in parallel
			const modules = [
				Theme.setup(),
				FontUtils.setup(),
				InputHandler.setup()
			];

			// Analytics profiler, only on DEBUG
			if (DEBUG) modules.push(Analytics.setup());

			await Promise.all(modules);

			// Setup game state
			await this.state.setup();

			// Request the first frame
			this.requestNextFrame();
		} catch (e) {
			Log.error("Main", "Failed to load modules", e);
			if (!DEBUG) alert(`Failed to load modules. Please refresh the page.${e}`);
		}
	}

	private onVisibilityChange(isVisible: boolean) {
		Log.info("Main", `Window visibility changed to ${isVisible ? "visible" : "hidden"}`);

		if (isVisible) {
			if (this.handleAnimationFrameRequest >= 0) {
				if (USE_ANIMATION_FRAME) {
					cancelAnimationFrame(this.handleAnimationFrameRequest as number);
				} else {
					clearInterval(this.handleAnimationFrameRequest as number);
				}
			}

			this.invalidate();
			this.lastFrameTime = performance.now();

			// Request the next frame
			setTimeout(this.requestNextFrame.bind(this), 0);
		} else {
			// Cancel the next frame
			if (this.handleAnimationFrameRequest) {
				if (USE_ANIMATION_FRAME) {
					cancelAnimationFrame(this.handleAnimationFrameRequest as number);
				} else {
					clearInterval(this.handleAnimationFrameRequest as number);
				}

				this.handleAnimationFrameRequest = -1;
			}
		}
	}

	private onResize() {
		Log.debug("Main", "Window resized");

		this.screen = {
			width: window.innerWidth,
			height: window.innerHeight
		};

		// Resize canvas
		this.gui.setSize(this.screen);
		if (!SKIP_WEBGL) this.gl.setSize(this.screen);
		this.invalidate();
	}
	// #endregion

	// #region State management
	public setState(state: AState) {
		this.state = state;
		this.state.setup();
		Cursor.apply(this.gui.element);
		this.invalidate();
	}
	// #endregion

	// #region Frame
	public invalidate() {
		this.gui.invalidate();
		if (!SKIP_WEBGL) this.gl.invalidate();
	}

	private requestNextFrame() {
		if (this.isRecording) {
			if (this.handleAnimationFrameRequest !== -1) clearTimeout(this.handleAnimationFrameRequest);
			this.handleAnimationFrameRequest = setTimeout(() => this.loop(performance.now()), 1000 / RECORDING_FRAME_RATE) as unknown as number;
		} else if (USE_ANIMATION_FRAME) {
			this.handleAnimationFrameRequest = requestAnimationFrame(this.loop.bind(this));
		} else {
			if (this.handleAnimationFrameRequest === -1) {
				this.handleAnimationFrameRequest = setInterval(() => this.loop(performance.now()), 1000 / SIMULATION_FREQUENCY) as unknown as number;
			}
		}
	}

	private updateRecording(deltaTime: number) {
		if (this.isRecording) {
			Gizmo.circle(new Vector2(this.screen.width - 30, 30), 10, "red", true);
			Gizmo.circle(new Vector2(this.screen.width - 30, 30), 15, "red", false);
		}

		if (InputHandler.isRecording()) {
			if (this.isRecording) {
				this.onStopRecording();
			} else {
				this.onStartRecording();
			}
		}
	}

	private onStartRecording() {
		Log.info("Main", "Recording started");
		this.isRecording = true;

		// Resize canvas
		this.screen = RECORDING_VIEWPORT;
		this.gui.setSize(this.screen);
		if (!SKIP_WEBGL) this.gl.setSize(this.screen);
		this.invalidate();
	}

	private onStopRecording() {
		Log.info("Main", "Recording stopped");
		this.isRecording = false;

		GIFUtils.generate("recording");
		this.onResize();
	}

	private update(newTime: DOMHighResTimeStamp) {
		let deltaTime = (newTime - this.lastFrameTime) / 1000.0;
		this.lastFrameTime = newTime;

		Terminal.update(deltaTime);

		this.updateRecording(deltaTime);
		if (this.isRecording) deltaTime = 1.0 / RECORDING_FRAME_RATE;

		let updatedInput = false;
		const dt = deltaTime / SIMULATION_SUBSTEPS;
		for (let i = 0; i < SIMULATION_SUBSTEPS; i++) {
			this.state.update(dt);

			if (!updatedInput) {// Update it only once, since it's the same for all substeps
				// TODO: Move input handling out of update loop
				updatedInput = true;
				InputHandler.update();
			}

			if (DEBUG) Analytics.endUpdate();
		}

		if (DEBUG) Analytics.update(deltaTime);
		this.globalTimer += deltaTime;
	}

	private loop(time: DOMHighResTimeStamp) {
		if (DEBUG) Analytics.startFrame(time);

		this.update(time);

		// GUI
		Cursor.apply(this.gui.element);
		this.gui.render();
		this.state.render(this.gui.context);

		// WebGL
		if (!SKIP_WEBGL) this.gl.render();

		Gizmo.render(this.gui.context);
		Gizmo.clear();

		if (DEBUG && !Terminal.isVisible()) Analytics.render(this.gui.context);
		Terminal.render(this.gui.context);

		// GIF
		if (this.isRecording) GIFUtils.addFrame(this.gl.canvas, this.gui.canvas);

		if (DEBUG) Analytics.endFrame();

		this.requestNextFrame();
	}
	// #endregion

}

new Main();