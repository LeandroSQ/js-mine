#!/bin/sh

FPS=24
INPUT_DIR=$1
OUTPUT_DIR=./output

if [ -z "$INPUT_DIR" ]; then
  echo "Usage: gif-packer.sh <input-dir>"
  exit 1
fi

# Create output directory
if [ ! -d "$OUTPUT_DIR" ]; then
  mkdir $OUTPUT_DIR
fi

# Generate pallete
# ffmpeg -y -framerate $FPS -i "$INPUT_DIR/%d.png" -vf "fps=$FPS,palettegen=stats_mode=full" $OUTPUT_DIR/palette.png

# Generate gif
# ffmpeg -y -framerate $FPS -i "$INPUT_DIR/%d.png" \
# 	-vf "fps=$FPS,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" \
# 	-c:v gifski -pix_fmt rgb24 \
# 	$OUTPUT_DIR/output.gif

gifski -o $OUTPUT_DIR/output.gif $INPUT_DIR/*.png
# Low quality
# gifski -o anim.gif ~/Downloads/frames/*.png --quality=80 --motion-quality=70 --lossy-quality=80 --width 400 --height 400 --fps 24 --fast-forward 2