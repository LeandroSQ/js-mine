import JSZip from "jszip";
import * as FileSaver from "filesaver.js";

export abstract class GIFUtils {

	private static frames: HTMLCanvasElement[] = [];

	public static addFrame(source: HTMLCanvasElement, overlay: HTMLCanvasElement) {
		const canvas = document.createElement("canvas");
		canvas.width = source.width;
		canvas.height = source.height;

		const context = canvas.getContext("2d");
		if (!context) throw new Error("Could not get context of canvas");

		context.drawImage(source, 0, 0);
		context.drawImage(overlay, 0, 0);

		this.frames.push(canvas);
	}

	public static async generate(filename: string) {
		const zip = new JSZip();
		const folder = zip.folder("frames");

		const promises = this.frames.map(async (frame, index) => {
			const blob = await new Promise<Blob>((resolve) => {
				frame.toBlob((blob) => resolve(blob as Blob));
			});
			folder?.file(`${index}.png`, blob);
		});
		await Promise.all(promises);

		this.frames = [];

		const content = await zip.generateAsync({ type: "blob" });
		FileSaver.saveAs(content, `${filename}.zip`);
	}

}