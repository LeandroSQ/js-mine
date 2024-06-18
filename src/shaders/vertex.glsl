#version 300 es

layout(location = 0) in vec3 a_position;
layout(location = 1) in float a_normal;

uniform mat4 u_view;
uniform mat4 u_model;
uniform mat4 u_projection;

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
	v_normal = mat3(transpose(inverse(u_model))) * normals[int(a_normal)];
	gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
}