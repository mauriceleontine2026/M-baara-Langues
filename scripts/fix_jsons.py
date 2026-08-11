#!/usr/bin/env python3
"""Validate JSON files under data/ and src/; backup and replace malformed files with minimal valid JSON.
Saves a report to Desktop/fix_jsons_report.txt
"""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
patterns = ["data/**/*.json", "src/**/data/**/*.json", "src/data/**/*.json"]
report = []
for pat in patterns:
    for p in sorted(root.glob(pat)):
        try:
            with p.open('r', encoding='utf-8') as f:
                json.load(f)
            report.append(f"OK: {p.relative_to(root)}")
        except Exception as e:
            report.append(f"BAD: {p.relative_to(root)} -> {e}")
            bak = p.with_suffix(p.suffix + '.bak')
            try:
                p.rename(bak)
            except Exception:
                # fallback copy
                import shutil
                shutil.copy2(p, str(bak))
            # Heuristic: try to repair by trimming trailing characters until valid
            repaired = None
            s = bak.read_text(encoding='utf-8', errors='ignore')
            # If starts with '[' assume array
            target = '[]' if s.lstrip().startswith('[') else '{}'
            try:
                p.write_text(target, encoding='utf-8')
                repaired = target
                report.append(f"REPLACED with minimal JSON: {p.relative_to(root)}")
            except Exception as e2:
                report.append(f"REPAIR_FAILED: {p.relative_to(root)} -> {e2}")

# Write report
out = Path.home() / 'Desktop' / 'fix_jsons_report.txt'
out.write_text('\n'.join(report), encoding='utf-8')
print(f"Wrote report to {out}")
for line in report:
    print(line)
