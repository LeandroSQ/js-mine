# Mine

WebGL minecraft-like concept.

<!-- <center>
    <p float="left" align="center">
		<img src=".github/screenshots/day0.svg" style="width: 48%"/>
        <img src=".github/screenshots/day0.gif" style="width: 48%"/>
    </p>
</center> -->

<p align="center">
	<a href="https://leandrosq.github.io/js-mine/">Live demo here</a>
</p>

## Devlog

### Day 0

After playing a little bit with `WebGL 2.0` this is what I came up with:

<p align="center">
	<img src=".github/screenshots/day0.gif" style="height: 400px; border-radius: 10pt; box-shadow: 0px 5pt 15pt rgba(0, 0, 0, 0.25)"/>
</p>

<p align="center">Some really cool looking cube, <br>where each face is being colored by their normal.</p>

I think I spent more time coming up with the `GIF` above than actually coding the renderer. Since I wanted something nice and `screen recording` + `gif conversion` + `free online editors` were not cutting it... so I decided to save the frames, zip them, download and run `ffmpeg` to convert them to a gif.

Not long after that I introduced textures and a simple lighting system:
<p align="center">
	<img src=".github/screenshots/day0-1.gif" style="height: 400px; border-radius: 10pt; box-shadow: 0px 5pt 15pt rgba(0, 0, 0, 0.25)"/>
</p>

<p align="center">Now we talking</p>

### Day 1

Did not have much time today, so mainly cleaned up the code, added wrappers for `WebGL` boilerplate which made life easier and also played with some post-processing effects.

<p align="center">
	<img src=".github/screenshots/day1.gif" style="height: 400px; border-radius: 10pt; box-shadow: 0px 5pt 15pt rgba(0, 0, 0, 0.25)"/>
</p>

<p align="center">Original on the <b>left</b> and new on the <b>right</b></p>

Added some `sharpen`, `brightness`, `contrast` and `saturation`, which works great.
And also tried to add `FXAA`, but it either introduces too much blur on the textures or does not work at all, not sure if this is apparent on the GIF above.
But mostly important, the rendering pipeline now supports frame buffers and drawing to textures with multi-pass filtering, all done with my wrappers which makes me happy.


## Used in this project

| Name | Description |
| -- | -- |
| Eslint | For linting and semantic analysis |
| Prettier | For code formatting |
| Browser sync | For live reloading |
| Esbuild | For bundling |
| gulp | For task automation |
| SASS | For CSS preprocessing |
| Github actions | For CI, building and deploying to github pages |
| Google fonts | For the [Pixelify Sans font](https://fonts.google.com/specimen/Pixelify+Sans) |
| [Real favicon generator](https://realfavicongenerator.net/) | For generating the favicon |
| [gl-matrix](http://glmatrix.net/) | For matrix operations, this library is awesome |
| [zipjs](https://gildas-lormeau.github.io/zip.js/) | For zip file manipulation ~duh~ |
| [filesaver.js](https://github.com/eligrey/FileSaver.js) | For saving files ~duh~ |
| [thebennybox](https://www.youtube.com/watch?v=Z9bYzpwVINA) | On the bright explanation of FXAA |