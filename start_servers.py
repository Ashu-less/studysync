import subprocess
import time
import sys
import os

def start_servers():
    """Start both the focus detection and emotion detection servers"""
    
    print("🚀 Starting StudySync servers...")
    print("=" * 50)
    
    # Start emotion detection server
    print("1. Starting Emotion Detection Server (port 5001)...")
    emotion_process = subprocess.Popen([
        sys.executable, "backend/emotion_api.py"
    ], cwd=os.getcwd())
    
    # Wait a moment for the server to start
    time.sleep(3)
    
    print("2. Emotion Detection Server should be running on http://localhost:5001")
    print("3. Make sure your focus detection server is running on http://127.0.0.1:8000")
    print("\n" + "=" * 50)
    print("✅ StudySync is ready!")
    print("\n📱 Frontend: http://localhost:5173 (or your Vite dev server)")
    print("🎯 Focus API: http://127.0.0.1:8000")
    print("😊 Emotion API: http://localhost:5001")
    print("\nPress Ctrl+C to stop all servers")
    
    try:
        # Keep the script running
        emotion_process.wait()
    except KeyboardInterrupt:
        print("\n🛑 Stopping servers...")
        emotion_process.terminate()
        print("✅ Servers stopped")

if __name__ == "__main__":
    start_servers() 