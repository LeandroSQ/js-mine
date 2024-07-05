import { SETTINGS } from "../settings";
import { Log } from "../utils/log";

export class FrameBuffer {

	private frameBuffer: WebGLFramebuffer;

	private colorTexture: WebGLTexture;
	private colorRenderBuffer: WebGLRenderbuffer;
	private colorFrameBuffer: WebGLFramebuffer;

	private depthBuffer: WebGLRenderbuffer;


	constructor(private gl: WebGLContext) {
		
	}

	private verifyFrameBuffer() {
		const status = this.gl.checkFramebufferStatus(GL.FRAMEBUFFER);
		if (status !== this.gl.FRAMEBUFFER_COMPLETE) throw new Error(`Frame buffer is incomplete: ${status}`);
	}

	private setupFrameBuffer() {
		Log.debug("FrameBuffer", "Setting up frame buffer...");
		const buffer = this.gl.createFramebuffer();
		if (!buffer) throw new Error("Could not create frame buffer");
		this.frameBuffer = buffer;
		this.gl.bindFramebuffer(GL.FRAMEBUFFER, this.frameBuffer);

		this.setupColorRenderBuffer();
		this.setupDepthBuffer();

		this.verifyFrameBuffer();
	}

	private setupDepthBuffer() {
		Log.debug("FrameBuffer", "Setting up depth buffer...");
		const buffer = this.gl.createRenderbuffer();
		if (!buffer) throw new Error("Could not create depth buffer");
		this.depthBuffer = buffer;
		this.gl.bindRenderbuffer(GL.RENDERBUFFER, this.depthBuffer);

		if (SETTINGS.USE_MSAA && this.gl.maxSamplesForMSAA > 0 && this.gl instanceof WebGL2RenderingContext) {
			this.gl.renderbufferStorageMultisample(GL.RENDERBUFFER, this.gl.maxSamplesForMSAA, WebGL2RenderingContext.DEPTH_COMPONENT24, this.gl.canvas.width, this.gl.canvas.height);
		} else {
			this.gl.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT16, this.gl.canvas.width, this.gl.canvas.height);
		}

		// Attach
		this.gl.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.RENDERBUFFER, this.depthBuffer);
	}

	private setupColorRenderBuffer() {
		Log.debug("FrameBuffer", "Setting up color render buffer...");
		const color = this.gl.createRenderbuffer();
		if (!color) throw new Error("Could not create color buffer");
		this.colorRenderBuffer = color;
		this.gl.bindRenderbuffer(GL.RENDERBUFFER, this.colorRenderBuffer);

		if (SETTINGS.USE_MSAA && this.gl.maxSamplesForMSAA > 0 && this.gl instanceof WebGL2RenderingContext) {
			this.gl.renderbufferStorageMultisample(GL.RENDERBUFFER, this.gl.maxSamplesForMSAA, GL.RGBA8, this.gl.canvas.width, this.gl.canvas.height);
		} else {
			this.gl.renderbufferStorage(GL.RENDERBUFFER, GL.RGBA8, this.gl.canvas.width, this.gl.canvas.height);
		}

		// Attach
		this.gl.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.RENDERBUFFER, this.colorRenderBuffer);
	}

	private setupColorFrameBuffer() {
		Log.debug("FrameBuffer", "Setting up color frame buffer...");
		const buffer = this.gl.createFramebuffer();
		if (!buffer) throw new Error("Could not create color frame buffer");
		this.colorFrameBuffer = buffer;
		this.gl.bindFramebuffer(GL.FRAMEBUFFER, this.colorFrameBuffer);

		this.setupColorTexture();

		this.verifyFrameBuffer();
	}

	private setupColorTexture() {
		Log.debug("FrameBuffer", "Setting up color texture...");
		// Texture
		const texture = this.gl.createTexture();
		if (!texture) throw new Error("Could not create texture");
		this.colorTexture = texture;

		this.gl.bindTexture(GL.TEXTURE_2D, this.colorTexture);
		this.gl.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, this.gl.canvas.width, this.gl.canvas.height, 0, GL.RGBA, GL.UNSIGNED_BYTE, null);

		// Filtering
		this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
		this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);

		// Wrapping
		this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
		this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);

		this.gl.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, this.colorTexture, 0);
	}

	public resize() {
		Log.debug("FrameBuffer", "Resizing frame buffer...");

		this.setupFrameBuffer();
		this.setupColorFrameBuffer();
		this.gl.bindFramebuffer(GL.FRAMEBUFFER, null);
	}


	public bind() {
		this.gl.bindFramebuffer(GL.FRAMEBUFFER, this.frameBuffer);
	}

	public blit(screen: boolean = false) {
		if (this.gl instanceof WebGL2RenderingContext) {
			this.gl.bindFramebuffer(WebGL2RenderingContext.READ_FRAMEBUFFER, this.frameBuffer);

			if (screen) {
				// Apply it to the screen
				this.gl.bindFramebuffer(WebGL2RenderingContext.DRAW_FRAMEBUFFER, null);
			} else {
				// Apply it to the color frame buffer, which will render to the texture
				this.gl.bindFramebuffer(WebGL2RenderingContext.DRAW_FRAMEBUFFER, this.colorFrameBuffer);
			}

			this.gl.blitFramebuffer(
				0, 0, this.gl.canvas.width, this.gl.canvas.height,
				0, 0, this.gl.canvas.width, this.gl.canvas.height,
				GL.COLOR_BUFFER_BIT, GL.NEAREST
			);

			this.gl.bindFramebuffer(WebGL2RenderingContext.READ_FRAMEBUFFER, null);
			this.gl.bindFramebuffer(WebGL2RenderingContext.DRAW_FRAMEBUFFER, null);
		}
	}

	public unbind() {
		this.gl.bindFramebuffer(GL.FRAMEBUFFER, null);
	}

	public bindTexture() {
		this.gl.activeTexture(GL.TEXTURE0);
		this.gl.bindTexture(GL.TEXTURE_2D, this.colorTexture);
	}
}