#version 300 es

precision highp float;

uniform sampler2D u_texture;

in vec2 v_texcoord;

out vec4 fragColor;

// FXAA BASE SETTINGS
const float FXAA_SPAN_MAX = 4.0;
const float FXAA_REDUCE_MIN = 1.0 / 128.0;
const float FXAA_REDUCE_MUL = 1.0 / 4.0;
const float FXAA_DIR_THRESHOLD = 0.75;
const float FXAA_MIX = 1.0;

const float SHARPEN_AMOUNT = 0.35;

const vec3 luma = vec3(0.299, 0.587, 0.114);

vec3 fxaa(vec2 texelSize, vec2 v_texcoord, sampler2D u_texture) {
	float lumaTL = dot(texture(u_texture, v_texcoord + vec2(-texelSize.x, -texelSize.y)).rgb, luma);
	float lumaTR = dot(texture(u_texture, v_texcoord + vec2(texelSize.x, -texelSize.y)).rgb, luma);
	float lumaBL = dot(texture(u_texture, v_texcoord + vec2(-texelSize.x, texelSize.y)).rgb, luma);
	float lumaBR = dot(texture(u_texture, v_texcoord + vec2(texelSize.x, texelSize.y)).rgb, luma);
	fragColor = texture(u_texture, v_texcoord);
	float lumaM = dot(fragColor.rgb, luma);

	vec2 dir = vec2(
		-(lumaTL + lumaTR) - (lumaBL + lumaBR),
		(lumaTL + lumaBL) - (lumaTR + lumaBR)
	);

	/* if (length(dir) < FXAA_DIR_THRESHOLD) {
		// return vec3(1.0, 0.0, 0.0);
		return fragColor.rgb;
	} */

	float dirReduce = max((lumaTL + lumaTR + lumaBL + lumaBR) * 0.25 * FXAA_REDUCE_MUL, FXAA_REDUCE_MIN);
	float inverseDirAdjustment = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);

	dir = min(
		vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),
		max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX), dir * inverseDirAdjustment)
	) * texelSize;

	vec3 result1 = 0.5 * (
		texture(u_texture, v_texcoord + (dir * vec2(1.0 / 3.0 - 0.5))).rgb +
		texture(u_texture, v_texcoord + (dir * vec2(2.0 / 3.0 - 0.5))).rgb
	);
	vec3 result2 = result1 * 0.5 + 0.25 * (
		texture(u_texture, v_texcoord + (dir * vec2(0.0 / 3.0 - 0.5))).rgb +
		texture(u_texture, v_texcoord + (dir * vec2(3.0 / 3.0 - 0.5))).rgb
	);

	float lumaMin = min(lumaM, min(min(lumaTL, lumaTR), min(lumaBL, lumaBR)));
	float lumaMax = max(lumaM, max(max(lumaTL, lumaTR), max(lumaBL, lumaBR)));

	float lumaResult2 = dot(result2, luma);

	if (lumaResult2 < lumaMin || lumaResult2 > lumaMax) {
		return result1;
	} else {
		return result2;
	}
}

void main() {
	vec2 texelSize = 1.0 / vec2(textureSize(u_texture, 0));

	#ifdef SPLIT
		// Vertical line
		if (v_texcoord.x > 0.5 - texelSize.x && v_texcoord.x < 0.5 + texelSize.x) {
			fragColor = vec4(1.0);
			return;
		}

		// No effect on left side
		if (v_texcoord.x < 0.5) {
			fragColor = texture(u_texture, v_texcoord);
			return;
		}
	#endif

	vec3 color = fxaa(texelSize, v_texcoord, u_texture);
	fragColor = vec4(mix(fragColor.rgb, color, FXAA_MIX), 1.0);

}