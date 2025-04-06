#!/bin/bash

# Check if input file is provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 input.png output.png"
    exit 1
fi

INPUT_IMAGE="$1"
OUTPUT_IMAGE="$2"

# Resize to 96x96 while preserving aspect ratio and adding transparent padding if needed
convert "$INPUT_IMAGE" \
    -resize 96x96 \
    -background transparent \
    -gravity center \
    -extent 96x96 \
    "$OUTPUT_IMAGE"

echo "Success! Resized image saved as '$OUTPUT_IMAGE'."