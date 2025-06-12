import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";

// Button component (copy the style from App.jsx)
function Button({ children, variant = "primary", className = "", ...props }) {
  const base =
    "btn font-bold rounded-full px-6 py-2 text-lg shadow-xl transition";
  const variants = {
    primary:
      "bg-gradient-to-r from-sky-400 to-blue-400 text-white hover:from-sky-300 hover:to-blue-300 border-blue-200",
    danger:
      "bg-gradient-to-r from-pink-400 to-red-400 text-white hover:from-pink-300 hover:to-red-300 border-pink-200",
    outline:
      "bg-transparent border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white",
  };
  return (
    <button
      className={`${base} ${variants[variant] || ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default function SignIn({ onSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      console.log("Attempting sign-in with email:", email); // Debug log
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Sign-in successful"); // Debug log
      if (onSignIn) onSignIn();
      navigate("/");
    } catch (err) {
      console.error("Sign-in error:", err); // Debug log
      setError(err.message);
    }
  };

  return (
    <form className="card max-w-sm mx-auto mt-10" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-4">Sign In</h2>
      {error && <div className="text-red-400 mb-2">{error}</div>}
      <input
        className="w-full mb-3 p-2 rounded bg-[#181a29] border border-blue-900 text-white placeholder-gray-400"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="w-full mb-3 p-2 rounded bg-[#181a29] border border-blue-900 text-white placeholder-gray-400"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button
        variant=""
        className="w-full font-semibold bg-white text-blue-500 border-none px-4 py-2 mb-2"
        type="submit"
      >
        Sign In
      </Button>
      <div className="mt-4 text-center">
        <span>Don't have an account? </span>
        <Button
          type="button"
          variant=""
          className="ml-2 inline-block font-semibold underline bg-white text-blue-500 border-none px-4 py-1"
          onClick={() => navigate("/signup")}
        >
          Sign Up
        </Button>
      </div>
    </form>
  );
}
