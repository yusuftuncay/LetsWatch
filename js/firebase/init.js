// Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

// Declare `auth` and `db`
window.auth = null;
window.db = null;

// Initialize Firebase only once
let firebaseInitialized = false;
let firebasePromise = null;

// Function to initialize Firebase
export async function getFirebase() {
    if (!firebaseInitialized) {
        if (!firebasePromise) {
            firebasePromise = (async () => {
                // Fetch Firebase Config
                const firebaseConfig = await (await fetch("https://firebase.letswatch.one")).json();

                // Initialize Firebase
                const app = initializeApp(firebaseConfig);
                window.db = getFirestore(app);
                window.auth = getAuth(app);

                firebaseInitialized = true;

                // Return the initialized `auth` and `db` objects
                return { auth: window.auth, db: window.db };
            })();
        }
        return firebasePromise;
    }
    return { auth: window.auth, db: window.db };
}
