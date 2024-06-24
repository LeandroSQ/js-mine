import { mat4, vec4, vec3 } from "gl-matrix";
import { Size } from "../types/size";
import { Vector2 } from "./vector2";
import { CHUNK_HEIGHT, CHUNK_SIZE } from "../constants";
import { Chunk } from "./chunk";
import { Gizmo3D } from "../utils/gizmo3d";

export class Camera {

	public position = vec3.create();

	// I know I could have used a vec3 for rotation, but this makes the code more readable
	private currentPitch: number = 0.0;
	private currentYaw: number = 0.0;
	private currentRoll: number = 0.0;

	public pitch = 0.0;
	public yaw = 0.0;
	public roll = 0.0;

	public fov = Math.toRadians(45);
	public near = 0.1;
	public far = 1000.0;

	constructor() {

	}

	// #region Utility
	public get tiledPosition() {
		return new Vector2(
			Math.floor((this.position[0] + CHUNK_SIZE / 2) / CHUNK_SIZE),
			Math.floor((this.position[2] + CHUNK_SIZE / 2) / CHUNK_SIZE)
		);
	}

	public get forward() {
		const result = vec3.create();
		const yawRadians = Math.toRadians(this.yaw);
		const pitchRadians = Math.toRadians(this.pitch);
		const cosPitch = Math.cos(pitchRadians);
		result[0] = -Math.sin(yawRadians) * cosPitch;
		result[1] = Math.sin(pitchRadians);
		result[2] = -Math.cos(yawRadians) * cosPitch;

		return result;
	}

	public get right() {
		const up = vec3.fromValues(0, 1, 0);
		const forward = this.forward;
		const result = vec3.create();
		vec3.cross(result, up, forward);
		vec3.normalize(result, result);

		return result;
	}

	public get up() {
		const right = this.right;
		const forward = this.forward;
		const result = vec3.create();
		vec3.cross(result, forward, right);
		vec3.normalize(result, result);

		return result;
	}

	/**
	 * Look at a specific position in the world
	 *
	 * @see https://gamedev.stackexchange.com/a/112572
	 *
	 * @param position The world-space position to look at
	 */
	public lookAt(position: vec3) {
		const direction = vec3.create();
		vec3.subtract(direction, position, this.position);
		vec3.normalize(direction, direction);

		this.pitch = Math.toDegrees(Math.asin(direction[1]));
		this.yaw = Math.toDegrees(Math.atan2(-direction[0], -direction[2]));
	}
	// #endregion

	// #region Frustum culling
	public getFrustumPlanes(view: mat4, projection: mat4): vec4[] {
		const combinedMatrix = mat4.create();
		mat4.multiply(combinedMatrix, projection, view);

		const planes: Array<vec4> = [];

		// Right plane
		planes.push(vec4.fromValues(
			combinedMatrix[3] - combinedMatrix[0],
			combinedMatrix[7] - combinedMatrix[4],
			combinedMatrix[11] - combinedMatrix[8],
			combinedMatrix[15] - combinedMatrix[12]
		));

		// Left plane
		planes.push(vec4.fromValues(
			combinedMatrix[3] + combinedMatrix[0],
			combinedMatrix[7] + combinedMatrix[4],
			combinedMatrix[11] + combinedMatrix[8],
			combinedMatrix[15] + combinedMatrix[12]
		));

		// Top plane
		planes.push(vec4.fromValues(
			combinedMatrix[3] - combinedMatrix[1],
			combinedMatrix[7] - combinedMatrix[5],
			combinedMatrix[11] - combinedMatrix[9],
			combinedMatrix[15] - combinedMatrix[13]
		));

		// Bottom plane
		planes.push(vec4.fromValues(
			combinedMatrix[3] + combinedMatrix[1],
			combinedMatrix[7] + combinedMatrix[5],
			combinedMatrix[11] + combinedMatrix[9],
			combinedMatrix[15] + combinedMatrix[13]
		));

		// Near plane
		planes.push(vec4.fromValues(
			combinedMatrix[3] + combinedMatrix[2],
			combinedMatrix[7] + combinedMatrix[6],
			combinedMatrix[11] + combinedMatrix[10],
			combinedMatrix[15] + combinedMatrix[14]
		));

		// Far plane
		planes.push(vec4.fromValues(
			combinedMatrix[3] - combinedMatrix[2],
			combinedMatrix[7] - combinedMatrix[6],
			combinedMatrix[11] - combinedMatrix[10],
			combinedMatrix[15] - combinedMatrix[14]
		));

		return planes.map(x => vec4.normalize(x, x));
	}

	public isCubeInsideFrustum(view: mat4, projection: mat4, position: vec3, size: vec3) {
		const planes = this.getFrustumPlanes(view, projection);

		for (const plane of planes) {
			const normal = vec3.fromValues(plane[0], plane[1], plane[2]);
			const distance = vec3.dot(normal, position) + plane[3];
			const radius = Math.abs(vec3.dot(normal, size));

			if (distance < -radius) return false;
		}

		return true;
	}

	public isSphereInsideFrustum(view: mat4, projection: mat4, position: vec3, radius: number) {
		const planes = this.getFrustumPlanes(view, projection);

		for (const plane of planes) {
			const distance = vec3.dot(vec3.fromValues(plane[0], plane[1], plane[2]), position) + plane[3];

			if (distance < -radius) return false;
		}

		return true;
	}

	public isChunkInsideFrustum(view: mat4, projection: mat4, chunk: Chunk) {
		const position = chunk.globalPosition;

		// Cube
		const padding = 0;
		const size = vec3.fromValues(CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_SIZE);
		size[0] += padding;
		size[1] += padding;
		size[2] += padding;
		position[0] += padding / 2 + CHUNK_SIZE / 2;
		position[1] += padding / 2;
		position[2] += padding / 2 + CHUNK_SIZE / 2;
		const inside = this.isCubeInsideFrustum(view, projection, position, size);
		Gizmo3D.box(
			position,
			size,
			vec3.fromValues(0, 0, 0),
			inside ? vec4.fromValues(0, 1, 0, 1.0) : vec4.fromValues(1, 0, 0, 1.0),
			false
		);

		Gizmo3D.box(
			position,
			vec3.fromValues(1, 1, 1),
			vec3.fromValues(0, 0, 0),
			vec4.fromValues(0, 0, 1, 1.0),
			true
		);

		// Sphere
		// const radius = CHUNK_SIZE / 2;
		// position[0] += radius;
		// position[1] += radius;
		// position[2] += radius;
		// const inside = this.isSphereInsideFrustum(
		// 	view,
		// 	projection,
		// 	position,
		// 	radius
		// );
		// Gizmo3D.sphere(position, radius, inside ? vec4.fromValues(0, 0, 0, 1.0) : vec4.fromValues(1, 1, 1, 1.0));

		/* Gizmo3D.frustum(
			this,
			vec4.fromValues(1, 0, 0, 0.5),
			false
		); */


		return inside;
	}
	// #endregion

    public update(deltaTime: number) {
		// TODO: Decide whether to continue with the smooth rotation
		const speed = 20;
        this.currentPitch = Math.lerp(this.currentPitch, this.pitch, deltaTime * speed);
        this.currentYaw = Math.lerp(this.currentYaw, this.yaw, deltaTime * speed);
        this.currentRoll = Math.lerp(this.currentRoll, this.roll, deltaTime * speed);
    }

    public getViewMatrix() {
		const viewMatrix = mat4.create();
		mat4.translate(viewMatrix, viewMatrix, this.position);
		mat4.rotate(viewMatrix, viewMatrix, Math.toRadians(this.currentYaw), [0, 1, 0]);
        mat4.rotate(viewMatrix, viewMatrix, Math.toRadians(this.currentPitch), [1, 0, 0]);
        mat4.rotate(viewMatrix, viewMatrix, Math.toRadians(this.currentRoll), [0, 0, 1]);
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