#version 300 es

precision highp float;

uniform sampler2D u_texture;

in vec3 v_normal;
in vec2 v_texCoord;
in float v_fogDepth;

out vec4 fragColor;

const vec3 lightColor = vec3(0.97f, 0.88f, 0.77f);
const vec3 shadowColor = vec3(0.09f, 0.09f, 0.18f);
const vec3 fogColor = vec3(0.05f, 0.09f, 0.17f);
const float fogNear = 200.1;// TODO: Move these to uniforms
const float fogFar = 100.0;
const vec3 lightDirection = normalize(vec3(0.0f, 1.0f, 0));

void main() {
    float lightIntensity = max(pow(max(dot(v_normal, lightDirection), 0.0), 2.0), 0.35);
	vec3 color = lightColor * lightIntensity + shadowColor * (1.0 - lightIntensity);

	// Flip texture vertically
	vec2 flippedTexCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y);
	fragColor = vec4(color, 1.0) * texture(u_texture, flippedTexCoord);

	// Fog
	float fogAmount = smoothstep(fogNear, fogFar, v_fogDepth);
	// fragColor = mix(vec4(fogColor, 1.0), fragColor, fogAmount);

	// Debug normals
	// fragColor = vec4(normalize(v_normal) * 0.5 + 0.5, 1.0);

	// Depth buffer
	// fragColor = vec4(vec3(gl_FragCoord.z), 1.0);

}