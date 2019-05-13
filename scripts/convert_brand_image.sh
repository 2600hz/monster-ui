#!/usr/bin/env bash
command -v convert >/dev/null 2>&1 || { echo >&2 "I require ImageMagick's 'convert' tool but it's not installed.  Aborting."; exit 1; }
[ $# -lt 2 ] && { echo "Usage: ./convert_brand_image.sh <input_image> <output_image_base_name>"; exit 1; }
convert "$1" -trim +repage -gravity center -resize 80x60 -background white -gravity center -extent 100x80 "$2".png
