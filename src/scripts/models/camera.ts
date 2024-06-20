import { mat4, vec3, vec3 as Vector3 } from "gl-matrix";
import { Size } from "../types/size";

export class Camera {

	public position: Vector3;

	// I know I could have used a Vector3 for rotation, but this makes the code more readable
	public pitch: number = 0.0;
	public yaw: number = 0.0;
	public roll: number = 0.0;

	public fov = 45 * Math.PI / 180;
	public near = 0.1;
	public far = 1000.0;

	constructor() {
		this.position = Vector3.create();
	}

	get forward() {
		const result = vec3.create();
		const yawRadians = Math.toRadians(this.yaw);
		const pitchRadians = Math.toRadians(this.pitch);
		const cosPitch = Math.cos(pitchRadians);
		result[0] = -Math.sin(yawRadians) * cosPitch;
		result[1] = Math.sin(pitchRadians);
		result[2] = -Math.cos(yawRadians) * cosPitch;

		return result;
	}

	get right() {
		const up = vec3.fromValues(0, 1, 0);
		const forward = this.forward;
		const result = vec3.create();
		vec3.cross(result, up, forward);
		vec3.normalize(result, result);

		return result;
	}

	public getViewMatrix() {
		const viewMatrix = mat4.create();
		mat4.translate(viewMatrix, viewMatrix, this.position);
		mat4.rotate(viewMatrix, viewMatrix, Math.toRadians(this.yaw), [0, 1, 0]);
		mat4.rotate(viewMatrix, viewMatrix, Math.toRadians(this.pitch), [1, 0, 0]);
		mat4.rotate(viewMatrix, viewMatrix, Math.toRadians(this.roll), [0, 0, 1]);
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