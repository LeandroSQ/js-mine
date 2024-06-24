/* eslint-disable max-statements */
import { mat4 } from "gl-matrix";
import { Main } from "../main";
import { Size } from "../types/size";
import { Log } from "../utils/log";
import { Theme } from "../utils/theme";
import { Color } from "../utils/color";
import { RenderingPipelineBuffer } from "../models/rendering-pipeline-buffer";
import { ChunkManager } from "../models/chunk-manager";
import { Chunk } from "../models/chunk";
import { Gizmo3D } from "../utils/gizmo3d";

export class WebGLRenderer {

	public canvas: HTMLCanvasElement;
	public gl: WebGLContext;

	private isDirty = false;

	private frameBuffer: RenderingPipelineBuffer;

	constructor(private main: Main) {  }

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
		// this.cube = new Cube(this.gl, CubeFace.GRASS, CubeFace.GRASS_SIDE, CubeFace.DIRT);
		// this.cube = new Cube(this.gl, CubeFace.DIAMOND_ORE, CubeFace.DIAMOND_ORE, CubeFace.DIAMOND_ORE);
		// await this.cube.setup();

		// this.cubes = await TerrainGenerator.generateCubes(this.gl, 16, 1);
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

		// Matrixes
		const projection = this.main.camera.getProjectionMatrix(this.main.screen);
		const view = this.main.camera.getViewMatrix();

		// Draw chunks
		for (const chunk of ChunkManager.activeChunks) {
			if (this.main.camera.isChunkInsideFrustum(view, projection, chunk)) {
				this.main.analytics.notifyChunkVisible(chunk);
				chunk.render(this.gl, projection, view);
			}
		}

		Gizmo3D.render(this.gl, projection, view);
		Gizmo3D.clear();
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