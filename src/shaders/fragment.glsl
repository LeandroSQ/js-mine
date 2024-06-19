#version 300 es

precision highp float;

uniform sampler2D u_texture;

in vec3 v_normal;
in vec2 v_texCoord;

out vec4 fragColor;

void main() {
	vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
	vec3 lightColor = vec3(0.97f, 0.88f, 0.77f);
	vec3 shadowColor = vec3(0.09f, 0.09f, 0.18f);
    float lightIntensity = pow(max(dot(v_normal, lightDirection), 0.0), 2.0) + 0.15;

	vec3 color = lightColor * lightIntensity + shadowColor * (1.0 - lightIntensity);

	// Flip texture vertically
	vec2 flippedTexCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y);
	fragColor = vec4(color, 1.0) * texture(u_texture, flippedTexCoord);

	// Depth buffer
	// fragColor = vec4(vec3(gl_FragCoord.z), 1.0);

}