/*
 * Browser-side Google authentication.
 *
 * This file:
 * 1. Loads Google's Identity Services library.
 * 2. Displays Google's official sign-in button.
 * 3. Receives the ID token after successful sign-in.
 * 4. Sends that token to our Express backend.
 * 5. Displays the identity information returned by the backend.
 *
 * Important:
 * The Google Client ID is public and can appear in browser code.
 * Never put the Google Client Secret in this file.
 */

// The Client ID identifies our application to Google.
// Replace the placeholder with the same Client ID stored in .env.
const GOOGLE_CLIENT_ID = "525199468982-goopjgvm7tp5bst9oac8diuohrs80vr0.apps.googleusercontent.com";

// References to elements on our login page.
const statusElement = document.getElementById("status");
const userDetailsElement = document.getElementById("user-details");
const googleButtonElement = document.getElementById("google-button");

/*
 * This function is called by Google's Identity Services
 * after the user successfully signs in.
 *
 * Google's response contains a credential: the ID token.
 */
window.handleGoogleCredentialResponse = async function (response) {

    // Tell the user that the token is being checked by our backend.
    statusElement.textContent = "Verifying your Google account...";
    userDetailsElement.textContent = "";

    try {
        // Send the Google ID token to our own backend.
        // We deliberately do not send a separate email address:
        // the backend obtains the trusted email from Google's token.
        const serverResponse = await fetch("/api/auth/google", {
            method: "POST",

            // Tell Express that the request body contains JSON.
            headers: {
                "Content-Type": "application/json"
            },

            // Send the ID token in the request body.
            body: JSON.stringify({
                credential: response.credential
            })
        });

        // Convert the backend's JSON response into a JavaScript object.
        const result = await serverResponse.json();

        // If the backend rejected the token, display its error.
        if (!serverResponse.ok) {
            throw new Error(result.error || "Authentication failed");
        }

        // The backend has verified the Google identity.
        statusElement.textContent = "Google identity verified.";

        // Display the verified identity.
        // textContent is used rather than innerHTML to avoid
        // interpreting account information as HTML.
        const name = document.createElement("p");
        name.textContent = `Name: ${result.user.name || "Not provided"}`;

        const email = document.createElement("p");
        email.textContent = `Email: ${result.user.email}`;

        // Display the internal Google Auth Starter database user ID.
        // This is not Google's private or stable account identifier.
        const userId = document.createElement("p");
        userId.textContent = `Google Auth Starter User ID: ${result.user.id}`;

        // Display all three identity details.
        userDetailsElement.append(name, email, userId);

    } catch (error) {
        // Display a safe, understandable error message.
        statusElement.textContent = error.message;

        // Keep technical details in the browser console for debugging.
        console.error("Sign-in error:", error);
    }
};

/*
 * Load Google's Identity Services library.
 *
 * We load it dynamically so that our initialization code runs
 * only after Google's library has finished loading.
 */
function loadGoogleIdentityServices() {

    // Create a script element that loads Google's sign-in library.
    const googleScript = document.createElement("script");

    googleScript.src = "https://accounts.google.com/gsi/client";
    googleScript.async = true;

    // This runs only after the Google library has loaded successfully.
    googleScript.onload = function () {

        // Initialize Google's sign-in system for this application.
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: window.handleGoogleCredentialResponse
        });

        // Render Google's official sign-in button inside our page.
        google.accounts.id.renderButton(googleButtonElement, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular"
        });

        statusElement.textContent = "Ready to sign in.";
    };

    // Handle failure to load Google's external library.
    googleScript.onerror = function () {
        statusElement.textContent =
            "Could not load Google sign-in. Check your internet connection.";
    };

    // Add the script to the page so the browser downloads it.
    document.head.appendChild(googleScript);
}

// Start loading Google's sign-in library once the page is ready.
loadGoogleIdentityServices();