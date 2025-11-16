// PharmaStore Management System
class PharmaStore {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.drugs = this.loadData('drugs') || [];
        this.sales = this.loadData('sales') || [];
        this.stockAdjustments = this.loadData('stockAdjustments') || [];
        this.pettyCash = this.loadData('pettyCash') || [];
        this.pettyCashBalance = this.loadData('pettyCashBalance') || 0;
        this.employees = this.loadData('employees') || [];
        this.salaryPayments = this.loadData('salaryPayments') || [];
        
        // Load users or initialize with default users
        const loadedUsers = this.loadData('users');
        if (Array.isArray(loadedUsers) && loadedUsers.length > 0) {
            this.users = loadedUsers;
        } else {
            this.users = [
                { username: 'admin', password: 'password123', type: 'admin', createdAt: new Date().toISOString() },
                { username: 'user', password: 'user123', type: 'user', createdAt: new Date().toISOString() }
            ];
            this.saveData('users', this.users);
        }
        
        this.auditLog = this.loadData('auditLog') || [];
        this.currentLanguage = this.loadData('language') || 'en';
        this.translations = this.getTranslations();
        this.isOnline = navigator.onLine;
        this.cloudSyncEnabled = false; // Disable cloud sync
        
        // Auto-logout timer
        this.inactivityTimer = null;
        this.inactivityWarningTimer = null;
        this.lastActivityTime = Date.now();
        this.inactivityTimeout = 60 * 1000; // 1 minute in milliseconds
        this.warningTime = 50 * 1000; // Show warning at 50 seconds
        
        this.init();
    }

    // Data handling methods
    loadData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error loading data:', e);
            return null;
        }
    }

    saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error saving data:', e);
            return false;
        }
    }

    // Authentication
    handleLogin() {
        try {
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const userTypeSelect = document.getElementById('userType');
            const loginMessage = document.getElementById('loginMessage');

            if (!usernameInput || !passwordInput || !userTypeSelect || !loginMessage) {
                console.error('Required login elements not found');
                return false;
            }

            const username = usernameInput.value.trim();
            const password = passwordInput.value;
            const userType = userTypeSelect.value;

            // Basic validation
            if (!username || !password) {
                loginMessage.textContent = 'Please enter both username and password';
                loginMessage.style.color = 'red';
                loginMessage.style.display = 'block';
                return false;
            }

            // Find user in the users array
            const user = this.users.find(u => 
                u.username === username && 
                u.password === password && 
                u.type === userType
            );

            if (user) {
                this.currentUser = user;
                this.isAdmin = user.type === 'admin';
                
                // Log the login event
                this.logAuditEvent('login', 'User ' + username + ' logged in');
                
                // Show the main app
                this.showMainApp();
                
                // Initialize app data
                if (this.updateDashboard) this.updateDashboard();
                if (this.populateSalesDrugs) this.populateSalesDrugs();
                if (this.renderDrugs) this.renderDrugs();
                if (this.renderSales) this.renderSales();
                
                // Show welcome message
                loginMessage.textContent = 'Welcome, ' + username + '!';
                loginMessage.style.color = 'green';
                loginMessage.style.display = 'block';
                
                // Hide message after 3 seconds
                setTimeout(() => {
                    loginMessage.style.display = 'none';
                }, 3000);
                
                return true;
            } else {
                // Invalid credentials
                loginMessage.textContent = 'Invalid username or password';
                loginMessage.style.color = 'red';
                loginMessage.style.display = 'block';
                
                // Log failed login attempt
                this.logAuditEvent('login_failed', 'Failed login attempt for username: ' + username);
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            const loginMessage = document.getElementById('loginMessage');
            if (loginMessage) {
                loginMessage.textContent = 'An error occurred during login. Please try again.';
                loginMessage.style.color = 'red';
                loginMessage.style.display = 'block';
            }
            return false;
        }
    }

    // Log audit event helper method
    logAuditEvent(action, details) {
        try {
            const event = {
                action: action,
                details: details,
                timestamp: new Date().toISOString(),
                user: this.currentUser ? this.currentUser.username : 'system'
            };
            
            this.auditLog = this.auditLog || [];
            this.auditLog.push(event);
            this.saveData('auditLog', this.auditLog);
            
            console.log('[Audit] ' + action + ': ' + details);
            return true;
        } catch (error) {
            console.error('Error logging audit event:', error);
            return false;
        }
    }

    // Initialize the application
    init() {
        this.setupEventListeners();
        this.updateDashboard();
        this.setLanguage(this.currentLanguage);
        this.setupOnlineOfflineListeners();
        this.updateSyncStatus();
        this.setupInactivityTimer();
    }

    // Show main application
    showMainApp() {
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';
        
        const userEl = document.getElementById('currentUser');
        if (userEl && this.currentUser) {
            userEl.textContent = `${this.currentUser.username} (${this.currentUser.type || 'user'})`;
        }

        // Show/hide admin-only UI
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = this.isAdmin ? '' : 'none';
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Add your event listeners here
        document.addEventListener('click', () => this.resetInactivityTimer());
        document.addEventListener('keypress', () => this.resetInactivityTimer());
        document.addEventListener('mousemove', () => this.resetInactivityTimer());
    }

    // Reset inactivity timer
    resetInactivityTimer() {
        this.lastActivityTime = Date.now();
        
        if (this.inactivityWarningTimer) {
            clearTimeout(this.inactivityWarningTimer);
            this.inactivityWarningTimer = null;
        }
        
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        
        this.inactivityTimer = setTimeout(() => this.handleInactive(), this.inactivityTimeout);
        this.inactivityWarningTimer = setTimeout(
            () => this.showInactivityWarning(), 
            this.inactivityTimeout - this.warningTime
        );
    }

    // Handle inactive user
    handleInactive() {
        this.logAuditEvent('auto_logout', 'User logged out due to inactivity');
        this.handleLogout();
    }

    // Show inactivity warning
    showInactivityWarning() {
        // Implement warning UI if needed
        console.log('You will be logged out soon due to inactivity');
    }

    // Handle logout
    handleLogout() {
        // Clear inactivity timers
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
        
        if (this.inactivityWarningTimer) {
            clearTimeout(this.inactivityWarningTimer);
            this.inactivityWarningTimer = null;
        }
        
        // Reset user session
        this.currentUser = null;
        this.isAdmin = false;
        
        // Show login screen
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loginScreen) loginScreen.style.display = 'block';
        if (mainApp) mainApp.style.display = 'none';
        
        // Clear form fields
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
    }

    // Update dashboard
    updateDashboard() {
        // Implement dashboard update logic
        console.log('Updating dashboard...');
    }

    // Set language
    setLanguage(lang) {
        this.currentLanguage = lang;
        this.saveData('language', lang);
        // Implement language switching logic
    }

    // Setup online/offline listeners
    setupOnlineOfflineListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateSyncStatus();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateSyncStatus();
        });
    }

    // Update sync status
    updateSyncStatus() {
        const statusElement = document.getElementById('syncStatus');
        if (statusElement) {
            statusElement.textContent = this.isOnline ? 'Online' : 'Offline';
            statusElement.className = this.isOnline ? 'online' : 'offline';
        }
    }

    // Setup inactivity timer
    setupInactivityTimer() {
        this.resetInactivityTimer();
    }

    // Get translations
    getTranslations() {
        // Return translations object
        return {
            en: {
                welcome: 'Welcome',
                login: 'Login',
                logout: 'Logout',
                // Add more translations as needed
            }
            // Add more languages as needed
        };
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pharmaStore = new PharmaStore();
});
