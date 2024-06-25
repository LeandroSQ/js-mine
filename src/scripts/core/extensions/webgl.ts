import { SETTINGS } from "../../settings";
import { Log } from "../../utils/log";

GL = WebGL2RenderingContext;

const enableAnisotropicFiltering = function () {
	if (SETTINGS.ANSIOTROPIC_FILTERING <= 0) return;

	const extension = this.getExtension("EXT_texture_filter_anisotropic") || this.getExtension("MOZ_EXT_texture_filter_anisotropic") || this.getExtension("WEBKIT_EXT_texture_filter_anisotropic");
	if (extension) {
		const maxAnisotropy = this.getParameter(extension.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
		this.texParameterf(GL.TEXTURE_2D, extension.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(SETTINGS.ANSIOTROPIC_FILTERING, maxAnisotropy));
		Log.info("Texture", `Anisotropic filtering supported, max: ${maxAnisotropy}`);
	} else {
		Log.warn("Texture", "Anisotropic filtering not supported");
	}
};
WebGL2RenderingContext.prototype.enableAnisotropicFiltering = enableAnisotropicFiltering;
WebGLRenderingContext.prototype.enableAnisotropicFiltering = enableAnisotropicFiltering;