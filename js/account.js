//#region Firebase
import {
    verifyBeforeUpdateEmail,
    updatePassword,
    signOut as firebaseSignOut,
    reauthenticateWithCredential,
    EmailAuthProvider,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirebase } from "./firebase/init.js";
import { doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
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

//#region Delete User
async function deleteUser() {
    // Alert
    var confirmation = confirm("Are you sure you want to delete your account?");
    if (!confirmation) return;

    // 2nd Alert
    var confirmation2 = confirm("YOU ARE ABOUT TO DELETE YOUR ACCOUNT\n\nARE YOU SURE?");
    if (!confirmation2) return;

    // Get the current user
    const user = auth.currentUser;

    // Check if the user exists
    if (!user) return;

    try {
        // Delete the user's document
        await deleteDoc(doc(db, "users", user.email));

        // Delete user from Firebase Authentication
        await user.delete();

        // Redirect to login page
        window.location.href = "../html/login.html";
    } catch (error) {
        alert(error.message);
    }
}
//#endregion

//#region Restore Backup
async function restoreBackup() {
    // Get the current user
    const user = auth.currentUser;
    if (!user) {
        alert("No user is currently logged in");
        return;
    }

    try {
        // Get backup document
        const backupRef = doc(db, "backup", user.email);
        const backupSnap = await getDoc(backupRef);

        if (!backupSnap.exists()) {
            alert("No backup found for your account");
            return;
        }

        // Ask for confirmation before overwriting data
        const confirmation = confirm("Are you sure you want to restore your data from backup?\nThis will overwrite your current data!");
        if (!confirmation) return;

        // Overwrite user document with backup data
        const backupData = backupSnap.data();
        const userRef = doc(db, "users", user.email);
        await setDoc(userRef, backupData);

        alert("Your backup has been restored successfully!");
    } catch (error) {
        alert(error.message);
    }
}
//#endregion

//#region "DOMContentLoaded" event handler
document.addEventListener("DOMContentLoaded", async () => {
    // Fetch Firebase
    const firebase = await getFirebase();
    db = firebase.db;
    auth = firebase.auth;

    // Email update form
    const emailForm = document.querySelector(".email-update-form");
    if (emailForm) {
        emailForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const newEmail = document.getElementById("email").value;
            const currentPassword = document.getElementById("current-password-1").value;
            updateUserEmail(newEmail, currentPassword);
        });
    }

    // Password update form
    const passwordForm = document.querySelector(".password-update-form");
    if (passwordForm) {
        passwordForm.addEventListener("submit", (event) => {
            // Prevent the form from submitting
            event.preventDefault();

            // Get the values from the form
            const newPassword = document.getElementById("password").value;
            const newPasswordRepeat = document.getElementById("password-repeat").value;
            const currentPassword = document.getElementById("current-password-2").value;
            updateUserPassword(newPassword, newPasswordRepeat, currentPassword);
        });
    }

    // Logout button
    const logoutButton = document.querySelector(".logout");
    if (logoutButton) {
        logoutButton.addEventListener("click", (event) => {
            // Prevent the form from submitting
            event.preventDefault();

            // Sign out the user
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

    // Delete account button
    const deleteButton = document.querySelector(".delete");
    if (deleteButton) {
        deleteButton.addEventListener("click", (event) => {
            // Prevent the form from submitting
            event.preventDefault();
            // Delete the user
            deleteUser();
        });
    }

    // Restore backup button
    const restoreButton = document.querySelector(".restore");
    if (restoreButton) {
        restoreButton.addEventListener("click", (event) => {
            // Prevent the form from submitting
            event.preventDefault();
            // Restore backup
            restoreBackup();
        });
    }
});
//#endregion
