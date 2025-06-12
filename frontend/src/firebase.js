import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBFOEze0apxIauIpE4xF3iiMmWWh1Ll0dw",
  authDomain: "studysync-2c489.firebaseapp.com",
  projectId: "studysync-2c489",
  storageBucket: "studysync-2c489.firebasestorage.app",
  messagingSenderId: "882845774974",
  appId: "1:882845774974:web:2b5cb923632d5c4b8cd42f",
  measurementId: "G-6494FMN0M4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
