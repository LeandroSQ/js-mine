export type WorkerMessage<T> = {
	type: string;
	data: T
};