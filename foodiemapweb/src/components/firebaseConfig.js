// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// Import Firestore and other Firebase services
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKtJVdxpq6WmukVLBnI4uWZd88hgP9ghg",
  authDomain: "foodiemapweb.firebaseapp.com",
  projectId: "foodiemapweb",
  storageBucket: "foodiemapweb.firebasestorage.app",
  messagingSenderId: "866735208409",
  appId: "1:866735208409:web:bdcccd03246c7dff8c4bc8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);  // This initializes Firestore

// You can now use Firestore in your app using the 'db' variable

export { db };  // Export db to use it elsewhere in your app
