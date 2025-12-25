/**
 * Authentication Controller with Firebase
 * Handles Google, Apple, Facebook OAuth and email/password login
 */

const Auth = {
    isAuthenticated: false,
    currentUser: null,
    firebaseApp: null,
    firebaseAuth: null,

    async init() {
        await this.initFirebase();
        this.setupEventListeners();
        this.checkAuthState();
    },

    async initFirebase() {
        // Check if running in Electron with file:// protocol
        // Firebase popup auth doesn't work in file:// protocol
        if (window.location.protocol === 'file:') {
            console.info('Running in Electron (file:// protocol) - using demo authentication');
            this.useMockAuth = true;
            return;
        }

        // Check if Firebase SDK is loaded
        if (typeof firebase === 'undefined') {
            console.warn('Firebase SDK not loaded - using mock authentication');
            this.useMockAuth = true;
            return;
        }

        // Check if Firebase config is set up
        if (!window.firebaseConfig || window.firebaseConfig.apiKey === 'YOUR_API_KEY') {
            console.info('Firebase not configured - using demo authentication');
            this.useMockAuth = true;
            return;
        }

        try {
            // Initialize Firebase
            if (!firebase.apps.length) {
                this.firebaseApp = firebase.initializeApp(window.firebaseConfig);
            } else {
                this.firebaseApp = firebase.app();
            }
            this.firebaseAuth = firebase.auth();

            // Listen for auth state changes
            this.firebaseAuth.onAuthStateChanged((user) => {
                if (user) {
                    this.handleAuthSuccess(user);
                }
            });

            this.useMockAuth = false;
        } catch (error) {
            console.warn('Firebase initialization failed:', error);
            this.useMockAuth = true;
        }
    },

    checkAuthState() {
        const savedAuth = localStorage.getItem('loanai_auth');
        if (savedAuth) {
            try {
                const authData = JSON.parse(savedAuth);
                // Check if token is still valid (24 hour expiry)
                if (Date.now() - authData.timestamp < 24 * 60 * 60 * 1000) {
                    this.isAuthenticated = true;
                    this.currentUser = authData.user;
                    this.showApp();
                    this.updateUserUI();
                    return;
                }
            } catch (e) {
                console.error('Error parsing auth data:', e);
            }
        }
        this.showLogin();
    },

    setupEventListeners() {
        // Email/Password form
        document.getElementById('login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEmailLogin();
        });

        // Registration form
        document.getElementById('register-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });

        // Social login buttons
        document.getElementById('btn-google')?.addEventListener('click', () => {
            this.handleGoogleLogin();
        });

        document.getElementById('btn-google-register')?.addEventListener('click', () => {
            this.handleGoogleLogin();
        });

        document.getElementById('btn-apple')?.addEventListener('click', () => {
            this.handleAppleLogin();
        });

        document.getElementById('btn-facebook')?.addEventListener('click', () => {
            this.handleFacebookLogin();
        });

        // Password visibility toggles
        document.getElementById('toggle-password')?.addEventListener('click', () => {
            this.togglePasswordVisibility('login-password', 'toggle-password');
        });

        document.getElementById('toggle-register-password')?.addEventListener('click', () => {
            this.togglePasswordVisibility('register-password', 'toggle-register-password');
        });

        // Demo login button (for hackathon)
        document.getElementById('btn-demo-login')?.addEventListener('click', () => {
            this.handleDemoLogin();
        });

        // View switching - Show Register
        document.getElementById('show-register')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterView();
        });

        // View switching - Show Login
        document.getElementById('show-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginView();
        });

        // Logout button
        document.getElementById('btn-logout')?.addEventListener('click', () => {
            this.logout();
        });

        // Account menu toggle
        document.getElementById('account-trigger')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleAccountMenu();
        });

        // Close account menu when clicking outside
        document.addEventListener('click', () => {
            this.closeAccountMenu();
        });
    },

    // ==================== View Switching ====================
    showRegisterView() {
        const loginView = document.getElementById('login-view');
        const registerView = document.getElementById('register-view');

        if (loginView && registerView) {
            loginView.classList.add('hidden');
            registerView.classList.remove('hidden');

            // Add animation
            registerView.style.animation = 'fadeSlideIn 0.3s ease-out';
        }
    },

    showLoginView() {
        const loginView = document.getElementById('login-view');
        const registerView = document.getElementById('register-view');

        if (loginView && registerView) {
            registerView.classList.add('hidden');
            loginView.classList.remove('hidden');

            // Add animation
            loginView.style.animation = 'fadeSlideIn 0.3s ease-out';
        }
    },

    // ==================== Registration Handler ====================
    async handleRegistration() {
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            this.showError('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        const submitBtn = document.querySelector('#register-form button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;"></span>';
        submitBtn.disabled = true;

        if (this.useMockAuth) {
            await this.mockRegistration(name, email);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }

        try {
            const result = await this.firebaseAuth.createUserWithEmailAndPassword(email, password);

            // Update profile with name
            await result.user.updateProfile({
                displayName: name
            });

            this.handleAuthSuccess({
                ...result.user,
                displayName: name
            });
        } catch (error) {
            console.error('Registration error:', error);
            if (error.code === 'auth/email-already-in-use') {
                this.showError('An account with this email already exists');
            } else if (error.code === 'auth/weak-password') {
                this.showError('Password is too weak. Please use a stronger password');
            } else {
                this.showError(error.message);
            }
        }

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    },

    async mockRegistration(name, email) {
        await new Promise(resolve => setTimeout(resolve, 1200));

        const user = {
            uid: 'mock_' + Date.now(),
            email: email,
            displayName: name,
            photoURL: null,
            provider: 'email'
        };

        this.showSuccess('Account created successfully!');
        this.handleAuthSuccess(user);
    },

    // Demo login for hackathon - instant login with demo user
    async handleDemoLogin() {
        const button = document.getElementById('btn-demo-login');
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;"></span>';
        button.disabled = true;

        // Brief delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 500));

        const demoUser = {
            uid: 'demo_user_hackathon',
            email: 'demo@loanai.app',
            displayName: 'Demo User',
            photoURL: null,
            provider: 'demo'
        };

        this.showSuccess('Welcome to the demo!');
        this.handleAuthSuccess(demoUser);

        button.innerHTML = originalText;
        button.disabled = false;
    },

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-success';
        toast.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // ==================== Google OAuth ====================
    async handleGoogleLogin() {
        const button = document.getElementById('btn-google');
        button.classList.add('loading');

        // Check if running in Electron with the electronAPI available
        if (window.electronAPI && window.electronAPI.googleOAuth) {
            try {
                const result = await window.electronAPI.googleOAuth();
                console.log('Google OAuth result:', result);

                // For now, create a mock user from the OAuth result
                // In production, you'd exchange the auth code for user info
                const user = {
                    uid: 'google_' + Date.now(),
                    email: 'user@gmail.com',
                    displayName: 'Google User',
                    photoURL: null,
                    provider: 'google.com'
                };

                this.handleAuthSuccess(user);
                button.classList.remove('loading');
                return;
            } catch (error) {
                console.error('Google OAuth error:', error);
                if (error.message !== 'Authentication cancelled by user') {
                    this.showError('Google login failed: ' + error.message);
                }
                button.classList.remove('loading');
                return;
            }
        }

        // Fallback to mock auth if not in Electron
        if (this.useMockAuth) {
            await this.mockSocialLogin('google');
            button.classList.remove('loading');
            return;
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');

            const result = await this.firebaseAuth.signInWithPopup(provider);
            this.handleAuthSuccess(result.user);
        } catch (error) {
            console.error('Google login error:', error);
            this.showError('Google login failed: ' + error.message);
        }

        button.classList.remove('loading');
    },

    // ==================== Apple OAuth ====================
    async handleAppleLogin() {
        const button = document.getElementById('btn-apple');
        button.classList.add('loading');

        if (this.useMockAuth) {
            await this.mockSocialLogin('apple');
            button.classList.remove('loading');
            return;
        }

        try {
            const provider = new firebase.auth.OAuthProvider('apple.com');
            provider.addScope('email');
            provider.addScope('name');

            const result = await this.firebaseAuth.signInWithPopup(provider);
            this.handleAuthSuccess(result.user);
        } catch (error) {
            console.error('Apple login error:', error);
            this.showError('Apple login failed: ' + error.message);
        }

        button.classList.remove('loading');
    },

    // ==================== Facebook OAuth ====================
    async handleFacebookLogin() {
        const button = document.getElementById('btn-facebook');
        button.classList.add('loading');

        if (this.useMockAuth) {
            await this.mockSocialLogin('facebook');
            button.classList.remove('loading');
            return;
        }

        try {
            const provider = new firebase.auth.FacebookAuthProvider();
            provider.addScope('email');
            provider.addScope('public_profile');

            const result = await this.firebaseAuth.signInWithPopup(provider);
            this.handleAuthSuccess(result.user);
        } catch (error) {
            console.error('Facebook login error:', error);
            this.showError('Facebook login failed: ' + error.message);
        }

        button.classList.remove('loading');
    },

    // ==================== Email/Password Login ====================
    async handleEmailLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        const submitBtn = document.querySelector('#login-form button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;"></span>';
        submitBtn.disabled = true;

        if (this.useMockAuth) {
            await this.mockEmailLogin(email);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }

        try {
            const result = await this.firebaseAuth.signInWithEmailAndPassword(email, password);
            this.handleAuthSuccess(result.user);
        } catch (error) {
            // If user doesn't exist, try to create account
            if (error.code === 'auth/user-not-found') {
                try {
                    const result = await this.firebaseAuth.createUserWithEmailAndPassword(email, password);
                    this.handleAuthSuccess(result.user);
                } catch (createError) {
                    this.showError(createError.message);
                }
            } else {
                this.showError(error.message);
            }
        }

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    },

    // ==================== Mock Auth (fallback) ====================
    async mockSocialLogin(provider) {
        await new Promise(resolve => setTimeout(resolve, 1200));

        const user = {
            uid: 'mock_' + Date.now(),
            email: `user@${provider}.com`,
            displayName: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
            photoURL: null,
            provider: provider
        };

        this.handleAuthSuccess(user);
    },

    async mockEmailLogin(email) {
        await new Promise(resolve => setTimeout(resolve, 1200));

        const user = {
            uid: 'mock_' + Date.now(),
            email: email,
            displayName: email.split('@')[0],
            photoURL: null,
            provider: 'email'
        };

        this.handleAuthSuccess(user);
    },

    // ==================== Auth Success Handler ====================
    handleAuthSuccess(user) {
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            photoURL: user.photoURL,
            provider: user.providerData?.[0]?.providerId || 'email'
        };

        this.isAuthenticated = true;
        this.currentUser = userData;

        // Save auth state
        localStorage.setItem('loanai_auth', JSON.stringify({
            user: userData,
            timestamp: Date.now()
        }));

        // Animate transition
        const loginScreen = document.getElementById('login-screen');
        loginScreen.classList.add('fade-out');

        setTimeout(() => {
            this.showApp();
            this.updateUserUI();
        }, 400);
    },

    // ==================== UI Methods ====================
    showLogin() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('login-screen').classList.remove('fade-out');
        document.getElementById('app-wrapper').classList.add('hidden');
    },

    showApp() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-wrapper').classList.remove('hidden');
    },

    updateUserUI() {
        if (!this.currentUser) return;

        // Update user name display
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) {
            userNameEl.textContent = this.currentUser.displayName;
        }

        // Update user email display
        const userEmailEl = document.getElementById('user-email');
        if (userEmailEl) {
            userEmailEl.textContent = this.currentUser.email;
        }

        // Update avatar
        const userAvatarEl = document.getElementById('user-avatar');
        if (userAvatarEl) {
            if (this.currentUser.photoURL) {
                userAvatarEl.innerHTML = `<img src="${this.currentUser.photoURL}" alt="Avatar">`;
            } else {
                const initials = this.currentUser.displayName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                userAvatarEl.innerHTML = `<span>${initials}</span>`;
            }
        }

        // Update provider badge
        const providerBadge = document.getElementById('user-provider');
        if (providerBadge) {
            const providerNames = {
                'google.com': 'Google',
                'apple.com': 'Apple',
                'facebook.com': 'Facebook',
                'google': 'Google',
                'apple': 'Apple',
                'facebook': 'Facebook',
                'email': 'Email'
            };
            providerBadge.textContent = providerNames[this.currentUser.provider] || 'Email';
        }
    },

    toggleAccountMenu() {
        const menu = document.getElementById('account-menu');
        if (menu) {
            menu.classList.toggle('active');
        }
    },

    closeAccountMenu() {
        const menu = document.getElementById('account-menu');
        if (menu) {
            menu.classList.remove('active');
        }
    },

    // ==================== Logout ====================
    async logout() {
        if (this.firebaseAuth) {
            try {
                await this.firebaseAuth.signOut();
            } catch (error) {
                console.error('Firebase logout error:', error);
            }
        }

        this.isAuthenticated = false;
        this.currentUser = null;
        localStorage.removeItem('loanai_auth');

        // Clear form
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';

        this.showLogin();
    },

    // ==================== Utility ====================
    togglePasswordVisibility(inputId = 'login-password', iconId = 'toggle-password') {
        const input = document.getElementById(inputId);
        const icon = document.getElementById(iconId);

        if (!input || !icon) return;

        if (input.type === 'password') {
            input.type = 'text';
            icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>`;
        } else {
            input.type = 'password';
            icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>`;
        }
    },

    showError(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast toast-error';
        toast.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <circle cx="12" cy="12" r="10"/>
                <path d="M15 9l-6 6M9 9l6 6"/>
            </svg>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
};

// Initialize auth when DOM is ready
document.addEventListener('DOMContentLoaded', () => Auth.init());
