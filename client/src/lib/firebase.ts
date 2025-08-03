import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Check if Firebase environment variables are available and valid
const hasValidFirebaseConfig = () => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  
  return apiKey && projectId && 
         apiKey !== 'your-api-key' && 
         projectId !== 'your-project-id' &&
         apiKey.length > 10; // Basic validation for API key length
};

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

if (hasValidFirebaseConfig()) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.warn("Firebase initialization failed, app will work without Firebase features:", error);
  }
} else {
  console.warn("Firebase configuration is missing or invalid. App will work in database-only mode.");
}

export { auth, db, storage };
export default app;
