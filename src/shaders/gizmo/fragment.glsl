#version 300 es

precision highp float;

uniform vec4 u_color;

out vec4 fragColor;

void main() {
	fragColor = u_color;
	// fragColor = vec4(1, 0, 0, 1);
}