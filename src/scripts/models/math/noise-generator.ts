import { SETTINGS } from './../../settings';
import { createNoise2D, NoiseFunction2D } from 'simplex-noise';
import Alea from 'alea';

export class NoiseGenerator {

	private generators: NoiseFunction2D[];

	constructor(seed: string, octaves: number, private scale: number, private min: number, private max: number) {
		this.generators = [];
		for (let i = 0; i < octaves; i++) {
			this.generators.push(createNoise2D(Alea(SETTINGS.TERRAIN_GENERATION_SEED + seed + i)));
		}
	}

	public get(x: number, z: number) {
		// The more generators we have, the more detailed higher frequency noise we get
		// Apply weights to the noise, each octave is half the amplitude of the previous one
		let result = 0;
		let amplitude = 1;
		let frequency = 1;
		let maxAmplitude = 0;
		for (const generator of this.generators) {
			result += generator(x / this.scale * frequency, z / this.scale * frequency) * amplitude;
			maxAmplitude += amplitude;
			amplitude /= 2;
			frequency *= 2;
		}

		// Normalize the result
		result = (result / maxAmplitude + 1) / 2;
		return result * (this.max - this.min) + this.min;
	}
}