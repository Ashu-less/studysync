import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import { Box, Paper, Typography, Button, Chip, Alert, Grid } from "@mui/material";
import { mapEmotionToStudyState } from "../App";
import { startSession, analyzeFocus } from "../services/api";

export default function FocusPage() {
  const [sessionId, setSessionId] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [studyState, setStudyState] = useState(null);
  const [emotionConfidence, setEmotionConfidence] = useState(0);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const webcamRef = useRef(null);

  const handleStartSession = async () => {
    const data = await startSession();
    setSessionId(data.session_id);
    setIsSessionActive(true);
  };

  const handleStopSession = () => {
    setIsSessionActive(false);
    setSessionId(null);
    setStudyState(null);
  };

  useEffect(() => {
    let interval;
    if (isSessionActive && sessionId) {
      interval = setInterval(async () => {
        if (webcamRef.current) {
          const imageSrc = webcamRef.current.getScreenshot();
          if (imageSrc) {
            try {
              const blob = await (await fetch(imageSrc)).blob();
              const file = new File([blob], "screenshot.jpg", { type: "image/jpeg" });
              const data = await analyzeFocus(file);
              setStudyState(data.study_state);
              // Assuming confidence is part of the response now
              // setEmotionConfidence(data.confidence); 
              setEmotionHistory(prev => [...prev.slice(-9), {
                state: data.study_state,
                timestamp: new Date().toLocaleTimeString()
              }]);
            } catch (error) {
              console.error("Error analyzing focus:", error);
            }
          }
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, sessionId]);

  return (
    <Box sx={{ py: 6, px: 4, color: 'white' }}>
      <Typography variant="h3" gutterBottom>Focus Session</Typography>
      <Typography variant="body1" color="gray" paragraph>
        Start a session to begin tracking your focus and emotional state.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 2, mb: 4 }}>
        <Button variant="contained" onClick={handleStartSession} disabled={isSessionActive}>Start Session</Button>
        <Button variant="outlined" onClick={handleStopSession} disabled={!isSessionActive}>Stop Session</Button>
      </Box>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ border: '4px solid #1e40af', borderRadius: 4, overflow: 'hidden', height: 480, backgroundColor: '#23263a' }}>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isSessionActive ? "none" : "grayscale(1) blur(4px)" }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="h6">Current State</Typography>
          {isSessionActive && studyState && (
            <Alert severity="info" sx={{ mt: 1 }}>
              {studyState}
            </Alert>
          )}
          {isSessionActive && !studyState && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Waiting for data...
            </Alert>
          )}
          {!isSessionActive && (
            <Alert severity="error" sx={{ mt: 1 }}>
              Session not active.
            </Alert>
          )}

          <Typography variant="h6" sx={{ mt: 4 }}>History</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {emotionHistory.map((entry, index) => (
              <Chip
                key={index}
                label={`${entry.state} (${entry.timestamp})`}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
} 