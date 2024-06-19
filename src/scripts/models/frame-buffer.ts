import { Log } from "../utils/log";
import { Texture } from "./texture";

export class FrameBuffer {

	private texture: WebGLTexture;
	private frameBuffer: WebGLFramebuffer;

	constructor(private gl: WebGLRenderingContext | WebGL2RenderingContext) {
		this.setup();
	}

	private setup() {
		Log.debug("FrameBuffer", "Setting up frame buffer...");
		this.setupTexture();

		const buffer = this.gl.createFramebuffer();
		if (!buffer) throw new Error("Could not create frame buffer");
		this.frameBuffer = buffer;
		this.linkTexture();

		const status = this.gl.checkFramebufferStatus(GL.FRAMEBUFFER);
		if (status !== this.gl.FRAMEBUFFER_COMPLETE) throw new Error(`Frame buffer is incomplete: ${status}`);
	}

	private linkTexture() {
		this.bind();
		this.gl.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, this.texture, 0);
		this.unbind();
	}

	private setupTexture() {
		const texture = this.gl.createTexture();
		if (!texture) throw new Error("Could not create texture");
		this.texture = texture;

		this.gl.bindTexture(GL.TEXTURE_2D, this.texture);
		this.gl.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, this.gl.canvas.width, this.gl.canvas.height, 0, GL.RGBA, GL.UNSIGNED_BYTE, null);

		// Filtering
		this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
		this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);

		// Wrapping
		this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
		this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
	}

	public resize() {
		Log.debug("FrameBuffer", "Resizing frame buffer...");
		this.setupTexture();
		this.linkTexture();
	}

	public bind() {
		this.gl.bindFramebuffer(GL.FRAMEBUFFER, this.frameBuffer);
	}

	public unbind() {
		this.gl.bindFramebuffer(GL.FRAMEBUFFER, null);
	}

	public bindTexture() {
		this.gl.activeTexture(GL.TEXTURE0);
		this.gl.bindTexture(GL.TEXTURE_2D, this.texture);
	}
}