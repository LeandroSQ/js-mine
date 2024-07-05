import { FONT_FAMILY, FONT_SIZE } from "../constants";
import { Vector2 } from "../models/math/vector2";
import { Chunk } from "../models/terrain/chunk";
import { ChunkManager } from "../models/terrain/chunk-manager";
import { Optional } from "../types/optional";
import { Log } from "../utils/log";
import { Theme } from "../utils/theme";

type ChartInfo = {
	average: number;
	max: number;
	last: number;
	reference: number;
	fps1Low: number;
};

export namespace Analytics {

	const MARGIN = 10;
	const PADDING = 15;
	const WIDTH = 230;
	const RADIUS = 10;
	const LINE_HEIGHT = FONT_SIZE * 1.25;

	const FRAME_TIME_MAX_ENTRIES = 250;

	// Timing
	let targetFPS = 60;
	let lastFrameTime = 0;
	let frameTimer = 0;
	let frameCount = 0;
	let updateCount = 0;
	let fps = 0;
	let ups = 0;
	let chart: Array<number> = [];

	// For smooth transitioning on chart scaling
	let currentMaxHeight = 1;
	let targetMaxHeight = 1000 / targetFPS;

	// Memory
	let memory = 0;

	// Graphics
	let activeChunkCount = 0;
	let vertexCount = 0;
	let triangleCount = 0;

	// Raycast
	let raycastStepCount = 0;
	let raycastSteps = 0;

	// Chunks
	let chunkUpdateCount = 0;
	let chunkUpdates = 0;

	export async function setup() {
		try {
			targetFPS = await window.getRefreshRate();
			Log.info("Analytics", `Target FPS: ${targetFPS}`);
		} catch (e) {
			Log.warn("Analytics", "Failed to get refresh rate, defaulting to 60 FPS");
		}
	}

	// #region Metrics tracking
	export function notifyChunkVisible(chunk: Chunk) {
		activeChunkCount++;
		vertexCount += chunk.mesh?.vertexCount ?? 0;
		triangleCount += chunk.mesh?.triangleCount ?? 0;
	}

	export function notifyChunkUpdate() {
		chunkUpdateCount++;
	}

	export function notifyRaycast() {
		raycastStepCount++;
	}
	// #endregion

	// #region Update
	export function startFrame(time: DOMHighResTimeStamp = performance.now()) {
		lastFrameTime = time;

		activeChunkCount = 0;
		vertexCount = 0;
		triangleCount = 0;

		raycastStepCount = 0;
	}

	export function update(deltaTime: number) {
		frameTimer += deltaTime;
		if (frameTimer >= 1.0) {
			frameTimer -= 1.0;
			fps = frameCount;
			frameCount = 0;
			ups = updateCount;
			updateCount = 0;

			chunkUpdates = chunkUpdateCount;
			chunkUpdateCount = 0;

			performance.getUsedMemory()
				.then(bytes => memory = bytes);
		}

		currentMaxHeight = Math.lerp(currentMaxHeight, targetMaxHeight, deltaTime * 4);
	}

	export function endUpdate() {
		updateCount++;
	}

	export function endFrame() {
		const elapsed = performance.now() - lastFrameTime;
        frameCount++;

        // Skip the first 1 second of data to allow the chart to stabilize
        // if (chart.length === 0 && frameCount < targetFPS) return;

		chart.push(elapsed);
		if (chart.length > FRAME_TIME_MAX_ENTRIES) {
			chart.shift();
		}
	}
	// #endregion

	// #region Rendering
	/**
	 * Calculates the average, max, and last frame time.
	 */
	function processChart(): ChartInfo {
		const targetFrameTime = 1000 / targetFPS;
		let maxFrameTime = 0;
		let totalFrameTime = 0;
		let last = 0;

		for (const entry of chart) {
			if (entry > maxFrameTime) maxFrameTime = entry;
			totalFrameTime += entry;
			last = entry;
		}
		const averageFrameTime = totalFrameTime / chart.length;
		targetMaxHeight = maxFrameTime;

		// 1% low
		const sorted = chart.slice().sort((a, b) => a - b);
		const targetIndex = Math.floor(sorted.length * 0.01);
		let onePercentLow = (targetIndex >= 0 && targetIndex < sorted.length) ? Math.round(1000 / sorted[targetIndex]) : 0;

		return {
			average: averageFrameTime,
			max: maxFrameTime,
			last,
			reference: targetFrameTime,
			fps1Low: onePercentLow
		}
	}

	function renderMetrics(ctx: CanvasRenderingContext2D, chart: ChartInfo, cursor: Vector2) {
        function text(text: string) {
            // Split the text into parts to allow for bolding
            // Splitting at : but keeping the colon on the left side
            const parts = text.split(/([a-zA-Z 0-9\%]+:)/g);
            let offset = 0;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (part.length <= 0) continue;

                const isBold = part.includes(":");
                ctx.fillStyle = isBold ? Theme.secondary : Theme.foreground;
                ctx.font = `${isBold ? "bold" : "normal"} ${FONT_SIZE}px ${FONT_FAMILY}`;
                ctx.fillText(part, cursor.x + offset, cursor.y);
                offset += ctx.measureText(part).width;
            }
            cursor.y += LINE_HEIGHT;
		}

		// Initial cursor position
		cursor.x = MARGIN + PADDING;
		cursor.y = MARGIN + PADDING;

		// Setup font
		ctx.font = `bold ${FONT_SIZE}px ${FONT_FAMILY}`;
        ctx.textBaseline = "top";
		ctx.fillStyle = Theme.secondary;
		ctx.textAlign = "center";
		ctx.fillText("- Analytics -", cursor.x + WIDTH / 2, cursor.y);
		cursor.y += LINE_HEIGHT + PADDING / 2;

		// Render values
		ctx.fillStyle = Theme.foreground;
		ctx.textAlign = "left";
		text(`FPS: ${fps} real / ${Math.floor(1000.0 / chart.max)} max est.`);
		text(`Average: ${Math.prettifyElapsedTime(chart.average)} | Max: ${Math.prettifyElapsedTime(chart.max)}`);
		text(`1% Low: ${chart.fps1Low} | Last: ${Math.prettifyElapsedTime(chart.last)}`);
		text(`UPS: ${ups}`);
		text(`Chunks: ${activeChunkCount}/${Math.prettifyUnit(ChunkManager.activeChunks.length)} | ${Math.prettifyUnit(ChunkManager.loadedChunkCount)} loaded`);
		text(`Chunk updates: ${chunkUpdates}`);
		text(`Vertices: ${Math.prettifyUnit(vertexCount)}`);
		text(`Triangles: ${Math.prettifyUnit(triangleCount)}`);
		text(`Ray casts: ${Math.prettifyUnit(raycastSteps)}`);
        if (!isNaN(memory)) text(`Memory usage: ${Math.prettifyUnit(memory, "B")}`);

        cursor.y += LINE_HEIGHT;
	}

	function renderChart(ctx: CanvasRenderingContext2D, info: ChartInfo, cursor: Vector2) {
		if (chart.length < 2) return;

		const chartHeight = 50;
		const chartWidth = WIDTH + MARGIN + PADDING * 2;
		const chartX = MARGIN;
		const spacing = chartWidth / (FRAME_TIME_MAX_ENTRIES - 1);

		// Create a round rect clipping mask
		ctx.save();
		ctx.beginPath();
		ctx.roundRect(chartX, cursor.y, chartWidth, chartHeight, [0, 0, RADIUS, RADIUS]);
		ctx.clip();

		// Render the chart
		const gradient = ctx.createLinearGradient(chartX, cursor.y, chartX, cursor.y + chartHeight);
        gradient.addColorStop(0.25, "#ef5777");
        gradient.addColorStop(1, "#f53b57");
		ctx.fillStyle = gradient;
		ctx.strokeStyle = Theme.containerBorder;
		ctx.beginPath();
		ctx.moveTo(chartX, cursor.y + chartHeight);
		const logMax = Math.max(currentMaxHeight, 0);
		for (let i = 0; i < chart.length; i++) {
			const peak = (chart[i] / logMax) * chartHeight;
			const x = chartX + i * spacing;
			const y = cursor.y + chartHeight - peak;

			ctx.lineTo(x, y);
		}
		ctx.lineTo(chartX + (chart.length - 1) * spacing, cursor.y + chartHeight);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();

		ctx.restore();

		// Draw the reference line
		if (currentMaxHeight > info.reference) {
			const referenceHeight = info.reference / currentMaxHeight * chartHeight;
            ctx.strokeStyle = "#05c46b";
            ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.moveTo(chartX, cursor.y + chartHeight - referenceHeight);
			ctx.lineTo(chartX + chartWidth, cursor.y + chartHeight - referenceHeight);
			ctx.stroke();
		}

		cursor.y += chartHeight;
	}

	function renderBackground(ctx: CanvasRenderingContext2D, cursor: Vector2) {
		ctx.fillStyle = Theme.containerBackground;
		ctx.strokeStyle = Theme.containerBorder;
		ctx.lineWidth = 1;

		ctx.save();
		ctx.beginPath();
		ctx.shadowColor = Theme.containerShadow;
		ctx.shadowBlur = 25;
		ctx.roundRect(MARGIN, MARGIN, WIDTH + MARGIN + PADDING * 2, cursor.y - RADIUS, RADIUS);
		ctx.fill();
		ctx.stroke();
		ctx.restore();
	}

	export function render(ctx: CanvasRenderingContext2D) {
		ctx.save();

		const chart = processChart();
		const cursor = Vector2.zero;

		renderMetrics(ctx, chart, cursor);
		renderChart(ctx, chart, cursor);

		ctx.globalCompositeOperation = "destination-over";
		renderBackground(ctx, cursor);

		ctx.restore();
	}
	// #endregion

}