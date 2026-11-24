#!/bin/bash
# Usage: gen-one.sh name "prompt" size
DIR="/home/z/my-project/public/images"
name="$1"; prompt="$2"; size="$3"
[ -s "$DIR/$name.png" ] && { echo "skip $name"; exit 0; }
timeout 150 z-ai image -p "$prompt" -o "$DIR/$name.png" -s "$size" > /dev/null 2>&1 && echo "OK $name" || echo "FAIL $name"
