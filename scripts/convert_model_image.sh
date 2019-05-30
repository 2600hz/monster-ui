#!/usr/bin/env bash
command -v convert >/dev/null 2>&1 || { echo >&2 "I require ImageMagick's 'convert' tool but it's not installed.  Aborting."; exit 1; }
[ $# -lt 1 ] && { echo "Usage: ./convert_model_image.sh <input_images>..."; exit 1; }
for var in "$@"; do
    filename="${var%%.*}"
    convert "$var" -trim +repage -gravity center -resize 80x70 -background white -gravity center -extent 100x80 "$filename.jpg"
done