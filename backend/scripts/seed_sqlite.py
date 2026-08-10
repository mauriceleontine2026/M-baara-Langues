import sqlite3
import json
from pathlib import Path
import unicodedata
import re
from datetime import datetime

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = ROOT / 'mbaara.db'
DICTS_ROOT = ROOT / 'src' / 'data'

if not DB_PATH.exists():
    print('DB missing at', DB_PATH)
    raise SystemExit(1)

conn = sqlite3.connect(str(DB_PATH))
cur = conn.cursor()

# normalization
def normalize_slug(value):
    text = str(value or '').lower()
    text = unicodedata.normalize('NFD', text)
    text = ''.join(ch for ch in text if unicodedata.category(ch) != 'Mn')
    text = re.sub(r'[^a-z0-9]+', '', text)
    return text

# load languages
langs = cur.execute('SELECT code, name, name_fr FROM languages').fetchall()
known_codes = {normalize_slug(code): code for code, _, _ in langs}
known_names = {normalize_slug(name): code for code, name, _ in langs if name}
known_name_fr = {normalize_slug(name_fr): code for code, _, name_fr in langs if name_fr}

aliases = {
    'english': 'anglais', 'deutsch': 'allemand', 'mandarin': 'chinois', 'italiano': 'italien',
    'espanol': 'espagnol', 'portugues': 'portugais', 'russian': 'russe', 'japanese': 'japonais'
}

processed = 0
if not DICTS_ROOT.exists():
    print('Dictionaries folder missing', DICTS_ROOT)
    raise SystemExit(1)

for folder in sorted(DICTS_ROOT.iterdir()):
    if not folder.is_dir():
        continue
    folder_slug = normalize_slug(folder.name)
    lang_code = aliases.get(folder_slug) or known_codes.get(folder_slug) or known_names.get(folder_slug) or known_name_fr.get(folder_slug)
    if not lang_code:
        # try contains
        for k in known_codes:
            if k in folder_slug or folder_slug in k:
                lang_code = known_codes[k]
                break
    if not lang_code:
        continue

    # mark language active
    cur.execute('UPDATE languages SET status = ?, total_lessons = CASE WHEN total_lessons IS NULL OR total_lessons < 1 THEN 1 ELSE total_lessons END WHERE code = ?', ('active', lang_code))

    # ensure lesson 1 exists
    cur.execute('SELECT id FROM lessons WHERE language_code = ? AND lesson_number = 1', (lang_code,))
    if cur.fetchone() is None:
        title = f"Leçon 1 - {lang_code}"
        content = f"Vocabulaire et expressions de base pour {lang_code}."
        now = datetime.utcnow().isoformat()
        cur.execute('INSERT INTO lessons (title, language_code, lesson_number, difficulty, content, published, created_at) VALUES (?,?,?,?,?,?,?)', (title, lang_code, 1, 'beginner', content, 1, now))

    # load json files
    for json_file in sorted(folder.rglob('*.json')):
        if not json_file.is_file():
            continue
        try:
            payload = json.loads(json_file.read_text(encoding='utf-8'))
        except Exception:
            continue
        # flatten entries
        items = []
        if isinstance(payload, list):
            for entry in payload:
                if isinstance(entry, dict) and 'vocabulaire' in entry and isinstance(entry['vocabulaire'], list):
                    items.extend(entry['vocabulaire'])
                elif isinstance(entry, dict):
                    items.append(entry)
        elif isinstance(payload, dict):
            if 'vocabulaire' in payload and isinstance(payload['vocabulaire'], list):
                items.extend(payload['vocabulaire'])
            else:
                items.append(payload)

        for item in items:
            if not isinstance(item, dict):
                continue
            # find target
            target = None
            for key in ['langue_cible','word','target','term','phrase','pular','malinke','guerze','kpele','swahili','wolof','yoruba','igbo','lingala','dioula','bissa','kissi','toma','moore','kono','nouchi','hindi']:
                v = item.get(key)
                if v and isinstance(v, str) and v.strip():
                    target = v.strip()
                    break
            if not target:
                # fallback to first string value that's not meta
                for k,v in item.items():
                    if isinstance(v, str) and v.strip() and k.lower() not in ['id','lecon','titre','description','categorie','category','vocabulaire']:
                        target = v.strip(); break
            if not target:
                continue
            translation = None
            for key in ['francais','translation_fr','translation','french','fr']:
                v = item.get(key)
                if v and isinstance(v, str) and v.strip():
                    translation = v.strip(); break
            example_target = None
            for key in ['exemple_langue_cible','example_target','exemple','example']:
                v = item.get(key)
                if v and isinstance(v, str) and v.strip():
                    example_target = v.strip(); break
            example_fr = item.get('exemple_francais') or item.get('example_fr') or translation
            phonetic = item.get('phonetique') or item.get('phonetic')
            category = item.get('categorie') or item.get('category')

            # insert if not exists
            cur.execute('SELECT id FROM vocabulary_items WHERE language_code = ? AND lesson_number = 1 AND word = ?', (lang_code, target))
            if cur.fetchone() is None:
                now = datetime.utcnow().isoformat()
                cur.execute('INSERT INTO vocabulary_items (language_code, lesson_number, word, translation_fr, phonetic, example_target, example_fr, difficulty, created_at) VALUES (?,?,?,?,?,?,?,?,?)', (lang_code, 1, target, translation, phonetic, example_target, example_fr, category or 'beginner', now))
                processed += 1

conn.commit()
conn.close()
print('Processed entries:', processed)
