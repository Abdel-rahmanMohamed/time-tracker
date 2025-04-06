#!/bin/bash

# Check if input file is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 input.png"
    exit 1
fi

INPUT_IMAGE="$1"
OUTPUT_DIR="icons"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Define icon sizes and properties (name, width, height, is_maskable)
ICONS=(
    "icon-72x72.png 72 72 false"
    "icon-96x96.png 96 96 false"
    "icon-128x128.png 128 128 false"
    "icon-144x144.png 144 144 false"
    "icon-152x152.png 152 152 false"
    "icon-192x192.png 192 192 true"
    "icon-384x384.png 384 384 false"
    "icon-512x512.png 512 512 false"
)

# Process each icon
for icon in "${ICONS[@]}"; do
    read -r name width height maskable <<< "$icon"
    echo "Generating $name (${width}x${height})..."
    
    if [ "$maskable" = "true" ]; then
        # Apply a maskable background (optional: adjust rounding)
        convert "$INPUT_IMAGE" -resize "${width}x${height}" \
                -background transparent -gravity center -extent "${width}x${height}" \
                \( +clone -threshold -1 -draw "fill black polygon 0,0 0,${height} ${width},${height} ${width},0" \) \
                -alpha off -compose copy_opacity -composite \
                "$OUTPUT_DIR/$name"
    else
        # Standard resize with transparent padding (if aspect ratio differs)
        convert "$INPUT_IMAGE" -resize "${width}x${height}" \
                -background transparent -gravity center -extent "${width}x${height}" \
                "$OUTPUT_DIR/$name"
    fi
done

echo "All icons generated in '$OUTPUT_DIR/'!"