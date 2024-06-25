/* eslint-disable max-statements */
import { mat4, vec3, vec4 } from "gl-matrix";
import { Main } from "../main";
import { Size } from "../types/size";
import { Log } from "../utils/log";
import { Theme } from "../utils/theme";
import { Color } from "../utils/color";
import { RenderingPipelineBuffer } from "../models/rendering-pipeline-buffer";
import { ChunkManager } from "../models/chunk-manager";
import { Chunk } from "../models/chunk";
import { Gizmo3D } from "../utils/gizmo3d";
import { SETTINGS } from "../settings";

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
		const options: WebGLContextAttributes = { antialias: true, depth: true };
		const gl = this.canvas.getContext("webgl2", options) ?? this.canvas.getContext("webgl", options) ?? this.canvas.getContext("experimental-webgl", options);
		if (!gl) throw new Error("Could not get WebGL context");
		this.gl = gl as WebGLContext;

		document.body.appendChild(this.canvas);

		this.gl.enable(GL.DEPTH_TEST);
		this.gl.cullFace(GL.BACK);

		this.gl.enable(GL.CULL_FACE);
		this.gl.depthFunc(GL.LEQUAL);
		this.gl.clearDepth(1.0);
		/* this.gl.enable(GL.BLEND);
		this.gl.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
		this.gl.depthMask(false); */
	}

	private async setupTextures() {
		Log.debug("WebGLRenderer", "Setting up textures...");

		// Ensure to flip the Y axis of the texture. 'cos WebGL is weird
		this.gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
	}

	private async setupMesh() {
		await Chunk.setup(this.gl);
	}

	async setup() {
		Log.info("WebGLRenderer", "Setting up...");

		this.setupCanvas();
		this.frameBuffer = new RenderingPipelineBuffer(this.gl);
		await this.setupMesh();
		await this.setupTextures();
		await Gizmo3D.setup(this.gl);

		// await this.frameBuffer.addFilter("fxaa");
		// await this.frameBuffer.addFilter("sharpen");
		await this.frameBuffer.addFilter("gamma");
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
		let visibleChunks = ChunkManager.activeChunks.filter(chunk => this.main.playerCamera.isChunkInsideFrustum(chunk));
		if (SETTINGS.SORT_CHUNKS_BY_DISTANCE) {
			const distances = visibleChunks.map(chunk => vec3.distance(chunk.globalCenterPosition, this.main.playerCamera.position));
			visibleChunks = visibleChunks.sort((a, b) => {
				const distanceA = distances[visibleChunks.indexOf(a)];
				const distanceB = distances[visibleChunks.indexOf(b)];
				return distanceB - distanceA;
			});
		}


		for (const chunk of visibleChunks) {
			this.main.analytics.notifyChunkVisible(chunk);
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

        Gizmo3D.box(
            position,
            vec3.fromValues(0.5, 0.5, 0.5),
            vec3.fromValues(Math.toRadians(camera.pitch), Math.toRadians(camera.yaw), Math.toRadians(camera.roll)),
            this.main.useDebugCamera ? vec4.fromValues(1, 0, 0, 1) : vec4.fromValues(0, 0, 1, 1),
            true
        );

        // Calculate the near plane, ensuring that the camera is looking at the center of the near plane
        const nearCenter = vec3.create();
        vec3.scaleAndAdd(nearCenter, position, forward, near);
        vec3.scaleAndAdd(nearCenter, nearCenter, up, near / 2);
        mat4.lookAt(nearPlane, position, nearCenter, up);

        /* Gizmo3D.quad(
            nearCenter,
            vec3.fromValues(1, 1, 1),
            vec4.fromValues(1, 1, 1, 1),
            false
        ); */

        // Forward
        const forwardEnd = vec3.create();
        vec3.scaleAndAdd(forwardEnd, position, forward, 100);
        Gizmo3D.line(
            position,
            forwardEnd,
            vec4.fromValues(1, 1, 1, 1)
        );

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