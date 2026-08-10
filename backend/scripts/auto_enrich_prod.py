import urllib.request, json, time
from pathlib import Path
import unicodedata, re

BASE = 'https://mbaara-backend.vercel.app'
DICT_ROOT = Path(__file__).resolve().parents[2] / 'src' / 'data' / 'dictionnaires'

# normalization helpers

def normalize_slug(value):
    text = str(value or '').lower()
    text = unicodedata.normalize('NFD', text)
    text = ''.join(ch for ch in text if unicodedata.category(ch) != 'Mn')
    text = re.sub(r'[^a-z0-9]+', '', text)
    return text

language_aliases = {
    'francais': 'francais','anglais':'anglais','english':'anglais','aleman':'allemand','allemand':'allemand','deutsch':'allemand',
    'arabe':'arabe','arabic':'arabe','espagnol':'espagnol','espanol':'espagnol','italien':'italien','italiano':'italien',
    'portugais':'portugais','portugues':'portugais','russe':'russe','russian':'russe','japonais':'japonais','japanese':'japonais',
    'chinois':'chinois','mandarin':'chinois','pular':'pular','pulaar':'pular','soussou':'soussou','soso':'soussou',
    'malinke':'malinke','malinke':'malinke','malinké':'malinke','guerze':'guerze','kpele':'guerze','kono':'kono','bissa':'bissa',
    'kissi':'kissi','kisi':'kissi','lingala':'lingala','swahili':'swahili','yoruba':'yoruba','igbo':'igbo','nouchi':'nouchi',
    'wolof':'wolof','dioula':'dioula','fulfulde':'fulfulde','toma':'toma','loma':'toma','moore':'moore','hindi':'hindi'
}

# helpers to extract vocab entries from payloads

def iter_vocab(payload):
    if isinstance(payload, list):
        for item in payload:
            yield from iter_vocab(item)
        return
    if not isinstance(payload, dict):
        return
    if 'vocabulaire' in payload and isinstance(payload['vocabulaire'], list):
        for it in payload['vocabulaire']:
            yield from iter_vocab(it)
        return
    yield payload


def extract_text(item):
    # common keys
    for key in ['langue_cible','word','target','term','phrase','pular','malinke','guerze','kpele','swahili','wolof','yoruba','igbo','lingala','dioula','bissa','kissi','toma','moore','kono','nouchi','hindi']:
        v = item.get(key)
        if v and isinstance(v, str) and v.strip():
            return v.strip()
    # fallback: first reasonable string
    for k,v in item.items():
        kl = k.lower()
        if isinstance(v, str) and v.strip() and kl not in ('id','lecon','titre','description','categorie','category','vocabulaire'):
            return v.strip()
    return None


def extract_translation(item):
    for key in ['francais','translation_fr','translation','french','fr']:
        v = item.get(key)
        if v and isinstance(v, str) and v.strip():
            return v.strip()
    return None


def extract_example(item):
    for key in ['exemple_langue_cible','example_target','exemple','example','exemple_pular','exemple_malinke']:
        v = item.get(key)
        if v and isinstance(v, str) and v.strip():
            return v.strip()
    return None

# get existing words for a language from prod

def get_existing_words(lang_code):
    url = f"{BASE}/api/vocabulary?language_code={lang_code}&lesson_number=1"
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            data = json.load(r)
            return set(item.get('word') for item in data if item.get('word'))
    except Exception as e:
        print('WARN get_existing_words', lang_code, e)
        return set()


def post_vocab(payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(f"{BASE}/api/vocabulary", data=data, headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status, r.read().decode()


# iterate dictionary folders
if not DICT_ROOT.exists():
    print('Dictionnaires root missing:', DICT_ROOT)
    raise SystemExit(1)

processed = 0
for folder in sorted(DICT_ROOT.iterdir()):
    if not folder.is_dir():
        continue
    folder_slug = normalize_slug(folder.name)
    lang_code = language_aliases.get(folder_slug) or folder_slug
    # if language not known, skip (API will ignore unknown codes)
    existing = get_existing_words(lang_code)
    print('Processing', folder.name, 'as', lang_code, 'existing_count=', len(existing))
    for json_file in sorted(folder.glob('*.json')):
        try:
            payload = json.loads(json_file.read_text(encoding='utf-8'))
        except Exception as e:
            print('skip', json_file, e)
            continue
        for item in iter_vocab(payload):
            if not isinstance(item, dict):
                continue
            word = extract_text(item)
            if not word:
                continue
            if word in existing:
                continue
            translation = extract_translation(item)
            example = extract_example(item)
            phonetic = item.get('phonetique') or item.get('phonetic')
            category = item.get('categorie') or item.get('category')
            payload = {
                'language_code': lang_code,
                'lesson_number': 1,
                'word': word,
                'translation_fr': translation,
                'phonetic': phonetic,
                'example_target': example,
                'example_fr': translation,
                'difficulty': category or 'beginner'
            }
            try:
                status, body = post_vocab(payload)
                if status == 201:
                    processed += 1
                    existing.add(word)
                    print('Added', lang_code, word)
                else:
                    print('Non-201', status, body)
            except Exception as e:
                print('ERROR posting', lang_code, word, e)
            time.sleep(0.1)

print('Done. processed=', processed)
