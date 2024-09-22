//#region Firebase
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirebase } from "./firebase/init.js";
//#endregion

//#region Search Function
function search() {
    const query = document.querySelector('input[name="search"]').value.trim();
    if (query) location.href = `../html/search.html?query=${encodeURIComponent(query)}`;
}
//#endregion

//#region Cache Busting
function applyCacheBusting() {
    // Get the current date and time
    const now = new Date();

    // Create a cache-busting value in the format "DDMMYYYYHHMM"
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const cacheBustingValue = `${day}${month}${year}${hours}${minutes}`;

    // Append the cache-busting parameter to the URL if it's not already present
    if (!location.search.includes("version=")) {
        location.href += `${location.href.includes("?") ? "&" : "?"}version=${cacheBustingValue}`;
    }
}
//#endregion

//#region Initialize Navbar
function initNavbar() {
    onAuthStateChanged(auth, (user) => {
        // Navbar login/logout button
        const loginButton = document.querySelector('nav ul li a[href="../html/login.html"]');
        // Search Input
        const searchInput = document.querySelector(".search-container input[type='text']");
        // Search Button
        const searchButton = document.querySelector(".search-container button");

        // Check if the user is logged in with a verified email
        if (user && user.emailVerified && loginButton) {
            // Update the navbar link to show "Account" if the user is logged in
            loginButton.textContent = "Account";
            // Go to the account page
            loginButton.href = "../html/account.html";
        } else if (loginButton) {
            // Show "Login" if the user is not logged in
            loginButton.textContent = "Login";
            // Go to the login page
            loginButton.href = "../html/login.html";
        }

        // Add event listeners for the search input and button
        if (searchInput) {
            searchInput.addEventListener("keydown", (event) => {
                if (event.key == "Enter") search();
            });
        }
        if (searchButton) {
            searchButton.addEventListener("click", () => {
                search();
            });
        }
    });
}
//#endregion

//#region "DOMContentLoaded" event handler
document.addEventListener("DOMContentLoaded", async () => {
    // Apply cache busting
    applyCacheBusting();
    // Fetch Firebase
    const firebase = await getFirebase();
    auth = firebase.auth;
    // Initialize the navbar
    initNavbar();
});
//#endregion
