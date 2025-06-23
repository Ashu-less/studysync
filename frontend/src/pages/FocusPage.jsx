import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { Box, Paper, Typography, Button, Chip, Alert, Grid, CircularProgress, Snackbar } from "@mui/material";
import { mapEmotionToStudyState } from "../App";
import { startSession, endSession, predictEmotion, analyzeFocusAndLog } from "../services/api";

/**
 * FocusPage component for real-time focus tracking using webcam and emotion detection.
 * Allows users to start and stop study sessions, see live study state, and review emotion history.
 * @returns {JSX.Element} The rendered FocusPage component.
 */
export default function FocusPage() {
  const [sessionId, setSessionId] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [studyState, setStudyState] = useState(null);
  const [emotionConfidence, setEmotionConfidence] = useState(0);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // For general errors
  const [snackbarOpen, setSnackbarOpen] = useState(false); // For Snackbar messages
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  const webcamRef = useRef(null);
  const analysisIntervalRef = useRef(null); // Ref to hold the interval ID

  /**
   * Shows a snackbar message to the user.
   * @param {string} message - The message to display.
   * @param {string} severity - The severity of the message (e.g., 'success', 'error', 'info', 'warning').
   */
  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  /**
   * Handles the start of a study session.
   * Calls the backend API to create a new session.
   */
  const handleStartSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await startSession();
      setSessionId(data.session_id);
      setIsSessionActive(true);
      setEmotionHistory([]); // Clear history for new session
      setStudyState(null);
      setEmotionConfidence(0);
      showSnackbar("Study session started!", "success");
    } catch (err) {
      setError("Failed to start session. Please try again.");
      showSnackbar("Failed to start session.", "error");
      console.error("Start session error:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the stop of a study session.
   * Calls the backend API to end the session.
   */
  const handleStopSession = async () => {
    if (!sessionId) {
      showSnackbar("No active session to stop.", "warning");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Clear the interval first to stop further analysis
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }

      await endSession(sessionId);
      setIsSessionActive(false);
      setSessionId(null);
      setStudyState(null);
      setEmotionConfidence(0);
      showSnackbar("Study session ended.", "success");
    } catch (err) {
      setError("Failed to stop session. Please try again.");
      showSnackbar("Failed to stop session.", "error");
      console.error("Stop session error:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Effect hook to manage the webcam stream and periodic focus analysis.
   * Runs when `isSessionActive` or `sessionId` changes.
   */
  useEffect(() => {
    const startAnalysis = async () => {
      if (!webcamRef.current) {
        console.warn("Webcam reference not available.");
        showSnackbar("Webcam not ready. Ensure camera is connected and permissions are granted.", "warning");
        return;
      }

      // Capture screenshot
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        console.warn("No image captured from webcam.");
        // Consider showing a warning to the user if this happens frequently
        return;
      }

      try {
        // Convert base64 image to Blob for FormData
        const blob = await (await fetch(imageSrc)).blob();

        // 1. Send to Flask for raw emotion prediction
        const emotionResult = await predictEmotion(imageSrc);
        const dominantEmotion = emotionResult.emotion;
        const confidence = emotionResult.confidence;

        // 2. Send to FastAPI for focus analysis and logging to DB
        // The `analyzeFocusAndLog` now takes the sessionId and image blob
        const focusAnalysisResult = await analyzeFocusAndLog(sessionId, blob);

        setStudyState(focusAnalysisResult.study_state || mapEmotionToStudyState(dominantEmotion)); // Use FastAPI's study_state if available
        setEmotionConfidence(confidence);

        // Update emotion history with the latest dominant emotion and timestamp
        setEmotionHistory(prevHistory => {
          const now = new Date();
          // Keep only the last 20 entries for display to avoid clutter
          return [...prevHistory, { emotion: dominantEmotion, timestamp: now.toLocaleTimeString() }].slice(-20);
        });

      } catch (err) {
        console.error("Focus analysis error:", err);
        // Do not set global error to avoid disrupting continuous flow, use snackbar
        showSnackbar(`Analysis failed: ${err.message}`, "error");
      }
    };

    if (isSessionActive && sessionId) {
      // Clear any existing interval before setting a new one
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      // Start polling for focus analysis every 3 seconds
      analysisIntervalRef.current = setInterval(startAnalysis, 3000);
    } else {
      // Clear interval when session is not active
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    }

    // Cleanup function to clear interval when component unmounts or dependencies change
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [isSessionActive, sessionId, showSnackbar]); // Added showSnackbar to dependencies


  // Handle Snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ py: 6 }}>
      <Typography variant="h3" gutterBottom sx={{ color: '#7fb3ff', fontWeight: 'bold' }}>Focus Tracking</Typography>
      <Typography variant="body1" color="gray" paragraph>
        Monitor your focus and emotional state in real-time during your study sessions.
      </Typography>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        {/* Left pane: Webcam feed and controls */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ border: '4px solid #1e40af', borderRadius: 4, overflow: 'hidden', height: 480, backgroundColor: '#23263a', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {loading && <CircularProgress sx={{ color: '#7fb3ff' }} size={60} />}
            {!loading && (
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user" }} // Use front camera
                onUserMedia={() => showSnackbar("Webcam feed active!", "success")}
                onUserMediaError={(err) => {
                  console.error("Webcam error:", err);
                  setError("Camera access denied or failed. Please allow camera permissions.");
                  showSnackbar("Camera access denied or failed.", "error");
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: isSessionActive ? "none" : "grayscale(1) blur(4px)",
                  transform: 'scaleX(-1)' // Mirror the webcam feed
                }}
              />
            )}
          </Paper>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartSession}
              disabled={isSessionActive || loading}
              sx={{ px: 4, py: 1.5, borderRadius: 2, fontSize: '1.1rem' }}
            >
              {loading && !isSessionActive ? <CircularProgress size={24} color="inherit" /> : "Start Session"}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleStopSession}
              disabled={!isSessionActive || loading}
              sx={{ px: 4, py: 1.5, borderRadius: 2, fontSize: '1.1rem' }}
            >
              {loading && isSessionActive ? <CircularProgress size={24} color="inherit" /> : "Stop Session"}
            </Button>
          </Box>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%', justifyContent: 'center' }}>
              {error}
            </Alert>
          )}
        </Grid>

        {/* Right pane: Current State and History */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, backgroundColor: '#23263a', color: 'white', borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ color: '#7fb3ff', mb: 2 }}>Current State</Typography>
            {isSessionActive && studyState && (
              <Alert severity="info" sx={{ mt: 1, backgroundColor: '#4a148c', color: 'white', '& .MuiAlert-icon': { color: 'white' } }}>
                Your study state: <strong>{studyState}</strong>
                {emotionConfidence > 0 && ` (Confidence: ${(emotionConfidence * 100).toFixed(1)}%)`}
              </Alert>
            )}
            {isSessionActive && !studyState && (
              <Alert severity="warning" sx={{ mt: 1, backgroundColor: '#ff9800', color: 'white', '& .MuiAlert-icon': { color: 'white' } }}>
                Analyzing... Waiting for initial data.
              </Alert>
            )}
            {!isSessionActive && (
              <Alert severity="error" sx={{ mt: 1, backgroundColor: '#d32f2f', color: 'white', '& .MuiAlert-icon': { color: 'white' } }}>
                Session not active. Click "Start Session" to begin.
              </Alert>
            )}

            <Typography variant="h6" sx={{ mt: 4, color: '#7fb3ff', mb: 2 }}>Emotion History</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, maxHeight: 200, overflowY: 'auto' }}>
              {emotionHistory.length > 0 ? (
                emotionHistory.map((entry, index) => (
                  <Chip
                    key={index}
                    label={`${entry.emotion} (${entry.timestamp})`}
                    color={entry.emotion === 'neutral' ? 'success' : entry.emotion === 'happy' ? 'primary' : 'warning'}
                    sx={{
                      fontSize: '0.8rem',
                      px: 1,
                      py: 0.5,
                      height: 'auto',
                      borderRadius: '8px',
                      '& .MuiChip-label': {
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                      },
                    }}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">No emotion data yet. Start a session!</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
