/* eslint-disable max-nested-callbacks */
Function.oneshot = function (predicate) {
	let fired = false;

	const wrapper = () => {
		if (fired) return;
		fired = true;

		predicate();
	};

	return wrapper;
};

Function.timeout = function (predicate, amount) {
	let fired = false;

	const wrapper = () => {
		if (fired) return;
		fired = true;

		setTimeout(() => {
			predicate();
			fired = false;
		}, amount);
	};

	return wrapper;
};

Function.debounce = function (predicate, amount) {
	let fired = false;

	const wrapper = () => {
		if (fired) return;
		fired = true;

		setTimeout(() => {
			predicate();
			fired = false;
		}, amount);
	};

	return wrapper;
};

Promise.delay = function (amount) {
	return new Promise((resolve, _) => {
		setTimeout(resolve, amount);
	});
};

Promise.sequential = function<T> (promises) {
	return promises.reduce((promise, next) => {
		return promise.then((result) => {
			return next.then((nextResult) => {
				result.push(nextResult as T);

				return result;
			});
		});
	}, Promise.resolve([]));
};