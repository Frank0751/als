#!/usr/bin/env python3
"""Download Spectral + Public Sans latin woff2 for self-hosting (hermetic builds)."""
import re, urllib.request, os

UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"}
OUT = "/home/z/my-project/src/fonts"
os.makedirs(OUT, exist_ok=True)

FAMILIES = {
    "spectral": ("Spectral", [400, 600, 700]),
    "public-sans": ("Public Sans", [400, 500, 600, 700]),
}

def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=30).read()

for slug, (family, weights) in FAMILIES.items():
    css = fetch(f"https://fonts.googleapis.com/css2?family={family.replace(' ', '+')}:wght@{';'.join(map(str, weights))}&display=swap").decode()
    # blocks: /* subset */ @font-face { ... src: url(...) ...; font-weight: W }
    blocks = re.findall(r"/\*\s*([\w-]+)\s*\*/\s*@font-face\s*\{(.*?)\}", css, re.S)
    for subset, body in blocks:
        if subset != "latin":
            continue
        w = re.search(r"font-weight:\s*(\d+)", body)
        url = re.search(r"src:\s*url\((\S+?)\)", body)
        style = re.search(r"font-style:\s*(\w+)", body)
        if not (w and url):
            continue
        weight = w.group(1)
        suffix = f"-italic" if style and style.group(1) == "italic" else ""
        name = f"{slug}-{weight}{suffix}.woff2"
        data = fetch(url.group(1))
        with open(os.path.join(OUT, name), "wb") as f:
            f.write(data)
        print(f"{name}: {len(data)} bytes")

print("done")
