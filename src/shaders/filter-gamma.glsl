#version 300 es

precision highp float;

uniform sampler2D u_texture;

in vec2 v_texcoord;

out vec4 fragColor;

const float MIX_AMOUNT = 0.75;

vec3 applyContrast(vec3 color, float contrast) {
	return (color - 0.5) * contrast + 0.5;
}

vec3 applyBrightness(vec3 color, float brightness) {
	return color + brightness;
}

vec3 applySaturation(vec3 color, float saturation) {
	vec3 gray = vec3(dot(vec3(0.2126, 0.7152, 0.0722), color));
	return mix(gray, color, saturation);
}

void main() {
	#ifdef SPLIT_
		// No effect on the left side
		if (v_texcoord.x < 0.5) {
			fragColor = texture(u_texture, v_texcoord);
			return;
		}
	#endif

	vec3 color = texture(u_texture, v_texcoord).rgb;
	vec3 color2 = applyContrast(color, 1.1);
	color2 = applyBrightness(color2, 0.025);
	color2 = applySaturation(color2, 1.15);

	fragColor = vec4(mix(color, color2, MIX_AMOUNT), 1.0);
}