import { Log } from "./log";

export abstract class FileUtils {

	private static readonly cache: Map<string, string> = new Map();

	public static async load(name: string): Promise<string> {
		try {
			if (this.cache.has(name)) {
				Log.debug("FileUtils", `Loading file from cache: ${name}`);
				return this.cache.get(name) as string;
			}

			Log.debug("FileUtils", `Loading file: ${name}`);
			const response = await fetch(`${window.location.href}${name}`);
			if (!response.ok) throw new Error(`Failed to load file: ${name}`);

			const text = await response.text();
			this.cache.set(name, text);

			return text;
		} catch (error) {
			Log.error("FileUtils", `Failed to load file: ${name}`, error);
			throw error;
		}
	}

}