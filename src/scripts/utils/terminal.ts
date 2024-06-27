import { FONT_SIZE, GUI_MARGIN } from "../constants";
import { Key } from "../enums/key";
import { TextAlign } from "../enums/text-align";
import { InputHandler } from "../input/input-handler";
import { KeyboardInput } from "../input/keyboard";

export namespace Terminal {

	const lineHeight = FONT_SIZE * 1.5;
	const height = lineHeight * 20;

	const scrollback: string[] = [];
	let currentLine = "";
	let cursor = 0;

	let currentY = -height;
	let targetY = -height;
	let visible = false;

	function onKeyPress(event: KeyboardEvent) {
		event.preventDefault();

		switch (event.code) {
			case Key.ArrowLeft:
				cursor = Math.max(0, cursor - 1);
				break;
			case Key.ArrowRight:
				cursor = Math.min(currentLine.length, cursor + 1);
				break;
			case Key.Enter:
				scrollback.push(currentLine);
				currentLine = "";
				cursor = 0;

				if (scrollback.length >= (height - GUI_MARGIN * 2 - FONT_SIZE) / lineHeight) {
					scrollback.shift();
				}
				break;
			case Key.Backspace:
				console.log(event);
				if (cursor > 0) {
					currentLine = currentLine.slice(0, cursor - 1) + currentLine.slice(cursor);
					console.log(currentLine, cursor, currentLine[cursor - 1]);
					cursor--;
				}
				break;
			case Key.V:
				if (event.ctrlKey) {
					navigator.clipboard.readText().then(text => {
						currentLine += text;
						cursor += text.length;
					});
				} else {
					currentLine += event.key;
					cursor++;
				}
				break;
			case Key.C:
				if (event.ctrlKey) {
					// TODO: Handle selection + copy
				} else {
					currentLine += event.key;
					cursor++;
				}
				break;
			default:
				currentLine += event.key;
				cursor++;
				break;
		}
	}

	export function isVisible() {
		return visible;
	}

	export function update(deltaTime: number) {
		if (InputHandler.isTogglingTerminal()) {
			if (visible) {
				targetY = -height;
				KeyboardInput.releaseCapture();
				visible = false;
			} else {
				targetY = 0;
				KeyboardInput.startCapture(onKeyPress);
				visible = true;
			}
		}

		currentY = Math.lerp(currentY, targetY, 10 * deltaTime);
	}

	export function render(ctx: CanvasRenderingContext2D) {
		if (Math.floor(currentY) <= -height) return;

		const progress = 1.0 - Math.min(1, Math.abs(currentY) / height);

		ctx.save();
		ctx.translate(0, currentY);
		ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * progress})`;
		ctx.shadowBlur = 10;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 10;
		ctx.shadowColor = `rgba(0, 0, 0, ${0.5 * progress})`;
		ctx.fillRect(0, 0, ctx.canvas.width, height);

		let y = GUI_MARGIN;

		// Title
		ctx.fillStyle = "white";
		ctx.font = `${FONT_SIZE}px monospace`;
		ctx.textBaseline = "top";
		ctx.textAlign = "left";
		ctx.fillTextAligned("- Debug terminal -", ctx.canvas.width / 2, y, TextAlign.Center);
		y += lineHeight;

		// Scrollback
		for (let i = 0; i < scrollback.length; i++) {
			ctx.fillText(scrollback[i], GUI_MARGIN, y);
			y += lineHeight;
		}

		// Current line
		ctx.fillText(">", GUI_MARGIN, y);
		ctx.fillText(currentLine, GUI_MARGIN + FONT_SIZE, y);

		// Cursor
		if ((Date.now() / 1000) % 1 > 0.5) {
			const cursorX = GUI_MARGIN + FONT_SIZE + ctx.measureText(currentLine.slice(0, cursor)).width;
			ctx.fillRect(cursorX, y, 1, FONT_SIZE);
		}


		ctx.restore();
	}

}