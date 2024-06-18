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