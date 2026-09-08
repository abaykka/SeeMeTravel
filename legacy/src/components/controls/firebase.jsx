// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyCMuspIoSpECBlwh4z4n9u3FLF4hIF4ggg",
  authDomain: "my-earth-49307.firebaseapp.com",
  projectId: "my-earth-49307",
  storageBucket: "my-earth-49307.appspot.com",
  messagingSenderId: "223679483384",
  appId: "1:223679483384:web:4bbea14c102e5a70f39a0d",
  measurementId: "G-ST8J2200J4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

export const storage = getStorage(app);
export const db = getFirestore(app);
