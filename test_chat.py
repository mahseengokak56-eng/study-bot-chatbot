import requests

print('=== Testing Chat Endpoint ===')

# Login
login_res = requests.post('http://localhost:8090/api/login',
    json={'email':'testuser2025@example.com','password':'password123'},
    timeout=10)

if login_res.status_code != 200:
    print(f'Login failed: {login_res.status_code}')
    print(login_res.text)
else:
    token = login_res.json()['access_token']
    print(f'1. Login successful')
    print(f'   Token: {token[:50]}...')
    
    # Chat
    chat_res = requests.post('http://localhost:8090/api/chat',
        headers={'Authorization': f'Bearer {token}'},
        json={'message':'I feel stressed about exams'},
        timeout=10)
    
    print(f'\n2. Chat status: {chat_res.status_code}')
    if chat_res.status_code == 200:
        data = chat_res.json()
        print(f'   Predicted category: {data["predicted_category"]}')
        print(f'   Response: {data["response"][:100]}...')
        print('\n✅ SUCCESS - Full flow working!')
    else:
        print(f'   Error: {chat_res.text}')
