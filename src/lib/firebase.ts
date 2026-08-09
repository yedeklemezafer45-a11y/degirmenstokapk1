import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDKLLqnfmIja09ySisrLeDaf0l4h5J8P6A",
  authDomain: "degirmen-cafe.firebaseapp.com",
  projectId: "degirmen-cafe",
  storageBucket: "degirmen-cafe.firebasestorage.app",
  messagingSenderId: "596759224337",
  appId: "1:596759224337:web:551dade88b64ff0ff2d1b0"
};

// Duplicate app init önlemi (Next.js hot-reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
