import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: 'AIzaSyBYd01McAqECyq-WyTmvcuPiq-hVywA7lQ',
  authDomain: 'spotify-20a57.firebaseapp.com',
  projectId: 'spotify-20a57',
  storageBucket: 'spotify-20a57.appspot.com',
  messagingSenderId: '1076873169068',
  appId: '1:1076873169068:web:d4d2713c548d3fc975f709',
  measurementId: 'G-NCHLXKFJYK',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
export { auth, db };

