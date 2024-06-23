/* eslint-env node */
import gulp from "gulp";
const { src, dest, series, parallel, watch, symlink } = gulp;
import browserSync from "browser-sync";
import htmlMinify from "gulp-htmlmin";
import sourcemaps from "gulp-sourcemaps";
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
const sass = gulpSass(dartSass);
import { createGulpEsbuild } from "gulp-esbuild";
const gulpEsbuild = createGulpEsbuild({ incremental: false, pipe: false });
import cssAutoPrefixer from "gulp-autoprefixer";
import concat from "gulp-concat";
import { deleteAsync } from "del";

// Utilities
function isArgumentPassed(...args) {
	for (let i = 0; i < args.length; i++) {
		if (!args[i].startsWith("--")) {
			if (args[i].length > 1) {
				args.unshift(`--${args[i]}`);
			} else {
				args.unshift(`-${args[i]}`);
			}

			i++;
		}
	}

	for (const key of args) {
		if (process.argv.includes(key)) return true;
		if (!key.startsWith("-") && key.toUpperCase() in process.env) return true;
	}

	return false;
}

// Env
const isProduction = isArgumentPassed("production", "prod");
const shouldMinify = true;
console.log(isProduction ? "PRODUCTION" : "DEVELOPMENT");

// Options
const browserSyncOptions = {
	open: false,
	browser: false,
	ui: false,
	host: "0.0.0.0",
	server: {
		baseDir: "./dist",
		port: 3000,
	},
};

/** @type import("gulp-esbuild").Options */
const esbuildOptions = {
	bundle: true,
	sourcemap: isProduction ? undefined : "both",
	target: [
		"es2015",
		"chrome58",
		"edge18",
		"firefox57",
		"node12",
		"safari11"
	],
	// outdir: "./",
	platform: "browser",
	minify: shouldMinify,
	minifyWhitespace: shouldMinify,
	minifyIdentifiers: shouldMinify,
	minifySyntax: shouldMinify,
	treeShaking: true,
	define: {
		"DEBUG": `${!isProduction}`,
	}
};

const htmlOptions = {
	collapseWhitespace: true,
	removeComments: true,
	removeRedundantAttributes: true,
};

const cssOptions = {
	outputStyle: "compressed",
	sourceComments: false,
	sourceMap: false,
};

// Tasks
function reloadBrowsers() {
	return browserSync.reload({ stream: true });
}

async function cleanDistDir() {
	await deleteAsync("./dist");
}

function initializeBrowserSync() {
	return browserSync.init(browserSyncOptions);
}

function handleHtml() {
	return src("src/**/*.html")
		.pipe(htmlMinify(htmlOptions))
		.pipe(dest("./dist"))
		.pipe(reloadBrowsers());
}

function watchHtml() {
	return watch("src/**/*.html", handleHtml);
}

function handleTs() {
	return src(["./src/scripts/main.ts", "./src/scripts/jobs/gif.worker.ts"])
		.pipe(gulpEsbuild(esbuildOptions))
		.pipe(dest("./dist/scripts"))
		.pipe(reloadBrowsers());
}

function watchTs() {
	return watch("src/scripts/**/*.ts", handleTs);
}

function handleShaders() {
	if (isProduction) {
		return src("./src/shaders/**/**.glsl")
			.pipe(dest("./dist/shaders"))
			.pipe(reloadBrowsers());
	} else {
		return src("./src/shaders/**/**.glsl")
			.pipe(symlink("./dist/shaders", { force: true }));
	}
}

function watchShaders() {
	return watch("src/shaders/**.glsl", reloadBrowsers());
}

function handleAssets() {
	if (isProduction) {
		return src("./src/assets/**/**.*")
			.pipe(dest("./dist/assets"))
			.pipe(reloadBrowsers());
	} else {
		return src("./src/assets/**/**.*")
			.pipe(symlink("./dist/assets", { force: true }));
	}
}

function handleSCSS() {
	return src("./src/styles/**.scss")
		.pipe(sourcemaps.init())
		.pipe(sass(cssOptions).on("error", sass.logError))
		.pipe(cssAutoPrefixer())
		.pipe(concat("style.min.css"))
		.pipe(sourcemaps.write("./"))
		.pipe(dest("./dist/styles"))
		.pipe(reloadBrowsers());
}

function watchSCSS() {
	return watch("./src/styles/**.scss", handleSCSS);
}

// Export tasks
export const assets = handleAssets;
export const shaders = handleShaders;
export const html = handleHtml;
export const ts = handleTs;
export const scss = handleSCSS;
export const clean = cleanDistDir;
export const build = series(clean, parallel(assets, shaders, scss, html, ts));
export const dev = series(clean,
	parallel(
		initializeBrowserSync,
		parallel(assets, shaders, scss, html, ts),
		parallel(watchShaders, watchSCSS, watchHtml, watchTs)
	)
);
export default build;