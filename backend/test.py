import urllib.request, urllib.error
req = urllib.request.Request(
    'http://localhost:8000/api/users/',
    data=b'{"email":"test3@ub.ac.bw", "password":"password123"}',
    headers={'Content-Type': 'application/json', 'Authorization': 'Bearer bad'}
)
try:
    urllib.request.urlopen(req)
except urllib.error.HTTPError as e:
    print(f'CODE: {e.code}')
    print(e.read().decode('utf-8'))
