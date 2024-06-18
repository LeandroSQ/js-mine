#version 300 es

precision highp float;

uniform sampler2D u_texture;

in vec3 v_normal;
in vec2 v_texCoord;

out vec4 fragColor;

void main() {
	vec3 lightDirection = normalize(vec3(0.0, 1.0, 1.0));
    float lightIntensity = max(dot(v_normal, lightDirection), 0.0);

	vec3 normlizedNormal = normalize(v_normal);
	vec3 color = normlizedNormal * 0.5 + 0.5;

	fragColor = texture(u_texture, v_texCoord) * vec4(lightIntensity, lightIntensity, lightIntensity, 1.0);

	// fragColor = vec4(color * 0.5, 1.0) * texture(u_texture, v_texCoord);
}