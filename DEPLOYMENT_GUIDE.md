# Firebase Hosting Setup - Ready to Deploy! 🚀

## ✅ What's Been Done:

1. **Files Organized**: All necessary files have been moved to the `public/` folder:
   - ✅ `index.html` (main app)
   - ✅ `renderer/` folder (all JavaScript files)
   - ✅ `styles/` folder (CSS)

2. **Firebase Configuration**: 
   - ✅ `firebase.json` configured
   - ✅ `.firebaserc` set with project: `loanailmaedge`
   - ⚠️  `firebase-config.js` needs your API credentials

## 🔧 What You Need To Do:

### Step 1: Get Your Firebase Configuration

1. Go to Firebase Console: https://console.firebase.google.com/project/loanailmaedge/settings/general

2. Scroll down to **"Your apps"** section

3. If you see a web app already:
   - Click on it to view the config
   
4. If no web app exists:
   - Click **"Add app"** button
   - Select **Web** (</> icon)
   - Give it a nickname: "LoanAI Web"
   - Check **"Also set up Firebase Hosting"**
   - Click **"Register app"**

5. Copy the `firebaseConfig` object (looks like this):
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

### Step 2: Update Firebase Config

Open the file: `public/renderer/firebase-config.js`

Replace these lines:
```javascript
apiKey: "YOUR_API_KEY_HERE",
// ...
messagingSenderId: "YOUR_SENDER_ID",
appId: "YOUR_APP_ID"
```

With your actual values from Firebase Console.

### Step 3: Enable Firebase Authentication

1. In Firebase Console, go to **Authentication** → **Get started**
2. Click on **"Sign-in method"** tab
3. Enable **Google** sign-in provider:
   - Click on "Google"
   - Toggle to enable
   - Add your support email
   - Click "Save"

### Step 4: Set Up Firestore (if using database)

1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"** or **"Test mode"** (for development)
4. Select a Cloud Firestore location close to you
5. Click **"Enable"**

### Step 5: Deploy to Firebase Hosting

Once you've completed Steps 1-4, run these commands:

```bash
# Make sure you're logged in to Firebase CLI
firebase login

# Deploy to Firebase Hosting
firebase deploy
```

Your app will be live at: **https://loanailmaedge.web.app**

## 📁 Current File Structure:

```
LTM hackathon/
├── public/                    ← Deployment folder (goes to Firebase)
│   ├── index.html            ← Main application
│   ├── renderer/             ← All JavaScript
│   │   ├── firebase-config.js ← ⚠️ UPDATE THIS FILE
│   │   ├── auth.js
│   │   ├── app.js
│   │   ├── loanService.js
│   │   ├── onboarding.js
│   │   ├── dashboard.js
│   │   ├── rocks.js
│   │   └── test-generator.js
│   └── styles/
│       └── main.css
├── server/                    ← Backend (not deployed to hosting)
├── firebase.json             ← Firebase hosting config
└── .firebaserc               ← Firebase project config
```

## ⚙️ Environment Variables (for Backend Server)

If you're using the backend server with Groq AI, you'll need to:

1. Create a `.env` file in the `server/` folder
2. Add your Groq API key:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

**Note**: The backend server won't run on Firebase Hosting (it's static hosting only).
For the backend, you'll need to deploy it separately to a service like:
- Google Cloud Run
- Heroku
- Railway
- Vercel (for serverless functions)

## 🔍 Testing Before Deployment

To test locally before deploying:

```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Serve locally
firebase serve
```

This will start a local server at `http://localhost:5000`

## 🎯 Quick Deployment Commands

After updating the Firebase config:

```bash
# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting
```

## 📝 Notes:

- ✅ All frontend files are ready in the `public/` folder
- ⚠️ Update `public/renderer/firebase-config.js` with your Firebase credentials
- ⚠️ Enable Authentication (Google sign-in) in Firebase Console
- 🔧 Backend server needs separate deployment (not included in Firebase Hosting)

---

**You're all set!** Just update the Firebase config and run `firebase deploy` 🚀
