import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import json
from rest_framework.test import APIClient
from core.models import User

def test_isolation():
    client = APIClient()
    
    # Login as Informatics Student
    student = User.objects.get(username='student_info')
    client.force_authenticate(user=student)
    
    response = client.get('/api/tasks/')
    tasks = response.json()
    
    print(f"Tasks visible to {student.username}:")
    for t in tasks:
        print(f"- {t['title']} ({t['faction']})")
        if t['faction'] == 'robotics':
            print("FAILURE: Student saw task from other faction!")
            return False
    
    print("SUCCESS: Data isolation verified for tasks.")
    return True

if __name__ == '__main__':
    test_isolation()
