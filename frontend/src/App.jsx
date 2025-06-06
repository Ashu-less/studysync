import { useEffect, useState, useRef } from "react";
import Webcam from "react-webcam";
import {
  startSession,
  endSession,
  logFocus,
  analyzeFocus,
} from "./services/api";

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
      console.error("Error starting session:", err);
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
      console.error("Error ending session:", err);
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
    } catch (err) {
      console.error("Focus check failed:", err);
    }
  };

  const startFocusTracking = () => {
    intervalRef.current = setInterval(checkFocus, 5000);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-bold text-center mb-6">StudySync</h1>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <div className="mb-4">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full rounded-lg border"
            mirrored={true}
          />
        </div>

        <div className="flex justify-center space-x-4">
          {!isSessionActive ? (
            <button
              onClick={handleStartSession}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
            >
              Start Session
            </button>
          ) : (
            <button
              onClick={handleEndSession}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
            >
              End Session
            </button>
          )}
        </div>

        {focusPercentage > 0 && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-2">Session Results</h2>
            <p className="text-lg">Focus Percentage: {focusPercentage}%</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
