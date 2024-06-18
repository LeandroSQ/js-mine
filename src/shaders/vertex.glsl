#version 300 es

precision highp float;

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec2 a_texcoord;
layout(location = 2) in float a_normal;

uniform mat4 u_view;
uniform mat4 u_model;
uniform mat4 u_projection;

out vec2 v_texCoord;
out vec3 v_normal;

const vec3 normals[6] = vec3[](
    vec3(0.0, 0.0, 1.0),// Front face
    vec3(0.0, 0.0, -1.0),// Back face
    vec3(0.0, 1.0, 0.0),// Top face
    vec3(0.0, -1.0, 0.0),// Bottom face
    vec3(1.0, 0.0, 0.0),// Right face
    vec3(-1.0, 0.0, 0.0)// Left face
);

void main() {
	// Calculate the normal in world space
	v_normal = mat3(transpose(inverse(u_model))) * normals[int(a_normal)];

	// Calculate the position in clip space
	gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);

	// Pass the texture
	v_texCoord = a_texcoord;
}