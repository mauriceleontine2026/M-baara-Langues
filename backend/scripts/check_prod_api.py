import urllib.request, json, sys

BASE = 'https://mbaara-backend.vercel.app'
endpoints = [
    '/api/languages',
    '/api/lessons?language_code=wolof',
    '/api/vocabulary?language_code=wolof',
    '/api/lessons?language_code=bissa',
    '/api/vocabulary?language_code=bissa',
]

results = {}
for ep in endpoints:
    url = BASE + ep
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            body = r.read().decode('utf-8')
            data = json.loads(body)
            results[ep] = {'status': r.status, 'type': type(data).__name__, 'len': (len(data) if isinstance(data, (list, dict)) else None)}
    except Exception as e:
        results[ep] = {'error': str(e)}

print(json.dumps(results, ensure_ascii=False, indent=2))
