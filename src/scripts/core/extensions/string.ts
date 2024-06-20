String.prototype.toCamelCase = function () {
	return this.replace("--", "")
		.replace(/-./g, (x) => x[1].toUpperCase())
		.trim();
};

String.prototype.insertAt = function (index, value) {
	return this.substr(0, index) + value + this.substr(index);
};