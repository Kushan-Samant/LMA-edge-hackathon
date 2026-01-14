/**
 * Firebase Configuration for LoanAI
 */

const firebaseConfig = {
    apiKey: "AIzaSyAa0_hts7Fs1iwihlFq2z4UDzQLkSYVKpM",
    authDomain: "loanailmaedge.firebaseapp.com",
    projectId: "loanailmaedge",
    storageBucket: "loanailmaedge.firebasestorage.app",
    messagingSenderId: "718665127538",
    appId: "1:718665127538:web:b478eac16f607b8c4c94eb",
    measurementId: "G-6ESX4HEMG9"
};

// Initialize Firebase (if not already initialized by Firebase Hosting)
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Export for use in other scripts
window.firebaseConfig = firebaseConfig;
