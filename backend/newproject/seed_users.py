"""
Run from the newproject directory:
    python seed_users.py

Creates 10 dummy shop owner users with password: Test@1234
"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "newproject.settings")
django.setup()

from accounts.models import UserMaster
from roles.models import RoleMaster

PASSWORD = "Test@1234"

# user_type_id=3 is the shop owner role (matches your DB)
ROLE_ID = 3

USERS = [
    {"first_name": "Ramesh",   "last_name": "Patil",    "email": "rameshpatil@gmail.com",     "mobile": "9823001001", "business": "Patil Agro Traders"},
    {"first_name": "Suresh",   "last_name": "More",     "email": "sureshmore@gmail.com",      "mobile": "9823001002", "business": "More & Sons Enterprises"},
    {"first_name": "Vijay",    "last_name": "Deshmukh", "email": "vijaydeshmukh@gmail.com",   "mobile": "9823001003", "business": "Deshmukh Food Products"},
    {"first_name": "Prakash",  "last_name": "Jadhav",   "email": "prakashjadhav@gmail.com",   "mobile": "9823001004", "business": "Jadhav General Store"},
    {"first_name": "Santosh",  "last_name": "Kale",     "email": "santoshkale@gmail.com",     "mobile": "9823001005", "business": "Kale Wholesale Traders"},
    {"first_name": "Dinesh",   "last_name": "Shinde",   "email": "dineshshinde@gmail.com",    "mobile": "9823001006", "business": "Shinde Agri Supplies"},
    {"first_name": "Mahesh",   "last_name": "Pawar",    "email": "maheshpawar@gmail.com",     "mobile": "9823001007", "business": "Pawar Trading Co."},
    {"first_name": "Nilesh",   "last_name": "Bhosale",  "email": "nileshbhosale@gmail.com",   "mobile": "9823001008", "business": "Bhosale Kirana Store"},
    {"first_name": "Ganesh",   "last_name": "Salve",    "email": "ganeshsalve@gmail.com",     "mobile": "9823001009", "business": "Salve Brothers Traders"},
    {"first_name": "Rakesh",   "last_name": "Kulkarni", "email": "rakeshkulkarni@gmail.com",  "mobile": "9823001010", "business": "Kulkarni Provision Store"},
]

def run():
    try:
        role = RoleMaster.objects.get(pk=ROLE_ID)
    except RoleMaster.DoesNotExist:
        print(f"ERROR: Role with id={ROLE_ID} not found. Check your roles table.")
        return

    created = 0
    skipped = 0

    for u in USERS:
        if UserMaster.objects.filter(email=u["email"]).exists():
            print(f"  SKIP  {u['email']} (already exists)")
            skipped += 1
            continue

        user = UserMaster(
            email=u["email"],
            mobile_number=u["mobile"],
            first_name=u["first_name"],
            last_name=u["last_name"],
            business_name=u["business"],
            user_type=role,
            is_active=True,
            is_staff=False,
            is_superuser=False,
        )
        user.set_password(PASSWORD)
        user.save()
        print(f"  OK    {u['first_name']} {u['last_name']} — {u['email']}")
        created += 1

    print(f"\nDone. Created: {created}  |  Skipped: {skipped}")
    print(f"Password for all new users: {PASSWORD}")

if __name__ == "__main__":
    run()
