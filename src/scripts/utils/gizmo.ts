import { Vector2 } from "../models/vector2";
import { Rectangle } from "../models/rectangle";
import { Color } from "./color";
import { GamepadInputState } from "../types/input-state";
import { Dictionary } from "../types/dictionary";
import { GamepadAxis } from "../enums/gamepad-axis";
import { GamepadButton } from "../enums/gamepad-button";
import { TextAlign } from "../enums/text-align";

interface IGizmo {

	render(ctx: CanvasRenderingContext2D);

}

class StrokeRectangleGizmo implements IGizmo {

	constructor(private rect: Rectangle, private color: string, private thickness: number) { }

	public render(ctx: CanvasRenderingContext2D) {
		ctx.strokeStyle = this.color;
		ctx.lineWidth = this.thickness;
		ctx.strokeRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
	}

}

class RectangleGizmo implements IGizmo {

	constructor(private rect: Rectangle, private color: string) { }

	public render(ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
	}

}

class LineGizmo implements IGizmo {

	constructor(private start: Vector2, private end: Vector2, private color: string, private thickness: number) { }

	public render(ctx: CanvasRenderingContext2D) {
		ctx.strokeStyle = this.color;
		ctx.lineWidth = this.thickness;

		ctx.beginPath();
		ctx.moveTo(this.start.x, this.start.y);
		ctx.lineTo(this.end.x, this.end.y);
		ctx.stroke();
	}

}

class CircleGizmo implements IGizmo {

	constructor(private center: Vector2, private radius: number, private color: string, private fill: boolean) { }

	public render(ctx: CanvasRenderingContext2D) {
		if (this.fill) ctx.fillStyle = this.color;
		else ctx.strokeStyle = this.color;
		ctx.lineWidth = 1;

		ctx.beginPath();
		ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2);
		if (this.fill) ctx.fill();
		else ctx.stroke();
	}

}

class TextGizmo implements IGizmo {

	constructor(private text: string, private position: Vector2, private color: string, private alignment: CanvasTextAlign) { }

	public render(ctx: CanvasRenderingContext2D) {
		ctx.save();
		ctx.fillStyle = this.color;
		ctx.font = "12px Arial";
		ctx.textAlign = this.alignment;
		ctx.fillText(this.text, this.position.x, this.position.y);
		ctx.restore();
	}

}

class VectorGizmo implements IGizmo {

	private readonly ARROWHEAD_LENGTH = 10;
	private readonly ARROWHEAD_ANGLE = Math.PI / 6;
	private readonly MIN_LENGTH = 1;
	private readonly MAX_LENGTH = 100;

	constructor(private origin: Vector2, private vector: Vector2, private color: string) { }

	// eslint-disable-next-line max-statements
	public render(ctx: CanvasRenderingContext2D) {
		let length = this.vector.length;

		// If vector is zero, don't draw anything
		if (length < this.MIN_LENGTH) return;

		// Clamp vector length to 100
		if (length > this.MAX_LENGTH) {
			this.vector = this.vector.normalize().multiply(this.MAX_LENGTH);
			length = this.MAX_LENGTH;
		}

		// Calculate opacity 0-1 based on vector length
		const opacity = (length - this.MIN_LENGTH) / (this.MAX_LENGTH - this.MIN_LENGTH);
		const color = Color.alpha(this.color, opacity);

		// Draw line
		ctx.fillStyle = color;
		ctx.strokeStyle = color;
		ctx.lineWidth = 1.5;
		ctx.lineCap = "round";

		ctx.beginPath();
		ctx.moveTo(this.origin.x, this.origin.y);
		ctx.lineTo(this.origin.x + this.vector.x, this.origin.y + this.vector.y);
		ctx.stroke();

		// Draw arrowhead
		const arrowheadLength = 10;
		const arrowheadAngle = Math.PI / 6;

		const angle = Math.atan2(this.vector.y, this.vector.x);

		ctx.beginPath();
		ctx.moveTo(this.origin.x + this.vector.x, this.origin.y + this.vector.y);
		ctx.lineTo(this.origin.x + this.vector.x - arrowheadLength * Math.cos(angle - arrowheadAngle), this.origin.y + this.vector.y - arrowheadLength * Math.sin(angle - arrowheadAngle));
		ctx.lineTo(this.origin.x + this.vector.x - arrowheadLength * Math.cos(angle + arrowheadAngle), this.origin.y + this.vector.y - arrowheadLength * Math.sin(angle + arrowheadAngle));
		ctx.lineTo(this.origin.x + this.vector.x, this.origin.y + this.vector.y);
		ctx.fill();
	}

}

class GamepadGizmo implements IGizmo {

	private static readonly scale = 1.0;
	private static readonly width = 200 * GamepadGizmo.scale;
	private static readonly height = 100 * GamepadGizmo.scale;
	private static readonly color = "rgba(52, 73, 94, 0.5)"//"rgba(255, 255, 255, 0.1)" as const;
	private static readonly buttonColor = "rgba(255, 255, 255, 0.5)" as const;
	private static readonly activeColor = "rgba(52, 152, 219, 0.85)";
	private static readonly textColor = "rgba(255, 255, 255, 0.75)";
	private static readonly outerRadius = 20 * GamepadGizmo.scale;
	private static readonly innerRadius = 10 * GamepadGizmo.scale;
	private static readonly buttonSize = 10 * GamepadGizmo.scale;

	constructor(
		private position: Vector2,
		private buttons: Dictionary<GamepadInputState>,
		private axes: Dictionary<number>
	) {
		// Center the gamepad
		this.position = this.position.subtract(new Vector2(GamepadGizmo.width / 2, GamepadGizmo.height / 2));

	}

	private getColor(button: GamepadButton): string {
		return this.buttons[button].active ? GamepadGizmo.activeColor : GamepadGizmo.buttonColor;
	}

	private getTextColor(button: GamepadButton): string {
		return this.buttons[button].active ? GamepadGizmo.textColor : GamepadGizmo.color;
	}

	private renderAnalogStick(ctx: CanvasRenderingContext2D, offset: Vector2, button: GamepadButton, axisX: GamepadAxis, axisY: GamepadAxis) {
		const radius = GamepadGizmo.outerRadius;

		// Outer
		ctx.fillStyle = GamepadGizmo.color;
		ctx.fillCircle(offset.x, offset.y, radius);

		// Inner
		ctx.fillStyle = this.getColor(button);
		ctx.fillCircle(offset.x + this.axes[axisX] * radius, offset.y + this.axes[axisY] * radius, GamepadGizmo.innerRadius);
	}

	private renderDpad(ctx: CanvasRenderingContext2D, offset: Vector2) {
		const radius = GamepadGizmo.buttonSize;

		// Background
		ctx.fillStyle = GamepadGizmo.color;
		ctx.fillCircle(offset.x + radius, offset.y + radius / 2, radius * 2);

		// Left
		ctx.fillStyle = this.getColor(GamepadButton.Left);
		ctx.beginPath();
		ctx.roundRect(offset.x - radius / 2, offset.y, radius, radius, [radius / 4, 0, 0, radius / 4]);
		ctx.fill();

		// Right
		ctx.fillStyle = this.getColor(GamepadButton.Right);
		ctx.beginPath();
		ctx.roundRect(offset.x + radius * 1.5, offset.y, radius, radius, [0, radius / 4, radius / 4, 0]);
		ctx.fill();

		// Up
		ctx.fillStyle = this.getColor(GamepadButton.Up);
		ctx.beginPath();
		ctx.roundRect(offset.x + radius / 2, offset.y - radius, radius, radius, [radius / 4, radius / 4, 0, 0]);
		ctx.fill();

		// Down
		ctx.fillStyle = this.getColor(GamepadButton.Down);
		ctx.beginPath();
		ctx.roundRect(offset.x + radius / 2, offset.y + radius, radius, radius, [0, 0, radius / 4, radius / 4]);
		ctx.fill();

		// Center
		ctx.fillStyle = GamepadGizmo.buttonColor;
		ctx.fillRect(offset.x + radius / 2, offset.y, radius, radius);
	}

	private renderButtons(ctx: CanvasRenderingContext2D, offset: Vector2) {
		const radius = GamepadGizmo.buttonSize * 1.25;

		ctx.font = `${radius / 2}px Arial`;

		// Background
		ctx.fillStyle = GamepadGizmo.color;
		ctx.fillCircle(offset.x - radius, offset.y + radius / 2, radius * 1.75);

		// Y - top
		ctx.fillStyle = this.getColor(GamepadButton.Y);
		ctx.fillCircle(offset.x - radius, offset.y - radius / 2, radius / 2);
		ctx.fillStyle = this.getTextColor(GamepadButton.Y);
		ctx.fillTextAligned("Y", offset.x - radius, offset.y - radius * 0.75, TextAlign.Center);

		 // X - left
		ctx.fillStyle = this.getColor(GamepadButton.X);
		ctx.fillCircle(offset.x - radius * 2, offset.y + radius / 2, radius / 2);
		ctx.fillStyle = this.getTextColor(GamepadButton.X);
		ctx.fillTextAligned("X", offset.x - radius * 2, offset.y + radius * 0.25, TextAlign.Center);

		// A - bottom
		ctx.fillStyle = this.getColor(GamepadButton.A);
		ctx.fillCircle(offset.x - radius, offset.y + radius * 1.5, radius / 2);
		ctx.fillStyle = this.getTextColor(GamepadButton.A);
		ctx.fillTextAligned("A", offset.x - radius, offset.y + radius * 1.25, TextAlign.Center);

		// B - right
		ctx.fillStyle = this.getColor(GamepadButton.B);
		ctx.fillCircle(offset.x, offset.y + radius / 2, radius / 2);
		ctx.fillStyle = this.getTextColor(GamepadButton.B);
		ctx.fillTextAligned("B", offset.x, offset.y + radius * 0.25, TextAlign.Center);
	}

	private renderBumpersAndTriggers(ctx: CanvasRenderingContext2D, offset: Vector2, bumper: GamepadButton, trigger: GamepadButton) {
		const radius = GamepadGizmo.buttonSize;

		// Bumper
		ctx.fillStyle = this.getColor(bumper);
		ctx.beginPath();
		ctx.roundRect(offset.x, offset.y - radius / 1.5, radius * 3, radius / 1.5, [radius / 4, radius / 4, 0, 0]);
		ctx.fill();
		/* ctx.fillStyle = GamepadGizmo.textColor;
		ctx.fillTextAligned(bumper === GamepadButton.LB ? "LB" : "RB", offset.x + radius * 1.5, offset.y - radius * 0.5, TextAlign.Center); */

		// Trigger
		let value = Math.abs(this.buttons[trigger].value ?? 0);
		ctx.fillStyle = Color.mix(GamepadGizmo.color, GamepadGizmo.activeColor, value);
		value = 1.0 - value * 0.75;
		ctx.beginPath();
		ctx.roundRect(offset.x + radius / 1.5, offset.y - 2.5 - radius / 2 - (radius * value), radius * 1.5, radius * 1 * value, [radius / 4, radius / 4, 0, 0]);
		ctx.fill();
		/* ctx.fillStyle = GamepadGizmo.textColor;
		ctx.fillTextAligned(trigger === GamepadButton.LT ? "LT" : "RT", offset.x + radius * 1.5, offset.y - 2.5 - radius * 1.25, TextAlign.Center); */
	}

	private renderExtraButtons(ctx: CanvasRenderingContext2D, offset: Vector2) {
		const radius = GamepadGizmo.buttonSize;

		// Start
		ctx.fillStyle = this.getColor(GamepadButton.Back);
		ctx.fillCircle(offset.x - radius * 2, offset.y - radius / 2, radius / 2);

		// Select
		ctx.fillStyle = this.getColor(GamepadButton.Home);
		ctx.fillCircle(offset.x, offset.y, radius / 2);

		// Home
		ctx.fillStyle = this.getColor(GamepadButton.Start);
		ctx.fillCircle(offset.x + radius * 2, offset.y - radius / 2, radius / 2);
	}

	private renderBackground(ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = GamepadGizmo.color;
		ctx.beginPath();

		// Main body
		ctx.roundRect(this.position.x, this.position.y, GamepadGizmo.width, GamepadGizmo.height - GamepadGizmo.outerRadius / 2.5, [GamepadGizmo.outerRadius, GamepadGizmo.outerRadius, 0]);

		// Left handle
		ctx.save();
		const w = GamepadGizmo.outerRadius * 3;
		const h = GamepadGizmo.outerRadius * 4;
		let posX = this.position.x;
		let posY = this.position.y + GamepadGizmo.height - GamepadGizmo.outerRadius * 3;
		ctx.roundRect(posX, posY, w, h, [GamepadGizmo.outerRadius * 2, 0, GamepadGizmo.outerRadius * 8, GamepadGizmo.outerRadius * 8]);
		ctx.restore();

		// Right handle
		ctx.save();
		posX = this.position.x + GamepadGizmo.width - w;
		posY = this.position.y + GamepadGizmo.height - GamepadGizmo.outerRadius * 3;
		ctx.roundRect(posX, posY, w, h, [0, GamepadGizmo.outerRadius * 2, GamepadGizmo.outerRadius * 8, GamepadGizmo.outerRadius * 8]);
		ctx.restore();

		ctx.fill();
	}

	render(ctx: CanvasRenderingContext2D) {
		// Background
		this.renderBackground(ctx);

		this.renderAnalogStick(
			ctx,
			new Vector2(
				this.position.x + GamepadGizmo.width / 3,
				this.position.y + GamepadGizmo.height - GamepadGizmo.outerRadius - GamepadGizmo.buttonSize
			),
			GamepadButton.LS,
			GamepadAxis.LeftStickX,
			GamepadAxis.LeftStickY
		);
		this.renderAnalogStick(
			ctx,
			new Vector2(
				this.position.x + GamepadGizmo.width - GamepadGizmo.width / 3,
				this.position.y + GamepadGizmo.height - GamepadGizmo.outerRadius - GamepadGizmo.buttonSize
			),
			GamepadButton.RS,
			GamepadAxis.RightStickX,
			GamepadAxis.RightStickY
		);
		this.renderDpad(
			ctx,
			new Vector2(this.position.x + GamepadGizmo.buttonSize * 2, this.position.y + GamepadGizmo.buttonSize * 2.5)
		);
		this.renderButtons(
			ctx,
			new Vector2(this.position.x + GamepadGizmo.width - GamepadGizmo.buttonSize * 2, this.position.y + GamepadGizmo.buttonSize * 2.5)
		);

		this.renderBumpersAndTriggers(
			ctx,
			new Vector2(
				this.position.x + GamepadGizmo.outerRadius,
				this.position.y
			),
			GamepadButton.LB,
			GamepadButton.LT
		);
		this.renderBumpersAndTriggers(
			ctx,
			new Vector2(
				this.position.x + GamepadGizmo.width - GamepadGizmo.outerRadius - GamepadGizmo.buttonSize * 3,
				this.position.y
			),
			GamepadButton.RB,
			GamepadButton.RT
		);
		this.renderExtraButtons(
			ctx,
			new Vector2(
				this.position.x + GamepadGizmo.width / 2,
				this.position.y + GamepadGizmo.height / 2 - GamepadGizmo.buttonSize * 2
			)
		);
	}

}

export abstract class Gizmo {

	private static list: Array<IGizmo> = [];

	static render(ctx: CanvasRenderingContext2D) {
		if (!DEBUG) return;

		ctx.save();
		for (const gizmo of this.list) gizmo.render(ctx);
		ctx.restore();
	}

	static clear() {
		if (!DEBUG) return;

		this.list = [];
	}

	static rect(rect: Rectangle, color = "#fff") {
		if (!DEBUG) return;

		this.list.push(new RectangleGizmo(rect, color));
	}

	static outline(rect: Rectangle, color = "#fff", thickness = 1) {
		if (!DEBUG) return;

		this.list.push(new StrokeRectangleGizmo(rect, color, thickness));
	}

	static line(start: Vector2, end: Vector2, color = "#fff", thickness = 1) {
		if (!DEBUG) return;

		this.list.push(new LineGizmo(start, end, color, thickness));
	}

	static circle(center: Vector2, radius: number, color = "#fff", fill = true) {
		if (!DEBUG) return;

		this.list.push(new CircleGizmo(center, radius, color, fill));
	}

	static text(text: string, position: Vector2, color = "#fff", alignment: CanvasTextAlign = "left") {
		if (!DEBUG) return;

		this.list.push(new TextGizmo(text, position, color, alignment));
	}

	static arrow(origin: Vector2, vector: Vector2, color = "#fff") {
		if (!DEBUG) return;

		this.list.push(new VectorGizmo(origin, vector, color));
	}

	static gamepad(position: Vector2, buttons: Dictionary<GamepadInputState>, axes: Dictionary<number>) {
		if (!DEBUG) return;

		this.list.push(new GamepadGizmo(position, buttons, axes));
	}

}