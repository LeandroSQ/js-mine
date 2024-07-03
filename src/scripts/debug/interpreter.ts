import { SETTINGS } from "../settings";
import { Log } from "../utils/log";

export namespace Interpreter {

	function evalInScope(js: string, scope: any): any {
		return new Function("with(this) { return eval('" + js + "')}").call(scope);
	}

	function calculateSimilarity(a: string, b: string): number {
		const maxLength = Math.max(a.length, b.length);
		const distance = maxLength - a.split("").reduce((acc, char, index) => {
			return acc + (char === b[index] ? 1 : 0);
		}, 0);
		return 1 - distance / maxLength;
	}

	function prepareScope(extra: any): any {
		return {
			SETTINGS,
			set(key: string, value: any) {
				key = key.toUpperCase();
				if (SETTINGS.hasOwnProperty(key)) {
					SETTINGS[key] = value;
					return undefined;
				} else {
					const keys = Object.keys(SETTINGS)
										.map(k => ({ similarity: calculateSimilarity(key, k), key: k }))
										.sort((a, b) => b.similarity - a.similarity)
										.map(x => x.key)
										.slice(0, 3)
					throw new Error(`Invalid setting: ${key}.\nDid you mean: ${keys}?`);
				}
			},
			...extra
		};
	}

	export function evaluate(input: string, context = {}): Promise<any> {
		return new Promise((resolve, reject) => {
			try {
				Log.debug("Interpreter", `Evaluating: ${input}`);
				const scope = prepareScope(context);
				const result = evalInScope(input, scope);
				resolve(result);
			} catch (error) {
				Log.error("Interpreter", error);
				reject(error.message);
			}
		});
	}

}