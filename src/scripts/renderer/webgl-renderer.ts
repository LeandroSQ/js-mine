/* eslint-disable max-statements */
import { mat4 } from "gl-matrix";
import { Main } from "../main";
import { Cube } from "../models/cube";
import { Optional } from "../types/optional";
import { Size } from "../types/size";
import { FileUtils } from "../utils/file";
import { Log } from "../utils/log";
import { Theme } from "../utils/theme";
import { Color } from "../utils/color";
import { ImageUtils } from "../utils/image";
import { Quad } from "../models/quad";
import { Shader } from "../models/shader";
import { Texture } from "../models/texture";

export class WebGLRenderer {

	public canvas: HTMLCanvasElement;
	public gl: WebGLRenderingContext | WebGL2RenderingContext;

	private meshShader: Shader;
	private finalPassShader: Shader;

	private textureAtlas: Texture;

	private isDirty = false;

	private frameBuffer: WebGLFramebuffer;

	constructor(private main: Main) {  }

	// #region Utility
	public invalidate() {
		this.isDirty = true;
	}

	public setSize(size: Size) {
		Log.info("WebGLRenderer", "Setting size...");
		this.canvas.width = size.width;
		this.canvas.height = size.height;
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
	}
	// #endregion

	// #region Setup
	// #region Textures
	private setupFrameBuffer() {
		Log.info("WebGLRenderer", "Setting up frame buffer...");

		// this.textures.target = this.gl.createTexture();
		// if (!this.textures.target) throw new Error("Could not create target texture");
		// this.gl.bindTexture(GL.TEXTURE_2D, this.textures.target);
		// this.gl.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, this.canvas.width, this.canvas.height, 0, GL.RGBA, GL.UNSIGNED_BYTE, null);
		// this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
		// this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
		// this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
		// this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);

		// const buffer = this.gl.createFramebuffer();
		// if (!buffer) throw new Error("Could not create frame buffer");
		// this.frameBuffer = buffer;
		// this.gl.bindFramebuffer(GL.FRAMEBUFFER, this.frameBuffer);

		// this.gl.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, this.textures.target, 0);
	}
	// #endregion

	private setupCanvas() {
		Log.debug("WebGLRenderer", "Creating canvas...");
		this.canvas = document.createElement("canvas");
		this.canvas.id = "webgl-canvas";
		const options: WebGLContextAttributes = { antialias: false };
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

        this.finalPassShader = new Shader(this.gl, "final");
		await this.finalPassShader.setup({
			source: {
				vertex: "vertex-final",
				fragment: "fragment-final"
			},
            uniforms: ["u_texture"],
            buffers: {
				vertex: {
					data: Quad.vertices,
					attribute: "a_position"
				},
				uv: {
					data: Quad.textureCoordinates,
					attribute: "a_texcoord"
				},
				index: {
					data: Quad.indices,
					target: GL.ELEMENT_ARRAY_BUFFER,
				}
            }
        });
	}

	private async setupTextures() {
		Log.debug("WebGLRenderer", "Setting up textures...");

		// Ensure to flip the Y axis of the texture. 'cos WebGL is weird
		this.gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);

		this.textureAtlas = new Texture(this.gl);
		await this.textureAtlas.load("terrain");
	}

	async setup() {
		Log.info("WebGLRenderer", "Setting up...");

        this.setupCanvas();
		await this.setupShaders();
		await this.setupTextures();
	}
	// #endregion

	// #region Render
	private getModelMatrix() {
		const modelMatrix = mat4.create();
		const rad = this.main.globalTimer / 2;
		mat4.translate(modelMatrix, modelMatrix, [0.0, 0.0, -6.0]);
		mat4.rotate(modelMatrix, modelMatrix, rad, [0.0, 1.0, 0.0]);
		mat4.rotate(modelMatrix, modelMatrix, rad, [1.0, 0.0, 0.0]);

		return modelMatrix;
	}

	private bindProjectionMatrix(shader: Shader) {
		shader.setUniform("u_projection", this.main.camera.getProjectionMatrix(this.main.screen));
		shader.setUniform("u_view", this.main.camera.getViewMatrix());
		shader.setUniform("u_model", this.getModelMatrix());
	}

	private drawScene() {
		// Scene
		const color = Color.decode(Theme.background, true);
		this.gl.clearColor(color.r, color.g, color.b, 1.0);
		this.gl.clearDepth(1.0);
		this.gl.cullFace(GL.BACK);
		this.gl.enable(GL.DEPTH_TEST);
		this.gl.enable(GL.CULL_FACE);
		this.gl.depthFunc(GL.LEQUAL);
		this.gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

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

		this.drawScene();
	}
	// #endregion

}