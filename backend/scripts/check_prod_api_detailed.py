import urllib.request, json, sys
BASE = 'https://mbaara-backend.vercel.app'

def fetch(path):
    url = BASE + path
    with urllib.request.urlopen(url, timeout=15) as r:
        return r.status, json.load(r)

out = {}
status, langs = fetch('/api/languages')
out['languages_count'] = len(langs) if isinstance(langs, list) else None
out['languages_sample'] = []
for lang in langs[:10]:
    out['languages_sample'].append({k: lang.get(k) for k in ('code','name','name_fr','status','total_lessons')})

# pick some languages to inspect
inspect_codes = ['wolof','bissa','dioula','lingala','swahili']
for code in inspect_codes:
    try:
        s1, lessons = fetch(f'/api/lessons?language_code={code}')
        s2, vocab = fetch(f'/api/vocabulary?language_code={code}')
        out[code] = {
            'lessons_count': len(lessons) if isinstance(lessons, list) else None,
            'lessons_sample': lessons[:3] if isinstance(lessons, list) else None,
            'vocab_count': len(vocab) if isinstance(vocab, list) else None,
            'vocab_sample': vocab[:5] if isinstance(vocab, list) else None,
        }
    except Exception as e:
        out[code] = {'error': str(e)}

print(json.dumps(out, ensure_ascii=False, indent=2))
