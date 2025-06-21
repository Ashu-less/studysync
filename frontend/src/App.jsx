import React, { useState, useRef, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Webcam from "react-webcam";
import { auth } from "./firebase";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import { AppBar, Toolbar, Typography, Button, Container, Grid, Paper, Box, CircularProgress, Chip, Alert, Tabs, Tab, IconButton } from "@mui/material";
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import HomePage from "./pages/HomePage";
import FocusPage from "./pages/FocusPage";
import HistoryPage from "./pages/HistoryPage";

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

function Layout({ children }) {
  const [tab, setTab] = React.useState(0);
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    if (newValue === 0) navigate("/");
    if (newValue === 1) navigate("/focus");
    if (newValue === 2) navigate("/history");
  };

  return (
    <Box sx={{ bgcolor: '#101223', minHeight: '100vh', color: 'white' }}>
      <AppBar position="sticky" sx={{ background: 'linear-gradient(to bottom, #1e293b, #181a29)' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton color="inherit" edge="start" sx={{ mr: 1 }}>
              <CameraAltIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>StudySync</Typography>
          </Box>
          <Tabs value={tab} onChange={handleTabChange} textColor="inherit" indicatorColor="secondary">
            <Tab label="Home" />
            <Tab label="Focus" />
            <Tab label="History" />
          </Tabs>
          <Box>
            <Button color="inherit" onClick={() => navigate("/signin")}>Sign In</Button>
            <Button color="error" variant="contained" onClick={() => navigate("/signup")}>Sign Up</Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Container>
        {children}
      </Container>
    </Box>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/focus" element={<Layout><FocusPage /></Layout>} />
        <Route path="/history" element={<Layout><HistoryPage /></Layout>} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

// --- Helper for mapping emotion to study state ---
export function mapEmotionToStudyState(emotion) {
  const mapping = {
    angry: 'Frustrated',
    disgust: 'Frustrated',
    fear: 'Anxious / Overwhelmed',
    sad: 'Anxious / Overwhelmed',
    neutral: 'Zoned Out / Passive',
    happy: 'Motivated / Engaged',
    surprise: 'Distracted / Alert',
  };
  return mapping[emotion] || 'Unknown';
}
