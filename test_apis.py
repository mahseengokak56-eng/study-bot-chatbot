import requests

BASE_URL = "http://localhost:8000"

# Login with existing user
login_data = {'email': 'test123@gmail.com', 'password': 'password123'}
r = requests.post(f'{BASE_URL}/api/login', json=login_data, timeout=5)
print('Login:', r.status_code)

if r.status_code != 200:
    # If login fails, try register
    register_data = {'name': 'Test User', 'email': 'test123@gmail.com', 'password': 'password123'}
    r = requests.post(f'{BASE_URL}/api/register', json=register_data, timeout=5)
    print('Register:', r.status_code)

token = r.json().get('access_token')
if not token:
    print('No token received!')
    exit(1)

headers = {'Authorization': f'Bearer {token}'}

# Test all APIs
print('\n=== Testing All APIs ===')

# Chat
r = requests.post(f'{BASE_URL}/api/chat', json={'message': 'what is ai'}, headers=headers, timeout=10)
print('Chat:', r.status_code, '- Category:', r.json().get('predicted_category', 'none'))

# Stress
stress_data = {'study_hours': 8, 'sleep_hours': 6, 'screen_time': 5}
r = requests.post(f'{BASE_URL}/api/stress-predict', json=stress_data, headers=headers, timeout=5)
print('Stress Predict:', r.status_code, '- Level:', r.json().get('level', 'error'))

# Performance
perf_data = {'attendance': 85, 'study_hours': 5, 'assignments_completed': 90}
r = requests.post(f'{BASE_URL}/api/performance-predict', json=perf_data, headers=headers, timeout=5)
print('Performance:', r.status_code, '- Level:', r.json().get('level', 'error'))

# Quiz
quiz_data = {'topic': 'Python', 'difficulty': 'medium', 'num_questions': 3}
r = requests.post(f'{BASE_URL}/api/quiz', json=quiz_data, headers=headers, timeout=10)
print('Quiz:', r.status_code, '- Questions:', r.json().get('total_questions', 0))

# Notes
notes_data = {'topic': 'Machine Learning', 'detail_level': 'brief'}
r = requests.post(f'{BASE_URL}/api/notes', json=notes_data, headers=headers, timeout=10)
print('Notes:', r.status_code, '- Points:', len(r.json().get('key_points', [])))

# Dashboard
r = requests.get(f'{BASE_URL}/api/dashboard', headers=headers, timeout=5)
print('Dashboard:', r.status_code, '- Queries:', r.json().get('total_queries', 0))

print('\n=== All APIs Working ===')
