//import './index.css';
import Webcam from "react-webcam";
import { useState, useRef, useEffect } from "react";
import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import { auth } from "./firebase";

function Feature({ icon, title, desc }) {
  return (
    <div className="card flex flex-col items-center text-center gap-2 bg-[#23263a] hover:shadow-strong transition-shadow duration-200">
      <div className="text-3xl text-indigo-400">{icon}</div>
      <div className="font-bold text-white">{title}</div>
      <div className="text-gray-300 text-sm">{desc}</div>
    </div>
  );
}

function FocusFeedback({ focused }) {
  return (
    <div className="mt-4 text-center">
      {focused === null ? null : focused ? (
        <span className="text-green-400 font-bold">You are focused!</span>
      ) : (
        <span className="text-red-400 font-bold">Please look at the screen</span>
      )}
    </div>
  );
}

function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "btn font-bold rounded-full px-6 py-2 text-lg shadow-xl transition-transform duration-200";
  const variants = {
    primary: "bg-gradient-to-r from-sky-400 to-blue-400 text-white hover:scale-105 hover:from-sky-300 hover:to-blue-300 border-blue-200",
    danger: "bg-gradient-to-r from-pink-400 to-red-400 text-white hover:scale-105 hover:from-pink-300 hover:to-red-300 border-pink-200",
    outline: "bg-transparent border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white hover:scale-105",
  };
  return (
    <button className={`${base} ${variants[variant] || ""} ${className}`} {...props}>
      {children}
    </button>
  );
}

function RequireAuth({ children }) {
  const [user, setUser] = useState(() => auth.currentUser);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      console.log("Auth state changed:", u); // Debug log
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <div>Loading...</div>; // Show a loading state while checking auth
  if (!user) return <Navigate to="/signin" state={{ from: location }} replace />;
  return children;
}

function RedirectIfAuth({ children }) {
  const [user, setUser] = useState(() => auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      console.log("Auth state changed:", u); // Debug log
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <div>Loading...</div>; // Show a loading state while checking auth
  if (user) return <Navigate to="/" replace />;
  return children;
}

function Layout() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [focused, setFocused] = useState(null);
  const webcamRef = useRef(null);
  const navigate = useNavigate();
  const [user, setUser] = useState(() => auth.currentUser);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      setUser(u);
    });
    return unsub;
  }, []);

  // Focus detection: periodically send webcam image to backend
  React.useEffect(() => {
    let interval;
    if (isSessionActive) {
      interval = setInterval(async () => {
        if (webcamRef.current) {
          const imageSrc = webcamRef.current.getScreenshot();
          if (imageSrc) {
            const blob = await (await fetch(imageSrc)).blob();
            const file = new File([blob], "screenshot.jpg", { type: "image/jpeg" });
            try {
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
          }
        }
      }, 3000); // every 3 seconds
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  const handleSignOut = async () => {
    await auth.signOut();
    navigate("/signin");
  };

  return (
    <div className="min-h-screen bg-[#101223] flex flex-col">
      <nav className="navbar sticky top-0 z-50 bg-gradient-to-b from-gray-800 via-gray-900 to-[#181a29] border-b border-blue-900 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4da.png" alt="logo" className="w-10 h-10" />
            <span className="navbar-title">StudySync</span>
          </div>
          <div className="flex gap-8 items-center">
            <a href="#" className="text-white hover:text-sky-300 font-semibold text-lg transition">Home</a>
            <a href="#" className="text-white hover:text-sky-300 font-semibold text-lg transition">About</a>
            <a href="#" className="text-white hover:text-sky-300 font-semibold text-lg transition">Features</a>
            <a href="#" className="text-white hover:text-sky-300 font-semibold text-lg transition">Pricing</a>
            <a href="#" className="text-white hover:text-sky-300 font-semibold text-lg transition">Blog</a>
            <a href="#" className="text-white hover:text-sky-300 font-semibold text-lg transition">Contact</a>
          </div>
          <div className="flex gap-3 items-center">
            {user ? (
              <>
                <span className="text-white font-semibold">{user.email}</span>
                <Button variant="danger" onClick={handleSignOut}>Sign Out</Button>
              </>
            ) : (
              <>
                <Button variant="primary" onClick={() => navigate("/signin")}>Sign In</Button>
                <Button variant="danger" onClick={() => navigate("/signup")}>Sign Up</Button>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="flex-1">
        <section className="w-full bg-gradient-to-br from-[#181a29] to-[#23263a] py-20 px-4">
          <div className="container mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 max-w-xl">
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
                Enhance Your Focus, <br className="hidden md:block" />
                <span className="text-gradient">Master Your Code.</span>
              </h1>
              <p className="text-lg text-gray-300 mb-8">
                Leverage AI-powered camera detection to maintain concentration during deep work and study sessions. Maximize productivity and learning retention with real-time feedback.
              </p>
              <div className="flex gap-4">
                <Button
                  variant="primary"
                  className="shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-transform duration-150"
                  onClick={() => setIsSessionActive(true)}
                >
                  Try the Focus Detector
                </Button>
                <Button
                  variant="danger"
                  className="shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-transform duration-150"
                >
                  Learn More
                </Button>
              </div>
              <FocusFeedback focused={focused} />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="rounded-2xl overflow-hidden shadow-strong border-4 border-blue-900 bg-[#23263a] w-80 h-60 flex items-center justify-center">
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover"
                  mirrored={true}
                  style={{ filter: isSessionActive ? "none" : "grayscale(1) blur(2px)" }}
                />
              </div>
            </div>
          </div>
        </section>
        <section className="py-20 px-4 bg-[#181a29]">
          <div className="container mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">Why Choose StudySync?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Feature icon="🎯" title="Enhanced Focus" desc="AI-powered detection helps you stay on track and maximize your study sessions." />
              <Feature icon="⚡" title="Real-time Feedback" desc="Instant alerts notify you when your concentration drifts, allowing for immediate correction." />
              <Feature icon="📈" title="Progress Tracking" desc="Monitor your focus levels and productivity trends over time with insightful analytics." />
              <Feature icon="🔔" title="Customizable Alerts" desc="Tailor notification patterns and intensity to fit your personal study preferences." />
              <Feature icon="🔒" title="Privacy First" desc="All processing occurs locally on your device, ensuring your data remains private and secure." />
              <Feature icon="🔗" title="Seamless Integration" desc="Works effortlessly with your existing workflow, no complex configuration required." />
            </div>
          </div>
        </section>
        <section className="py-20 px-4 bg-[#101223]">
          <div className="container mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card flex flex-col items-center text-center bg-[#23263a]">
                <div className="text-3xl text-indigo-400 mb-2">📷</div>
                <div className="font-bold text-white mb-1">Activate Camera</div>
                <div className="text-gray-300 text-sm">Enable your webcam within the app. Our AI begins analyzing your posture and gaze.</div>
              </div>
              <div className="card flex flex-col items-center text-center bg-[#23263a]">
                <div className="text-3xl text-indigo-400 mb-2">🚀</div>
                <div className="font-bold text-white mb-1">Start Session</div>
                <div className="text-gray-300 text-sm">Begin your coding or study session. The detector quietly works in the background.</div>
              </div>
              <div className="card flex flex-col items-center text-center bg-[#23263a]">
                <div className="text-3xl text-indigo-400 mb-2">💡</div>
                <div className="font-bold text-white mb-1">Get Feedback</div>
                <div className="text-gray-300 text-sm">Receive subtle, real-time alerts if your focus wavers, helping you re-engage instantly.</div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-20 px-4 flex flex-col items-center justify-center bg-gradient-to-br from-[#181a29] to-[#23263a] border-t border-blue-900">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 text-center">
            Ready to Elevate Your Study Sessions?
          </h2>
          <p className="text-lg text-gray-300 mb-8 text-center max-w-2xl">
            Join hundreds of developers boosting their focus and productivity with StudySync. Sign up now and transform your workflow!
          </p>
          <Button className="btn-primary shadow-lg hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-transform duration-150">
            Sign Up For Free
          </Button>
        </section>
      </main>
      <footer className="footer bg-[#181a29] border-t border-blue-900">
        &copy; {new Date().getFullYear()} StudySync &mdash; All rights reserved.
      </footer>
    </div>
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
        <Route
          path="/signin"
          element={
            <RedirectIfAuth>
              <SignIn />
            </RedirectIfAuth>
          }
        />
        <Route
          path="/signup"
          element={
            <RedirectIfAuth>
              <SignUp />
            </RedirectIfAuth>
          }
        />
        {/* ...other routes... */}
      </Routes>
    </Router>
  );
}
