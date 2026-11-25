#!/usr/bin/env python3
"""Radius normalization per CLAUDE.md section 8: radius 4px or less, no pill buttons.
Keeps rounded-full only on true circles (fixed square dimensions)."""
import re, glob

CIRCLE_HINTS = re.compile(r"(h-\d+(\.\d+)? w-\d+(\.\d)?|w-\d+(\.\d+)? h-\d+(\.\d)?|size-\d+(\.\d)?|-left-\[\d+px\]|w-2 h-2|h-2 w-2|w-1\.5 h-1\.5|h-1\.5 w-1\.5)")

changed = []
for path in glob.glob("/home/z/my-project/src/components/als/**/*.tsx", recursive=True):
    with open(path) as f:
        lines = f.readlines()
    out, touched = [], False
    for line in lines:
        if "rounded-xl" in line or "rounded-lg" in line or "rounded-md" in line:
            line = re.sub(r"rounded-(xl|lg|md)", "rounded", line)
            touched = True
        if "rounded-full" in line:
            if CIRCLE_HINTS.search(line):
                pass  # true circle, keep
            else:
                line = line.replace("rounded-full", "rounded")
                touched = True
        out.append(line)
    if touched:
        with open(path, "w") as f:
            f.writelines(out)
        changed.append(path.split("als/")[-1])

print("changed files:")
for c in changed:
    print(" ", c)
