import subprocess
import os
import sys
import time

# Base project directory (same folder where this script lives)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

BACKEND_VENV   = os.path.join(BASE_DIR, "backend", "venv", "Scripts", "activate")
BACKEND_MANAGE = os.path.join(BASE_DIR, "backend", "newproject", "manage.py")
FRONTEND_DIR   = os.path.join(BASE_DIR, "frontend")

# Common Git Bash locations — script picks the first one that exists
BASH_CANDIDATES = [
    r"C:\Users\IMR104\AppData\Local\Programs\Git\usr\bin\bash.exe",  # your machine
    r"C:\Program Files\Git\bin\bash.exe",
    r"C:\Program Files\Git\usr\bin\bash.exe",
    r"C:\Program Files (x86)\Git\bin\bash.exe",
    r"C:\Program Files (x86)\Git\usr\bin\bash.exe",
]


def find_bash():
    for path in BASH_CANDIDATES:
        if os.path.isfile(path):
            return path
    try:
        result = subprocess.check_output(["where", "bash"], text=True).strip().splitlines()
        for line in result:
            # Skip WSL/Windows bash, prefer Git bash
            if "Git" in line and os.path.isfile(line):
                return line
        # Fallback: first valid result
        for line in result:
            if os.path.isfile(line):
                return line
    except Exception:
        pass
    return None


def open_bash_window(title, bash_cmd, bash_exe):
    subprocess.Popen(
        ["cmd", "/c", "start", title, bash_exe, "--login", "-i", "-c", f'{bash_cmd}; exec bash'],
        shell=False,
    )


if __name__ == "__main__":
    print("=== Xpilot-Inventa Dev Launcher ===\n")

    if not os.path.isfile(BACKEND_VENV):
        print(f"[x] venv not found: {BACKEND_VENV}"); sys.exit(1)
    if not os.path.isfile(BACKEND_MANAGE):
        print(f"[x] manage.py not found: {BACKEND_MANAGE}"); sys.exit(1)
    if not os.path.isdir(FRONTEND_DIR):
        print(f"[x] frontend dir not found: {FRONTEND_DIR}"); sys.exit(1)

    bash = find_bash()
    if not bash:
        print("[x] Could not find Git Bash (bash.exe) on this machine.")
        print("    Install Git for Windows or add bash to your PATH.")
        sys.exit(1)

    print(f"[+] Using bash: {bash}\n")

    backend_cmd = f'source "{BACKEND_VENV}" && python "{BACKEND_MANAGE}" runserver'
    open_bash_window("Backend - Django", backend_cmd, bash)
    print("[+] Backend terminal launched  ->  http://127.0.0.1:8000")

    time.sleep(1)

    frontend_cmd = f'cd "{FRONTEND_DIR}" && npm run dev'
    open_bash_window("Frontend - Vite", frontend_cmd, bash)
    print("[+] Frontend terminal launched ->  http://localhost:5173")

    print("\nBoth servers are starting in separate terminals.")
    print("Close those terminals (or Ctrl+C in each) to stop the servers.")