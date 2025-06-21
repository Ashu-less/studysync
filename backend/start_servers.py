import subprocess
import time
import sys

backend_cmd = [sys.executable, '-m', 'uvicorn', 'backend.main:app']
backend_proc = subprocess.Popen(backend_cmd)
time.sleep(2)
frontend_cmd = ['npm', 'run', 'dev', '--prefix', 'frontend']
frontend_proc = subprocess.Popen(frontend_cmd)
try:
    backend_proc.wait()
    frontend_proc.wait()
except KeyboardInterrupt:
    backend_proc.terminate()
    frontend_proc.terminate() 