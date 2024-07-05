import { SETTINGS } from "../settings";
import { Optional } from "../types/optional";
import { ImageUtils } from "../utils/image";
import { Log } from "../utils/log";

export class Texture {

	private texture: Optional<WebGLTexture> = null;

	public static terrain: Texture;

	constructor(private gl: WebGLContext) { }

	public static async loadTerrain(gl: WebGLContext) {
		// All blocks will share the same texture, for now
		if (!Texture.terrain) {
			Texture.terrain = new Texture(gl);
			await Texture.terrain.load("terrain", true, true);
		}
	}

	async load(url: string, nearestNeighborFiltering = true, padding = false) {
		// Load image
		let image: HTMLCanvasElement | HTMLImageElement = await ImageUtils.load(url);
		if (padding) image = ImageUtils.applyPadding(image);

		// Create texture
		const texture = this.gl.createTexture();
		if (!texture) throw new Error(`Could not create texture for '${url}'`);
		this.texture = texture;
		this.gl.bindTexture(GL.TEXTURE_2D, texture);
		this.gl.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);

		// Filtering
		if (nearestNeighborFiltering) {
			this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
			this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
		} else {
			this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
			this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
		}

		// Wrapping
		this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
		this.gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);

		// this.gl.enableAnisotropicFiltering();
	}

	bind() {
		this.gl.activeTexture(GL.TEXTURE0);
		this.gl.bindTexture(GL.TEXTURE_2D, this.texture);
	}

}