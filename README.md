# StudySync

**StudySync** is an AI-powered productivity tool designed to help students and developers maintain focus during study or work sessions. By leveraging real-time webcam analysis and emotion detection, StudySync provides instant feedback on your concentration levels, helping you stay on track and maximize your productivity.

## Features

- **AI-Powered Focus Detection:** Uses your webcam and deep learning to determine if you are focused on your work.
- **Emotion Recognition:** Detects your emotional state during sessions to help you understand your study patterns.
- **Real-Time Feedback:** Notifies you instantly if your attention drifts, allowing for immediate correction.
- **Session Tracking:** Logs your focus sessions, including start/end times and focus percentage.
- **User Authentication:** Secure sign up and sign in with Firebase.
- **Modern UI:** Built with React, Vite, Tailwind CSS, and Material UI for a fast and responsive experience.
- **Backend API:** FastAPI backend with endpoints for session management, focus logging, and emotion analysis.
- **Database Integration:** Stores session and focus logs using SQLite and SQLAlchemy.

## Planned Features

- **Progress Analytics:** Visualize your focus trends and productivity over time.
- **Customizable Alerts:** Personalize notification patterns and intensity.
- **Privacy Controls:** Enhanced privacy options for local-only processing.
- **Mobile Support:** Responsive design and possible mobile app integration.
- **Gamification:** Earn rewards and achievements for consistent focus.
- **Third-Party Integrations:** Sync with calendars, to-do lists, and productivity tools.

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3.8+
- [FER2013 dataset](https://www.kaggle.com/datasets/msambare/fer2013) (for emotion model training)
- Webcam

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/studysync.git
   cd studysync
   ```

2. **Backend Setup:**
   - Create and activate a Python virtual environment.
   - Install backend dependencies:
     ```bash
     pip install -r requirements.txt
     ```
   - Place `fer2013.csv` in the backend directory.
   - Train the emotion model (optional, pre-trained model provided):
     ```bash
     python backend/train_emotion_model.py
     ```
   - Start the FastAPI server:
     ```bash
     uvicorn backend.main:app --reload
     ```

3. **Frontend Setup:**
   - Navigate to the frontend directory:
     ```bash
     cd frontend
     ```
   - Install frontend dependencies:
     ```bash
     npm install
     ```
   - Start the development server:
     ```bash
     npm run dev
     ```

4. **Access the App:**
   - Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

- Sign up or sign in to your account.
- Start a focus session and allow webcam access.
- Receive real-time feedback on your focus and emotion.
- Review your session stats at the end.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Material UI, Firebase Auth
- **Backend:** FastAPI, SQLAlchemy, SQLite, OpenCV, ONNX Runtime, TensorFlow/Keras
- **Machine Learning:** Custom-trained emotion detection model (FER2013)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for bug fixes, new features, or improvements.

## License

This project is licensed under the MIT License.

---

**StudySync** — Stay focused. Study smarter. Achieve more.