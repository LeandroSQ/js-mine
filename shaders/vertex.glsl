#version 300 es

precision highp float;

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec2 a_texcoord;
layout(location = 2) in vec3 a_normal;

uniform mat4 u_modelView;
uniform mat4 u_projection;

out vec2 v_texCoord;
out vec3 v_normal;
out float v_fogDepth;

void main() {
	// Calculate the normal in world space
	v_normal = mat3(transpose(inverse(u_modelView))) * a_normal;

	mat4 u_matrix = u_projection * u_modelView;

	// Calculate the position in clip space
	gl_Position = u_matrix * vec4(a_position, 1.0);

	// Pass the texture
	v_texCoord = a_texcoord;

	// Calculate the fog depth
	v_fogDepth = -(u_modelView * vec4(a_position, 1.0)).z;

}