import { FONT_SIZE, GUI_MARGIN } from "../constants";
import { Key } from "../enums/key";
import { TextAlign } from "../enums/text-align";
import { InputHandler } from "../input/input-handler";
import { KeyboardInput } from "../input/keyboard";
import { MouseInput } from "../input/mouse";
import { Interpreter } from "./interpreter";

export namespace Terminal {

	enum Colors {
		Green = "rgb(172,205,112)",
		Yellow = "rgb(229,196,148)",
		Blue = "rgb(154, 158, 200)",
		White = "rgb(189, 194, 237)",
		Gray = "rgb(98, 105, 147)",
		Red = "rgb(191, 97, 106)"
	}

	type ScrollbackEntry = {
		text: string;
		color: string;
	};

	const lineHeight = FONT_SIZE * 1.5;
	const height = lineHeight * 20;
	const maxLines = 1000;

	const scrollback: ScrollbackEntry[] = [];
	let scrollY = 0;

	let currentLine = "";
	let cursor = 0, cursorEnd = 0;

	let currentY = -height;
	let targetY = -height;
	let visible = false;

	function prepareScope() {
		return {
			print: (text: string) => {
				log(text);
			},
			clear: () => {
				scrollback.length = 0;
			}
		};
	}

	function log(text: any, color = "white") {
		if (text === undefined) return;

		if (typeof text === "object") {
			// If an object, pretty print it
			const lines = JSON.stringify(text, null, 2).split("\n");
			lines.forEach(line => log(line, Colors.Blue));
		} else {
			const lines = text.toString().split("\n");
			lines.forEach(line => {
				if (line.length > 0) {
					scrollback.push({ text: line, color });
					if (scrollback.length > maxLines) scrollback.shift();
					scrollY = scrollback.length;
				}
			});
		}


		/* if ((scrollback.length + 2) * lineHeight + GUI_MARGIN * 2 >= height) {
			scrollback.shift();
		} */
	}

	function onInput(text: string, selectionStart: number, selectionEnd: number) {
		if (KeyboardInput.isKeyDown(Key.Enter) && text.trim().length > 0) {
			KeyboardInput.clearInput();

			// Add it to scrollback
			log(`:> ${text}`, Colors.Gray);

			// Evaluate
			Interpreter.evaluate(text, prepareScope())
				.then(result => log(result, Colors.Green))
				.catch(error => log(error, Colors.Red));

			// Reset
			currentLine = "";
			cursor = 0;
			cursorEnd = 0;
		} else if (KeyboardInput.isKeyDown(Key.Escape)) {
			// Dismiss the terminal
			KeyboardInput.clearInput();
			toggle(false);
		} else if (KeyboardInput.isKeyDown(Key.ArrowUp)) {
			// Previous command
			const previous = scrollback.findLast(entry => entry.text.startsWith(":> "));
			if (previous) {
				currentLine = previous.text.slice(3);
				cursor = currentLine.length;
				cursorEnd = cursor;
				KeyboardInput.setInput(currentLine, cursor, cursorEnd);
			}
		} else {
			// Regular input, update the current line
			currentLine = text;
			cursor = selectionStart;
			cursorEnd = selectionEnd;
		}
	}

	function toggle(show: boolean) {
		if (show) {
			targetY = 0;
			KeyboardInput.startCapture(onInput.bind(this));
			visible = true;
		} else {
			targetY = -height;
			KeyboardInput.releaseCapture();
			visible = false;
		}

	}

	export function isVisible() {
		return visible;
	}

	export function update(deltaTime: number) {
		if (InputHandler.isTogglingTerminal() && !visible) toggle(true)

		// Handle scrolling
		if (visible) {
			scrollY += MouseInput.mouseWheelDelta * 0.1;
			scrollY = Math.clamp(scrollY, 0, scrollback.length);
		}

		currentY = Math.lerp(currentY, targetY, 10 * deltaTime);
	}

	export function render(ctx: CanvasRenderingContext2D) {
		if (Math.floor(currentY) <= -height) return;

		const progress = 1.0 - Math.min(1, Math.abs(currentY) / height);

		ctx.save();
		ctx.translate(0, currentY);
		ctx.fillStyle = `rgba(22, 24, 31, ${0.75 * progress})`;
		ctx.shadowBlur = 20;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 2;
		ctx.shadowColor = `rgba(0, 0, 0, ${0.25 * progress})`;
		ctx.beginPath();
		ctx.roundRect(0, 0, ctx.canvas.width, height, [0, 0, 15, 15]);
		ctx.fill();

		let y = GUI_MARGIN;

		// Title
		ctx.fillStyle = Colors.Green;
		ctx.font = `${FONT_SIZE}px monospace`;
		ctx.textBaseline = "top";
		ctx.textAlign = "left";
		ctx.fillTextAligned("- Debug terminal -", ctx.canvas.width / 2, y, TextAlign.Center);
		y += lineHeight;

		// Scrollback
		const maxVisibleLines = Math.floor((height - y - GUI_MARGIN - lineHeight) / lineHeight);
		const startIndex = Math.floor(Math.max(Math.min(scrollY, scrollback.length - maxVisibleLines), 0));
		const endIndex = Math.min(scrollback.length, startIndex + maxVisibleLines);
		for (let i = startIndex; i < endIndex; i++) {
			const entry = scrollback[i];

			ctx.fillStyle = entry.color;
			ctx.fillText(entry.text, GUI_MARGIN, y);
			// TODO: Text wrapping
			y += lineHeight;
		}

		// Scrollbar
		if (scrollback.length > maxVisibleLines) {
			const scrollbarHeight = Math.max(20, maxLines / scrollback.length * (height - y - GUI_MARGIN));
			const scrollbarY = Math.lerp(GUI_MARGIN, height - GUI_MARGIN - scrollbarHeight, scrollY / scrollback.length);
			ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
			ctx.beginPath();
			ctx.roundRect(ctx.canvas.width - GUI_MARGIN, scrollbarY, GUI_MARGIN / 2, scrollbarHeight, 10);
			ctx.fill();
		}

		// Current line
		y = height - GUI_MARGIN - lineHeight;
		ctx.fillStyle = Colors.White;
		ctx.fillText(">", GUI_MARGIN, y);
		ctx.fillText(currentLine, GUI_MARGIN + FONT_SIZE, y);

		// Cursor
		const cursorX = GUI_MARGIN + FONT_SIZE + ctx.measureText(currentLine.slice(0, cursor)).width;
		if (cursorEnd > cursor) {
			ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
			ctx.fillRect(cursorX, y, ctx.measureText(currentLine.slice(cursor, cursorEnd)).width, FONT_SIZE);
		} else if ((Date.now() / 1000) % 0.5 > 0.25) {
			ctx.fillRect(cursorX, y - FONT_SIZE * 0.15, 2.5, FONT_SIZE);
		}

		ctx.restore();
	}

}