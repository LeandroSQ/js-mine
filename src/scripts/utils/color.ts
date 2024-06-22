export type RGBA = {
	r: number;
	g: number;
	b: number;
	a: number;
};

export abstract class Color {

	public static decode(color: string, normalize = false): RGBA {
		if (color.startsWith("rgba")) {
			const [r, g, b, a] = color.slice(5, -1).split(",").map(p => parseFloat(p));

			return { r, g, b, a };
		} else if (color.startsWith("rgb")) {
			const [r, g, b] = color.slice(4, -1).split(",").map(p => parseInt(p));

			return { r, g, b, a: 1.0 };
		} else {
			let tmp = color;
			if (tmp.startsWith("#")) tmp = tmp.slice(1);

			// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
			if (tmp.length === 3) tmp = tmp.replace(/./g, "$&$&");

			const r = parseInt(tmp.slice(0, 2), 16);
			const g = parseInt(tmp.slice(2, 4), 16);
			const b = parseInt(tmp.slice(4, 6), 16);

			if (normalize) {
				return {
					r: r / 255,
					g: g / 255,
					b: b / 255,
					a: 1.0
				};
			}

			return { r, g, b, a: 1.0 };
		}
	}

	public static mix(colorA: string, colorB: string, mix: number): string {
		const c1 = this.decode(colorA);
		const c2 = this.decode(colorB);

		const r = Math.floor(c1.r + (c2.r - c1.r) * mix);
		const g = Math.floor(c1.g + (c2.g - c1.g) * mix);
		const b = Math.floor(c1.b + (c2.b - c1.b) * mix);
		const a = c1.a + (c2.a - c1.a) * mix;

		return `rgba(${r},${g},${b},${Math.clamp(Math.abs(a), 0.0, 1.0)})`;
	}

	public static alpha(color: string, alpha: number): string {
		let c = color;

		if (c.startsWith("rgba")) {
			const parts = c.slice(5, -1).split(",");
			parts[3] = `${alpha}`;
			return `rgba(${parts.join(",")})`;
		}

		// Removes the # if present
		if (c.startsWith("#")) c = c.slice(1);

		// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		if (c.length === 3) c = c.replace(/./g, "$&$&");

		const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, "0");

		return `#${c}${alphaHex}`;
	}

	public static interpolate(current: string, target: string, step: number): string {
		if (current.startsWith("rgba")) {
			const currentParts = current.slice(5, -1).split(",").map(p => parseInt(p));
			const targetParts = target.slice(5, -1).split(",").map(p => parseInt(p));

			const r = Math.round(currentParts[0] + (targetParts[0] - currentParts[0]) * step);
			const g = Math.round(currentParts[1] + (targetParts[1] - currentParts[1]) * step);
			const b = Math.round(currentParts[2] + (targetParts[2] - currentParts[2]) * step);
			const a = currentParts[3] + (targetParts[3] - currentParts[3]) * step;

			return `rgba(${r},${g},${b},${a})`;
		}

		// Remove the # if present
		let tmpCurrent = `0x${current.trim().slice(1)}`;
		let tmpTarget = `0x${target.trim().slice(1)}`;

		// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		if (tmpCurrent.length < 5) tmpCurrent = tmpCurrent.replace(/./g, "$&$&");
		if (tmpTarget.length < 5) tmpTarget = tmpTarget.replace(/./g, "$&$&");

		// Convert to integer
		const currentColor = parseInt(tmpCurrent, 16);
		const targetColor = parseInt(tmpTarget, 16);

		// Decode the color channels
		const r1 = currentColor >> 16;
		const g1 = (currentColor >> 8) & 255;
		const b1 = currentColor & 255;

		const r2 = targetColor >> 16;
		const g2 = (targetColor >> 8) & 255;
		const b2 = targetColor & 255;

		// Interpolate
		const r = Math.round(r1 + (r2 - r1) * step);
		const g = Math.round(g1 + (g2 - g1) * step);
		const b = Math.round(b1 + (b2 - b1) * step);

		// Encode back to hex
		const hex = `#${(0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

		return hex;
	}

	public static isColorLight(hex: string): boolean {
		// Remove the # if present
		let tmp = `0x${hex.trim().slice(1)}`;

		// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		if (tmp.length < 5) tmp = tmp.replace(/./g, "$&$&");

		// Convert to integer
		const color = parseInt(tmp, 16);

		// Decode the color channels
		const r = color >> 16;
		const g = (color >> 8) & 255;
		const b = color & 255;

		// HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
		const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

		return hsp > 127.5;
	}

}