performance.getUsedMemory = function () {
	return new Promise((resolve, _) => {
		if ("measureUserAgentSpecificMemory" in performance) {
			this.measureUserAgentSpecificMemory()
				.then(memory => resolve(memory.bytes))
				.catch(() => resolve(NaN));
		} else if ("memory" in performance) {
			resolve(this.memory.usedJSHeapSize);
		} else {
			resolve(NaN);
		}
	});
}