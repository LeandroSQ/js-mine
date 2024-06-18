#version 300 es

precision mediump float;

in vec3 v_normal;

out vec4 fragColor;

void main() {
	vec3 normlizedNormal = normalize(v_normal);
	vec3 color = normlizedNormal * 0.5 + 0.5;
	fragColor = vec4(color, 1.0);
}