/**
 * Firebase Configuration
 * Replace these values with your Firebase project credentials
 * Get these from: https://console.firebase.google.com/
 */

const firebaseConfig = {
    // TODO: Replace with your Firebase project configuration
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Export for use in auth.js
window.firebaseConfig = firebaseConfig;
