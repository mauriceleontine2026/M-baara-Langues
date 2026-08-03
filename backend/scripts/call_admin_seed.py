import urllib.request, json

url = 'https://mbaara-backend.vercel.app/api/admin/seed-dictionaries'
req = urllib.request.Request(url, method='POST')
try:
    with urllib.request.urlopen(req, timeout=60) as r:
        body = r.read().decode('utf-8')
        print(r.status)
        print(body)
except Exception as e:
    print('ERROR', e)
