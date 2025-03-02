

  import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyACcbgRj7hMFvWcY4bmfpAuu229rHqF2iA",
    authDomain: "botfolio9.firebaseapp.com",
    projectId: "botfolio9",
    storageBucket: "botfolio9.firebasestorage.app", // ✅ Ensure this matches your Firebase Storage URL
    messagingSenderId: "99312083485",
    appId: "1:99312083485:web:04191a659700162fc5dcf4",
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const storage = getStorage(app);

export { auth, provider, storage };
