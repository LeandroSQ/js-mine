/* eslint-env node */
import { isArgumentPassed } from "./utils/argparser.mjs";
import * as esbuild from "esbuild";
import { Transform } from "stream";
import Vinyl from "vinyl";

// Env
const isProduction = isArgumentPassed("production", "prod");
const shouldMinify = true;
console.log(isProduction ? "PRODUCTION" : "DEVELOPMENT");

// Options
/** @type {import("esbuild").BuildOptions} */
const options = {
	bundle: true,
	sourcemap: !isProduction,
	target: [
		"es2015",
		"chrome58",
		"edge18",
		"firefox57",
		"node12",
		"safari11"
	],
	outdir: ".",
	platform: "browser",
	minify: shouldMinify,
	minifyWhitespace: shouldMinify,
	minifyIdentifiers: shouldMinify,
	minifySyntax: shouldMinify,
	treeShaking: true,
	define: {
		"DEBUG": `${!isProduction}`,
	},
	color: true
};


export async function buildAsync() {
	await esbuild.build(options);
}

export function buildPipe() {
	options.entryPoints = [];
	options.write = false;

	const stream = new Transform({ objectMode: true });

	// Called once for each file, to setup the stream
	stream._transform = function (file, encoding, callback) {
		if (file.isNull()) return callback(new TypeError("File is null"));
		if (!file.isBuffer()) return callback(new TypeError("File is not a buffer"));

		// To make TS lint happy
		if (options.entryPoints instanceof Array) options.entryPoints?.push(file.path);

		callback(null);
	};

	// Called every time the stream is flushed, i.e. when all files have been changed
	stream._flush = function (callback) {
		esbuild.build(options)
			.then(result => {
				if (result.errors.length > 0) {
					// Continue with warnings
					console.error("Errors:");
					for (const error of result.errors) {
						console.error(error);
					}

					return callback(null);
				}

				if (!result?.outputFiles) return callback(new Error("No output file found"), result.outputFiles);
				for (const file of result.outputFiles) {
					stream.push(new Vinyl({
						path: file.path,
						contents: Buffer.from(file.contents)
					}));
				}

				callback(null);
			})
			.catch((err) => callback(null));
	};

	return stream;
}