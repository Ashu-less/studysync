import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Box, AppBar, Toolbar, Typography, Button, Drawer, List, ListItem, ListItemIcon, ListItemText, CssBaseline, Container, Divider } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import HistoryIcon from '@mui/icons-material/History';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HomePage from "./pages/HomePage";
import FocusPage from "./pages/FocusPage";
import HistoryPage from "./pages/HistoryPage";
import SignIn from "./SignIn";
import SignUp from "./SignUp";

const drawerWidth = 220;

function Sidebar({ onNavigate, selected }) {
  const navItems = [
    { label: "Home", icon: <HomeIcon />, path: "/" },
    { label: "Focus", icon: <TrackChangesIcon />, path: "/focus" },
    { label: "History", icon: <HistoryIcon />, path: "/history" },
  ];
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', background: '#181a29', color: 'white' },
      }}
    >
      <Toolbar sx={{ minHeight: 64 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#7fb3ff' }}>
          StudySync
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: '#23263a' }} />
      <List>
        {navItems.map((item, idx) => (
          <ListItem button key={item.label} selected={selected === item.path} onClick={() => onNavigate(item.path)} sx={{ my: 1, borderRadius: 2, '&.Mui-selected': { background: '#23263a' } }}>
            <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

function TopBar({ onSignIn, onSignUp }) {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, background: 'linear-gradient(to right, #1e293b, #181a29)' }}>
      <Toolbar sx={{ justifyContent: 'flex-end' }}>
        <Button color="inherit" startIcon={<LoginIcon />} onClick={onSignIn} sx={{ mr: 2 }}>Sign In</Button>
        <Button color="secondary" variant="contained" startIcon={<PersonAddIcon />} onClick={onSignUp}>Sign Up</Button>
      </Toolbar>
    </AppBar>
  );
}

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Sidebar navigation handler
  const handleNavigate = (path) => {
    navigate(path);
  };

  // Top bar handlers
  const handleSignIn = () => navigate("/signin");
  const handleSignUp = () => navigate("/signup");

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#101223' }}>
      <CssBaseline />
      <TopBar onSignIn={handleSignIn} onSignUp={handleSignUp} />
      <Sidebar onNavigate={handleNavigate} selected={location.pathname} />
      <Box component="main" sx={{ flexGrow: 1, p: 4, ml: `${drawerWidth}px`, mt: 8, color: 'white', minHeight: '100vh', background: '#101223' }}>
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
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
        <Route path="/signin" element={<Layout><SignIn /></Layout>} />
        <Route path="/signup" element={<Layout><SignUp /></Layout>} />
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
