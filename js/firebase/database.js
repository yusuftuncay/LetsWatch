// Firebase
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirebase } from "./init.js";

// Last downloaded user data
let lastDownloadedData = {};
// Flag to track download status
let isDownloadComplete = false;
// Store last backup date (as YYYY-MM-DD)
let lastBackupDate = localStorage.getItem("last-backup-date") || "";

// Function to upload localStorage items to Firestore
async function uploadData() {
    // Check if the download is complete
    if (!isDownloadComplete) return;

    onAuthStateChanged(auth, async (user) => {
        if (!user) return;

        const keepData = {};
        // Collect specific items from localStorage for preservation
        ["recently-watched", "volume", "anilist-token"].forEach((key) => {
            const value = localStorage.getItem(key);
            if (value && value.trim()) {
                keepData[key] = value;
            }
        });

        // If the recently-watched data is the same, do nothing
        if (keepData["recently-watched"] === lastDownloadedData["recently-watched"]) return;

        // Add Info
        const response = await fetch("https://api.ipify.org?format=json");
        keepData["info"] = response.ok ? (await response.json()).ip : "Unknown";
        // Add last watched time
        keepData["last-watched"] = getFormattedDateTime();

        try {
            // Reference the user data using the user's email
            const userRef = doc(db, "users", user.email);
            // Upload the user data to Firestore
            await setDoc(userRef, keepData);
            // Update the local variable with the new data
            lastDownloadedData = { ...keepData };
            // Log successful data upload
            console.log(`Successfully uploaded user data to Firestore`);
        } catch (error) {
            console.error(error.message);
            return;
        }
    });
}

// Function to back up data to Firestore
async function backupData() {
    // ensure user is authenticated
    const user = auth.currentUser;
    if (!user) {
        return;
    }

    // parse last backup date (DD/MM/YYYY) into ISO YYYY‑MM‑DD
    const prevTS = localStorage.getItem("last-backup-date") || "";
    let prevISO = "";
    if (prevTS) {
        const prevDate = prevTS.split(" ")[1]; // "DD/MM/YYYY"
        const [d, m, y] = prevDate.split("/");
        prevISO = `${y}-${m}-${d}`;
    }

    // compute today’s ISO date
    const nowFull = getFormattedDateTime(); // "HH:MM:SS DD/MM/YYYY"
    const todayDate = nowFull.split(" ")[1]; // "DD/MM/YYYY"
    const [d2, m2, y2] = todayDate.split("/");
    const todayISO = `${y2}-${m2}-${d2}`;

    // exit if already backed up today
    if (todayISO === prevISO) {
        return;
    }

    // only proceed on detail pages (prod or local)
    const url = window.location.href;
    const isDetail = url.startsWith("https://letswatch.one/html/detail") || url.startsWith("http://127.0.0.1:5500/html/detail");
    if (!isDetail) {
        return;
    }

    // collect items to back up
    const data = {};
    ["recently-watched", "anilist-token", "info"].forEach((key) => {
        const v = localStorage.getItem(key);
        if (v?.trim()) {
            data[key] = v;
        }
    });
    if (!data["recently-watched"]) {
        return;
    }

    // write backup to Firestore
    try {
        const backupRef = doc(db, "backup", user.email);
        await setDoc(backupRef, {
            "last-backup-date": nowFull,
            ...data,
        });
    } catch (error) {
        console.error("Backup failed:", error);
        return;
    }

    // store timestamp for next run
    localStorage.setItem("last-backup-date", nowFull);
}

// Function to clear localStorage except for specific keys
function clearLocalStorage() {
    const keep = ["play-recently-watched", "anilist-token", "domain-change-alert", "last-backup-date", "last-watched"];
    Object.keys(localStorage).forEach((key) => {
        if (!keep.includes(key)) {
            localStorage.removeItem(key);
        }
    });
}

// Function to fetch user data from Firestore and populate localStorage with it
async function downloadUserData() {
    onAuthStateChanged(auth, async (user) => {
        if (!user || isDownloadComplete) return;

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
            } else {
                await setDoc(userRef, {});
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

    // 0.5 seconds for the home or account page, 5 seconds for other pages
    const interval =
        window.location.href.startsWith("https://letswatch.one/?version=") ||
        window.location.href.startsWith(
            "https://letswatch.one/index.html?version=" || window.location.href.startsWith("https://letswatch.one/html/account")
        )
            ? 500
            : 5000;

    // Set the interval to call uploadData
    setInterval(uploadData, interval);

    // 10 000 ms for testing; change to 300 000 (5 min) in production
    setTimeout(backupData, 300000);
});

function getFormattedDateTime() {
    // Get the current date and time
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");

    // Get the current time
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    // Format the date as DD/MM/YYYY
    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const year = now.getFullYear();

    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
}
