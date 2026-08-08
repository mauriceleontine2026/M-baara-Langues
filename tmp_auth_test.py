import http.client
import json
from urllib.parse import urlparse

url = 'https://mbaara-backend.vercel.app/api/auth/login'
parsed = urlparse(url)
conn = http.client.HTTPSConnection(parsed.netloc)
headers = {
    'Origin': 'https://m-baara-langues.firebaseapp.com',
    'Content-Type': 'application/json',
}
data = json.dumps({'email': 'test@example.com', 'password': 'StrongPassword123!'})
conn.request('POST', parsed.path, body=data, headers=headers)
res = conn.getresponse()
print('STATUS', res.status)
print('HEADERS')
for k, v in res.getheaders():
    print(k + ':', v)
body = res.read().decode('utf-8', errors='replace')
print('BODY', body)
