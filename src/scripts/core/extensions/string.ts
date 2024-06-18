String.prototype.toCamelCase = function () {
	return this.replace("--", "")
		.replace(/-./g, (x) => x[1].toUpperCase())
		.trim();
};