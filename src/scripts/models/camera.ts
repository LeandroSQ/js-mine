import { mat4, vec4, vec3 } from "gl-matrix";
import { Vector2 } from "./math/vector2";
import { CHUNK_HEIGHT, CHUNK_SIZE } from "../constants";
import { Gizmo3D } from "../debug/gizmo3d";
import { SETTINGS } from "../settings";
import { Chunk } from "./terrain/chunk";

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
	public get aspectRatio() {
		// TODO: Get the aspect ratio from the screen
		return window.innerWidth / window.innerHeight;
	}

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
	private normalizePlane(plane: vec4) {
		const length = Math.sqrt(plane[0] * plane[0] + plane[1] * plane[1] + plane[2] * plane[2]);
		plane[0] /= length;
		plane[1] /= length;
		plane[2] /= length;


		return plane;
	}

	public getFrustumPlanes(): vec4[] {
		const view = this.getViewMatrix();
		const projection = this.getProjectionMatrix();
		const viewProjectionMatrix = mat4.multiply(mat4.create(), projection, view);

		const planesData = [
			vec4.fromValues(viewProjectionMatrix[3] + viewProjectionMatrix[0], viewProjectionMatrix[7] + viewProjectionMatrix[4], viewProjectionMatrix[11] + viewProjectionMatrix[8], viewProjectionMatrix[15] + viewProjectionMatrix[12]), // Left
			vec4.fromValues(viewProjectionMatrix[3] - viewProjectionMatrix[0], viewProjectionMatrix[7] - viewProjectionMatrix[4], viewProjectionMatrix[11] - viewProjectionMatrix[8], viewProjectionMatrix[15] - viewProjectionMatrix[12]), // Right
			vec4.fromValues(viewProjectionMatrix[3] + viewProjectionMatrix[1], viewProjectionMatrix[7] + viewProjectionMatrix[5], viewProjectionMatrix[11] + viewProjectionMatrix[9], viewProjectionMatrix[15] + viewProjectionMatrix[13]), // Bottom
			vec4.fromValues(viewProjectionMatrix[3] - viewProjectionMatrix[1], viewProjectionMatrix[7] - viewProjectionMatrix[5], viewProjectionMatrix[11] - viewProjectionMatrix[9], viewProjectionMatrix[15] - viewProjectionMatrix[13]), // Top
			vec4.fromValues(viewProjectionMatrix[3] + viewProjectionMatrix[2], viewProjectionMatrix[7] + viewProjectionMatrix[6], viewProjectionMatrix[11] + viewProjectionMatrix[10], viewProjectionMatrix[15] + viewProjectionMatrix[14]), // Near
			vec4.fromValues(viewProjectionMatrix[3] - viewProjectionMatrix[2], viewProjectionMatrix[7] - viewProjectionMatrix[6], viewProjectionMatrix[11] - viewProjectionMatrix[10], viewProjectionMatrix[15] - viewProjectionMatrix[14])  // Far
		];

		return planesData.map(plane => vec4.normalize(vec4.create(), plane));
	}

	public isBoxInFrustum(position: vec3, size: vec3) {
		const planes = this.getFrustumPlanes();

		const halfSize = vec3.scale(vec3.create(), size, 0.5);
		const min = vec3.subtract(vec3.create(), position, halfSize);
		const max = vec3.add(vec3.create(), position, halfSize);

		for (const plane of planes) {
			const normal = vec3.fromValues(plane[0], plane[1], plane[2]);
			const positive = vec3.fromValues(
				normal[0] > 0 ? max[0] : min[0],
				normal[1] > 0 ? max[1] : min[1],
				normal[2] > 0 ? max[2] : min[2]
			);

			const distance = vec3.dot(normal, positive) + plane[3];
			if (distance < 0) return false;
		}

		return true;
	}

	public isSphereInsideFrustum(position: vec3, radius: number) {
		const planes = this.getFrustumPlanes();

		for (const plane of planes) {
			const distance = vec3.dot(vec3.fromValues(plane[0], plane[1], plane[2]), position) + plane[3];

			if (distance < -radius) return false;
		}

		return true;
	}

	public isChunkInsideFrustum(chunk: Chunk) {
		const position = chunk.globalCenterPosition;

		// Cube
		const padding = 0;
		const size = vec3.fromValues(CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_SIZE);
		size[0] += padding;
		size[1] += padding;
		size[2] += padding;
		position[0] -= padding / 2;
		position[1] -= padding / 2;
		position[2] -= padding / 2;
		const inside = this.isBoxInFrustum(position, size);

		if (SETTINGS.RENDER_CHUNK_BOUNDS) {
			Gizmo3D.box(
				chunk.globalCenterPosition,
				size,
				vec3.fromValues(0, 0, 0),
				inside ? vec4.fromValues(0, 1, 0, 1.0) : vec4.fromValues(1, 0, 0, 1.0),
				false
			);

			Gizmo3D.box(
				chunk.globalCenterPosition,
				vec3.fromValues(1, 1, 1),
				vec3.fromValues(0, 0, 0),
				vec4.fromValues(0, 0, 1, 1.0),
				true
			);
		}

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

	public getProjectionMatrix() {
		const projectionMatrix = mat4.create();
		mat4.perspective(projectionMatrix, this.fov, this.aspectRatio, this.near, this.far);

		return projectionMatrix;
	}

}