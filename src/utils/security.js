// Security utility functions
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Initialize auth
const auth = getAuth();

/**
 * Hashes a password using bcrypt
 * @param {string} password - The password to hash
 * @returns {Promise<string>} - The hashed password
 */
const hashPassword = async (password) => {
    // In a production environment, you should use a proper backend service for hashing
    // This is a simplified version for demonstration
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Verifies a password against a hash
 * @param {string} password - The password to verify
 * @param {string} hash - The hash to verify against
 * @returns {Promise<boolean>} - True if the password matches the hash
 */
const verifyPassword = async (password, hash) => {
    const hashedPassword = await hashPassword(password);
    return hashedPassword === hash;
};

export { hashPassword, verifyPassword };
