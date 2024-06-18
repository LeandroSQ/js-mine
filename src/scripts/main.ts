/* eslint-disable max-statements */
import "./core/extensions";
import { Analytics } from "./models/analytics";
import { Log } from "./utils/log";
import { InputHandler } from "./core/components/input-handler";
import { AState } from "./types/state";
import { Gizmo } from "./utils/gizmo";
import { Cursor } from "./utils/cursor";
import { Theme } from "./utils/theme";
import { MARGIN, SIMULATION_FREQUENCY, SIMULATION_SUBSTEPS, USE_ANIMATION_FRAME } from "./constants";
import { FontUtils } from "./utils/font";
import { StatePlay } from "./states/state-play";
import { GUIRenderer } from "./renderer/gui-renderer";
import { Size } from "./types/size";
import { WebGLRenderer } from "./renderer/webgl-renderer";
import { Camera } from "./models/camera";
import { Key } from "./types/key";

export class Main {

	// Graphics
	public screen: Size = { width: 0, height: 0 };
	public gui = new GUIRenderer(this);
	public camera = new Camera();
	public gl = new WebGLRenderer(this);

	// Frame
	private handleAnimationFrameRequest = -1;
	private lastFrameTime = performance.now();

	// Misc
	public globalTimer = 0;
	private analytics: Analytics;

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

			await this.gl.setup();
			this.gui.setup();

			// Setup canvas
			this.onResize();

			// Load modules in parallel
			const modules = [
				Theme.setup(),
				FontUtils.setup(),
				InputHandler.setup(this)
			];

			// Analytics profiler, only on DEBUG
			if (DEBUG) {
				this.analytics = new Analytics(this);
				modules.push(this.analytics.setup());
			}

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
		this.gl.setSize(this.screen);
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
		this.gl.invalidate();
	}

	private requestNextFrame() {
		if (USE_ANIMATION_FRAME) {
			this.handleAnimationFrameRequest = requestAnimationFrame(this.loop.bind(this));
		} else {
			if (this.handleAnimationFrameRequest === -1) {
				this.handleAnimationFrameRequest = setInterval(() => this.loop(performance.now()), 1000 / SIMULATION_FREQUENCY) as unknown as number;
			}
		}
	}

	private update(newTime: DOMHighResTimeStamp) {
		const deltaTime = (newTime - this.lastFrameTime) / 1000.0;
		this.lastFrameTime = newTime;

		const dt = deltaTime / SIMULATION_SUBSTEPS;
		for (let i = 0; i < SIMULATION_SUBSTEPS; i++) {
			this.state.update(dt);
			InputHandler.update();
			if (DEBUG) this.analytics.endUpdate();
		}

		if (DEBUG) this.analytics.update(deltaTime);
		this.globalTimer += deltaTime;
	}

	private loop(time: DOMHighResTimeStamp) {
		this.update(time);

		// GUI
		Cursor.apply(this.gui.element);
		if (DEBUG) this.analytics.startFrame(time);
		this.gui.render();
		this.state.render(this.gui.context);
		if (DEBUG) this.analytics.render(this.gui.context);
		Gizmo.render(this.gui.context);
		Gizmo.clear();
		if (DEBUG) this.analytics.endFrame();

		// GL
		this.gl.render();

		this.requestNextFrame();
	}
	// #endregion

}

new Main();