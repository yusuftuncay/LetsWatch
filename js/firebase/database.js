//#region Firebase
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirebase } from "./init.js";
//#endregion

// Variable to store the previous data in localStorage
let previousLocalStorageData = {};
// Flag to indicate that initial data has been downloaded
let isDataInitialized = false;

// Function to upload localStorage items to Firestore
async function uploadData() {
    onAuthStateChanged(auth, async (user) => {
        // Prevent upload if data isn't initialized
        if (!user || !isDataInitialized) return;

        // Temporary object to store data that should be kept
        const keepData = {};
        // Collect specific items from localStorage for preservation
        ["recently-watched", "volume", "quality"].forEach((key) => {
            if (localStorage.getItem(key)) {
                keepData[key] = localStorage.getItem(key);
            }
        });

        // Check if there are changes by comparing current data with previous data
        if (JSON.stringify(keepData) !== JSON.stringify(previousLocalStorageData)) {
            const userRef = doc(db, "users", user.email);

            // Attempt to upload the new local storage data to Firestore
            try {
                await setDoc(userRef, keepData);
                console.log(`${new Date().toLocaleTimeString([], { hour12: false })} - Successfully uploaded user data to Firestore`);
                // Update the previous data with the current data
                previousLocalStorageData = { ...keepData };
            } catch (error) {
                console.error(error.message);
            }
        }
    });
}

// Function to clear localStorage except for "play-recently-watched"
function clearLocalStorage() {
    // Key to preserve
    const keyToKeep = "play-recently-watched";
    const valueToKeep = localStorage.getItem(keyToKeep);

    // Clear localStorage
    localStorage.clear();

    // Restore the preserved key if it exists
    if (valueToKeep !== null) {
        localStorage.setItem(keyToKeep, valueToKeep);
    }
}

// Function to fetch user data from Firestore and populate localStorage with it
async function downloadUserData() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) return;

        // Reference to the user data in Firestore
        const userRef = doc(db, "users", user.email);

        // Attempt to retrieve the user data from Firestore
        try {
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                // Populate localStorage with the user data
                Object.entries(docSnap.data()).forEach(([key, value]) => localStorage.setItem(key, value));
                // Update the previousLocalStorageData variable
                previousLocalStorageData = docSnap.data();
                // Mark data as initialized
                isDataInitialized = true;
                // Log
                console.log(`${new Date().toLocaleTimeString([], { hour12: false })} - Successfully downloaded user data from Firestore`);
            }
        } catch (error) {
            console.error(error.message);
        }
    });
}

// "DOMContentLoaded" event handler
document.addEventListener("DOMContentLoaded", async () => {
    // Clear localStorage
    clearLocalStorage();
    // Fetch Firebase
    const firebase = await getFirebase();
    auth = firebase.auth;
    db = firebase.db;
    // Download user data
    await downloadUserData();
});

// Check for changes every minute or every X amount of seconds based on if the user is on the homepage
//(because it has to be updated almost instantly when the user deletes an item from the recently-watched list)
const checkInterval =
    window.location.href.startsWith("https://letswatch.site/?version=") || window.location.href.startsWith("https://letswatch.site/index.html?version=") ? 500 : 5000;
setInterval(uploadData, checkInterval);
