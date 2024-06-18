/* eslint-disable max-nested-callbacks */
window.addLoadEventListener = function (listener) {
	const callback = Function.oneshot(listener);

	window.addEventListener("DOMContentLoaded", callback);
	window.addEventListener("load", callback);
	document.addEventListener("load", callback);
	window.addEventListener("ready", callback);
	setTimeout(callback, 1000);
};

window.addVisibilityChangeEventListener = function (listener) {
	const prefixes = ["webkit", "moz", "ms", ""];

	const callback = Function.debounce(() => {
		listener(!window.isDocumentHidden());
	}, 50);

	prefixes.forEach(prefix => {
		document.addEventListener(`${prefix}visibilitychange`, callback);
	});
	document.onvisibilitychange = callback;
};

window.isMobile = function () {
	return window.matchMedia("(any-pointer: coarse)").matches;
};

window.isDocumentHidden = function () {
	const prefixes = ["webkit", "moz", "ms", ""];

	return prefixes
		.map((x) => (x && x.length > 0 ? `${x}Hidden` : "hidden"))
		.map((x) => document[x]).reduce((a, b) => a || b, false);
};

window.getRefreshRate = function () {
	return new Promise((resolve, _) => {
		const knownRefreshRates = [60, 75, 100, 120, 144, 165, 240, 360];

		setTimeout(() => {
			requestAnimationFrame(start => {
				requestAnimationFrame(end => {
					const elapsed = end - start;
					const rate = 1000 / elapsed;

					// Get the closest known refresh rate
					const closest = knownRefreshRates.reduce((a, b) => Math.abs(b - rate) < Math.abs(a - rate) ? b : a);

					resolve(closest);
				});
			});
		}, 10);
	});
};