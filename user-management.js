// User Management Module for PharmaStore
class UserManager {
    constructor(pharmaStore) {
        this.pharmaStore = pharmaStore;
    }

    // Handle login form submission
    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const userType = document.getElementById('userType').value;
        
        // Simple validation
        if (!username || !password || !userType) {
            this.pharmaStore.showMessage('Please fill in all fields', 'error');
            return;
        }
        
        try {
            // Find user by username and type
            const user = this.pharmaStore.users.find(u => 
                u.username.toLowerCase() === username.toLowerCase() && 
                u.type === userType
            );
            
            // Check if user exists and is active
            if (!user) {
                this.pharmaStore.showMessage('Invalid username or password', 'error');
                this.logActivity('login_failed', `Failed login attempt for username: ${username} - User not found`);
                return;
            }
            
            // Check if account is locked
            if (user.status === 'locked') {
                const timeLeft = this.getAccountLockTimeLeft(user);
                if (timeLeft > 0) {
                    this.pharmaStore.showMessage(`Account locked. Please try again in ${timeLeft} minutes.`, 'error');
                    return;
                } else {
                    // Unlock the account after lock time has passed
                    user.status = 'active';
                    user.failedLoginAttempts = 0;
                    user.lockedUntil = null;
                    this.pharmaStore.saveData('users', this.pharmaStore.users);
                }
            }
            
            // Check password (in production, use proper password hashing)
            if (user.password !== password) {
                // Increment failed login attempts
                user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
                
                // Check if account should be locked
                if (user.failedLoginAttempts >= 5) {
                    user.status = 'locked';
                    user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
                    this.pharmaStore.showMessage('Account locked due to too many failed attempts. Please try again in 30 minutes.', 'error');
                    this.logActivity('account_locked', `Account locked for user: ${username} due to multiple failed login attempts`);
                } else {
                    const attemptsLeft = 5 - user.failedLoginAttempts;
                    this.pharmaStore.showMessage(`Invalid password. ${attemptsLeft} attempts remaining.`, 'error');
                    this.logActivity('login_failed', `Failed login attempt for user: ${username} - ${attemptsLeft} attempts left`);
                }
                
                this.pharmaStore.saveData('users', this.pharmaStore.users);
                return;
            }
            
            // Reset failed login attempts on successful login
            user.failedLoginAttempts = 0;
            user.lastLogin = new Date().toISOString();
            user.lockedUntil = null; // Clear any lock
            this.pharmaStore.saveData('users', this.pharmaStore.users);
            
            // Set current user
            this.pharmaStore.currentUser = user;
            this.pharmaStore.isAdmin = user.type === 'admin';
            
            // Show main application
            this.pharmaStore.showMainApp();
            
            // Show welcome message
            this.pharmaStore.showMessage(`Welcome back, ${user.profile?.firstName || user.username}!`, 'success');
            
            // Log successful login
            this.logActivity('login_success', `User ${username} logged in successfully`);
            
        } catch (error) {
            console.error('Login error:', error);
            this.pharmaStore.showMessage('An error occurred during login', 'error');
            this.logActivity('login_error', `Error during login for user: ${username} - ${error.message}`);
        }
    }

    // Handle user logout
    handleLogout() {
        this.pharmaStore.hideInactivityWarning();
        
        if (this.pharmaStore.currentUser) {
            this.logActivity('logout', `User ${this.pharmaStore.currentUser.username} logged out`);
        }
        this.pharmaStore.currentUser = null;
        this.pharmaStore.isAdmin = false;
        this.pharmaStore.showLoginScreen();
    }

    // Get remaining lock time in minutes
    getAccountLockTimeLeft(user) {
        if (!user.lockedUntil) return 0;
        const lockTime = new Date(user.lockedUntil).getTime();
        const now = Date.now();
        return Math.ceil((lockTime - now) / (60 * 1000)); // Convert to minutes
    }
    
    // Log activity
    logActivity(action, details) {
        const activity = {
            id: 'activity-' + Date.now(),
            userId: this.pharmaStore.currentUser?.id,
            username: this.pharmaStore.currentUser?.username,
            action,
            details,
            timestamp: new Date().toISOString(),
            ipAddress: '127.0.0.1' // In a real app, get this from the request
        };
        
        // Add to audit log
        this.pharmaStore.auditLog.unshift(activity);
        if (this.pharmaStore.auditLog.length > 1000) { // Keep log size manageable
            this.pharmaStore.auditLog = this.pharmaStore.auditLog.slice(0, 1000);
        }
        this.pharmaStore.saveData('auditLog', this.pharmaStore.auditLog);
    }
    
    // Request password reset
    async requestPasswordReset(email) {
        try {
            // Find user by email
            const user = this.pharmaStore.users.find(u => u.email === email);
            if (!user) {
                // Don't reveal that the email doesn't exist for security
                console.log('If an account with that email exists, a password reset link has been sent.');
                return { success: true };
            }
            
            // Generate reset token
            const token = 'reset-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const expires = new Date();
            expires.setHours(expires.getHours() + 1); // 1 hour expiration
            
            // Update user with reset token
            user.passwordResetToken = token;
            user.passwordResetExpires = expires.toISOString();
            this.pharmaStore.saveData('users', this.pharmaStore.users);
            
            // In a real app, send email with reset link
            const resetLink = `${window.location.origin}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
            console.log('Password reset link:', resetLink); // In production, send email instead
            
            // Log the activity
            this.logActivity('password_reset_requested', `Password reset requested for ${email}`);
            
            return { success: true };
            
        } catch (error) {
            console.error('Password reset request error:', error);
            this.logActivity('password_reset_error', `Error requesting password reset: ${error.message}`);
            return { success: false, error: 'An error occurred while processing your request' };
        }
    }
    
    // Reset password with token
    async resetPassword(email, token, newPassword) {
        try {
            // Find user by email and token
            const user = this.pharmaStore.users.find(u => 
                u.email === email && 
                u.passwordResetToken === token && 
                new Date(u.passwordResetExpires) > new Date()
            );
            
            if (!user) {
                return { success: false, error: 'Invalid or expired reset token' };
            }
            
            // Update password
            user.password = newPassword; // In production, hash the password
            user.passwordResetToken = null;
            user.passwordResetExpires = null;
            user.lastPasswordChange = new Date().toISOString();
            user.failedLoginAttempts = 0; // Reset failed attempts
            
            this.pharmaStore.saveData('users', this.pharmaStore.users);
            
            // Log the activity
            this.logActivity('password_reset', `Password reset for ${email}`);
            
            return { success: true };
            
        } catch (error) {
            console.error('Password reset error:', error);
            this.logActivity('password_reset_error', `Error resetting password: ${error.message}`);
            return { success: false, error: 'An error occurred while resetting your password' };
        }
    }
    
    // UI function to send reset link
    async sendResetLink() {
        const email = document.getElementById('resetEmail').value.trim();
        if (!email) {
            this.pharmaStore.showMessage('Please enter your email address', 'error');
            return;
        }
        
        const result = await this.requestPasswordReset(email);
        if (result.success) {
            // Show success message and switch to step 2
            document.getElementById('resetPasswordStep1').style.display = 'none';
            document.getElementById('resetPasswordStep2').style.display = 'block';
        } else {
            this.pharmaStore.showMessage(result.error || 'Failed to send reset link', 'error');
        }
    }
    
    // Update user profile
    async updateUserProfile(userId, updates) {
        try {
            const user = this.pharmaStore.users.find(u => u.id === userId);
            if (!user) {
                throw new Error('User not found');
            }
            
            // Update user data
            Object.assign(user, {
                ...updates,
                updatedAt: new Date().toISOString()
            });
            
            // If updating the current user, update the currentUser reference
            if (this.pharmaStore.currentUser && this.pharmaStore.currentUser.id === userId) {
                this.pharmaStore.currentUser = { ...this.pharmaStore.currentUser, ...updates };
            }
            
            this.pharmaStore.saveData('users', this.pharmaStore.users);
            this.logActivity('profile_updated', `User ${user.username} updated their profile`);
            
            return { success: true };
            
        } catch (error) {
            console.error('Update profile error:', error);
            this.logActivity('profile_update_error', `Error updating profile: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    
    // Change password
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = this.pharmaStore.users.find(u => u.id === userId);
            if (!user) {
                throw new Error('User not found');
            }
            
            // Verify current password (in production, use proper password hashing)
            if (user.password !== currentPassword) {
                throw new Error('Current password is incorrect');
            }
            
            // Update password
            user.password = newPassword; // In production, hash the password
            user.lastPasswordChange = new Date().toISOString();
            user.failedLoginAttempts = 0; // Reset failed attempts
            
            this.pharmaStore.saveData('users', this.pharmaStore.users);
            
            // If changing the current user's password, update the currentUser reference
            if (this.pharmaStore.currentUser && this.pharmaStore.currentUser.id === userId) {
                this.pharmaStore.currentUser = { ...this.pharmaStore.currentUser, password: newPassword };
            }
            
            this.logActivity('password_changed', `User ${user.username} changed their password`);
            
            return { success: true };
            
        } catch (error) {
            console.error('Change password error:', error);
            this.logActivity('password_change_error', `Error changing password: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    
    // Get user by ID
    getUserById(userId) {
        return this.pharmaStore.users.find(user => user.id === userId);
    }
    
    // Get all users (for admin)
    getAllUsers() {
        return this.pharmaStore.users;
    }
    
    // Create new user (admin only)
    async createUser(userData) {
        try {
            // Check if username or email already exists
            const usernameExists = this.pharmaStore.users.some(u => u.username === userData.username);
            const emailExists = this.pharmaStore.users.some(u => u.email === userData.email);
            
            if (usernameExists) {
                throw new Error('Username already exists');
            }
            
            if (emailExists) {
                throw new Error('Email already in use');
            }
            
            // Create new user
            const newUser = {
                id: 'user-' + Date.now() + Math.random().toString(36).substr(2, 9),
                username: userData.username,
                password: userData.password, // In production, hash the password
                email: userData.email,
                type: userData.type || 'user',
                status: userData.status || 'active',
                failedLoginAttempts: 0,
                lastLogin: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastPasswordChange: new Date().toISOString(),
                passwordResetToken: null,
                passwordResetExpires: null,
                profile: {
                    firstName: userData.firstName || userData.username,
                    lastName: userData.lastName || '',
                    phone: userData.phone || '',
                    address: userData.address || ''
                }
            };
            
            this.pharmaStore.users.push(newUser);
            this.pharmaStore.saveData('users', this.pharmaStore.users);
            
            this.logActivity('user_created', `User ${newUser.username} created`);
            
            return { success: true, user: newUser };
            
        } catch (error) {
            console.error('Create user error:', error);
            this.logActivity('user_creation_error', `Error creating user: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    
    // Update user (admin only)
    async updateUser(userId, updates) {
        try {
            const userIndex = this.pharmaStore.users.findIndex(u => u.id === userId);
            if (userIndex === -1) {
                throw new Error('User not found');
            }
            
            // Preserve sensitive fields
            const { password, ...safeUpdates } = updates;
            
            // Update user data
            this.pharmaStore.users[userIndex] = {
                ...this.pharmaStore.users[userIndex],
                ...safeUpdates,
                updatedAt: new Date().toISOString()
            };
            
            // If updating the current user, update the currentUser reference
            if (this.pharmaStore.currentUser && this.pharmaStore.currentUser.id === userId) {
                this.pharmaStore.currentUser = { ...this.pharmaStore.currentUser, ...safeUpdates };
            }
            
            this.pharmaStore.saveData('users', this.pharmaStore.users);
            
            this.logActivity('user_updated', `User ${this.pharmaStore.users[userIndex].username} was updated`);
            
            return { success: true, user: this.pharmaStore.users[userIndex] };
            
        } catch (error) {
            console.error('Update user error:', error);
            this.logActivity('user_update_error', `Error updating user: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    
    // Delete user (admin only)
    async deleteUser(userId) {
        try {
            const userIndex = this.pharmaStore.users.findIndex(u => u.id === userId);
            if (userIndex === -1) {
                throw new Error('User not found');
            }
            
            // Prevent deleting the last admin
            const isLastAdmin = this.pharmaStore.users.filter(u => u.type === 'admin').length <= 1 && 
                               this.pharmaStore.users[userIndex].type === 'admin';
            
            if (isLastAdmin) {
                throw new Error('Cannot delete the last admin user');
            }
            
            const deletedUser = this.pharmaStore.users.splice(userIndex, 1)[0];
            this.pharmaStore.saveData('users', this.pharmaStore.users);
            
            this.logActivity('user_deleted', `User ${deletedUser.username} was deleted`);
            
            return { success: true, user: deletedUser };
            
        } catch (error) {
            console.error('Delete user error:', error);
            this.logActivity('user_deletion_error', `Error deleting user: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}

// Export the UserManager class
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = UserManager;
}
