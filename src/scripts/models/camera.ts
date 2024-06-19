import { mat4, vec3 as Vector3 } from "gl-matrix";
import { Size } from "../types/size";

export class Camera {

	public position: Vector3;
	public rotation: Vector3;
	public fov = 45 * Math.PI / 180;
	public near = 0.1;
	public far = 1000.0;

	constructor() {
		this.position = Vector3.create();
		this.rotation = Vector3.create();
	}

	public getViewMatrix() {
		const viewMatrix = mat4.create();
		mat4.translate(viewMatrix, viewMatrix, this.position);
		mat4.rotateX(viewMatrix, viewMatrix, this.rotation[0]);
		mat4.rotateY(viewMatrix, viewMatrix, this.rotation[1]);
		mat4.rotateZ(viewMatrix, viewMatrix, this.rotation[2]);
		mat4.invert(viewMatrix, viewMatrix);

		return viewMatrix;
	}

	public getProjectionMatrix(screen: Size) {
		const aspectRatio = screen.width / screen.height;
		const projectionMatrix = mat4.create();
		mat4.perspective(projectionMatrix, this.fov, aspectRatio, this.near, this.far);

		return projectionMatrix;
	}

}