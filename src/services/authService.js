// Authentication service
import { getAuth, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { hashPassword, verifyPassword } from '../utils/security.js';

const auth = getAuth();

class AuthService {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
    }

    /**
     * Login with email and password
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<Object>} User data
     */
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            this.currentUser = userCredential.user;
            // Check if user is admin (you would typically get this from user claims or database)
            this.isAdmin = email.endsWith('@admin.com');
            
            // Store minimal user data in localStorage
            localStorage.setItem('user', JSON.stringify({
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                isAdmin: this.isAdmin,
                lastLogin: new Date().toISOString()
            }));
            
            return { success: true, user: this.currentUser };
        } catch (error) {
            console.error('Login error:', error);
            throw new Error(this._getAuthErrorMessage(error.code));
        }
    }

    /**
     * Logout the current user
     */
    async logout() {
        try {
            await signOut(auth);
            this.currentUser = null;
            this.isAdmin = false;
            localStorage.removeItem('user');
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            throw new Error('Failed to log out');
        }
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!this.currentUser || !!localStorage.getItem('user');
    }

    /**
     * Get current user
     * @returns {Object|null}
     */
    getCurrentUser() {
        if (this.currentUser) return this.currentUser;
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    /**
     * Map Firebase auth error codes to user-friendly messages
     * @private
     */
    _getAuthErrorMessage(code) {
        const messages = {
            'auth/invalid-email': 'Invalid email address',
            'auth/user-disabled': 'This account has been disabled',
            'auth/user-not-found': 'No account found with this email',
            'auth/wrong-password': 'Incorrect password',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.'
        };
        return messages[code] || 'An error occurred during authentication';
    }
}

export const authService = new AuthService();
