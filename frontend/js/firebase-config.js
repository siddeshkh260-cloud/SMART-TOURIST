// Firebase Configuration & Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, updateProfile,
  GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, collection,
  query, where, getDocs, deleteDoc, updateDoc, arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCDcaXYIO-lDB_WJcyJrMCBG6ww9nRrY8w",
  authDomain: "smart-attendance-26e62.firebaseapp.com",
  databaseURL: "https://smart-attendance-26e62-default-rtdb.firebaseio.com",
  projectId: "smart-attendance-26e62",
  storageBucket: "smart-attendance-26e62.firebasestorage.app",
  messagingSenderId: "421373704972",
  appId: "1:421373704972:web:98139ca74bcb3e62212729",
  measurementId: "G-WFJM11RJTV"
};

let app, auth, db, googleProvider;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} catch(err) {
  console.warn("Firebase initialization warning (using local fallback mode):", err);
}

window._firebase = {
  app, auth, db, googleProvider,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, updateProfile, signInWithPopup, sendPasswordResetEmail,
  doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, updateDoc, arrayUnion
};

if (auth) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      window.currentUser = user;
      let role = 'tourist';
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists() && snap.data().role) {
          role = snap.data().role;
        }
      } catch(e) {}
      window.currentUserRole = role;
      if (window.handleUserAuthenticated) {
        window.handleUserAuthenticated(user, role);
      }
    } else {
      window.currentUser = null;
      window.currentUserRole = null;
      if (window.handleUserSignedOut) {
        window.handleUserSignedOut();
      }
    }
  });
}
