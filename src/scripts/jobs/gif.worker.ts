import { Log } from "../utils/log";
import JSZip from "jszip";

let frames: Array<ImageBitmap> = [];
const canvas = new OffscreenCanvas(1, 1);
const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
if (!context) throw new Error("Could not get context of canvas");

async function bitmapToBlob(bitmap: ImageBitmap): Promise<Blob> {
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;
	context.drawImage(bitmap, 0, 0);

	return await canvas.convertToBlob();
}

function onAddFrame(frame: ImageBitmap) {
	frames.push(frame);
}

async function onZipFrames() {
	Log.info("GIFWorker", "Zipping frames...");
	const zip = new JSZip();
	const folder = zip.folder("frames");
	await Promise.all(frames.map(async (frame, index) => {
		// Calculate progress
		const progress = Math.round((index / frames.length) * 100);
		if (progress % 10 === 0) Log.info("GIFWorker", `Zipping progress ${progress}%`);

		// Save the frame
		const blob = await bitmapToBlob(frame);
		folder?.file(`${index}.png`, blob);
	}));
	const blob = await zip.generateAsync({ type: "blob" });
	reset();
	postMessage(blob);
}

function reset() {
	frames = [];
}

onmessage = (event) => {
	const { key, value } = event.data;
	switch (key) {
		case "add":
			onAddFrame(value);
			break;
		case "zip":
			onZipFrames();
			break;
		default:
			Log.error("GIFWorker", `Unknown message type: ${key}`);
			break;
	}
};