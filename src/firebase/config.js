import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA5pH70jx9S17gKVATj8vNZ0KJU5FnYGWA",
  authDomain: "mostakan-dashboard.firebaseapp.com",
  projectId: "mostakan-dashboard",
  appId: "1:412960732355:web:bcece78a2c4ea460d59e76",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;