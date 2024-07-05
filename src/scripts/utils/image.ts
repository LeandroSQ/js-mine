import { Size } from "./../types/size";
import { Optional } from "../types/optional";
import { Log } from "./log";
import { SETTINGS } from "../settings";

export abstract class ImageUtils {

	private static readonly cache: Map<string, HTMLImageElement> = new Map<string, HTMLImageElement>();

	public static applyPadding(image: HTMLImageElement) {
		const rows = image.height / SETTINGS.TEXTURE_ATLAS_SIZE;
		const cols = image.width / SETTINGS.TEXTURE_ATLAS_SIZE;
		const spriteWidthPadded = SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE + SETTINGS.TEXTURE_PADDING * 2;
		const spriteHeightPadded = SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE + SETTINGS.TEXTURE_PADDING * 2;

		const canvas = document.createElement("canvas");
		canvas.width = spriteWidthPadded * cols;
		canvas.height = spriteHeightPadded * rows;
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Could not get 2D context");
		context.imageSmoothingEnabled = false;

		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				const x = col * SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE;
				const y = row * SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE;

				// Apply SETTINGS.TEXTURE_PADDING
				// Top
				context.drawImage(
					image,
					x,
					y,
					SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE,
					1,
					col * spriteWidthPadded,
					row * spriteHeightPadded,
					SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE + SETTINGS.TEXTURE_PADDING * 2,
					SETTINGS.TEXTURE_PADDING
				);

				// Bottom
				context.drawImage(
					image,
					x,
					y + SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE - 1,
					SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE,
					1,
					col * spriteWidthPadded,
					row * spriteHeightPadded + SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE + SETTINGS.TEXTURE_PADDING,
					SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE + SETTINGS.TEXTURE_PADDING * 2,
					SETTINGS.TEXTURE_PADDING
				);

				// Left
				context.drawImage(
					image,
					x,
					y,
					1,
					SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE,
					col * spriteWidthPadded,
					row * spriteHeightPadded,
					SETTINGS.TEXTURE_PADDING,
					SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE + SETTINGS.TEXTURE_PADDING * 2
				);

				// Right
				context.drawImage(
					image,
					x + SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE - 1,
					y,
					1,
					SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE,
					col * spriteWidthPadded + SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE + SETTINGS.TEXTURE_PADDING,
					row * spriteHeightPadded,
					SETTINGS.TEXTURE_PADDING,
					SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE + SETTINGS.TEXTURE_PADDING * 2
				);

				// Draw the original texture
				context.drawImage(
					image,
					x,
					y,
					SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE,
					SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE,
					col * spriteWidthPadded + SETTINGS.TEXTURE_PADDING,
					row * spriteHeightPadded + SETTINGS.TEXTURE_PADDING,
					SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE,
					SETTINGS.TEXTURE_ATLAS_SPRITE_SIZE
				);

			}
		}

		return canvas;
	}

	public static load(id: string, size: Optional<Size> = null): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			if (this.cache.has(id)) {
				const value = this.cache.get(id);
				if (value === undefined) throw new Error("Unexpected undefined value in cache");

				return resolve(value);
			}

			const image = new Image();
			image.src = `${window.location.href}assets/images/${id}.png`;
			image.crossOrigin = "anonymous";
			image.style.display = "none";
			image.id = `image-${id}`;

			if (size) {
				image.width = size.width;
				image.height = size.height;
			}

			image.onerror = (e) => {
				Log.error("ImageUtils", `Failed to load image: ${id}`, e.toString());
				reject(e);
			};
			image.onload = () => {
				this.cache.set(id, image);
				resolve(image);
			};
		});
	}

	public static get(id: string): Optional<HTMLImageElement> {
		if (!this.cache.has(id)) return null;

		const value = this.cache.get(id);
		if (value === undefined) throw new Error("Unexpected undefined value in cache");

		return value;
	}

}