declare global {

	interface Window {
		addLoadEventListener: (listener: () => void) => void;
		addVisibilityChangeEventListener: (listener: (isVisible: boolean) => void) => void;
		isDocumentHidden: () => boolean;
		isMobile: () => boolean;
		getRefreshRate: () => Promise<number>;
	}

	interface HTMLCanvasElement {
		screenshot: () => void;
	}

	interface String {
		toCamelCase: () => string;
		insertAt(index: number, value: string): string;
	}

	interface Array<T> {
		remove: (item: T) => boolean;
		appendArray: (array: Array<T> | undefined) => void;
	}

	interface Math {
		clamp: (value: number, min: number, max: number) => number;
		average: (...values: number[]) => number;
		distance: (x1: number, y1: number, x2: number, y2: number) => number;
		randomInt: (min: number, max: number) => number;
		lerp: (a: number, b: number, t: number) => number;
		oscilate: (time: number, cyclesPerSecond: number, minAmplitude?: number, maxAmplitude?: number) => number;
		smoothstep: (x: number, min?: number, max?: number) => number;
		prettifyElapsedTime: (millis: number) => string;
		toDegrees: (radians: number) => number;
		toRadians: (degrees: number) => number;
	}

	interface CanvasRenderingContext2D {
		clear: () => void;
		line: (x1: number, y1: number, x2: number, y2: number) => void;
		fillTextAligned(text: string, x: number, y: number, alignment: TextAlign): void;
		fillCircle(x: number, y: number, radius: number): void;
	}

	interface Function {
		oneshot: (predicate: VoidFunction) => VoidFunction;
		timeout: (predicate: VoidFunction, amount: number) => VoidFunction;
		debounce: (predicate: VoidFunction, amount: number) => VoidFunction;
	}

	interface PromiseConstructor {
		delay: (ms: number) => Promise<void>;
		sequential<T>(promises: Promise<T>[]): Promise<T[]>;
	}

	const DEBUG: boolean;

	let GL: typeof WebGLRenderingContext | typeof WebGL2RenderingContext;

	declare type WebGLContext = WebGLRenderingContext | WebGL2RenderingContext;

}

export { };