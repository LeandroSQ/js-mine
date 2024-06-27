import { WorkerMessage } from "../types/worker-message";
import { Log } from "../utils/log";

export abstract class AWorkerBinding {

	private static readonly VERBOSE = DEBUG && false;

	private worker: Worker;

	constructor(private workerName: string) {
		this.worker = new Worker(`${window.location.href}scripts/jobs/${workerName}.worker.js`);
		this.worker.onmessage = this.onMessage.bind(this);
		this.worker.onerror = this.onError.bind(this);
		this.worker.onmessageerror = this.onMessageError.bind(this);
	}

	protected postMessage<T>(message: WorkerMessage<T>) {
		this.worker.postMessage(message);
	}

	protected onMessageReceived<T>(message: WorkerMessage<T>) {
		/* Ignore */
	}

	private onMessage(e: MessageEvent) {
		if (AWorkerBinding.VERBOSE) Log.debug(`WorkerBinding-${this.workerName}`, "Received message", e.data);
		this.onMessageReceived(e.data);
	}

	private onError(e: ErrorEvent) {
		Log.error(`WorkerBinding-${this.workerName}`, "Worker error", e.message);
	}

	private onMessageError(e: MessageEvent) {
		Log.error(`WorkerBinding-${this.workerName}`, "Worker message error", e.data);
	}

}