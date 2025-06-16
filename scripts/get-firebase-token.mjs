import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') });

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function getFirebaseToken() {
  try {
    // Use test user credentials from Firebase Authentication
    const email = "abdullahrafi628@gmail.com";  // Replace with your Firebase test user email
    const password = "Xabbir6288";     // Replace with your Firebase test user password

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const idToken = await user.getIdToken();
    
    console.log("Your Firebase ID Token:");
    console.log(idToken);
    console.log("\nUse this token in Postman:");
    console.log("1. Open Postman");
    console.log("2. Go to the 'Authorization' tab");
    console.log("3. Select 'Bearer Token' from the 'Type' dropdown");
    console.log("4. Paste the token above into the 'Token' field");
    
  } catch (error) {
    console.error("Error getting token:", error);
  }
}

// Run the function
getFirebaseToken();
