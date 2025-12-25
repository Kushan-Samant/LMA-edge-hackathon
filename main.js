const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow;
let authWindow = null;

// Google OAuth configuration - these should match your Firebase project
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '948612358058-nl7gdk2m1c0od5uddlud5q50nnkra107.apps.googleusercontent.com';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hiddenInset',
    frame: true,
    show: false
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Documents', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'] }
    ]
  });
  return result.filePaths;
});

ipcMain.handle('get-first-launch', () => {
  // Simple check - in production you'd use electron-store
  return !app.isPackaged || !process.env.ONBOARDING_COMPLETE;
});

// Google OAuth Handler
ipcMain.handle('google-oauth', async () => {
  return new Promise((resolve, reject) => {
    // Close any existing auth window
    if (authWindow) {
      authWindow.close();
      authWindow = null;
    }

    // Generate OAuth URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.set('redirect_uri', 'urn:ietf:wg:oauth:2.0:oob');
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'select_account');

    // Create auth window
    authWindow = new BrowserWindow({
      width: 500,
      height: 700,
      parent: mainWindow,
      modal: true,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    authWindow.loadURL(googleAuthUrl.toString());

    authWindow.once('ready-to-show', () => {
      authWindow.show();
    });

    // Listen for navigation to detect OAuth callback
    authWindow.webContents.on('will-redirect', (event, url) => {
      handleOAuthCallback(url, resolve, reject);
    });

    authWindow.webContents.on('will-navigate', (event, url) => {
      handleOAuthCallback(url, resolve, reject);
    });

    // Handle page title changes (for the "Success" page with auth code)
    authWindow.webContents.on('page-title-updated', (event) => {
      const title = authWindow.webContents.getTitle();
      if (title.startsWith('Success')) {
        // Extract code from title: "Success code=..."
        const codeMatch = title.match(/code=([^&]+)/);
        if (codeMatch) {
          authWindow.close();
          authWindow = null;
          resolve({ code: codeMatch[1] });
        }
      }
    });

    // Handle window close without completing auth
    authWindow.on('closed', () => {
      authWindow = null;
      reject(new Error('Authentication cancelled by user'));
    });
  });
});

function handleOAuthCallback(url, resolve, reject) {
  try {
    const urlObj = new URL(url);

    // Check for error
    const error = urlObj.searchParams.get('error');
    if (error) {
      if (authWindow) {
        authWindow.close();
        authWindow = null;
      }
      reject(new Error(error));
      return;
    }

    // Check for authorization code
    const code = urlObj.searchParams.get('code');
    if (code) {
      if (authWindow) {
        authWindow.close();
        authWindow = null;
      }
      resolve({ code });
      return;
    }

    // Check for id_token (implicit flow)
    if (urlObj.hash) {
      const hashParams = new URLSearchParams(urlObj.hash.substring(1));
      const idToken = hashParams.get('id_token');
      const accessToken = hashParams.get('access_token');
      if (idToken || accessToken) {
        if (authWindow) {
          authWindow.close();
          authWindow = null;
        }
        resolve({ idToken, accessToken });
        return;
      }
    }
  } catch (e) {
    // URL parsing failed, continue
  }
}
