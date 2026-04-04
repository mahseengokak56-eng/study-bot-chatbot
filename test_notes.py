import requests

# Login
login_res = requests.post('http://localhost:8000/api/login', 
    json={'email': 'test@example.com', 'password': 'password123'})
token = login_res.json().get('access_token')
print('Token:', token[:30] + '...')

# Test upload
headers = {'Authorization': f'Bearer {token}'}
files = {'files': ('water.txt', b'Water conservation is the practice of collecting and storing rainwater. It is important for sustainable living.', 'text/plain')}

upload_res = requests.post('http://localhost:8000/api/upload', files=files, headers=headers)
print('Upload:', upload_res.status_code)

if upload_res.status_code == 200:
    resp = upload_res.json()
    file_ids = resp.get('file_ids')
    for f in resp.get('files', []):
        print(f"File: {f['filename']}, Preview: {f.get('content_preview', '')[:50]}...")
    
    # Generate notes
    headers['Content-Type'] = 'application/json'
    data = {'file_ids': file_ids, 'detail_level': 'brief'}
    notes_res = requests.post('http://localhost:8000/api/notes-from-files', json=data, headers=headers)
    print('Notes:', notes_res.status_code)
    if notes_res.status_code == 200:
        print('SUCCESS! Heading:', notes_res.json().get('heading'))
    else:
        print('ERROR:', notes_res.text[:200])
