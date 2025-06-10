import './index.css';
import Webcam from "react-webcam";
import { useState, useRef } from "react";

function Feature({ icon, title, desc }) {
  return (
    <div className="card flex flex-col items-center text-center gap-2">
      <div className="text-3xl text-indigo-400">{icon}</div>
      <div className="font-bold text-gray-100">{title}</div>
      <div className="text-gray-400 text-sm">{desc}</div>
    </div>
  );
}

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const webcamRef = useRef(null);

  return (
    <div className="min-h-screen bg-[#0a0a12] flex flex-col">
      <nav className="navbar">
        <span className="navbar-title">StudySync</span>
        <div className="ml-auto flex gap-6">
          <a href="#" className="text-gray-300 hover:text-indigo-400 font-medium transition">Home</a>
          <a href="#" className="text-gray-300 hover:text-indigo-400 font-medium transition">About</a>
          <a href="#" className="text-gray-300 hover:text-indigo-400 font-medium transition">Features</a>
          <a href="#" className="text-gray-300 hover:text-indigo-400 font-medium transition">Contact</a>
          <button className="btn btn-primary ml-4">Sign Up</button>
        </div>
      </nav>
      <section className="flex flex-col md:flex-row items-center justify-between px-8 py-16 bg-gradient-to-br from-[#15172b] to-[#1e293b] border-b border-blue-900">
        <div className="flex-1 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-100 mb-4 leading-tight">
            Enhance Your Focus, <br className="hidden md:block" />
            <span className="text-gradient">Master Your Code.</span>
          </h1>
          <p className="text-lg text-gray-400 mb-8">
            Leverage AI-powered camera detection to maintain concentration during deep work and study sessions. Maximize productivity and learning retention with real-time feedback.
          </p>
          <div className="flex gap-4">
            <button className="btn btn-primary">Try the Focus Detector</button>
            <button className="btn btn-danger">Learn More</button>
          </div>
        </div>
        <div className="flex-1 flex justify-center mt-10 md:mt-0">
          <div className="rounded-2xl overflow-hidden shadow-strong border-4 border-blue-900 bg-[#15172b]">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-72 h-56 object-cover"
              mirrored={true}
              style={{ filter: isSessionActive ? "none" : "grayscale(1) blur(2px)" }}
            />
          </div>
        </div>
      </section>
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-100 text-center mb-10">Why Choose StudySync?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Feature
            icon="🎯"
            title="Enhanced Focus"
            desc="AI-powered detection helps you stay on track and maximize your study sessions."
          />
          <Feature
            icon="⚡"
            title="Real-time Feedback"
            desc="Instant alerts notify you when your concentration drifts, allowing for immediate correction."
          />
          <Feature
            icon="📈"
            title="Progress Tracking"
            desc="Monitor your focus levels and productivity trends over time with insightful analytics."
          />
          <Feature
            icon="🔔"
            title="Customizable Alerts"
            desc="Tailor notification patterns and intensity to fit your personal study preferences."
          />
          <Feature
            icon="🔒"
            title="Privacy First"
            desc="All processing occurs locally on your device, ensuring your data remains private and secure."
          />
          <Feature
            icon="🔗"
            title="Seamless Integration"
            desc="Works effortlessly with your existing workflow, no complex configuration required."
          />
        </div>
      </section>
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-100 text-center mb-10">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card flex flex-col items-center text-center">
            <div className="text-3xl text-indigo-400 mb-2">📷</div>
            <div className="font-bold text-gray-100 mb-1">Activate Camera</div>
            <div className="text-gray-400 text-sm">Enable your webcam within the app. Our AI begins analyzing your posture and gaze.</div>
          </div>
          <div className="card flex flex-col items-center text-center">
            <div className="text-3xl text-indigo-400 mb-2">🚀</div>
            <div className="font-bold text-gray-100 mb-1">Start Session</div>
            <div className="text-gray-400 text-sm">Begin your coding or study session. The detector quietly works in the background.</div>
          </div>
          <div className="card flex flex-col items-center text-center">
            <div className="text-3xl text-indigo-400 mb-2">💡</div>
            <div className="font-bold text-gray-100 mb-1">Get Feedback</div>
            <div className="text-gray-400 text-sm">Receive subtle, real-time alerts if your focus wavers, helping you re-engage instantly.</div>
          </div>
        </div>
      </section>
      <section className="py-16 px-4 flex flex-col items-center justify-center bg-gradient-to-br from-[#15172b] to-[#1e293b] border-t border-blue-900">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-100 mb-4 text-center">
          Ready to Elevate Your Study Sessions?
        </h2>
        <p className="text-lg text-gray-400 mb-8 text-center max-w-2xl">
          Join hundreds of developers boosting their focus and productivity with StudySync. Sign up now and transform your workflow!
        </p>
        <button className="btn btn-primary">Sign Up For Free</button>
      </section>
      <footer className="footer">
        &copy; {new Date().getFullYear()} StudySync &mdash; All rights reserved.
      </footer>
    </div>
  );
}
