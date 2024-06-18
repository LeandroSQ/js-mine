

Math.clamp = function (value, min, max) {
	return Math.min(Math.max(value, min), max);
};

Math.average = function (...values) {
	return values.reduce((a, b) => a + b, 0) / values.length;
};

Math.distance = function (x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

Math.randomInt = function (min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

Math.lerp = function (a, b, t) {
	/* const diff = b - a;
	if (diff > t) return a + t;
	if (diff < -t) return a - t;

	return a + diff; */

	return a + (b - a) * t;
};

Math.oscilate = function (time, cyclesPerSecond, minAmplitude = 0.0, maxAmplitude = 1.0) {
	// Calculate the angular frequency (in radians per second)
	const angularFrequency = 2 * Math.PI * cyclesPerSecond;

	// Calculate the amplitude range
	const amplitudeRange = maxAmplitude - minAmplitude;

	// Calculate the sine wave value at the given time
	const sineValue = Math.sin(angularFrequency * time);

	// Scale the sine value to the amplitude range
	const scaledValue = (sineValue + 1) / 2; // Shift sine value to [0, 1] range
	const amplitude = minAmplitude + scaledValue * amplitudeRange;

	return amplitude;
};

Math.smoothstep = function (x, min = 0, max = 1) {
	// Scale, bias and saturate x to 0..1 range
	// eslint-disable-next-line no-param-reassign
	x = Math.clamp((x - min) / (max - min), 0, 1);

	// Evaluate polynomial
	return x * x * (3 - 2 * x);
};

Math.prettifyElapsedTime = function (ms) {
	const toFixed = (value, digits) => {
		if (value % 1 === 0) return Math.floor(value);
		else return value.toFixed(digits);
	};

	if (ms < 1) return `${Math.floor(ms * 1000)}μs`;
	if (ms < 1000) return `${toFixed(ms, 2)}ms`;
	if (ms < 60000) return `${toFixed((ms / 1000), 2)}s`;
	if (ms < 3600000) return `${toFixed((ms / 60000), 2)}m`;
	else return `${toFixed((ms / 3600000), 2)}h`;
};