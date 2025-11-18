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
        this.salesTaxRatePercent = this.loadData('salesTaxRatePercent') ?? 7.5;
        this.discountRatePercent = this.loadData('discountRatePercent') ?? 0;
        this.cashReceived = 0;
        this.salesTaxRate = this.salesTaxRatePercent / 100;
        this.userCameraStream = null;
        this.globalErrorHandlersRegistered = false;
        this.maxPhotoSizeBytes = 500 * 1024; // 500KB
        this.recentErrors = [];
        
        // Load users or initialize with default users
        const loadedUsers = this.loadData('users');
        if (Array.isArray(loadedUsers) && loadedUsers.length > 0) {
            this.users = loadedUsers;
        } else {
            this.users = [
                { username: 'admin', password: 'password123', type: 'admin', createdAt: new Date().toISOString(), photo: '' },
                { username: 'user', password: 'user123', type: 'user', createdAt: new Date().toISOString(), photo: '' }
            ];
            this.saveData('users', this.users);
        }
        
        this.auditLog = this.loadData('auditLog') || [];
        this.currentLanguage = this.loadData('language') || 'en';
        this.translations = this.getTranslations();
        this.isOnline = navigator.onLine;
        this.cloudSyncEnabled = false; // Disable cloud sync
        
        // Theme management
        this.currentTheme = this.loadData('theme') || 'light';
        this.applyTheme(this.currentTheme);
        
        // Auto-logout timer
        this.inactivityTimer = null;
        this.inactivityWarningTimer = null;
        this.lastActivityTime = Date.now();
        this.inactivityTimeout = 60 * 1000; // 1 minute in milliseconds
        this.warningTime = 50 * 1000; // Show warning at 50 seconds
        
        this.setupGlobalErrorHandlers();
        this.init();
        this.ensureLegacyPasswordHashes();
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
            if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
                this.showMessage('Storage limit reached. Please clear old data before saving new records.', 'error');
                this.logAuditEvent('storage_quota', `Failed to save ${key}: quota exceeded`);
            }
            return false;
        }
    }

    async hashString(value) {
        if (!value) return '';
        const encoder = new TextEncoder();
        const data = encoder.encode(value);
        try {
            const digest = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.warn('Secure hashing unavailable, falling back to simple hash.', error);
            let hash = 0;
            for (let i = 0; i < value.length; i++) {
                hash = ((hash << 5) - hash) + value.charCodeAt(i);
                hash |= 0;
            }
            return hash.toString(16);
        }
    }

    async passwordMatches(user, plainPassword, hashedInput) {
        if (user.passwordHash) {
            return user.passwordHash === hashedInput;
        }
        return user.password === plainPassword;
    }

    async ensureLegacyPasswordHashes() {
        if (!Array.isArray(this.users)) return;
        let needsSave = false;
        for (const user of this.users) {
            if (user.password && !user.passwordHash) {
                user.passwordHash = await this.hashString(user.password);
                delete user.password;
                needsSave = true;
            }
        }
        if (needsSave) {
            this.saveData('users', this.users);
        }
    }

    // Authentication
    async handleLogin() {
        try {
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const loginMessage = document.getElementById('loginMessage');

            if (!usernameInput || !passwordInput || !loginMessage) {
                console.error('Required login elements not found');
                return false;
            }

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            // Basic validation
            if (!username || !password) {
                loginMessage.textContent = 'Please enter both username and password';
                loginMessage.style.color = 'red';
                loginMessage.style.display = 'block';
                return false;
            }

            // Find user in the users array
            const user = this.users.find(u => 
                u.username === username
            );

            if (user) {
                const hashedInput = await this.hashString(password);
                const passwordMatches = await this.passwordMatches(user, password, hashedInput);

                if (!passwordMatches) {
                    loginMessage.textContent = 'Invalid username or password';
                    loginMessage.style.color = 'red';
                    loginMessage.style.display = 'block';
                    this.logAuditEvent('login_failed', 'Failed login attempt for username: ' + username);
                    return false;
                }

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
        this.renderErrorLogTable();
    }

    setupGlobalErrorHandlers() {
        if (this.globalErrorHandlersRegistered) return;
        window.addEventListener('error', (event) => {
            console.error('Global error captured', event?.error || event);
            this.showMessage('An unexpected error occurred. Please try again.', 'error');
            this.logAuditEvent('global_error', event?.message || 'Unexpected error');
            this.recordGlobalError('global_error', event?.message || 'Unexpected error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection', event?.reason);
            this.showMessage('Something went wrong while processing your request.', 'error');
            this.logAuditEvent('promise_rejection', event?.reason?.message || 'Unhandled rejection');
            this.recordGlobalError('promise_rejection', event?.reason?.message || 'Unhandled rejection');
        });
        this.globalErrorHandlersRegistered = true;
    }

    recordGlobalError(action, details) {
        const entry = {
            timestamp: new Date().toISOString(),
            action,
            details
        };
        this.recentErrors = [entry, ...(this.recentErrors || [])].slice(0, 10);
        this.renderErrorLogTable();
    }

    renderErrorLogTable() {
        const tbody = document.getElementById('errorLogTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        (this.recentErrors || []).forEach(err => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(err.timestamp)} ${new Date(err.timestamp).toLocaleTimeString()}</td>
                <td>${err.action}</td>
                <td>${err.details}</td>
            `;
            tbody.appendChild(row);
        });
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
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showSection(btn.dataset.section);
            });
        });

        // Drug form
        const drugFormElem = document.getElementById('drugFormElement');
        if (drugFormElem) {
            drugFormElem.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleDrugSubmit();
            });
        }

        // Drug search
        const drugSearch = document.getElementById('drugSearch');
        if (drugSearch) {
            drugSearch.addEventListener('input', (e) => {
                this.filterDrugs(e.target.value);
            });
        }

        // Change password modal
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) changePasswordBtn.addEventListener('click', () => this.openChangePassword());
        const cancelChangePassword = document.getElementById('cancelChangePassword');
        if (cancelChangePassword) cancelChangePassword.addEventListener('click', () => this.closeChangePassword());
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleChangePassword();
            });
        }

        // Admin add user
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleAddUser();
            });
        }

        document.getElementById('startCameraBtn')?.addEventListener('click', () => this.startUserCamera());
        document.getElementById('capturePhotoBtn')?.addEventListener('click', () => this.captureUserPhoto());
        document.getElementById('clearPhotoBtn')?.addEventListener('click', () => this.clearUserPhoto({ preserveStream: true }));

        // Stock adjustment form
        const stockAdjustmentForm = document.getElementById('stockAdjustmentForm');
        if (stockAdjustmentForm) {
            stockAdjustmentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleStockAdjustment();
            });
        }

        // Stock adjustment drug selection
        const adjustmentDrugSelect = document.getElementById('adjustmentDrug');
        if (adjustmentDrugSelect) {
            adjustmentDrugSelect.addEventListener('change', (e) => {
                this.updateAdjustmentCurrentStock(e.target.value);
            });
        }

        // Multi-item sales
        document.getElementById('addSaleItemBtn')?.addEventListener('click', () => this.addSaleItem());
        document.getElementById('processMultiSaleBtn')?.addEventListener('click', () => this.processMultiSale());

        // Petty cash form
        const pettyCashForm = document.getElementById('pettyCashForm');
        if (pettyCashForm) {
            pettyCashForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePettyCashEntry();
            });
        }

        // Employee form
        const employeeForm = document.getElementById('employeeForm');
        if (employeeForm) {
            employeeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddEmployee();
            });
        }

        // Salary payment form
        const salaryPaymentForm = document.getElementById('salaryPaymentForm');
        if (salaryPaymentForm) {
            salaryPaymentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSalaryPayment();
            });
        }

        // Petty cash balance update
        const updateBalanceBtn = document.getElementById('updatePettyCashBalance');
        if (updateBalanceBtn) {
            updateBalanceBtn.addEventListener('click', () => this.toggleBalanceUpdateForm());
        }

        // Theme switcher
        const themeSwitcher = document.getElementById('themeSwitcher');
        if (themeSwitcher) {
            themeSwitcher.addEventListener('click', () => this.toggleTheme());
        }

        // Employee select change handler
        const paymentEmployeeSelect = document.getElementById('paymentEmployee');
        if (paymentEmployeeSelect) {
            paymentEmployeeSelect.addEventListener('change', (e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                const salary = parseFloat(selectedOption.getAttribute('data-salary')) || 0;
                const amountInput = document.getElementById('paymentAmount');
                if (amountInput) {
                    amountInput.value = salary.toFixed(2);
                }
            });
        }

        // Activity tracking
        document.addEventListener('click', () => this.resetInactivityTimer());
        document.addEventListener('keypress', () => this.resetInactivityTimer());
        document.addEventListener('mousemove', () => this.resetInactivityTimer());

        window.addEventListener('beforeunload', () => this.stopUserCamera());
        this.setCameraButtonsState({ capture: false, clear: false });

        this.setupSalesControls();
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
        
        this.hideInactivityWarning();
        
        if (this.currentUser) {
            this.logAuditEvent('logout', `User ${this.currentUser.username} logged out`);
        }
        
        // Reset user session
        this.currentUser = null;
        this.isAdmin = false;
        
        // Show login screen
        this.showLoginScreen();
    }

    // Show login screen
    showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.reset();
    }

    // Navigation
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected section
        const section = document.getElementById(sectionId);
        const navBtn = document.querySelector(`[data-section="${sectionId}"]`);
        if (section) section.classList.add('active');
        if (navBtn) navBtn.classList.add('active');
        
        // Reset inactivity timer on navigation
        this.resetInactivityTimer();

        // Update specific sections
        if (sectionId === 'dashboard') {
            this.updateDashboard();
        } else if (sectionId === 'drugs') {
            this.renderDrugs();
        } else if (sectionId === 'sales') {
            this.renderSales();
            this.populateSalesDrugs();
            const tbody = document.getElementById('saleItemsBody');
            if (tbody && tbody.children.length === 0) {
                this.addSaleItem();
            }
        } else if (sectionId === 'reports') {
            this.updateReportDate();
        } else if (sectionId === 'analytics') {
            this.renderAnalytics();
        } else if (sectionId === 'stockAdjustment') {
            this.populateAdjustmentDrugs();
            this.renderStockAdjustments();
        } else if (sectionId === 'pettyCash') {
            const expenseDate = document.getElementById('expenseDate');
            if (expenseDate) {
                expenseDate.value = new Date().toISOString().split('T')[0];
            }
            this.renderPettyCash();
            this.updatePettyCashSummary();
        } else if (sectionId === 'payroll') {
            if (this.isAdmin) {
                this.populateEmployeeSelect();
                this.renderEmployees();
                this.renderSalaryPayments();
            }
        } else if (sectionId === 'audit') {
            this.renderAuditTrail();
        } else if (sectionId === 'admin') {
            this.renderUsersTable();
        }
    }

    // Update dashboard
    updateDashboard() {
        const totalDrugs = this.drugs.length;
        const lowStock = this.drugs.filter(drug => (drug.quantity || 0) <= 3).length;
        const todaySales = this.getTodaySales().reduce((sum, sale) => sum + (sale.total || 0), 0);
        const expiringSoon = this.drugs.filter(drug => {
            if (!drug.expiry) return false;
            const expiryDate = new Date(drug.expiry);
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            return expiryDate <= thirtyDaysFromNow;
        }).length;

        const totalDrugsEl = document.getElementById('totalDrugs');
        const lowStockEl = document.getElementById('lowStock');
        const todaySalesEl = document.getElementById('todaySales');
        const expiringSoonEl = document.getElementById('expiringSoon');
        
        if (totalDrugsEl) totalDrugsEl.textContent = totalDrugs;
        if (lowStockEl) lowStockEl.textContent = lowStock;
        if (todaySalesEl) todaySalesEl.textContent = `$${todaySales.toFixed(2)}`;
        if (expiringSoonEl) expiringSoonEl.textContent = expiringSoon;
    }

    getTodaySales() {
        const today = new Date().toISOString().split('T')[0];
        return (this.sales || []).filter(sale => sale.date === today);
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString();
        } catch (e) {
            return dateString;
        }
    }

    showMessage(message, type = 'info') {
        // Create or update message element
        let messageEl = document.getElementById('appMessage');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'appMessage';
            messageEl.className = 'message';
            document.body.insertBefore(messageEl, document.body.firstChild);
        }
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        messageEl.style.display = 'block';
        
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }

    hideInactivityWarning() {
        // Implement if needed
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

    setupSalesControls() {
        const taxInput = document.getElementById('taxRateInput');
        if (taxInput) {
            taxInput.value = this.salesTaxRatePercent.toString();
            taxInput.addEventListener('input', () => {
                const value = Math.max(0, Number(taxInput.value) || 0);
                this.salesTaxRatePercent = value;
                this.salesTaxRate = value / 100;
                this.saveData('salesTaxRatePercent', this.salesTaxRatePercent);
                this.updateTaxLabel();
                this.updateTotals();
            });
        }

        const discountInput = document.getElementById('discountRateInput');
        if (discountInput) {
            discountInput.value = this.discountRatePercent.toString();
            discountInput.addEventListener('input', () => {
                const value = Math.min(Math.max(Number(discountInput.value) || 0, 0), 100);
                this.discountRatePercent = value;
                this.saveData('discountRatePercent', this.discountRatePercent);
                this.updateTotals();
            });
        }

        const cashInput = document.getElementById('cashReceivedInput');
        if (cashInput) {
            cashInput.value = this.cashReceived ? this.cashReceived.toString() : '';
            cashInput.addEventListener('input', () => {
                this.cashReceived = Math.max(0, Number(cashInput.value) || 0);
                this.updateTotals();
            });
        }

        this.updateTaxLabel();
    }

    updateTaxLabel() {
        const label = document.getElementById('saleTaxLabel');
        if (label) {
            label.textContent = `Tax (${this.salesTaxRatePercent.toFixed(1)}%)`;
        }
    }

    // Get translations
    getTranslations() {
        return {
            en: {
                welcome: 'Welcome',
                login: 'Login',
                logout: 'Logout',
            }
        };
    }

    // Drug Management
    toggleDrugForm() {
        const form = document.getElementById('drugForm');
        if (form) {
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
            if (form.style.display === 'block') {
                const formElement = document.getElementById('drugFormElement');
                if (formElement) {
                    formElement.reset();
                    formElement.dataset.editId = '';
                }
            }
        }
    }

    cancelDrugForm() {
        const form = document.getElementById('drugForm');
        const formElement = document.getElementById('drugFormElement');
        if (form) form.style.display = 'none';
        if (formElement) {
            formElement.reset();
            formElement.dataset.editId = '';
        }
    }

    handleDrugSubmit() {
        const form = document.getElementById('drugFormElement');
        if (!form) return;
        
        const isEdit = form.dataset.editId;
        const drugData = {
            name: document.getElementById('drugName')?.value || '',
            category: document.getElementById('drugCategory')?.value || '',
            quantity: parseInt(document.getElementById('drugQuantity')?.value || 0),
            price: parseFloat(document.getElementById('drugPrice')?.value || 0),
            expiry: document.getElementById('drugExpiry')?.value || '',
            supplier: document.getElementById('drugSupplier')?.value || 'N/A',
            id: isEdit || Date.now().toString()
        };

        if (!drugData.name || !drugData.category || !drugData.quantity || !drugData.price || !drugData.expiry) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }

        if (drugData.quantity < 0 || drugData.price < 0) {
            this.showMessage('Quantity and price must be positive numbers', 'error');
            return;
        }

        if (isEdit) {
            const index = this.drugs.findIndex(d => d.id === isEdit);
            if (index !== -1) {
                this.drugs[index] = drugData;
                this.showMessage('Drug updated successfully', 'success');
                this.logAuditEvent('edit_drug', `Updated drug: ${drugData.name}`);
            }
        } else {
            this.drugs.push(drugData);
            this.showMessage('Drug added successfully', 'success');
            this.logAuditEvent('add_drug', `Added drug: ${drugData.name}`);
        }

        this.saveData('drugs', this.drugs);
        this.renderDrugs();
        this.populateSalesDrugs();
        this.updateDashboard();
        this.cancelDrugForm();
    }

    renderDrugs() {
        const tbody = document.getElementById('drugTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        (this.drugs || []).forEach(drug => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${drug.name || ''}</td>
                <td>${drug.category || ''}</td>
                <td class="${(drug.quantity || 0) <= 3 ? 'text-danger' : ''}">${drug.quantity || 0}</td>
                <td>$${(drug.price || 0).toFixed(2)}</td>
                <td>${this.formatDate(drug.expiry)}</td>
                <td>${drug.supplier || 'N/A'}</td>
                <td>
                    <button class="btn-edit" onclick="pharmaStore.editDrug('${drug.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="pharmaStore.deleteDrug('${drug.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    editDrug(id) {
        const drug = this.drugs.find(d => d.id === id);
        if (!drug) return;

        const nameEl = document.getElementById('drugName');
        const categoryEl = document.getElementById('drugCategory');
        const quantityEl = document.getElementById('drugQuantity');
        const priceEl = document.getElementById('drugPrice');
        const expiryEl = document.getElementById('drugExpiry');
        const supplierEl = document.getElementById('drugSupplier');
        const formElement = document.getElementById('drugFormElement');
        const form = document.getElementById('drugForm');

        if (nameEl) nameEl.value = drug.name || '';
        if (categoryEl) categoryEl.value = drug.category || '';
        if (quantityEl) quantityEl.value = drug.quantity || 0;
        if (priceEl) priceEl.value = drug.price || 0;
        if (expiryEl) expiryEl.value = drug.expiry || '';
        if (supplierEl) supplierEl.value = drug.supplier || '';
        if (formElement) formElement.dataset.editId = id;
        if (form) form.style.display = 'block';
    }

    deleteDrug(id) {
        if (confirm('Are you sure you want to delete this drug?')) {
            const drug = this.drugs.find(d => d.id === id);
            this.drugs = this.drugs.filter(d => d.id !== id);
            this.saveData('drugs', this.drugs);
            this.renderDrugs();
            this.populateSalesDrugs();
            this.updateDashboard();
            this.showMessage('Drug deleted successfully', 'success');
            if (drug) {
                this.logAuditEvent('delete_drug', `Deleted drug: ${drug.name}`);
            }
        }
    }

    filterDrugs(searchTerm) {
        const tbody = document.getElementById('drugTableBody');
        if (!tbody) return;
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
        });
    }

    // Sales Management
    populateSalesDrugs() {
        const saleSelect = document.getElementById('saleDrug');
        const adjustmentSelect = document.getElementById('adjustmentDrug');

        if (saleSelect) saleSelect.innerHTML = '<option value="">Select Drug</option>';
        if (adjustmentSelect) adjustmentSelect.innerHTML = '<option value="">Select Drug</option>';

        if (!Array.isArray(this.drugs)) return;

        this.drugs.forEach(d => {
            const price = Number(d.price || 0).toFixed(2);
            const optionHtml = `<option value="${d.id}" data-price="${price}">${d.name}</option>`;
            if (saleSelect) saleSelect.insertAdjacentHTML('beforeend', optionHtml);
            if (adjustmentSelect) adjustmentSelect.insertAdjacentHTML('beforeend', optionHtml);
        });
    }

    populateAdjustmentDrugs() {
        this.populateSalesDrugs(); // Reuse the same logic
    }

    addSaleItem(initial = {}) {
        const tbody = document.getElementById('saleItemsBody');
        if (!tbody) return;
        const tr = document.createElement('tr');

        const templateSelect = document.getElementById('saleDrug');
        const optionsHTML = templateSelect ? templateSelect.innerHTML : '<option value="">Select Drug</option>';

        tr.innerHTML = `
            <td>
                <select class="sale-drug-select">
                    ${optionsHTML}
                </select>
            </td>
            <td><input type="number" min="1" value="${initial.quantity || 1}" class="sale-qty"></td>
            <td><input type="number" step="0.01" value="${initial.price || 0}" class="sale-unit-price" readonly></td>
            <td class="sale-line-total">${(((initial.quantity||1)*(initial.price||0))||0).toFixed(2)}</td>
            <td><button type="button" class="remove-sale-item btn-secondary">Remove</button></td>
        `;
        tbody.appendChild(tr);
        this.updateTotals();

        const select = tr.querySelector('.sale-drug-select');
        const qty = tr.querySelector('.sale-qty');
        const priceInput = tr.querySelector('.sale-unit-price');
        const removeBtn = tr.querySelector('.remove-sale-item');

        select?.addEventListener('change', () => {
            const opt = select.options[select.selectedIndex];
            const p = parseFloat(opt?.dataset?.price ?? opt?.getAttribute('data-price') ?? 0) || 0;
            if (priceInput) priceInput.value = p.toFixed(2);
            this.updateSaleLineTotalForRow(tr);
        });

        qty?.addEventListener('input', () => this.updateSaleLineTotalForRow(tr));

        removeBtn?.addEventListener('click', () => {
            tr.remove();
            this.updateTotals();
        });

        select?.dispatchEvent(new Event('change'));
    }

    updateSaleLineTotalForRow(tr) {
        const qty = Number(tr.querySelector('.sale-qty')?.value) || 0;
        const unit = Number(tr.querySelector('.sale-unit-price')?.value) || 0;
        const totalCell = tr.querySelector('.sale-line-total');
        if (totalCell) totalCell.textContent = (qty * unit).toFixed(2);
        this.updateTotals();
    }

    updateTotals() {
        const rows = Array.from(document.querySelectorAll('#saleItemsBody tr'));
        const items = rows.map(r => ({
            total: Number(r.querySelector('.sale-line-total')?.textContent) || 0,
            quantity: Number(r.querySelector('.sale-qty')?.value) || 0
        }));

        const calculator = window.PharmaCalculations?.calculateSaleSummary;
        const summary = calculator
            ? calculator({
                items,
                taxRate: this.salesTaxRatePercent,
                discountRate: this.discountRatePercent,
                cashReceived: this.cashReceived
            })
            : this.fallbackSaleSummary(items);

        const subtotalEl = document.getElementById('saleSubtotal');
        if (subtotalEl) subtotalEl.textContent = summary.subtotal.toFixed(2);
        const taxEl = document.getElementById('saleTax');
        if (taxEl) taxEl.textContent = summary.taxAmount.toFixed(2);
        const discountEl = document.getElementById('saleDiscount');
        if (discountEl) discountEl.textContent = summary.discountAmount.toFixed(2);
        const grandTotalEl = document.getElementById('saleGrandTotal');
        if (grandTotalEl) grandTotalEl.textContent = summary.grandTotal.toFixed(2);
        const changeEl = document.getElementById('saleChangeDue');
        if (changeEl) changeEl.textContent = summary.changeDue.toFixed(2);
        const itemCountEl = document.getElementById('saleItemCount');
        if (itemCountEl) itemCountEl.textContent = rows.length.toString();
        const unitCountEl = document.getElementById('saleUnitCount');
        if (unitCountEl) unitCountEl.textContent = summary.totalUnits.toString();
    }

    fallbackSaleSummary(items) {
        const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
        const totalUnits = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const taxAmount = subtotal * this.salesTaxRate;
        const discountAmount = subtotal * (this.discountRatePercent / 100);
        const grandTotal = subtotal + taxAmount - discountAmount;
        const changeDue = this.cashReceived - grandTotal;
        return {
            subtotal,
            taxAmount,
            discountAmount,
            grandTotal,
            changeDue,
            totalUnits
        };
    }

    async processMultiSale() {
        const rows = Array.from(document.querySelectorAll('#saleItemsBody tr'));
        if (rows.length === 0) {
            alert('Add at least one sale item.');
            return;
        }
        const items = rows.map(r => {
            const select = r.querySelector('.sale-drug-select');
            const drugId = select?.value || '';
            const drugName = select?.options[select.selectedIndex]?.text || '';
            const qty = Number(r.querySelector('.sale-qty')?.value) || 0;
            const price = Number(r.querySelector('.sale-unit-price')?.value) || 0;
            return { drugId, drugName, qty, price, total: +(qty * price).toFixed(2) };
        });

        const options = {
            customerName: document.getElementById('multiSaleCustomerName')?.value || 'Walk-in Customer',
            paymentMethod: document.getElementById('multiSalePaymentMethod')?.value || 'Cash'
        };

        try {
            await this.handleMultiSale(items, options);
        } catch (err) {
            console.error('processMultiSale error', err);
            alert('Error processing sale. See console for details.');
        }

        const body = document.getElementById('saleItemsBody');
        if (body) body.innerHTML = '';
        this.updateTotals();
    }

    async handleMultiSale(items = [], options = {}) {
        if (!Array.isArray(items) || items.length === 0) {
            this.showMessage('No items to process', 'error');
            return;
        }

        const validation = window.PharmaValidation?.validateSaleRequest?.(this.drugs, items);
        if (validation && !validation.ok) {
            this.showMessage(validation.issues[0], 'error');
            return;
        } else if (!validation) {
        for (const it of items) {
            if (!it.drugId) {
                this.showMessage('Please select a drug for all items', 'error');
                return;
            }
            const drug = this.drugs.find(d => d.id === it.drugId || d.id == it.drugId);
            if (!drug) {
                this.showMessage(`Drug not found: ${it.drugName || it.drugId}`, 'error');
                return;
            }
            if ((Number(drug.quantity) || 0) < Number(it.qty || 0)) {
                this.showMessage(`Insufficient stock for ${drug.name}`, 'error');
                return;
                }
            }
        }

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];
        const createdSales = [];

        for (const it of items) {
            const drug = this.drugs.find(d => d.id === it.drugId || d.id == it.drugId);
            drug.quantity = Math.max(0, (Number(drug.quantity) || 0) - Number(it.qty || 0));

            const sale = {
                id: `${Date.now().toString()}_${Math.random().toString(36).slice(2,7)}`,
                drugId: it.drugId,
                drugName: drug.name || it.drugName || '',
                quantity: Number(it.qty) || 0,
                price: Number(it.price) || Number(drug.price) || 0,
                total: +((Number(it.qty) || 0) * (Number(it.price) || Number(drug.price) || 0)).toFixed(2),
                customerName: options.customerName || 'Walk-in Customer',
                paymentMethod: options.paymentMethod || 'Cash',
                date: dateStr,
                time: timeStr,
                soldBy: this.currentUser?.username || 'unknown'
            };

            this.sales = Array.isArray(this.sales) ? this.sales : [];
            this.sales.push(sale);
            createdSales.push(sale);

            this.logAuditEvent('sale', `Sold ${sale.quantity} of ${sale.drugName} for $${sale.total.toFixed(2)}`);
        }

        this.saveData('sales', this.sales);
        this.saveData('drugs', this.drugs);

        this.renderSales();
        this.populateSalesDrugs();
        this.updateDashboard();

        this.showReceiptForItems(items);
        this.showMessage('Multi-item sale processed successfully', 'success');

        return createdSales;
    }

    showReceiptForItems(items) {
        const container = document.getElementById('receiptContainer');
        const content = document.getElementById('receiptContent');
        if (container && content) {
            container.style.display = 'block';
            const lines = items.map(i => `${i.drugName} x${i.qty} @ ${i.price.toFixed(2)} = ${i.total.toFixed(2)}`);
            content.innerHTML = `
                <strong>Sale</strong><br>
                ${lines.join('<br>')}<hr>
                <strong>Total: $${items.reduce((s,i)=>s+i.total,0).toFixed(2)}</strong>
            `;
        }

        const tbody = document.getElementById('salesTableBody');
        if (tbody) {
            const tr = document.createElement('tr');
            const date = new Date().toLocaleString();
            const drugs = items.map(i=>i.drugName).join(', ');
            const qty = items.reduce((s,i)=>s+i.qty,0);
            const total = items.reduce((s,i)=>s+i.total,0).toFixed(2);
            tr.innerHTML = `<td>${date}</td><td>${drugs}</td><td>${qty}</td><td>$${total}</td><td>$${total}</td><td>${document.getElementById('multiSaleCustomerName')?.value || 'Walk-in'}</td><td></td>`;
            tbody.prepend(tr);
        }
    }

    renderSales() {
        const tbody = document.getElementById('salesTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        (this.sales || []).slice().reverse().forEach(sale => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sale.date || ''} ${sale.time || ''}</td>
                <td>${sale.drugName || ''}</td>
                <td>${sale.quantity || 0}</td>
                <td>$${(sale.price || 0).toFixed(2)}</td>
                <td>$${(sale.total || 0).toFixed(2)}</td>
                <td>${sale.customerName || 'Walk-in'}</td>
                <td>
                    <button class="btn-delete" onclick="pharmaStore.deleteSale('${sale.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    deleteSale(id) {
        if (confirm('Are you sure you want to delete this sale?')) {
            const sale = this.sales.find(s => s.id === id);
            if (sale) {
                // Restore stock
                const drug = this.drugs.find(d => d.id === sale.drugId);
                if (drug) {
                    drug.quantity = (drug.quantity || 0) + (sale.quantity || 0);
                }
                this.saveData('drugs', this.drugs);
            }
            this.sales = this.sales.filter(s => s.id !== id);
            this.saveData('sales', this.sales);
            this.renderSales();
            this.updateDashboard();
            this.showMessage('Sale deleted successfully', 'success');
            if (sale) {
                this.logAuditEvent('delete_sale', `Deleted sale: ${sale.drugName}`);
            }
        }
    }

    updateAdjustmentCurrentStock(drugId) {
        const drug = this.drugs.find(d => d.id === drugId);
        const currentStockEl = document.getElementById('adjustmentCurrentStock');
        if (currentStockEl && drug) {
            currentStockEl.textContent = drug.quantity || 0;
        }
    }

    handleStockAdjustment() {
        const drugId = document.getElementById('adjustmentDrug')?.value;
        const adjustmentType = document.getElementById('adjustmentType')?.value;
        const quantity = parseInt(document.getElementById('adjustmentQuantity')?.value || 0);
        const reason = document.getElementById('adjustmentReason')?.value;
        const notes = document.getElementById('adjustmentNotes')?.value || '';

        if (!drugId || !adjustmentType || !quantity || !reason) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }

        const drug = this.drugs.find(d => d.id === drugId);
        if (!drug) {
            this.showMessage('Drug not found', 'error');
            return;
        }

        const oldQuantity = drug.quantity || 0;
        let newQuantity = oldQuantity;

        if (adjustmentType === 'increase') {
            newQuantity = oldQuantity + quantity;
        } else if (adjustmentType === 'decrease') {
            newQuantity = Math.max(0, oldQuantity - quantity);
        } else if (adjustmentType === 'set') {
            newQuantity = quantity;
        }

        drug.quantity = newQuantity;
        this.saveData('drugs', this.drugs);

        const adjustment = {
            id: Date.now().toString(),
            drugId: drugId,
            drugName: drug.name,
            oldQuantity: oldQuantity,
            adjustment: adjustmentType === 'increase' ? `+${quantity}` : adjustmentType === 'decrease' ? `-${quantity}` : `Set to ${quantity}`,
            newQuantity: newQuantity,
            reason: reason,
            notes: notes,
            adjustedBy: this.currentUser?.username || 'unknown',
            timestamp: new Date().toISOString()
        };

        this.stockAdjustments = this.stockAdjustments || [];
        this.stockAdjustments.push(adjustment);
        this.saveData('stockAdjustments', this.stockAdjustments);

        this.logAuditEvent('stock_adjustment', `Adjusted ${drug.name}: ${adjustment.adjustment} (Reason: ${reason})`);
        this.showMessage('Stock adjustment applied successfully', 'success');
        this.renderStockAdjustments();
        this.updateDashboard();
        this.populateSalesDrugs();

        // Reset form
        const form = document.getElementById('stockAdjustmentForm');
        if (form) form.reset();
        document.getElementById('adjustmentCurrentStock').textContent = '0';
    }

    renderStockAdjustments() {
        const tbody = document.getElementById('stockAdjustmentsTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        (this.stockAdjustments || []).slice().reverse().forEach(adj => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(adj.timestamp)}</td>
                <td>${adj.drugName || ''}</td>
                <td>${adj.oldQuantity || 0}</td>
                <td>${adj.adjustment || ''}</td>
                <td>${adj.newQuantity || 0}</td>
                <td>${adj.reason || ''}</td>
                <td>${adj.notes || ''}</td>
                <td>${adj.adjustedBy || ''}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Placeholder methods for other features - to be implemented
    renderAnalytics() {
        // Analytics rendering - placeholder
        console.log('Rendering analytics...');
    }

    updateReportDate() {
        const reportDate = document.getElementById('reportDate');
        if (reportDate && !reportDate.value) {
            reportDate.value = new Date().toISOString().split('T')[0];
        }
    }

    generateReport() {
        const type = document.getElementById('reportType')?.value || 'daily';
        const dateStr = document.getElementById('reportDate')?.value || new Date().toISOString().split('T')[0];
        const { start, end, label } = this.getReportRange(type, dateStr);
        const reportContainer = document.getElementById('reportContainer');
        const reportTitle = document.getElementById('reportTitle');
        const reportContent = document.getElementById('reportContent');

        const sales = type === 'inventory' ? [] : (this.sales || []).filter(sale => {
            if (!sale.date) return false;
            const saleDate = new Date(`${sale.date}T${sale.time || '00:00:00'}`);
            return saleDate >= start && saleDate <= end;
        });

        const totalSales = sales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
        const totalItems = sales.reduce((sum, sale) => sum + (Number(sale.quantity) || 0), 0);

        document.getElementById('totalSalesAmount').textContent = `$${totalSales.toFixed(2)}`;
        document.getElementById('totalItemsSold').textContent = type === 'inventory' ? this.drugs.length : totalItems;
        document.getElementById('totalTransactions').textContent = type === 'inventory' ? this.drugs.length : sales.length;

        if (reportTitle) {
            reportTitle.textContent = `${label} Report`;
        }
        if (reportContainer) {
            reportContainer.style.display = 'block';
        }

        if (reportContent) {
            if (type === 'inventory') {
                const rows = (this.drugs || []).map(drug => `
                    <tr>
                        <td>${drug.name || ''}</td>
                        <td>${drug.category || ''}</td>
                        <td>${drug.quantity || 0}</td>
                        <td>$${(drug.price || 0).toFixed(2)}</td>
                        <td>${drug.expiry || 'N/A'}</td>
                        <td>${drug.supplier || 'N/A'}</td>
                    </tr>
                `).join('');
                reportContent.innerHTML = `
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Expiry</th>
                                <th>Supplier</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                `;
            } else if (!sales.length) {
                reportContent.innerHTML = `<p class="section-description">No sales recorded for the selected period.</p>`;
            } else {
                const rows = sales.map(sale => `
                    <tr>
                        <td>${sale.date || ''}</td>
                        <td>${sale.time || ''}</td>
                        <td>${sale.drugName || ''}</td>
                        <td>${sale.quantity || 0}</td>
                        <td>$${(sale.price || 0).toFixed(2)}</td>
                        <td>$${(sale.total || 0).toFixed(2)}</td>
                        <td>${sale.customerName || 'Walk-in Customer'}</td>
                    </tr>
                `).join('');
                reportContent.innerHTML = `
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Drug</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total</th>
                                <th>Customer</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                `;
            }
        }

        this.showMessage('Report generated successfully', 'success');
        this.logAuditEvent('generate_report', `${label} report generated`);
    }

    getReportRange(type, dateStr) {
        const baseDate = dateStr ? new Date(dateStr) : new Date();
        const start = new Date(baseDate);
        const end = new Date(baseDate);
        let label = 'Daily';

        switch (type) {
            case 'weekly':
                {
                    const day = start.getDay();
                    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
                    start.setDate(diff);
                    end.setDate(start.getDate() + 6);
                    label = 'Weekly';
                }
                break;
            case 'monthly':
                start.setDate(1);
                end.setMonth(start.getMonth() + 1);
                end.setDate(0);
                label = 'Monthly';
                break;
            case 'yearly':
                start.setMonth(0, 1);
                end.setMonth(11, 31);
                label = 'Yearly';
                break;
            case 'inventory':
                start.setFullYear(1970, 0, 1);
                end.setFullYear(3000, 0, 1);
                label = 'Inventory';
                break;
            default:
                label = 'Daily';
        }

        return { start, end, label };
    }

    printReport() {
        const reportContainer = document.getElementById('reportContainer');
        if (!reportContainer || reportContainer.style.display === 'none') {
            this.showMessage('Generate a report before printing.', 'error');
            return;
        }
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        const title = document.getElementById('reportTitle')?.textContent || 'Report';
        printWindow.document.write(`<html><head><title>${title}</title>`);
        printWindow.document.write('<link rel="stylesheet" href="style.css">');
        printWindow.document.write('</head><body>');
        printWindow.document.write(reportContainer.outerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    }

    printReceipt() {
        window.print();
    }

    exportData() {
        const data = {
            drugs: this.drugs,
            sales: this.sales,
            stockAdjustments: this.stockAdjustments,
            pettyCash: this.pettyCash,
            employees: this.employees,
            salaryPayments: this.salaryPayments,
            users: this.users,
            auditLog: this.auditLog,
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pharmastore-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showMessage('Data exported successfully', 'success');
        this.logAuditEvent('export_data', 'Data exported');
    }

    importData() {
        const input = document.getElementById('fileInput');
        if (input) {
            input.click();
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const data = JSON.parse(event.target.result);
                            if (confirm('This will replace all current data. Are you sure?')) {
                                if (data.drugs) this.drugs = data.drugs;
                                if (data.sales) this.sales = data.sales;
                                if (data.stockAdjustments) this.stockAdjustments = data.stockAdjustments;
                                if (data.pettyCash) this.pettyCash = data.pettyCash;
                                if (data.employees) this.employees = data.employees;
                                if (data.salaryPayments) this.salaryPayments = data.salaryPayments;
                                if (data.users) this.users = data.users;
                                if (data.auditLog) this.auditLog = data.auditLog;

                                this.saveData('drugs', this.drugs);
                                this.saveData('sales', this.sales);
                                this.saveData('stockAdjustments', this.stockAdjustments);
                                this.saveData('pettyCash', this.pettyCash);
                                this.saveData('employees', this.employees);
                                this.saveData('salaryPayments', this.salaryPayments);
                                this.saveData('users', this.users);
                                this.saveData('auditLog', this.auditLog);

                                this.showMessage('Data imported successfully', 'success');
                                this.logAuditEvent('import_data', 'Data imported');
                                this.updateDashboard();
                                this.renderDrugs();
                                this.renderSales();
                            }
                        } catch (error) {
                            this.showMessage('Error importing data: ' + error.message, 'error');
                        }
                    };
                    reader.readAsText(file);
                }
            };
        }
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
            localStorage.clear();
            location.reload();
        }
    }

    syncToCloud() {
        this.showMessage('Cloud sync is disabled in offline mode', 'info');
    }

    syncFromCloud() {
        this.showMessage('Cloud sync is disabled in offline mode', 'info');
    }

    setupCloudBackup() {
        this.showMessage('Cloud backup is disabled in offline mode', 'info');
    }

    changeLanguage(lang) {
        this.setLanguage(lang);
        this.showMessage('Language changed to ' + lang, 'success');
    }

    // Theme management
    applyTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        this.saveData('theme', theme);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        this.showMessage(`Switched to ${newTheme} theme`, 'success');
    }

    renderAuditTrail() {
        const tbody = document.getElementById('auditTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        (this.auditLog || []).slice().reverse().forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(log.timestamp)}</td>
                <td>${log.user || 'system'}</td>
                <td>${log.action || ''}</td>
                <td>${log.details || ''}</td>
                <td>127.0.0.1</td>
            `;
            tbody.appendChild(row);
        });
    }

    filterAuditTrail() {
        // Simple filter implementation
        this.renderAuditTrail();
    }

    clearAuditFilters() {
        document.getElementById('auditUser').value = '';
        document.getElementById('auditAction').value = '';
        document.getElementById('auditDate').value = '';
        this.renderAuditTrail();
    }

    async handleAddUser() {
        if (!this.isAdmin) {
            this.showMessage('Only admins can add users', 'error');
            return;
        }

        const username = document.getElementById('newUsername')?.value.trim();
        const password = document.getElementById('newPassword')?.value;
        const userType = document.getElementById('newUserType')?.value;
        const photoData = document.getElementById('newUserPhoto')?.value || '';

        if (!username || !password || !userType) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        if (this.users.find(u => u.username === username)) {
            this.showMessage('Username already exists', 'error');
            return;
        }

        const passwordHash = await this.hashString(password);

        const newUser = {
            username: username,
            passwordHash: passwordHash,
            type: userType,
            createdAt: new Date().toISOString(),
            photo: photoData
        };

        this.users.push(newUser);
        this.saveData('users', this.users);
        this.showMessage('User added successfully', 'success');
        this.logAuditEvent('add_user', `Added user: ${username}`);
        this.renderUsersTable();

        const form = document.getElementById('addUserForm');
        if (form) form.reset();
        this.clearUserPhoto();
    }

    async startUserCamera() {
        if (!navigator.mediaDevices?.getUserMedia) {
            this.showMessage('Camera access is not supported on this device.', 'error');
            return;
        }

        try {
            if (this.userCameraStream) {
                this.stopUserCamera();
            }
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            this.userCameraStream = stream;
            const video = document.getElementById('userCameraPreview');
            if (video) {
                video.srcObject = stream;
                video.style.display = 'block';
                await video.play().catch(() => {});
            }
            const preview = document.getElementById('userPhotoPreview');
            if (preview) {
                preview.classList.remove('has-photo');
                preview.style.display = 'none';
                preview.src = '';
            }
            const hiddenInput = document.getElementById('newUserPhoto');
            if (hiddenInput) hiddenInput.value = '';
            this.setCameraButtonsState({ capture: true, clear: false });
            this.showMessage('Camera ready. Capture the user photo when ready.', 'info');
        } catch (error) {
            console.error('Camera access error:', error);
            this.showMessage('Unable to access camera: ' + error.message, 'error');
            this.logAuditEvent('camera_error', error.message || 'Camera unavailable');
            this.setCameraButtonsState({ capture: false, clear: false });
        }
    }

    captureUserPhoto() {
        if (!this.userCameraStream) {
            this.showMessage('Start the camera before capturing a photo.', 'error');
            return;
        }
        const video = document.getElementById('userCameraPreview');
        const canvas = document.getElementById('userPhotoCanvas');
        if (!video || !canvas) {
            this.showMessage('Camera preview unavailable.', 'error');
            return;
        }

        const context = canvas.getContext('2d');
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        if (!this.isPhotoWithinLimit(dataUrl)) {
            this.showMessage('Captured photo is too large. Please move the camera closer and try again.', 'error');
            return;
        }

        const hiddenInput = document.getElementById('newUserPhoto');
        if (hiddenInput) {
            hiddenInput.value = dataUrl;
        }

        const preview = document.getElementById('userPhotoPreview');
        if (preview) {
            preview.src = dataUrl;
            preview.classList.add('has-photo');
            preview.style.display = 'block';
        }
        this.stopUserCamera();
        this.setCameraButtonsState({ capture: false, clear: true });
        this.showMessage('User photo captured successfully.', 'success');
    }

    clearUserPhoto(options = {}) {
        const { preserveStream = false } = options;
        const hiddenInput = document.getElementById('newUserPhoto');
        if (hiddenInput) hiddenInput.value = '';

        const preview = document.getElementById('userPhotoPreview');
        if (preview) {
            preview.src = '';
            preview.classList.remove('has-photo');
            preview.style.display = 'none';
        }

        if (preserveStream && this.userCameraStream) {
            this.setCameraButtonsState({ capture: true, clear: false });
        } else {
            this.stopUserCamera();
            this.setCameraButtonsState({ capture: false, clear: false });
        }
    }

    isPhotoWithinLimit(dataUrl) {
        const estimator = window.PharmaValidation?.estimateBase64Size;
        const size = estimator ? estimator(dataUrl) : this.estimateBase64SizeFallback(dataUrl);
        return size <= this.maxPhotoSizeBytes;
    }

    estimateBase64SizeFallback(dataUrl) {
        if (!dataUrl.includes(',')) return 0;
        const base64 = dataUrl.split(',')[1];
        return Math.ceil((base64.length * 3) / 4);
    }

    stopUserCamera() {
        if (this.userCameraStream) {
            this.userCameraStream.getTracks().forEach(track => track.stop());
            this.userCameraStream = null;
        }
        const video = document.getElementById('userCameraPreview');
        if (video) {
            video.pause?.();
            video.srcObject = null;
            video.style.display = 'none';
        }
    }

    setCameraButtonsState({ capture = false, clear = false } = {}) {
        const captureBtn = document.getElementById('capturePhotoBtn');
        const clearBtn = document.getElementById('clearPhotoBtn');
        if (captureBtn) captureBtn.disabled = !capture;
        if (clearBtn) clearBtn.disabled = !clear;
    }

    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        (this.users || []).forEach(user => {
            const row = document.createElement('tr');
            const photoCell = user.photo 
                ? `<img src="${user.photo}" alt="${user.username} photo" class="user-photo-thumb">`
                : `<span class="text-muted">No photo</span>`;
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.type || 'user'}</td>
                <td>${this.formatDate(user.createdAt)}</td>
                <td>${photoCell}</td>
                <td>
                    <button class="btn-delete" onclick="pharmaStore.deleteUser('${user.username}')" ${user.username === this.currentUser?.username ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    deleteUser(username) {
        if (username === this.currentUser?.username) {
            this.showMessage('Cannot delete your own account', 'error');
            return;
        }
        if (confirm(`Are you sure you want to delete user: ${username}?`)) {
            this.users = this.users.filter(u => u.username !== username);
            this.saveData('users', this.users);
            this.showMessage('User deleted successfully', 'success');
            this.logAuditEvent('delete_user', `Deleted user: ${username}`);
            this.renderUsersTable();
        }
    }

    openChangePassword() {
        const modal = document.getElementById('changePasswordModal');
        if (modal) modal.style.display = 'block';
    }

    closeChangePassword() {
        const modal = document.getElementById('changePasswordModal');
        if (modal) modal.style.display = 'none';
        const form = document.getElementById('changePasswordForm');
        if (form) form.reset();
    }

    async handleChangePassword() {
        const currentPassword = document.getElementById('currentPassword')?.value;
        const newPassword1 = document.getElementById('newPassword1')?.value;
        const newPassword2 = document.getElementById('newPassword2')?.value;

        if (!currentPassword || !newPassword1 || !newPassword2) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        if (newPassword1 !== newPassword2) {
            this.showMessage('New passwords do not match', 'error');
            return;
        }

        const hashedCurrentInput = await this.hashString(currentPassword);
        const hasStoredHash = !!this.currentUser?.passwordHash;
        const storedHash = this.currentUser?.passwordHash;
        const currentMatches = hasStoredHash
            ? storedHash === hashedCurrentInput
            : this.currentUser?.password === currentPassword;

        if (!currentMatches) {
            this.showMessage('Current password is incorrect', 'error');
            return;
        }

        const newPasswordHash = await this.hashString(newPassword1);
        this.currentUser.passwordHash = newPasswordHash;
        delete this.currentUser.password;
        const userIndex = this.users.findIndex(u => u.username === this.currentUser.username);
        if (userIndex !== -1) {
            this.users[userIndex].passwordHash = newPasswordHash;
            delete this.users[userIndex].password;
            this.saveData('users', this.users);
            this.showMessage('Password changed successfully', 'success');
            this.logAuditEvent('change_password', 'Password changed');
            this.closeChangePassword();
        }
    }

    cancelEditUser() {
        // Placeholder
    }

    handlePettyCashEntry() {
        const date = document.getElementById('expenseDate')?.value;
        const category = document.getElementById('expenseCategory')?.value;
        const description = document.getElementById('expenseDescription')?.value;
        const amount = parseFloat(document.getElementById('expenseAmount')?.value || 0);
        const paymentMethod = document.getElementById('expensePaymentMethod')?.value;
        const notes = document.getElementById('expenseNotes')?.value || '';

        if (!date || !category || !description || !amount || !paymentMethod) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }

        if (amount <= 0) {
            this.showMessage('Amount must be greater than 0', 'error');
            return;
        }

        const entry = {
            id: Date.now().toString(),
            date: date,
            category: category,
            description: description,
            amount: amount,
            paymentMethod: paymentMethod,
            notes: notes,
            recordedBy: this.currentUser?.username || 'unknown',
            timestamp: new Date().toISOString()
        };

        this.pettyCash = this.pettyCash || [];
        this.pettyCash.push(entry);
        this.pettyCashBalance = (this.pettyCashBalance || 0) - amount;
        this.saveData('pettyCash', this.pettyCash);
        this.saveData('pettyCashBalance', this.pettyCashBalance);

        this.showMessage('Expense recorded successfully', 'success');
        this.logAuditEvent('petty_cash_entry', `Recorded expense: ${description} - $${amount.toFixed(2)}`);
        this.renderPettyCash();
        this.updatePettyCashSummary();

        const form = document.getElementById('pettyCashForm');
        if (form) form.reset();
    }

    renderPettyCash() {
        const tbody = document.getElementById('pettyCashTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        (this.pettyCash || []).slice().reverse().forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(entry.date)}</td>
                <td>${entry.category || ''}</td>
                <td>${entry.description || ''}</td>
                <td>$${(entry.amount || 0).toFixed(2)}</td>
                <td>${entry.paymentMethod || ''}</td>
                <td>${entry.notes || ''}</td>
                <td>${entry.recordedBy || ''}</td>
                <td>
                    <button class="btn-delete" onclick="pharmaStore.deletePettyCashEntry('${entry.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    deletePettyCashEntry(id) {
        if (confirm('Are you sure you want to delete this entry?')) {
            const entry = this.pettyCash.find(e => e.id === id);
            if (entry) {
                this.pettyCashBalance = (this.pettyCashBalance || 0) + (entry.amount || 0);
                this.saveData('pettyCashBalance', this.pettyCashBalance);
            }
            this.pettyCash = this.pettyCash.filter(e => e.id !== id);
            this.saveData('pettyCash', this.pettyCash);
            this.renderPettyCash();
            this.updatePettyCashSummary();
            this.showMessage('Entry deleted successfully', 'success');
        }
    }

    updatePettyCashSummary() {
        const balanceEl = document.getElementById('pettyCashBalanceDisplay');
        if (balanceEl) {
            balanceEl.textContent = (this.pettyCashBalance || 0).toFixed(2);
        }
    }

    toggleBalanceUpdateForm() {
        const form = document.getElementById('updateBalanceForm');
        if (form) {
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        }
    }

    savePettyCashBalance() {
        const newBalance = parseFloat(document.getElementById('newBalance')?.value || 0);
        const notes = document.getElementById('balanceNotes')?.value || '';

        if (newBalance < 0) {
            this.showMessage('Balance cannot be negative', 'error');
            return;
        }

        const oldBalance = this.pettyCashBalance || 0;
        this.pettyCashBalance = newBalance;
        this.saveData('pettyCashBalance', this.pettyCashBalance);

        const entry = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            category: 'Balance Update',
            description: `Balance updated from $${oldBalance.toFixed(2)} to $${newBalance.toFixed(2)}`,
            amount: newBalance - oldBalance,
            paymentMethod: 'Adjustment',
            notes: notes,
            recordedBy: this.currentUser?.username || 'unknown',
            timestamp: new Date().toISOString()
        };

        this.pettyCash = this.pettyCash || [];
        this.pettyCash.push(entry);
        this.saveData('pettyCash', this.pettyCash);

        this.showMessage('Balance updated successfully', 'success');
        this.logAuditEvent('petty_cash_balance_update', `Balance updated to $${newBalance.toFixed(2)}`);
        this.updatePettyCashSummary();
        this.renderPettyCash();
        this.toggleBalanceUpdateForm();
    }

    cancelBalanceUpdate() {
        this.toggleBalanceUpdateForm();
        document.getElementById('newBalance').value = '';
        document.getElementById('balanceNotes').value = '';
    }

    handleAddEmployee() {
        if (!this.isAdmin) {
            this.showMessage('Only admins can add employees', 'error');
            return;
        }

        const name = document.getElementById('employeeName')?.value.trim();
        const position = document.getElementById('employeePosition')?.value.trim();
        const salary = parseFloat(document.getElementById('employeeSalary')?.value || 0);
        const phone = document.getElementById('employeePhone')?.value.trim() || '';
        const email = document.getElementById('employeeEmail')?.value.trim() || '';
        const startDate = document.getElementById('employeeStartDate')?.value;

        if (!name || !position || !salary || !startDate) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }

        const employee = {
            id: Date.now().toString(),
            name: name,
            position: position,
            salary: salary,
            phone: phone,
            email: email,
            startDate: startDate,
            createdAt: new Date().toISOString()
        };

        this.employees = this.employees || [];
        this.employees.push(employee);
        this.saveData('employees', this.employees);

        this.showMessage('Employee added successfully', 'success');
        this.logAuditEvent('add_employee', `Added employee: ${name}`);
        this.renderEmployees();
        this.populateEmployeeSelect();

        const form = document.getElementById('employeeForm');
        if (form) {
            form.reset();
            form.style.display = 'none';
        }
    }

    renderEmployees() {
        const tbody = document.getElementById('employeesTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        (this.employees || []).forEach(emp => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${emp.name || ''}</td>
                <td>${emp.position || ''}</td>
                <td>$${(emp.salary || 0).toFixed(2)}</td>
                <td>${emp.phone || ''}</td>
                <td>${this.formatDate(emp.startDate)}</td>
                <td>
                    <button class="btn-delete" onclick="pharmaStore.deleteEmployee('${emp.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    deleteEmployee(id) {
        if (confirm('Are you sure you want to delete this employee?')) {
            this.employees = this.employees.filter(e => e.id !== id);
            this.saveData('employees', this.employees);
            this.showMessage('Employee deleted successfully', 'success');
            this.renderEmployees();
            this.populateEmployeeSelect();
        }
    }

    populateEmployeeSelect() {
        const select = document.getElementById('paymentEmployee');
        if (!select) return;
        select.innerHTML = '<option value="">Select Employee</option>';

        (this.employees || []).forEach(emp => {
            const option = document.createElement('option');
            option.value = emp.id;
            option.textContent = `${emp.name} - ${emp.position}`;
            option.setAttribute('data-salary', emp.salary || 0);
            select.appendChild(option);
        });
    }

    handleSalaryPayment() {
        if (!this.isAdmin) {
            this.showMessage('Only admins can process salary payments', 'error');
            return;
        }

        const employeeId = document.getElementById('paymentEmployee')?.value;
        const month = document.getElementById('paymentMonth')?.value;
        const amount = parseFloat(document.getElementById('paymentAmount')?.value || 0);
        const paymentMethod = document.getElementById('paymentMethod')?.value;
        const notes = document.getElementById('paymentNotes')?.value || '';

        if (!employeeId || !month || !amount || !paymentMethod) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }

        const employee = this.employees.find(e => e.id === employeeId);
        if (!employee) {
            this.showMessage('Employee not found', 'error');
            return;
        }

        const payment = {
            id: Date.now().toString(),
            employeeId: employeeId,
            employeeName: employee.name,
            position: employee.position,
            month: month,
            amount: amount,
            paymentMethod: paymentMethod,
            notes: notes,
            processedBy: this.currentUser?.username || 'unknown',
            timestamp: new Date().toISOString()
        };

        this.salaryPayments = this.salaryPayments || [];
        this.salaryPayments.push(payment);
        this.saveData('salaryPayments', this.salaryPayments);

        this.showMessage('Salary payment processed successfully', 'success');
        this.logAuditEvent('salary_payment', `Processed salary for ${employee.name}: $${amount.toFixed(2)}`);
        this.renderSalaryPayments();

        const form = document.getElementById('salaryPaymentForm');
        if (form) form.reset();
    }

    renderSalaryPayments() {
        const tbody = document.getElementById('salaryPaymentsTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        (this.salaryPayments || []).slice().reverse().forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(payment.timestamp)}</td>
                <td>${payment.employeeName || ''}</td>
                <td>${payment.position || ''}</td>
                <td>${payment.month || ''}</td>
                <td>$${(payment.amount || 0).toFixed(2)}</td>
                <td>${payment.paymentMethod || ''}</td>
                <td>${payment.notes || ''}</td>
                <td>${payment.processedBy || ''}</td>
            `;
            tbody.appendChild(row);
        });
    }

    toggleEmployeeForm() {
        const form = document.getElementById('employeeForm');
        if (form) {
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
            if (form.style.display === 'block') {
                form.reset();
            }
        }
    }

    cancelEmployeeForm() {
        const form = document.getElementById('employeeForm');
        if (form) {
            form.style.display = 'none';
            form.reset();
        }
    }
}

// Initialize the application when the DOM is fully loaded
let pharmaStore;
document.addEventListener('DOMContentLoaded', () => {
    try {
        pharmaStore = new PharmaStore();
        window.pharmaStore = pharmaStore;
    } catch (error) {
        console.error('Failed to initialize PharmaStore:', error);
    }
});

// Global functions for HTML onclick handlers
function showSection(sectionId) {
    if (pharmaStore) pharmaStore.showSection(sectionId);
}

function toggleDrugForm() {
    if (pharmaStore) pharmaStore.toggleDrugForm();
}

function cancelDrugForm() {
    if (pharmaStore) pharmaStore.cancelDrugForm();
}

function printReceipt() {
    if (pharmaStore) pharmaStore.printReceipt();
}

function printReport() {
    if (pharmaStore) pharmaStore.printReport();
}

function generateReport() {
    if (pharmaStore) pharmaStore.generateReport();
}

function exportData() {
    if (pharmaStore) pharmaStore.exportData();
}

function importData() {
    if (pharmaStore) pharmaStore.importData();
}

function clearAllData() {
    if (pharmaStore) pharmaStore.clearAllData();
}

function filterAuditTrail() {
    if (pharmaStore) pharmaStore.filterAuditTrail();
}

function clearAuditFilters() {
    if (pharmaStore) pharmaStore.clearAuditFilters();
}

function cancelEditUser() {
    if (pharmaStore) pharmaStore.cancelEditUser();
}

function toggleEmployeeForm() {
    if (pharmaStore) pharmaStore.toggleEmployeeForm();
}

function cancelEmployeeForm() {
    if (pharmaStore) pharmaStore.cancelEmployeeForm();
}

function savePettyCashBalance() {
    if (pharmaStore) pharmaStore.savePettyCashBalance();
}

function cancelBalanceUpdate() {
    if (pharmaStore) pharmaStore.cancelBalanceUpdate();
}

function toggleTheme() {
    if (pharmaStore) pharmaStore.toggleTheme();
}
