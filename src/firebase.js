
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZEi39c-YctCiYKyCIhqHcdVY1-iaZ1Ro",
  authDomain: "bem-ousada-backend.firebaseapp.com",
  projectId: "bem-ousada-backend",
  storageBucket: "bem-ousada-backend.appspot.com",
  messagingSenderId: "1076434771711",
  appId: "1:1076434771711:web:a7f8e5e93b63e2a2d3f6ca"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };