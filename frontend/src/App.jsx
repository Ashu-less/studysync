import { useState, useRef } from "react";
import Webcam from "react-webcam";
import {
  startSession,
  endSession,
  logFocus,
  analyzeFocus,
} from "./services/api";
import './index.css';

function App() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [focusPercentage, setFocusPercentage] = useState(0);
  const webcamRef = useRef(null);
  const intervalRef = useRef();

  const handleStartSession = async () => {
    try {
      const data = await startSession();
      setSession(data);
      setIsSessionActive(true);
      startFocusTracking();
    } catch (err) {
      setError("Failed to start session. Is FastAPI running?");
    }
  };

  const handleEndSession = async () => {
    try {
      const data = await endSession(session.session_id);
      setFocusPercentage(data.focus_percent);
      setIsSessionActive(false);
      clearInterval(intervalRef.current);
    } catch (err) {
      setError("Failed to end session");
    }
  };

  const checkFocus = async () => {
    if (!webcamRef.current) return;
    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) return;
    const blob = await (await fetch(screenshot)).blob();
    try {
      const focusResult = await analyzeFocus(blob);
      await logFocus(session.session_id, focusResult.focused);
    } catch (err) {}
  };

  const startFocusTracking = () => {
    intervalRef.current = setInterval(checkFocus, 5000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="w-full bg-black py-5 shadow-lg flex justify-center items-center">
        <span className="text-white text-3xl font-extrabold tracking-widest">StudySync</span>
      </nav>
      {/* Split Layout */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Left: Info/Marketing */}
        <section className="md:w-1/2 bg-black text-white flex flex-col justify-center px-8 py-12">
          <div className="max-w-lg mx-auto">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              Stay Focused, <span className="text-indigo-400">Stay Winning</span>
            </h1>
            <p className="text-lg mb-8 text-gray-300">
              StudySync uses your webcam and AI to help you lock in and maximize your productivity. 
              Track your focus, get real-time feedback, and see your improvement over time.
            </p>
            <ul className="mb-8 space-y-3">
              <li className="flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 mr-3"></span>
                <span>AI-powered focus detection</span>
              </li>
              <li className="flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 mr-3"></span>
                <span>Session analytics & progress tracking</span>
              </li>
              <li className="flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 mr-3"></span>
                <span>Simple, privacy-first design</span>
              </li>
            </ul>
            <div className="text-gray-400 text-sm">
              <span className="font-semibold">Why StudySync?</span> <br />
              <span>
                Because your time is valuable. Let technology help you build better study habits and achieve your goals.
              </span>
            </div>
          </div>
        </section>
        {/* Right: Camera & Controls */}
        <section className="md:w-1/2 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 py-12">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
            {error && (
              <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-center font-semibold">
                {error}
              </div>
            )}
            <div className="flex flex-col items-center">
              <div className="w-64 h-64 rounded-2xl overflow-hidden shadow-lg border-4 border-indigo-100 mb-6 bg-gray-100">
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover"
                  mirrored={true}
                />
              </div>
              <div className="flex gap-6 mb-6">
                {!isSessionActive ? (
                  <button
                    onClick={handleStartSession}
                    className="px-8 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold text-lg shadow-lg hover:from-indigo-600 hover:to-blue-600 transition"
                  >
                    Start Session
                  </button>
                ) : (
                  <button
                    onClick={handleEndSession}
                    className="px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold text-lg shadow-lg hover:from-pink-600 hover:to-red-600 transition"
                  >
                    End Session
                  </button>
                )}
              </div>
              {session && (
                <div className="mb-4 text-center">
                  <div className="text-gray-600 text-sm">
                    <span className="font-semibold">Session ID:</span>{" "}
                    {session.session_id}
                  </div>
                  <div className="text-gray-600 text-sm">
                    <span className="font-semibold">Started:</span>{" "}
                    {new Date(session.start_time).toLocaleString()}
                  </div>
                </div>
              )}
              {focusPercentage > 0 && (
                <div className="mt-6 w-full bg-gradient-to-r from-green-100 to-green-50 p-6 rounded-2xl shadow text-center">
                  <h2 className="text-2xl font-bold text-green-700 mb-2">
                    Session Results
                  </h2>
                  <p className="text-lg text-green-800 font-semibold">
                    Focus Percentage:{" "}
                    <span className="text-3xl">{focusPercentage}%</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      {/* Footer */}
      <footer className="py-4 text-center text-gray-400 text-sm bg-black">
        &copy; {new Date().getFullYear()} StudySync &mdash; Built for your best self.
      </footer>
    </div>
  );
}

export default App;
