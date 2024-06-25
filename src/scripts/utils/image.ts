import { Size } from "./../types/size";
import { Optional } from "../types/optional";
import { Log } from "./log";

export abstract class ImageUtils {

	private static readonly cache: Map<string, HTMLImageElement> = new Map<string, HTMLImageElement>();

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