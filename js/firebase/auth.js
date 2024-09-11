//#region Firebase
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendEmailVerification,
    sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirebase } from "./init.js";
//#endregion

//#region Register
function register(email, password) {
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Send verification email upon successful registration
            sendEmailVerification(userCredential.user)
                .then(() => {
                    signOut();
                    alert("Please check your email to verify your account");
                    // Redirect to login page after registration
                    window.location.href = "../html/login.html";
                })
                .catch((error) => {
                    alert(`Error sending verification email: ${error.message}`);
                });
        })
        .catch((error) => {
            alert(`Registration failed: ${error.message}`);
        });
}
//#endregion

//#region SignIn
function signIn(email, password) {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Redirect only if the user's email has been verified
            if (userCredential.user.emailVerified) {
                window.location.href = "../index.html";
            } else {
                signOut();
                alert("Please verify your email before logging in");
            }
        })
        .catch((error) => {
            alert(`Sign in failed: ${error.message}`);
        });
}
//#endregion

//#region SignOut
function signOut() {
    firebaseSignOut(auth)
        .then(() => {
            // Clear localStorage
            localStorage.clear();

            // Redirect to the login page
            if (window.location.pathname == "/index.html") {
                window.location.href = "../html/login.html";
            } else {
                window.location.href = "login.html";
            }
        })
        .catch((error) => {
            alert(`Sign out failed: ${error.message}`);
        });
}
//#endregion

//#region PasswordReset
function sendPasswordReset(email) {
    sendPasswordResetEmail(auth, email)
        .then(() => {
            alert("Password reset email sent");
        })
        .catch((error) => {
            alert(`Error sending password reset email: ${error.message}`);
        });
}
//#endregion

//#region "DOMContentLoaded" event handler
document.addEventListener("DOMContentLoaded", async function () {
    // Fetch Firebase
    const firebase = await getFirebase();
    auth = firebase.auth;

    // Cache frequently accessed DOM elements
    const loginForm = document.querySelector(".login-form");
    const signupForm = document.querySelector(".signup-form");
    const resetPasswordLink = document.getElementById("reset-password-link");

    // Login form event listener
    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();

            // Get the values from the form
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            // Sign in the user
            signIn(email, password);
        });
    }

    // Signup form event listener
    if (signupForm) {
        signupForm.addEventListener("submit", function (event) {
            event.preventDefault();

            // Get the values from the form
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const passwordRepeat = document.getElementById("password-repeat").value;

            // Check if the passwords match
            if (password == passwordRepeat) {
                register(email, password);
            } else {
                alert("Passwords do not match");
            }
        });
    }

    // Reset password link event listener
    if (resetPasswordLink) {
        resetPasswordLink.addEventListener("click", function (event) {
            event.preventDefault();

            // Get the email address from the user and send the password reset email
            const email = document.getElementById("email").value;
            if (email) {
                sendPasswordReset(email);
            } else {
                alert("Please enter your email address");
            }
        });
    }
});
//#endregion
