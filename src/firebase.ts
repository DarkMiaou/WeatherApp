import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { enableIndexedDbPersistence } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: 'AIzaSyXXXXXXXXXXXXXXX', // Clé Masquée 
  authDomain: 'your-project-id.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project-id.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:xxxxxxxxxxxxxxxx',
  measurementId: 'G-XXXXXXXXXX',
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app);
const db = getFirestore(app);

export { auth, db };