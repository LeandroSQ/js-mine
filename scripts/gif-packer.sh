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
ffmpeg -y -framerate $FPS -i "$INPUT_DIR/%d.png" -vf "fps=$FPS,palettegen=stats_mode=full" $OUTPUT_DIR/palette.png

# Generate gif
ffmpeg -y -framerate $FPS -i "$INPUT_DIR/%d.png" -i $OUTPUT_DIR/palette.png -lavfi "fps=$FPS [x]; [x][1:v] paletteuse=dither=sierra2_4a:diff_mode=rectangle" -f gif $OUTPUT_DIR/output.gif
