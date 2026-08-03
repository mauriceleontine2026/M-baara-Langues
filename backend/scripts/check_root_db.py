import sqlite3
import json
from pathlib import Path

DB = Path(__file__).resolve().parents[2] / "mbaara.db"
if not DB.exists():
    print(json.dumps({"error": "db_missing", "path": str(DB)}))
    raise SystemExit(1)

conn = sqlite3.connect(str(DB))
cur = conn.cursor()
try:
    langs = cur.execute("SELECT code,status,total_lessons FROM languages ORDER BY code").fetchall()
    no_vocab = cur.execute("SELECT l.code FROM languages l LEFT JOIN vocabulary_items v ON v.language_code=l.code GROUP BY l.code HAVING COUNT(v.language_code)=0 ORDER BY l.code").fetchall()
    no_lessons = cur.execute("SELECT l.code FROM languages l LEFT JOIN lessons s ON s.language_code=l.code GROUP BY l.code HAVING COUNT(s.language_code)=0 ORDER BY l.code").fetchall()
except Exception as e:
    print(json.dumps({"error":"db_query_error","message":str(e)}))
    raise

output = {
    "db_path": str(DB),
    "langs_count": len(langs),
    "langs_sample": [list(x) for x in langs[:20]],
    "no_vocab": [r[0] for r in no_vocab],
    "no_lessons": [r[0] for r in no_lessons]
}
print(json.dumps(output, ensure_ascii=False, indent=2))
conn.close()
