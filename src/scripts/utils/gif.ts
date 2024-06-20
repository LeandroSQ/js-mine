import * as FileSaver from "filesaver.js";
import { Log } from "./log";

// Not pretty to have code as this outside of a class,
// But even uglier is to have a GIF logic that hangs the main thread everytime
const worker = new Worker(`${window.location.href}scripts/jobs/gif.worker.js`);
worker.onerror = (e) => Log.error("GIFUtils", "Worker error", e.message);
worker.onmessageerror = (e) => Log.error("GIFUtils", "Worker message error", e.data);
worker.onmessage = (e) => {
	Log.info("GIFUtils", "Received message", e.data);
	FileSaver.saveAs(e.data, `recording.zip`);
};

const canvas = new OffscreenCanvas(1, 1);
const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
if (!context) throw new Error("Could not get context of canvas");

export abstract class GIFUtils {

	public static addFrame(source: HTMLCanvasElement, overlay: HTMLCanvasElement) {
		canvas.width = source.width;
		canvas.height = source.height;

		context.drawImage(source, 0, 0);
		context.drawImage(overlay, 0, 0);

		const data = canvas.transferToImageBitmap();

		// Send a message to the worker with the key "add" and the canvas as the value
		worker.postMessage({ key: "add", value: data }, [data]);
	}

	public static async generate(filename: string) {
		worker.postMessage({ key: "zip" });
	}

}