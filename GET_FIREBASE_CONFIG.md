# How to Get Your Firebase Configuration

## Steps:

1. Go to the Firebase Console: https://console.firebase.google.com/

2. Select your project: **loanailmaedge**

3. Click on the **gear icon** (⚙️) next to "Project Overview" → Select **Project settings**

4. Scroll down to the **"Your apps"** section

5. If you don't have a web app yet:
   - Click **"Add app"** → Select **Web** (< /> icon)
   - Give it a nickname (e.g., "LoanAI Web App")
   - Check **"Also set up Firebase Hosting for this app"**
   - Click **"Register app"**

6. You'll see a code snippet that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza....",
  authDomain: "loanailmaedge.firebaseapp.com",
  projectId: "loanailmaedge",
  storageBucket: "loanailmaedge.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

7. **Copy the entire `firebaseConfig` object values**

8. Come back here and I'll update the file with your configuration!

## What to provide me:
Just paste the entire firebaseConfig object from Firebase Console, and I'll update it in the correct file.
