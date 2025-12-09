import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCWs32-rlQt5KSTMS9ZR2Sg9uLgd97Sngw",
  authDomain: "sostek2025.firebaseapp.com",
  projectId: "sostek2025",
  storageBucket: "sostek2025.firebasestorage.app",
  messagingSenderId: "16565057926",
  appId: "1:16565057926:web:f244cc0b37851a86635407",
  measurementId: "G-XC73CJRCQW"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
