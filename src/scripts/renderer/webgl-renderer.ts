/* eslint-disable max-statements */
import { mat4, vec3 } from "gl-matrix";
import { Main } from "../main";
import { Cube, CubeFace } from "../models/cube";
import { Optional } from "../types/optional";
import { Size } from "../types/size";
import { Log } from "../utils/log";
import { Theme } from "../utils/theme";
import { Color } from "../utils/color";
import { Shader } from "../models/shader";
import { Texture } from "../models/texture";
import { RenderingPipelineBuffer } from "../models/rendering-pipeline-buffer";
import { TerrainGenerator } from "../models/terrain-generator";

export class WebGLRenderer {

	public canvas: HTMLCanvasElement;
	public gl: WebGLContext;

	private isDirty = false;

	private frameBuffer: RenderingPipelineBuffer;

	private cubes: Array<Cube> = [];

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

		this.cubes = await TerrainGenerator.generateCubes(this.gl, 16, 1);
	}

	async setup() {
		Log.info("WebGLRenderer", "Setting up...");

		this.setupCanvas();
		this.frameBuffer = new RenderingPipelineBuffer(this.gl);
		await this.setupMesh();
		await this.setupTextures();

		await this.frameBuffer.addFilter("fxaa");
		await this.frameBuffer.addFilter("sharpen");
		await this.frameBuffer.addFilter("gamma");
	}
	// #endregion

	// #region Render
	private getModelMatrix() {
		const modelMatrix = mat4.create();
		// const rad = 45 * Math.PI / 180;
		const rad = this.main.globalTimer;

		mat4.translate(modelMatrix, modelMatrix, [0.0, 0.0, -6.0]);
		mat4.rotate(modelMatrix, modelMatrix, rad, [0.0, 1.0, 0.0]);
		mat4.rotate(modelMatrix, modelMatrix, rad, [1.0, 0.0, 0.0]);

		return modelMatrix;
	}

	private bindProjectionMatrix(shader: Shader) {
		// Combine all matrixes on the CPU
		const projection = this.main.camera.getProjectionMatrix(this.main.screen);
		const view = this.main.camera.getViewMatrix();
		const model = this.getModelMatrix();
		const mvp = mat4.create();
		mat4.multiply(mvp, projection, view);
		mat4.multiply(mvp, mvp, model);

		shader.setUniform("u_matrix", mvp);
		shader.setUniform("u_texture", 0);
	}

	private clear(color: { r: number, g: number, b: number }) {
		this.gl.clearColor(color.r, color.g, color.b, 1.0);
		this.gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
	}

	private drawSingleCube() {
		const projection = this.main.camera.getProjectionMatrix(this.main.screen);
		const view = this.main.camera.getViewMatrix();
		this.cubes.forEach(cube => cube.render(projection, view));
		/* this.bindProjectionMatrix(this.meshShader);

		// Draw the cube
		this.textureAtlas.bind();
		this.meshShader.bindBuffer("index", Cube.indices);
		this.gl.drawElements(GL.TRIANGLES, Cube.indices.length, GL.UNSIGNED_SHORT, 0); */
	}

	/* private drawMultipleCubes() {
		// Combine all matrixes on the CPU
		const projection = this.main.camera.getProjectionMatrix(this.main.screen);
		const view = this.main.camera.getViewMatrix();
		const model = this.getModelMatrix();

		const instances = 2;
		const positions = [
			vec3.fromValues(0, 0, 0),
			vec3.fromValues(1, 2, 0.5),
			vec3.fromValues(0, -1, 0),
			vec3.fromValues(0, 0, -1),
		]

		this.meshShader.setUniform("u_texture", 0);
		this.textureAtlas.bind();
		this.meshShader.bindBuffer("index", Cube.indices);

		for (let i = 0; i < instances; i++) {
			for (let j = 0; j < instances; j++) {
				for (let k = 0; k < instances; k++) {
					const mvp = mat4.create();
					const translation = mat4.create();
					mat4.translate(translation, translation, positions[i]);
					mat4.multiply(mvp, projection, view);
					mat4.multiply(mvp, mvp, model);
					mat4.multiply(mvp, mvp, translation);

					this.meshShader.setUniform("u_matrix", mvp);
					this.gl.drawElements(GL.TRIANGLES, Cube.indices.length, GL.UNSIGNED_SHORT, 0);
				}
			}
		}
	} */

	private drawScene() {
		// Scene
		const color = Color.decode(Theme.background, true);
		this.clear(color);

		// Setup
		this.drawSingleCube();
		// this.drawMultipleCubes();
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