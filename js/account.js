//#region Firebase
import {
    verifyBeforeUpdateEmail,
    updatePassword,
    signOut as firebaseSignOut,
    reauthenticateWithCredential,
    EmailAuthProvider,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirebase } from "./firebase/init.js";
//#endregion

//#region Update User Email
async function updateUserEmail(newEmail, currentPassword) {
    // Get the current user
    const user = auth.currentUser;

    // Check if user is authenticated
    if (!user) return;

    // Re-authenticate the user before performing sensitive actions
    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    try {
        await reauthenticateWithCredential(user, credential);
    } catch (error) {
        alert(error.message);
        return;
    }

    // Update email
    if (newEmail && newEmail !== user.email) {
        verifyBeforeUpdateEmail(user, newEmail)
            .then(() => {
                alert("Email updated successfully. Please verify your email address");
            })
            .catch((error) => {
                alert(error.message);
            });
    }
}
//#endregion

//#region Update User Password
async function updateUserPassword(newPassword, newPasswordRepeat, currentPassword) {
    // Get the current user
    const user = auth.currentUser;

    // Check if user is authenticated
    if (!user) return;

    // Re-authenticate the user before performing sensitive actions
    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    try {
        await reauthenticateWithCredential(user, credential);
    } catch (error) {
        alert(error.message);
        return;
    }

    // Update password if both fields match and are not empty
    if (newPassword && newPassword === newPasswordRepeat) {
        updatePassword(user, newPassword)
            .then(() => {
                alert("Password updated successfully");
            })
            .catch((error) => {
                alert(error.message);
            });
    } else if (newPassword || newPasswordRepeat) {
        alert("Passwords do not match or are empty");
    }
}
//#endregion

//#region "DOMContentLoaded" event handler
document.addEventListener("DOMContentLoaded", async () => {
    // Fetch Firebase
    const firebase = await getFirebase();
    auth = firebase.auth;

    // Email update form
    const emailForm = document.querySelector(".email-update-form");
    if (emailForm) {
        emailForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const newEmail = document.getElementById("email").value;
            const currentPassword = document.getElementById("current-password").value;
            updateUserEmail(newEmail, currentPassword);
        });
    }

    // Password update form
    const passwordForm = document.querySelector(".password-update-form");
    if (passwordForm) {
        passwordForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const newPassword = document.getElementById("password").value;
            const newPasswordRepeat = document.getElementById("password-repeat").value;
            const currentPassword = document.getElementById("current-password").value;
            updateUserPassword(newPassword, newPasswordRepeat, currentPassword);
        });
    }

    // Navbar login/logout button
    const logoutButton = document.querySelector(".logout");
    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            firebaseSignOut(auth)
                .then(() => {
                    localStorage.clear();
                    window.location.href = "../html/login.html";
                })
                .catch((error) => {
                    alert(error.message);
                });
        });
    }
});
//#endregion
