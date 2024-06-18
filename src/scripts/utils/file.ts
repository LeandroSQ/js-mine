import { Log } from "./log";

export abstract class FileUtils {

	public static async load(name: string): Promise<string> {
		try {
			Log.debug("FileUtils", `Loading file: ${name}`);
			const response = await fetch(`${window.location.href}${name}`);

			return await response.text();
		} catch (error) {
			Log.error("FileUtils", `Failed to load file: ${name}`, error);
			throw error;
		}
	}

}