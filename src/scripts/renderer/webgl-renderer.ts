/* eslint-disable max-statements */
import { mat4 } from "gl-matrix";
import { Main } from "../main";
import { Cube } from "../models/cube";
import { Optional } from "../types/optional";
import { Size } from "../types/size";
import { Log } from "../utils/log";
import { Theme } from "../utils/theme";
import { Color } from "../utils/color";
import { Quad } from "../models/quad";
import { Shader } from "../models/shader";
import { Texture } from "../models/texture";
import { FrameBuffer } from "../models/frame-buffer";
import { RenderingPipelineBuffer } from "../models/filtering";

export class WebGLRenderer {

	public canvas: HTMLCanvasElement;
	public gl: WebGLRenderingContext | WebGL2RenderingContext;

	private meshShader: Shader;

	private textureAtlas: Texture;

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
		const options: WebGLContextAttributes = { antialias: true };
		const gl = this.canvas.getContext("webgl2", options) ?? this.canvas.getContext("webgl", options) ?? this.canvas.getContext("experimental-webgl", options);
		if (!gl) throw new Error("Could not get WebGL context");
		this.gl = gl as WebGLRenderingContext | WebGL2RenderingContext;

		document.body.appendChild(this.canvas);
	}

    private async setupShaders() {
        Log.debug("WebGLRenderer", "Setting up shaders...");
        this.meshShader = new Shader(this.gl, "mesh");
		await this.meshShader.setup({
			source: {
				vertex: "vertex",
				fragment: "fragment"
			},
            uniforms: ["u_projection", "u_model", "u_view", "u_texture"],
            buffers: {
				vertex: {
					data: Cube.vertices,
					attribute: "a_position"
				},
				uv: {
					data: Cube.textureCoordinates,
					attribute: "a_texcoord"
				},
				normal: {
					data: Cube.normals,
					attribute: "a_normal"
				},
                index: {
					data: Cube.indices,
					target: GL.ELEMENT_ARRAY_BUFFER,
				}
            }
		});
	}

	private async setupTextures() {
		Log.debug("WebGLRenderer", "Setting up textures...");

		this.textureAtlas = new Texture(this.gl);
		await this.textureAtlas.load("terrain");

		// Ensure to flip the Y axis of the texture. 'cos WebGL is weird
		this.gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
	}

	async setup() {
		Log.info("WebGLRenderer", "Setting up...");

		this.setupCanvas();
		this.frameBuffer = new RenderingPipelineBuffer(this.gl);
		await this.setupShaders();
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
		const rad = this.main.globalTimer / 5;

		mat4.translate(modelMatrix, modelMatrix, [0.0, 0.0, -6.0]);
		mat4.rotate(modelMatrix, modelMatrix, rad, [0.0, 1.0, 0.0]);
		mat4.rotate(modelMatrix, modelMatrix, rad, [1.0, 0.0, 0.0]);

		return modelMatrix;
	}

	private bindProjectionMatrix(shader: Shader) {
		shader.setUniform("u_projection", this.main.camera.getProjectionMatrix(this.main.screen));
		shader.setUniform("u_view", this.main.camera.getViewMatrix());
		shader.setUniform("u_model", this.getModelMatrix());
		shader.setUniform("u_texture", 0);
	}

	private clear(color: { r: number, g: number, b: number }) {
		this.gl.clearColor(color.r, color.g, color.b, 1.0);
		this.gl.clearDepth(1.0);
		this.gl.cullFace(GL.BACK);
		this.gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
	}

	private drawScene() {
		// Scene
		const color = Color.decode(Theme.background, true);
		this.clear(color);
		this.gl.enable(GL.DEPTH_TEST);
		this.gl.enable(GL.CULL_FACE);
		this.gl.depthFunc(GL.LEQUAL);

		// Setup
		this.meshShader.bind();
		this.bindProjectionMatrix(this.meshShader);

		// Draw the cube
		this.textureAtlas.bind();
		this.meshShader.bindBuffer("index", Cube.indices);
		this.gl.drawElements(GL.TRIANGLES, Cube.indices.length, GL.UNSIGNED_SHORT, 0);

		// Cleanup
		this.gl.disable(GL.CULL_FACE);
		this.gl.disable(GL.DEPTH_TEST);
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