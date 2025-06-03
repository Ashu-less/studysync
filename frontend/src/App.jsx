import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Webcam from "react-webcam";

function App() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [focusPercentage, setFocusPercentage] = useState(0);
  const webcamRef = useRef(null);
  const intervalRef = useRef();

  const startSession = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:8000/start_session");
      setSession(response.data);
      setIsSessionActive(true);
      startFocusTracking();
    } catch (err) {
      console.error("Error starting session:", err);
      setError("Failed to start session. Is FastAPI running?");
    }
  };

  const endSession = async () => {
    if (session?.session_id) {
      try {
        const response = await axios.post(
          `http://127.0.0.1:8000/end_session`,
          {},
          { params: { session_id: session.session_id } }
        );
        setFocusPercentage(response.data.focus_percent);
        setIsSessionActive(false);
        clearInterval(intervalRef.current);
      } catch (err) {
        setError("Failed to end session");
      }
    }
  };

  const checkFocus = async () => {
    if (webcamRef.current) {
      const screenshot = webcamRef.current.getScreenshot();

      if (screenshot) {
        const blob = await (await fetch(screenshot)).blob();
        const formData = new FormData();
        formData.append("file", blob, "screenshot.jpg");

        try {
          const response = await axios.post(
            "http://127.0.0.1:8000/analyze_focus/",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          if (session?.session_id) {
            await axios.post(
              `http://127.0.0.1:8000/log_focus`,
              {},
              {
                params: {
                  session_id: session.session_id,
                  focused: response.data.focused,
                },
              }
            );
          }
        } catch (err) {
          console.error("Focus check failed:", err);
        }
      }
    }
  };

  const startFocusTracking = () => {
    intervalRef.current = setInterval(checkFocus, 5000);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>StudySync</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginBottom: "2rem" }}>
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          style={{ width: "100%", borderRadius: "8px" }}
          mirrored={true}
        />
      </div>

      <div style={{ textAlign: "center" }}>
        {!isSessionActive ? (
          <button
            onClick={startSession}
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Start Session
          </button>
        ) : (
          <button
            onClick={endSession}
            style={{
              backgroundColor: "#f44336",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            End Session
          </button>
        )}
      </div>

      {focusPercentage > 0 && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <h2>Session Results</h2>
          <p>Focus Percentage: {focusPercentage}%</p>
        </div>
      )}
    </div>
  );
}

export default App;
