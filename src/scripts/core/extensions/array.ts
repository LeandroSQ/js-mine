Array.prototype.remove = function (item) {
	const index = this.indexOf(item);
	if (index != -1) {
		this.splice(index, 1);

		return true;
	}

	return false;
};

Array.prototype.appendArray = function (array) {
	if (!array) return;

	for (let i = 0; i < array.length; i++) {
		this.push(array[i]);
	}
};

Array.prototype.shuffle = function () {
	for (let i = this.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[this[i], this[j]] = [this[j], this[i]];
	}
};