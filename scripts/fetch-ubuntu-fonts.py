"""Download Ubuntu + Ubuntu Mono woff2 files (latin subset) into src/fonts/."""
import re
import urllib.request

UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
OUT = "/home/z/my-project/src/fonts"

FAMILIES = [
    ("Ubuntu", "wght@300;400;500;700", "ubuntu-{weight}.woff2"),
    ("Ubuntu Mono", "wght@400;700", "ubuntu-mono-{weight}.woff2"),
]


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


import os

os.makedirs(OUT, exist_ok=True)

for family, axis, pattern in FAMILIES:
    css_url = f"https://fonts.googleapis.com/css2?family={family.replace(' ', '+')}:{axis}&display=swap"
    css = fetch(css_url).decode()
    # Split into comment-labeled blocks: /* latin */ @font-face { ... }
    blocks = re.findall(r"/\*\s*([a-z0-9-]+)\s*\*/\s*@font-face\s*\{([^}]+)\}", css)
    seen_weights = set()
    for subset, body in blocks:
        if subset != "latin":
            continue
        weight_m = re.search(r"font-weight:\s*(\d+)", body)
        url_m = re.search(r"url\((https://[^)]+\.woff2)\)", body)
        if not weight_m or not url_m:
            continue
        weight = weight_m.group(1)
        if weight in seen_weights:
            continue
        seen_weights.add(weight)
        data = fetch(url_m.group(1))
        fname = pattern.format(weight=weight)
        with open(os.path.join(OUT, fname), "wb") as f:
            f.write(data)
        print(f"saved {fname} ({len(data)} bytes)")

print("done")
