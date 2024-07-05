#version 300 es

precision highp float;

uniform sampler2D u_texture;

in vec2 v_texcoord;

out vec4 fragColor;

const float SHARPEN_AMOUNT = 0.15;


// Adapted from https://igortrindade.wordpress.com/2010/04/23/fun-with-opengl-and-shaders/
vec4 sharpen() {
	vec2 renderSize = vec2(textureSize(u_texture, 0));
	float dx = 1.0 / renderSize.x;
	float dy = 1.0 / renderSize.y;
	vec4 sum = vec4(0.0);
	sum += -1.0 * texture(u_texture, v_texcoord + vec2(-1.0 * dx, 0.0 * dy));
	sum += -1.0 * texture(u_texture, v_texcoord + vec2(0.0 * dx, -1.0 * dy));
	sum +=  5.0 * texture(u_texture, v_texcoord + vec2(0.0 * dx, 0.0 * dy));
	sum += -1.0 * texture(u_texture, v_texcoord + vec2(0.0 * dx, 1.0 * dy));
	sum += -1.0 * texture(u_texture, v_texcoord + vec2(1.0 * dx, 0.0 * dy));

	return sum;
}

void main() {
	#ifdef SPLIT
		// No effect on the left side
		if (v_texcoord.x < 0.5) {
			fragColor = texture(u_texture, v_texcoord);
			return;
		}
	#endif

	vec4 sharpened = sharpen();
	fragColor = mix(texture(u_texture, v_texcoord), sharpened, SHARPEN_AMOUNT);
}