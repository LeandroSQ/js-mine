import { TextAlign } from "../../enums/text-align";
import FileSaver from 'file-saver';

HTMLCanvasElement.prototype.screenshot = function (filename = "download.png") {
	this.toBlob(blob => FileSaver.saveAs(blob, filename));
};

CanvasRenderingContext2D.prototype.clear = function () {
	this.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

CanvasRenderingContext2D.prototype.line = function (x1, y1, x2, y2) {
	this.beginPath();
	this.moveTo(x1, y1);
	this.lineTo(x2, y2);
	this.stroke();
};

CanvasRenderingContext2D.prototype.fillTextAligned = function (text, x, y, alignment) {
	const metrics = this.measureText(text);

	switch (alignment) {
		case TextAlign.Left:
			this.fillText(text, x, y);
			break;
		case TextAlign.Center:
			this.fillText(text, x - metrics.width / 2, y);
			break;
		case TextAlign.Right:
			this.fillText(text, x - metrics.width, y);
			break;
	}
};

CanvasRenderingContext2D.prototype.fillCircle = function (x, y, radius) {
	this.beginPath();
	this.arc(x, y, radius, 0, Math.PI * 2);
	this.fill();
};