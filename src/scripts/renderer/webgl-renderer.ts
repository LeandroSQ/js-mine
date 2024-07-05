/* eslint-disable max-statements */
import { mat4, vec3, vec4 } from "gl-matrix";
import { Main } from "../main";
import { Size } from "../types/size";
import { Log } from "../utils/log";
import { Theme } from "../utils/theme";
import { Color } from "../utils/color";
import { RenderingPipelineBuffer } from "../models/rendering-pipeline-buffer";
import { Gizmo3D } from "../debug/gizmo3d";
import { SETTINGS } from "../settings";
import { ChunkManager } from "../models/terrain/chunk-manager";
import { ChunkMesh } from "../models/terrain/chunk-mesh";
import { Analytics } from "../debug/analytics";
import { Texture } from "../models/texture";

export class WebGLRenderer {

	public canvas: HTMLCanvasElement;
	public gl: WebGLContext;

	private isDirty = false;

	private frameBuffer: RenderingPipelineBuffer;

	constructor(private main: Main) {}

	// #region Utility
	public invalidate() {
		this.isDirty = true;
	}

	public setSize(size: Size) {
		Log.info("WebGLRenderer", "Setting size...");
		const dpr = window.devicePixelRatio ?? 1;
		this.canvas.width = size.width * dpr;
		this.canvas.height = size.height * dpr;
		this.canvas.style.width = `${size.width}px`;
		this.canvas.style.height = `${size.height}px`;
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

		if (this.frameBuffer) this.frameBuffer.resize();
	}
	// #endregion

	// #region Setup
	private setupCanvas() {
		Log.debug("WebGLRenderer", "Creating canvas...");
		this.canvas = document.createElement("canvas");
		this.canvas.id = "webgl-canvas";

		// Workaround for MSAA and post-processing effects
		// When using MSAA and rendering to a texture, the MSAA buffer is not used for post-processing effects
		// And that will result in a error
		// So whenever we have any filter enabled and intend to use MSAA, we disable MSAA native support and use a multisample render buffer instead
		let antialias: boolean = SETTINGS.USE_MSAA;
		if (SETTINGS.USE_MSAA && (SETTINGS.FILTER_COLOR_CORRECTION_ENABLED || SETTINGS.FILTER_FXAA_ENABLED || SETTINGS.FILTER_SHARPEN_ENABLED)) {
			Log.warn("WebGLRenderer", "Disabling native MSAA in favor of multisample render buffer for post-processing effects.");
			antialias = false;
		}

		const options: WebGLContextAttributes = {
			antialias,
			depth: false,
			preserveDrawingBuffer: true
		};
		const gl = this.canvas.getContext("webgl2", options) ?? this.canvas.getContext("webgl", options) ?? this.canvas.getContext("experimental-webgl", options);
		if (!gl) throw new Error("Could not get WebGL context");
		this.gl = gl as WebGLContext;

		document.body.appendChild(this.canvas);

		this.gl.enable(GL.DEPTH_TEST);
		this.gl.depthFunc(GL.LEQUAL);
		this.gl.clearDepth(1.0);

		this.gl.enable(GL.CULL_FACE);
		this.gl.cullFace(GL.BACK);

		// Detect maximum available samples for MSAA
		if (SETTINGS.USE_MSAA) {
			if (!(this.gl instanceof WebGL2RenderingContext)) Log.warn("FrameBuffer", "MSAA is only supported on WebGL2");
			else if (this.gl.maxSamplesForMSAA <= 0) Log.warn("FrameBuffer", "MSAA is not supported on this device");
			else Log.info("FrameBuffer", `MSAA is supported with maximum of ${this.gl.maxSamplesForMSAA} samples`);
		}
	}

	private async setupTextures() {
		Log.debug("WebGLRenderer", "Setting up textures...");
		// Load terrain texture
		await Texture.loadTerrain(this.gl);
	}

	private async setupMesh() {
		await ChunkMesh.setup(this.gl);
	}

	async setup() {
		Log.info("WebGLRenderer", "Setting up...");

		this.setupCanvas();
		this.frameBuffer = new RenderingPipelineBuffer(this.gl);
		await this.setupMesh();
		await this.setupTextures();
		await Gizmo3D.setup(this.gl);

		if (SETTINGS.FILTER_FXAA_ENABLED) await this.frameBuffer.addFilter("fxaa");
		if (SETTINGS.FILTER_SHARPEN_ENABLED) await this.frameBuffer.addFilter("sharpen");
		if (SETTINGS.FILTER_COLOR_CORRECTION_ENABLED) await this.frameBuffer.addFilter("color-correction");
	}
	// #endregion

	// #region Render
	private clear(color: { r: number, g: number, b: number }) {
		this.gl.clearColor(color.r, color.g, color.b, 1.0);
		this.gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
	}

	private drawScene() {
		// Scene
		const color = Color.decode(Theme.background, true);
		this.clear(color);

		const projection = this.main.camera.getProjectionMatrix();
		const view = this.main.camera.getViewMatrix();

		// Draw chunks
		let visibleChunks = ChunkManager.activeChunks.filter(chunk => chunk && chunk.mesh && this.main.playerCamera.isChunkInsideFrustum(chunk));
		if (SETTINGS.SORT_CHUNKS_BY_DISTANCE) {
			const distances = visibleChunks.map(chunk => vec3.distance(chunk.globalCenterPosition, this.main.playerCamera.position));
			visibleChunks = visibleChunks.sort((a, b) => {
				const distanceA = distances[visibleChunks.indexOf(a)];
				const distanceB = distances[visibleChunks.indexOf(b)];
				return distanceB - distanceA;
			});
		}


		for (const chunk of visibleChunks) {
			Analytics.notifyChunkVisible(chunk);
			if (SETTINGS.RENDER_CHUNKS) {
				chunk.render(this.gl, projection, view);
			}
		}

		/* const boxPosition = vec3.fromValues(0, 0, -3);
		const boxSize = vec3.fromValues(1, 1, 1);
		const boxRotation = vec3.fromValues(0, 0, 0);
		const boxVisible = this.main.playerCamera.isBoxInFrustum(boxPosition, boxSize);
		const boxColor = boxVisible ? vec4.fromValues(1.0, 1.0, 1.0, 1.0) : vec4.fromValues(1.0, 0, 1.0, 1.0);
		Gizmo3D.box(boxPosition, boxSize, boxRotation, boxColor, true); */

        this.renderDebugOverlay();


		if (SETTINGS.DISABLE_DEPTH_FOR_GIZMOS) this.gl.disable(GL.DEPTH_TEST);

		Gizmo3D.render(this.gl, projection, view);
		Gizmo3D.clear();

		if (SETTINGS.DISABLE_DEPTH_FOR_GIZMOS) this.gl.enable(GL.DEPTH_TEST);
    }

    private renderDebugOverlay() {
        // Near plane
        const nearPlane = mat4.create();
        const camera = this.main.useDebugCamera ? this.main.playerCamera : this.main.debugCamera;
        const near = camera.near;
        const forward = camera.forward;
        const up = camera.up;
        const position = camera.position;
        const cameraView = camera.getViewMatrix();
        mat4.invert(cameraView, cameraView);

		const cameraRotation = vec3.create();
		vec3.set(cameraRotation, Math.toRadians(camera.pitch), Math.toRadians(camera.yaw), Math.toRadians(camera.roll));
		const cameraRotationMatrix = mat4.create();
		mat4.rotate(cameraRotationMatrix, cameraRotationMatrix, camera.pitch, [1, 0, 0]);
		mat4.rotate(cameraRotationMatrix, cameraRotationMatrix, camera.yaw, [0, 1, 0]);
		mat4.rotate(cameraRotationMatrix, cameraRotationMatrix, camera.roll, [0, 0, 1]);

        Gizmo3D.box(
            position,
            vec3.fromValues(0.5, 0.5, 0.5),
			cameraRotation,
            this.main.useDebugCamera ? vec4.fromValues(1, 0, 0, 1) : vec4.fromValues(0, 0, 1, 1),
            false
        );

        // Calculate the near plane, ensuring that the camera is looking at the center of the near plane
        /* const nearCenter = vec3.create();
        vec3.scaleAndAdd(nearCenter, position, forward, near);
        vec3.scaleAndAdd(nearCenter, nearCenter, up, near / 2);
        mat4.lookAt(nearPlane, position, nearCenter, up); */

        /* Gizmo3D.quad(
            nearCenter,
            vec3.fromValues(1, 1, 1),
            vec4.fromValues(1, 1, 1, 1),
            false
        ); */

        // Forward
       /*  const forwardEnd = vec3.create();
        vec3.scaleAndAdd(forwardEnd, position, forward, 100);
        Gizmo3D.line(
            position,
            forwardEnd,
            vec4.fromValues(1, 1, 1, 1)
        ); */

        /* Gizmo3D.frustum(
            this.main.useDebugCamera ? this.main.playerCamera : this.main.debugCamera,
            vec4.fromValues(0, 1, 0, 1),
            true
        ); */
    }

	public render() {
		if (!this.isDirty) return;
		this.isDirty = false;

		this.frameBuffer.bind();
		this.drawScene();
		this.frameBuffer.unbind();
		this.frameBuffer.commit();
	}
	// #endregion

}