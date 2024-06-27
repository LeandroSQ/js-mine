import { FrameBuffer } from "./frame-buffer";
import { Quad } from "./geometry/quad";
import { Shader } from "./shader";

export class RenderingPipelineBuffer {

	private frameBuffer0: FrameBuffer;
	private frameBuffer1: FrameBuffer;
	private filters: Shader[] = [];
	private pingPong = false;

	constructor(private gl: WebGLContext) {
		this.frameBuffer0 = new FrameBuffer(this.gl);
		this.frameBuffer1 = new FrameBuffer(this.gl);
	}

	private get primary() {
		return this.pingPong ? this.frameBuffer1 : this.frameBuffer0;
	}

	private get secondary() {
		return this.pingPong ? this.frameBuffer0 : this.frameBuffer1;
	}

	public async addFilter(name: string) {
		const invertY = this.filters.length % 2 === 0;
		const filter = new Shader(this.gl, `filter-${name}`);
		await filter.setup({
			source: {
				vertex: "vertex-passthrough",
				fragment: `filter-${name}`
			},
			uniforms: ["u_texture"],
			buffers: {
				vertex: {
					data: Quad.vertices.map(x => invertY ? -x : x),
					attribute: "a_position"
				},
				uv: {
					data: Quad.textureCoordinates,
					attribute: "a_texcoord"
				},
				index: {
					data: Quad.indices,
					target: GL.ELEMENT_ARRAY_BUFFER,
				}
			}
		});

		filter.bind();
		filter.setUniform("u_texture", 0);
		filter.bindBuffer("index", Quad.indices);

		this.filters.push(filter);
	}

	public swap() {
		this.pingPong = !this.pingPong;
	}

	public bind() {
		this.primary.bind();
	}

	public unbind() {
		this.primary.unbind();
	}

	public resize() {
		this.frameBuffer0.resize();
		this.frameBuffer1.resize();
	}

	public bindTexture() {
		this.primary.bindTexture();
	}

	public commit() {
		// After drawing to the primary frame buffer this is called
		// So apply the filters alternating between the two frame buffers
		for (let i = 0; i < this.filters.length; i++) {
			const filter = this.filters[i];
			const lastFilter = i === this.filters.length - 1;

			if (!lastFilter) this.secondary.bind();

			filter.bind();
			this.primary.bindTexture();
			this.gl.drawElements(GL.TRIANGLES, Quad.indices.length, GL.UNSIGNED_SHORT, 0);

			if (!lastFilter) {
				this.secondary.unbind();
				this.swap();
			}
		}


	}

}