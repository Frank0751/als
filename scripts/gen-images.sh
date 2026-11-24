#!/bin/bash
# Generate all photography for the ALS platform (runs in background)
set -u
DIR="/home/z/my-project/public/images"
mkdir -p "$DIR"
LOG="/home/z/my-project/scripts/gen-images.log"
: > "$LOG"

gen() {
  local name="$1"; local prompt="$2"; local size="$3"
  if [ -s "$DIR/$name.png" ]; then echo "skip $name (exists)" >> "$LOG"; return 0; fi
  z-ai image -p "$prompt" -o "$DIR/$name.png" -s "$size" >> "$LOG" 2>&1 \
    && echo "OK $name" >> "$LOG" || echo "FAIL $name" >> "$LOG"
}

# Batch 1 — scene photography
gen "hero-women" "Golden hour photograph of three smiling Ghanaian women fish farmers in rubber boots and aprons harvesting tilapia from a concrete aquaculture pond with a net, tropical fish farm in rural Ghana, warm sunlight, palm trees and green hills behind, professional documentary photography, high quality, detailed" 1440x720 &
gen "fingerlings" "Close-up photograph of hundreds of small silvery tilapia fingerlings swimming in a white basin of clear water, hands of an African fish farmer gently scooping some with a small net, fish hatchery in Ghana, natural daylight, professional photography, sharp detail, high quality" 1344x768 &
gen "farm-ponds" "Wide photograph of a tilapia aquaculture farm in Ghana with rows of large rectangular concrete fish ponds, green vegetation and palm trees around, a farm worker walking between ponds, bright African daylight, professional documentary photography, high quality" 1344x768 &
wait
# Batch 2 — scenes
gen "training" "Photograph of an outdoor fish farming training session in Ghana: a trainer holding a tilapia showing a group of attentive Ghanaian women and men farmers taking notes under a shade canopy beside fish ponds, warm friendly atmosphere, professional documentary photography, high quality, detailed" 1344x768 &
gen "harvest" "Photograph of a rich tilapia harvest in Ghana: African farmers lifting a full seine net out of a pond with many fresh silvery tilapia fish, water splashing, early morning light, joy and abundance, professional documentary photography, high quality" 1344x768 &
wait
# Batch 3 — products 1
gen "p-seine-net" "Studio product photograph of a green fishing seine net with floats and lead line, neatly folded on clean white background, professional e-commerce product photography, sharp, high quality" 1024x1024 &
gen "p-hand-net" "Studio product photograph of a small hand net with fine mesh and long handle for scooping fish fry, clean white background, professional e-commerce product photography, sharp, high quality" 1024x1024 &
gen "p-hapa" "Studio product photograph of a fine mesh aquaculture hapa breeding net cage, rectangular mesh box with rope edges, clean white background, professional e-commerce product photography, sharp, high quality" 1024x1024 &
gen "p-cast-net" "Studio product photograph of a cast fishing net spread open showing radial mesh with weights, clean white background, professional e-commerce product photography, sharp, high quality" 1024x1024 &
wait
# Batch 4 — products 2
gen "p-aerator" "Studio product photograph of a portable water aeration pump for fish tanks with air hose and diffuser stones, white and orange plastic device, clean white background, professional e-commerce product photography, sharp, high quality" 1024x1024 &
gen "p-test-kit" "Studio product photograph of a fish farm water quality test kit with vials of water, dropper bottles and colour chart card, clean white background, professional e-commerce product photography, sharp, high quality" 1024x1024 &
gen "p-feeder" "Studio product photograph of an automatic fish feeder with timer, white plastic hopper mounted on a metal clamp, clean white background, professional e-commerce product photography, sharp, high quality" 1024x1024 &
gen "p-crates" "Studio product photograph of three stackable blue-grey plastic fish crates with ventilation holes, clean white background, professional e-commerce product photography, sharp, high quality" 1024x1024 &
wait
# Batch 5 — products 3
gen "p-thermometer" "Studio product photograph of a pond water thermometer with digital display in a yellow protective case, clean white background, professional e-commerce product photography, sharp, high quality" 1024x1024 &
gen "p-waders" "Studio product photograph of olive-green chest waders for pond work with boots attached, clean white background, professional e-commerce product photography, sharp, high quality" 1024x1024 &
gen "p-feed" "Studio product photograph of a sack bag of floating fish feed pellets with one scoop of brown pellets spilling beside it, clean white background, professional e-commerce product photography, sharp, high quality" 1024x1024 &
wait
echo "DONE" >> "$LOG"
