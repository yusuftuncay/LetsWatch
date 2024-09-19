//#region Firebase
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirebase } from "./init.js";
//#endregion

// Firebase variable
let lastDownloadedData = {};
// Flag to track download status
let isDownloadComplete = false;

// Function to upload localStorage items to Firestore
async function uploadData() {
    // Check if the download is complete
    if (!isDownloadComplete) return;

    onAuthStateChanged(auth, async (user) => {
        if (!user) return;

        const keepData = {};
        // Collect specific items from localStorage for preservation
        ["recently-watched", "volume", "quality"].forEach((key) => {
            const value = localStorage.getItem(key);
            if (value && value.trim()) {
                keepData[key] = value;
            }
        });

        // If the data is the same, do nothing
        if (keepData["recently-watched"] === lastDownloadedData["recently-watched"]) return;

        try {
            // Reference the user data
            const userRef = doc(db, "users", user.email);
            // Upload the user data to Firestore
            await setDoc(userRef, keepData);
            // Update the local variable with the new data
            lastDownloadedData = { ...keepData };
            // Log successful data upload
            console.log(`${new Date().toLocaleTimeString([], { hour12: false })} - Successfully uploaded user data to Firestore`);
        } catch (error) {
            console.error(error.message);
            return;
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

        try {
            // Fetch the user data from Firestore
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                // Store the user data in a variable
                lastDownloadedData = docSnap.data();
                // Populate localStorage with the user data
                Object.entries(docSnap.data()).forEach(([key, value]) => localStorage.setItem(key, value));
                // Log successful data download
                console.log(`${new Date().toLocaleTimeString([], { hour12: false })} - Successfully downloaded user data from Firestore`);
                // Mark the download as complete
                isDownloadComplete = true;
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
