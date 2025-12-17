// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyATbaWB08s1gUT2YisAvhhSIphorjZ-XNY", // <--- REPLACE THIS
  authDomain: "medverify-hackathon.firebaseapp.com", // <--- REPLACE THIS
  projectId: "medverify-hackathon", // <--- REPLACE THIS
  storageBucket: "medverify-hackathon.firebasestorage.app", // <--- REPLACE THIS
  messagingSenderId: "164639541948", // <--- REPLACE THIS
  appId: "1:164639541948:web:91206ca5cf5b45eccd1eb9" // <--- REPLACE THIS
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the Firestore service
export const db = getFirestore(app);

// You can also export other services if you need them later, e.g.:
// export const auth = getAuth(app);
// export const storage = getStorage(app);