import React, { useState, useRef, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Webcam from "react-webcam";
import { auth } from "./firebase";
import SignIn from "./SignIn";
import SignUp from "./SignUp";

// Material UI
import { AppBar, Toolbar, Typography, Button, Container, Grid, Paper, Box, CircularProgress, Chip, Alert } from "@mui/material";

function Feature({ icon, title, desc }) {
  return (
    <Paper elevation={3} sx={{ padding: 3, textAlign: 'center', backgroundColor: '#23263a', color: 'white' }}>
      <Typography variant="h4" sx={{ color: '#7fb3ff' }}>{icon}</Typography>
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{title}</Typography>
      <Typography variant="body2" sx={{ color: '#ccc' }}>{desc}</Typography>
    </Paper>
  );
}

function FocusFeedback({ focused, emotion, emotionConfidence }) {
  if (focused === null && !emotion) return null;
  
  return (
    <Box sx={{ mt: 2, textAlign: 'center' }}>
      {focused !== null && (
        <Typography variant="body1" sx={{ 
          color: focused ? 'green' : 'red', 
          fontWeight: 'bold',
          mb: emotion ? 1 : 0
        }}>
          {focused ? "You are focused!" : "Please look at the screen"}
        </Typography>
      )}
      
      {emotion && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
          <Chip 
            label={`${emotion} (${(emotionConfidence * 100).toFixed(1)}%)`}
            color={getEmotionColor(emotion)}
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
          {getEmotionAdvice(emotion) && (
            <Alert severity={getEmotionSeverity(emotion)} sx={{ mt: 1, maxWidth: 400 }}>
              {getEmotionAdvice(emotion)}
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
}

function getEmotionColor(emotion) {
  const colors = {
    'neutral': 'success',
    'happy': 'success', 
    'surprise': 'info',
    'sad': 'warning',
    'angry': 'error',
    'fear': 'error',
    'disgust': 'error'
  };
  return colors[emotion] || 'default';
}

function getEmotionSeverity(emotion) {
  const severities = {
    'neutral': 'success',
    'happy': 'success',
    'surprise': 'info', 
    'sad': 'warning',
    'angry': 'error',
    'fear': 'error',
    'disgust': 'error'
  };
  return severities[emotion] || 'info';
}

function getEmotionAdvice(emotion) {
  const advice = {
    'neutral': 'Perfect! You\'re in an ideal focused state for studying.',
    'happy': 'Great! You\'re engaged and enjoying your study session.',
    'surprise': 'Interesting! You might be learning something new.',
    'sad': 'Consider taking a short break or switching to a different topic.',
    'angry': 'Take a deep breath. Maybe step away for a few minutes.',
    'fear': 'Don\'t worry! Break down the problem into smaller steps.',
    'disgust': 'Try a different approach or study environment.'
  };
  return advice[emotion];
}

function RequireAuth({ children }) {
  const [user, setUser] = useState(() => auth.currentUser);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <CircularProgress />;
  if (!user) return <Navigate to="/signin" state={{ from: location }} replace />;
  return children;
}

function RedirectIfAuth({ children }) {
  const [user, setUser] = useState(() => auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <CircularProgress />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function Layout() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [focused, setFocused] = useState(null);
  const [emotion, setEmotion] = useState(null);
  const [emotionConfidence, setEmotionConfidence] = useState(0);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const webcamRef = useRef(null);
  const navigate = useNavigate();
  const [user, setUser] = useState(() => auth.currentUser);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      setUser(u);
    });
    return unsub;
  }, []);

  useEffect(() => {
    let interval;
    if (isSessionActive) {
      interval = setInterval(async () => {
        if (webcamRef.current) {
          const imageSrc = webcamRef.current.getScreenshot();
          if (imageSrc) {
            // Try focus detection (existing endpoint)
            try {
              const blob = await (await fetch(imageSrc)).blob();
              const file = new File([blob], "screenshot.jpg", { type: "image/jpeg" });
              const res = await fetch("http://127.0.0.1:8000/analyze_focus/", {
                method: "POST",
                body: (() => {
                  const fd = new FormData();
                  fd.append("file", file);
                  return fd;
                })(),
              });
              const data = await res.json();
              setFocused(data.focused);
            } catch {
              setFocused(null);
            }

            // Try emotion detection (new endpoint)
            try {
              const emotionRes = await fetch("http://localhost:5001/predict_emotion", {
                method: "POST",
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  image: imageSrc
                })
              });
              
              if (emotionRes.ok) {
                const emotionData = await emotionRes.json();
                setEmotion(emotionData.emotion);
                setEmotionConfidence(emotionData.confidence);
                
                // Add to history
                setEmotionHistory(prev => [...prev.slice(-9), {
                  emotion: emotionData.emotion,
                  confidence: emotionData.confidence,
                  timestamp: new Date().toLocaleTimeString()
                }]);
              }
            } catch (error) {
              console.log("Emotion detection not available:", error.message);
            }
          }
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  const handleSignOut = async () => {
    await auth.signOut();
    navigate("/signin");
  };

  return (
    <Box sx={{ bgcolor: '#101223', minHeight: '100vh', color: 'white' }}>
      <AppBar position="sticky" sx={{ background: 'linear-gradient(to bottom, #1e293b, #181a29)' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4da.png" alt="logo" width={40} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>StudySync</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 3 }}>
            {user ? (
              <>
                <Typography>{user.email}</Typography>
                <Button color="error" variant="contained" onClick={handleSignOut}>Sign Out</Button>
              </>
            ) : (
              <>
                <Button variant="contained" onClick={() => navigate("/signin")}>Sign In</Button>
                <Button color="error" variant="contained" onClick={() => navigate("/signup")}>Sign Up</Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 6 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h3" gutterBottom>Enhance Your Focus. <span style={{ background: 'linear-gradient(to right, #38bdf8, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Master Your Code.</span></Typography>
            <Typography variant="body1" color="gray" paragraph>
              Leverage AI-powered camera detection to maintain concentration and track emotional states during deep work and study sessions.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button variant="contained" onClick={() => setIsSessionActive(true)}>Start Session</Button>
              <Button variant="outlined" onClick={() => setIsSessionActive(false)}>Stop Session</Button>
            </Box>
            <FocusFeedback focused={focused} emotion={emotion} emotionConfidence={emotionConfidence} />
            
            {/* Emotion History */}
            {emotionHistory.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Recent Emotions:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {emotionHistory.map((entry, index) => (
                    <Chip
                      key={index}
                      label={`${entry.emotion} (${entry.timestamp})`}
                      size="small"
                      color={getEmotionColor(entry.emotion)}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ border: '4px solid #1e40af', borderRadius: 4, overflow: 'hidden', height: 240, backgroundColor: '#23263a' }}>
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isSessionActive ? "none" : "grayscale(1) blur(2px)" }}
              />
            </Paper>
          </Grid>
        </Grid>

        <Box mt={10}>
          <Typography variant="h4" align="center" gutterBottom>Why Choose StudySync?</Typography>
          <Grid container spacing={4} mt={3}>
            <Feature icon="🎯" title="Enhanced Focus" desc="AI-powered detection helps you stay on track." />
            <Feature icon="😊" title="Emotion Tracking" desc="Monitor your emotional state during study sessions." />
            <Feature icon="⚡" title="Real-time Feedback" desc="Instant alerts notify you when your concentration drifts." />
            <Feature icon="📈" title="Progress Tracking" desc="Track focus levels and emotional trends over time." />
          </Grid>
        </Box>
      </Container>

      <Box sx={{ mt: 10, py: 4, textAlign: 'center', borderTop: '1px solid #1e3a8a', backgroundColor: '#181a29' }}>
        <Typography variant="body2" color="gray">&copy; {new Date().getFullYear()} StudySync — All rights reserved.</Typography>
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        />
        <Route path="/signin" element={<RedirectIfAuth><SignIn /></RedirectIfAuth>} />
        <Route path="/signup" element={<RedirectIfAuth><SignUp /></RedirectIfAuth>} />
      </Routes>
    </Router>
  );
}
