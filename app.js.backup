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

    initializeFirebase() {
        // No-op in offline mode
        console.log('Running in offline mode - Local storage only');
    }

    init() {
        this.setupEventListeners();
        this.updateDashboard();
        this.setLanguage(this.currentLanguage);
        this.initializeFirebase();
        this.setupOnlineOfflineListeners();
        this.updateSyncStatus();
        this.setupInactivityTimer();
    }

    setupEventListeners() {
        // Login form (guarded)
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Logout button (guarded)
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Navigation buttons (guarded)
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showSection(btn.dataset.section);
            });
        });

        // Drug form (guarded)
        const drugFormElem = document.getElementById('drugFormElement');
        if (drugFormElem) {
            drugFormElem.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleDrugSubmit();
            });
        }

        // Sales form (if exists - for backward compatibility)
        const salesForm = document.getElementById('salesForm');
        if (salesForm) {
            salesForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaleSubmit();
            });
        }

        // Drug search (guarded)
        const drugSearch = document.getElementById('drugSearch');
        if (drugSearch) {
            drugSearch.addEventListener('input', (e) => {
                this.filterDrugs(e.target.value);
            });
        }

        // Sales drug selection (if old form exists)
        const saleDrugEl = document.getElementById('saleDrug');
        if (saleDrugEl) {
            saleDrugEl.addEventListener('change', (e) => {
                this.updateSalePrice(e.target.value);
            });
        }

        // Report date change (guarded)
        const reportDate = document.getElementById('reportDate');
        if (reportDate) {
            reportDate.addEventListener('change', () => {
                this.updateReportDate();
            });
        }

        // Change password modal controls (guarded)
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) changePasswordBtn.addEventListener('click', () => this.openChangePassword());
        const cancelChangePassword = document.getElementById('cancelChangePassword');
        if (cancelChangePassword) cancelChangePassword.addEventListener('click', () => this.closeChangePassword());
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) changePasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleChangePassword();
        });

        // Admin add user (guarded)
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddUser();
            });
        }

        // Stock adjustment form (guarded)
        const stockAdjustmentForm = document.getElementById('stockAdjustmentForm');
        if (stockAdjustmentForm) {
            stockAdjustmentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleStockAdjustment();
            });
        }        // ...existing code...
            <!-- Login Screen -->
            <div id="loginScreen" class="login-container">
                <div class="login-card">
                    <form id="loginForm" class="login-form">
                        <h2>Sign in</h2>
        
                        <label for="username">Username</label>
                        <input id="username" name="username" type="text" autocomplete="username" required>
        
                        <label for="password">Password</label>
                        <input id="password" name="password" type="password" autocomplete="current-password" required>
        
                        <!-- Optional: user type (admin/user) -->
                        <label for="userType">User Type (optional)</label>
                        <select id="userType" name="userType">
                            <option value="">Any</option>
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                        </select>
        
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Login</button>
                        </div>
        
                        <div id="loginMessage" class="form-message" aria-live="polite"></div>
                    </form>
                </div>
            </div>
        // ...existing code...        # show lines ~140-180 (PowerShell - line numbers start at 1)
        Get-Content -Path "c:\Users\Administrator\Desktop\githubfirst\Pharma_Store\app.js" | Select-Object -Skip 137 -First 44 | ForEach-Object { "{0,4}: {1}" -f ++$global:i, $_ }        # show lines ~140-180 (PowerShell - line numbers start at 1)
        Get-Content -Path "c:\Users\Administrator\Desktop\githubfirst\Pharma_Store\app.js" | Select-Object -Skip 137 -First 44 | ForEach-Object { "{0,4}: {1}" -f ++$global:i, $_ }        # show lines ~140-180 (PowerShell - line numbers start at 1)
        Get-Content -Path "c:\Users\Administrator\Desktop\githubfirst\Pharma_Store\app.js" | Select-Object -Skip 137 -First 44 | ForEach-Object { "{0,4}: {1}" -f ++$global:i, $_ }

        // Stock adjustment drug selection (guarded)
        const adjustmentDrugSelect = document.getElementById('adjustmentDrug');
        if (adjustmentDrugSelect) {
            adjustmentDrugSelect.addEventListener('change', (e) => {
                this.updateAdjustmentCurrentStock(e.target.value);
            });
        }

        // Multi-item sales (buttons may or may not exist at load)
        document.getElementById('addSaleItemBtn')?.addEventListener('click', () => this.addSaleItem());
        document.getElementById('processMultiSaleBtn')?.addEventListener('click', () => this.processMultiSale());

        // Petty cash form (guarded)
        const pettyCashForm = document.getElementById('pettyCashForm');
        if (pettyCashForm) {
            pettyCashForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePettyCashEntry();
            });
        }

        // Employee form (guarded)
        const employeeForm = document.getElementById('employeeForm');
        if (employeeForm) {
            employeeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddEmployee();
            });
        }

        // Salary payment form (guarded)
        const salaryPaymentForm = document.getElementById('salaryPaymentForm');
        if (salaryPaymentForm) {
            salaryPaymentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSalaryPayment();
            });
        }

        // Petty cash balance update (guarded)
        const updateBalanceBtn = document.getElementById('updatePettyCashBalance');
        if (updateBalanceBtn) {
            updateBalanceBtn.addEventListener('click', () => this.updatePettyCashBalance());
        }

        // Employee select change handler (guarded)
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
    }

    init() {
        this.setupEventListeners();
        this.updateDashboard();
        this.setLanguage(this.currentLanguage);
        this.setupOnlineOfflineListeners();
        this.updateSyncStatus();
        this.setupInactivityTimer();
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
            const user = this.users.find(function(u) {
                return u.username === username && 
                       u.password === password && 
                       u.type === userType;
            });

            if (user) {
                this.currentUser = user;
                this.isAdmin = user.type === 'admin';
                
                // Show the main app
                this.showMainApp();
                
                // Initialize app data
                this.updateDashboard();
                this.populateSalesDrugs();
                this.renderDrugs();
                this.renderSales();
                
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
                return false;
            }
                return false;
            }

            // Find user in the users array
            const user = this.users.find(function(u) {
                return u.username === username && 
                       u.password === password && 
                       (userType ? u.type === userType : true);
            });

            if (user) {
                this.currentUser = user;
                this.isAdmin = user.type === 'admin';
                
                // Log the login event
                if (this.logAuditEvent) {
                    this.logAuditEvent('login', 'User ' + username + ' logged in');
                }
                
                // Show the main app
                if (this.showMainApp) this.showMainApp();
                
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
                var self = this;
                setTimeout(function() {
                    loginMessage.style.display = 'none';
                }, 3000);
                
                return true;
            } else {
                // Invalid credentials
                loginMessage.textContent = 'Invalid username or password';
                loginMessage.style.color = 'red';
                loginMessage.style.display = 'block';
                
                // Log failed login attempt
                if (this.logAuditEvent) {
                    this.logAuditEvent('login_failed', 'Failed login attempt for username: ' + username);
                }
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
        this.currentUser = null;
        this.isAdmin = false;
        this.showLoginScreen();
    }

    showLoginScreen() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('loginForm').reset();
    }

    showMainApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        document.getElementById('currentUser').textContent = 
            `${this.currentUser.username} (${this.currentUser.type})`;
        
        // Show/hide admin panel buttons
        document.querySelectorAll('.admin-only').forEach(btn => {
            btn.style.display = this.isAdmin ? 'flex' : 'none';
        });

        // Ensure stock adjustment button is visible to all users
        const stockAdjBtn = document.querySelector('[data-section="stockAdjustment"]');
        if (stockAdjBtn) {
            stockAdjBtn.style.display = 'flex';
            stockAdjBtn.style.visibility = 'visible';
        }

        // Render admin-only user management visibility - always show for admin
        const userMgmt = document.getElementById('userManagement');
        if (userMgmt) {
            if (this.isAdmin) {
                userMgmt.style.display = 'block';
                userMgmt.style.visibility = 'visible';
            } else {
                userMgmt.style.display = 'none';
            }
        }

        this.renderUsersTable();
        this.logAuditEvent('login', `User ${this.currentUser.username} logged in`);
        
        // Reset inactivity timer on login
        this.resetInactivityTimer();
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
        document.getElementById(sectionId).classList.add('active');
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
        
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
            // Add one empty row if table is empty
            const tbody = document.getElementById('saleItemsBody');
            if (tbody && tbody.children.length === 0) {
                this.addSaleItem();
            }
        } else if (sectionId === 'reports') {
            this.updateReportDate();
        } else if (sectionId === 'analytics') {
            this.renderAnalytics();
        } else if (sectionId === 'stockAdjustment') {
            // Populate stock adjustment drug list
            this.populateAdjustmentDrugs();
            this.renderStockAdjustments();
        } else if (sectionId === 'pettyCash') {
            // Set default date to today
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
            // Ensure user management is visible when viewing admin panel
            const userMgmt = document.getElementById('userManagement');
            if (userMgmt) {
                if (this.isAdmin) {
                    userMgmt.style.display = 'block';
                    userMgmt.style.visibility = 'visible';
                } else {
                    userMgmt.style.display = 'none';
                }
            }
            
            this.renderUsersTable();
        }
    }

    // Dashboard
    updateDashboard() {
        const totalDrugs = this.drugs.length;
        const lowStock = this.drugs.filter(drug => drug.quantity <= 3).length;
        const todaySales = this.getTodaySales().reduce((sum, sale) => sum + sale.total, 0);
        const expiringSoon = this.drugs.filter(drug => {
            const expiryDate = new Date(drug.expiry);
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            return expiryDate <= thirtyDaysFromNow;
        }).length;

        document.getElementById('totalDrugs').textContent = totalDrugs;
        document.getElementById('lowStock').textContent = lowStock;
        document.getElementById('todaySales').textContent = `$${todaySales.toFixed(2)}`;
        document.getElementById('expiringSoon').textContent = expiringSoon;
    }

    // Drug Management
    toggleDrugForm() {
        const form = document.getElementById('drugForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        
        if (form.style.display === 'block') {
            document.getElementById('drugFormElement').reset();
            document.getElementById('drugFormElement').dataset.editId = '';
        }
    }

    cancelDrugForm() {
        document.getElementById('drugForm').style.display = 'none';
        document.getElementById('drugFormElement').reset();
        document.getElementById('drugFormElement').dataset.editId = '';
    }

    handleDrugSubmit() {
        const form = document.getElementById('drugFormElement');
        const isEdit = form.dataset.editId;
        
        const drugData = {
            name: document.getElementById('drugName').value,
            category: document.getElementById('drugCategory').value,
            quantity: parseInt(document.getElementById('drugQuantity').value),
            price: parseFloat(document.getElementById('drugPrice').value),
            expiry: document.getElementById('drugExpiry').value,
            supplier: document.getElementById('drugSupplier').value || 'N/A',
            id: isEdit || Date.now().toString()
        };

        // Validation
        if (!drugData.name || !drugData.category || !drugData.quantity || !drugData.price || !drugData.expiry) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }

        if (drugData.quantity < 0 || drugData.price < 0) {
            this.showMessage('Quantity and price must be positive numbers', 'error');
            return;
        }

        if (isEdit) {
            // Update existing drug
            const index = this.drugs.findIndex(d => d.id === isEdit);
            if (index !== -1) {
                this.drugs[index] = drugData;
                this.showMessage('Drug updated successfully', 'success');
                this.logAuditEvent('edit_drug', `Updated drug: ${drugData.name}`);
            }
        } else {
            // Add new drug
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
        tbody.innerHTML = '';

        this.drugs.forEach(drug => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${drug.name}</td>
                <td>${drug.category}</td>
                <td class="${drug.quantity <= 3 ? 'text-danger' : ''}">${drug.quantity}</td>
                <td>$${drug.price.toFixed(2)}</td>
                <td>${this.formatDate(drug.expiry)}</td>
                <td>${drug.supplier}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="pharmaStore.editDrug('${drug.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="pharmaStore.deleteDrug('${drug.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    editDrug(id) {
        const drug = this.drugs.find(d => d.id === id);
        if (!drug) return;

        document.getElementById('drugName').value = drug.name;
        document.getElementById('drugCategory').value = drug.category;
        document.getElementById('drugQuantity').value = drug.quantity;
        document.getElementById('drugPrice').value = drug.price;
        document.getElementById('drugExpiry').value = drug.expiry;
        document.getElementById('drugSupplier').value = drug.supplier;
        
        document.getElementById('drugFormElement').dataset.editId = id;
        document.getElementById('drugForm').style.display = 'block';
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
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
        });
    }

    // Sales Management
    populateSalesDrugs() {
        // populate visible selects and hidden template used by multi-sale rows
        const saleSelect = document.getElementById('saleDrug');
        const adjustmentSelect = document.getElementById('adjustmentDrug');
        const paymentSelects = []; // extend if you have other selects to populate

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

    // Multi-item sales helpers (UI-driven)
    addSaleItem(initial = {}) {
        const tbody = document.getElementById('saleItemsBody');
        if (!tbody) return;
        const tr = document.createElement('tr');

        // Use the hidden/populated #saleDrug as template for options
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

        const select = tr.querySelector('.sale-drug-select');
        const qty = tr.querySelector('.sale-qty');
        const priceInput = tr.querySelector('.sale-unit-price');
        const removeBtn = tr.querySelector('.remove-sale-item');

        // When drug selection changes, fill price from data-price attribute if present
        select.addEventListener('change', () => {
            const opt = select.options[select.selectedIndex];
            const p = parseFloat(opt?.dataset?.price ?? opt?.getAttribute('data-price') ?? 0) || 0;
            priceInput.value = p.toFixed(2);
            this.updateSaleLineTotalForRow(tr);
        });

        qty.addEventListener('input', () => this.updateSaleLineTotalForRow(tr));

        removeBtn.addEventListener('click', () => {
            tr.remove();
            this.updateTotals();
        });

        // trigger initial update (in case initial.price provided or option default)
        select.dispatchEvent(new Event('change'));
    }

    updateSaleLineTotalForRow(tr) {
        const qty = Number(tr.querySelector('.sale-qty').value) || 0;
        const unit = Number(tr.querySelector('.sale-unit-price').value) || 0;
        const totalCell = tr.querySelector('.sale-line-total');
        totalCell.textContent = (qty * unit).toFixed(2);
        this.updateTotals();
    }

    updateTotals() {
        const rows = Array.from(document.querySelectorAll('#saleItemsBody tr'));
        let subtotal = 0;
        rows.forEach(r => {
            subtotal += Number(r.querySelector('.sale-line-total').textContent) || 0;
        });
        const el = document.getElementById('saleSubtotal');
        if (el) el.textContent = subtotal.toFixed(2);
    }

    async processMultiSale() {
        const rows = Array.from(document.querySelectorAll('#saleItemsBody tr'));
        if (rows.length === 0) {
            alert('Add at least one sale item.');
            return;
        }
        const items = rows.map(r => {
            const select = r.querySelector('.sale-drug-select');
            const drugId = select.value;
            const drugName = select.options[select.selectedIndex]?.text || '';
            const qty = Number(r.querySelector('.sale-qty').value) || 0;
            const price = Number(r.querySelector('.sale-unit-price').value) || 0;
            return { drugId, drugName, qty, price, total: +(qty * price).toFixed(2) };
        });

        const options = {
            customerName: document.getElementById('multiSaleCustomerName')?.value || 'Walk-in Customer',
            paymentMethod: document.getElementById('multiSalePaymentMethod')?.value || 'Cash'
        };

        // Delegate to class handler which persists locally and to Firestore
        try {
            await this.handleMultiSale(items, options);
        } catch (err) {
            console.error('processMultiSale error', err);
            alert('Error processing sale. See console for details.');
            return;
        }

        // clear UI rows and totals
        const body = document.getElementById('saleItemsBody');
        if (body) body.innerHTML = '';
        this.updateTotals();
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

        // Update Recent Sales table (simple summary)
        const tbody = document.getElementById('salesTableBody');
        if (tbody) {
            const tr = document.createElement('tr');
            const date = new Date().toLocaleString();
            const drugs = items.map(i=>i.drugName).join(', ');
            const qty = items.reduce((s,i)=>s+i.qty,0);
            const price = items.reduce((s,i)=>s+i.price,0).toFixed(2);
            const total = items.reduce((s,i)=>s+i.total,0).toFixed(2);
            tr.innerHTML = `<td>${date}</td><td>${drugs}</td><td>${qty}</td><td>${price}</td><td>${total}</td><td>${document.getElementById('multiSaleCustomerName')?.value || 'Walk-in'}</td><td></td>`;
            tbody.prepend(tr);
        }
    }

    // New: handleMultiSale - saves to localStorage and updates Firestore (if available)
    async handleMultiSale(items = [], options = {}) {
        if (!Array.isArray(items) || items.length === 0) {
            if (typeof this.showMessage === 'function') this.showMessage('No items to process', 'error');
            return;
        }

        // Validate availability first (do not mutate until all validated)
        for (const it of items) {
            if (!it.drugId) {
                if (typeof this.showMessage === 'function') this.showMessage('Please select a drug for all items', 'error');
                return;
            }
            const drug = this.drugs.find(d => d.id === it.drugId || d.id == it.drugId);
            if (!drug) {
                if (typeof this.showMessage === 'function') this.showMessage(`Drug not found: ${it.drugName || it.drugId}`, 'error');
                return;
            }
            if ((Number(drug.quantity) || 0) < Number(it.qty || 0)) {
                if (typeof this.showMessage === 'function') this.showMessage(`Insufficient stock for ${drug.name}`, 'error');
                return;
            }
        }

        // All validated — process each item
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];
        const createdSales = [];

        for (const it of items) {
            const drug = this.drugs.find(d => d.id === it.drugId || d.id == it.drugId);
            // decrement stock
            drug.quantity = Math.max(0, (Number(drug.quantity) || 0) - Number(it.qty || 0));

            // create sale record
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

            // audit per item
            if (typeof this.logAuditEvent === 'function') {
                this.logAuditEvent('sale', `Sold ${sale.quantity} of ${sale.drugName} for $${sale.total.toFixed(2)}`);
            }
        }

        // Persist locally
        this.saveData('sales', this.sales);
        this.saveData('drugs', this.drugs);

        // Update UI
        if (typeof this.renderSales === 'function') this.renderSales();
        if (typeof this.populateSalesDrugs === 'function') this.populateSalesDrugs();
        if (typeof this.updateDashboard === 'function') this.updateDashboard();

        // Attempt cloud sync (Firestore) — non-blocking
        try {
            if (window.Firebase && window.Firebase.setDoc && window.Firebase.doc && window.Firebase.firestore) {
                const db = window.Firebase.firestore;
                await window.Firebase.setDoc(
                    window.Firebase.doc(db, 'pharmastore', 'sales'),
                    { data: this.sales, lastUpdated: new Date().toISOString() }
                );
                await window.Firebase.setDoc(
                    window.Firebase.doc(db, 'pharmastore', 'drugs'),
                    { data: this.drugs, lastUpdated: new Date().toISOString() }
                );
            }
        } catch (err) {
            console.error('Cloud write failed for multi-sale:', err);
            if (typeof this.showMessage === 'function') this.showMessage('Local save OK — cloud sync failed (see console)', 'warning');
        }

        // Show receipt and success message
        if (typeof this.showReceiptForItems === 'function') this.showReceiptForItems(items);
        if (typeof this.showMessage === 'function') this.showMessage('Multi-item sale processed successfully', 'success');

        return createdSales;
    }

    constructor() {
        // ...existing code...

        // --- Ensure user list exists (create safe defaults if missing) ---
        try {
            const stored = localStorage.getItem('users');
            this.users = stored ? JSON.parse(stored) : (Array.isArray(this.users) ? this.users : []);
        } catch (e) {
            this.users = Array.isArray(this.users) ? this.users : [];
        }

        if (!Array.isArray(this.users) || this.users.length === 0) {
            this.users = [
                { username: 'admin', password: 'admin123', type: 'admin', created: new Date().toISOString() },
                { username: 'test',  password: 'password',  type: 'user',  created: new Date().toISOString() }
            ];
            try { localStorage.setItem('users', JSON.stringify(this.users)); } catch (e) { console.warn('Could not save default users', e); }
        }

        // --- Provide a safe fallback for showMainApp if missing ---
        if (typeof this.showMainApp !== 'function') {
            this.showMainApp = () => {
                const loginScreen = document.getElementById('loginScreen');
                const mainApp = document.getElementById('mainApp');
                if (loginScreen) loginScreen.style.display = 'none';
                if (mainApp) mainApp.style.display = 'block';
                const userEl = document.getElementById('currentUser');
                if (userEl && this.currentUser) userEl.textContent = `${this.currentUser.username} (${this.currentUser.type || 'user'})`;

                // Show/hide admin-only UI
                document.querySelectorAll('.admin-only').forEach(el => {
    }
}

// New: handleMultiSale - saves to localStorage and updates Firestore (if available)
async handleMultiSale(items = [], options = {}) {
    if (!Array.isArray(items) || items.length === 0) {
        if (typeof this.showMessage === 'function') this.showMessage('No items to process', 'error');
        return;
    }

    // Validate availability first (do not mutate until all validated)
    for (const it of items) {
        if (!it.drugId) {
            if (typeof this.showMessage === 'function') this.showMessage('Please select a drug for all items', 'error');
            return;
        }
        const drug = this.drugs.find(d => d.id === it.drugId || d.id == it.drugId);
        if (!drug) {
            if (typeof this.showMessage === 'function') this.showMessage(`Drug not found: ${it.drugName || it.drugId}`, 'error');
            return;
        }
        if ((Number(drug.quantity) || 0) < Number(it.qty || 0)) {
            if (typeof this.showMessage === 'function') this.showMessage(`Insufficient stock for ${drug.name}`, 'error');
            return;
        }
    }

    // All validated — process each item
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const createdSales = [];

    for (const it of items) {
        const drug = this.drugs.find(d => d.id === it.drugId || d.id == it.drugId);
        // decrement stock
        drug.quantity = Math.max(0, (Number(drug.quantity) || 0) - Number(it.qty || 0));

        // create sale record
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

        // audit per item
        if (typeof this.logAuditEvent === 'function') {
            this.logAuditEvent('sale', `Sold ${sale.quantity} of ${sale.drugName} for $${sale.total.toFixed(2)}`);
        }
    }

    // Persist locally
    this.saveData('sales', this.sales);
    this.saveData('drugs', this.drugs);

    // Update UI
    if (typeof this.renderSales === 'function') this.renderSales();
    if (typeof this.populateSalesDrugs === 'function') this.populateSalesDrugs();
    if (typeof this.updateDashboard === 'function') this.updateDashboard();

    // Attempt cloud sync (Firestore) — non-blocking
    try {
        if (window.Firebase && window.Firebase.setDoc && window.Firebase.doc && window.Firebase.firestore) {
            const db = window.Firebase.firestore;
            await window.Firebase.setDoc(
                window.Firebase.doc(db, 'pharmastore', 'sales'),
                { data: this.sales, lastUpdated: new Date().toISOString() }
            );
            await window.Firebase.setDoc(
                window.Firebase.doc(db, 'pharmastore', 'drugs'),
                { data: this.drugs, lastUpdated: new Date().toISOString() }
            );
        }
    } catch (err) {
        console.error('Cloud write failed for multi-sale:', err);
        if (typeof this.showMessage === 'function') this.showMessage('Local save OK — cloud sync failed (see console)', 'warning');
    }

    // Show receipt and success message
    if (typeof this.showReceiptForItems === 'function') this.showReceiptForItems(items);
    if (typeof this.showMessage === 'function') this.showMessage('Multi-item sale processed successfully', 'success');

    return createdSales;
}

constructor() {
    // ...existing code...

    // --- Ensure user list exists (create safe defaults if missing) ---
    try {
        const stored = localStorage.getItem('users');
        this.users = stored ? JSON.parse(stored) : (Array.isArray(this.users) ? this.users : []);
    } catch (e) {
        this.users = Array.isArray(this.users) ? this.users : [];
    }

    if (!Array.isArray(this.users) || this.users.length === 0) {
        this.users = [
            { username: 'admin', password: 'admin123', type: 'admin', created: new Date().toISOString() },
            { username: 'test',  password: 'password',  type: 'user',  created: new Date().toISOString() }
        ];
        try { localStorage.setItem('users', JSON.stringify(this.users)); } catch (e) { console.warn('Could not save default users', e); }
    }

    // --- Provide a safe fallback for showMainApp if missing ---
    if (typeof this.showMainApp !== 'function') {
        this.showMainApp = () => {
            const loginScreen = document.getElementById('loginScreen');
            const mainApp = document.getElementById('mainApp');
            if (loginScreen) loginScreen.style.display = 'none';
            if (mainApp) mainApp.style.display = 'block';
            const userEl = document.getElementById('currentUser');
            if (userEl && this.currentUser) userEl.textContent = `${this.currentUser.username} (${this.currentUser.type || 'user'})`;

            // Show/hide admin-only UI
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = this.isAdmin ? '' : 'none';
            });
        };
    }

    // Log audit event helper method
    this.logAuditEvent = (action, details) => {
        try {
            const event = {
                action,
                details,
                timestamp: new Date().toISOString(),
                user: this.currentUser?.username || 'system'
            };
            
            this.auditLog = this.auditLog || [];
            this.auditLog.push(event);
            this.saveData('auditLog', this.auditLog);
            
            console.log(`[Audit] ${action}: ${details}`);
            return true;
        } catch (error) {
            console.error('Error logging audit event:', error);
            return false;
        }
    };

    // ...existing code...
}

// Initialize the application
let pharmaStore;

function initializeApp() {
    try {
        console.log('Initializing PharmaStore application...');
        pharmaStore = new PharmaStore();
        
        // Make pharmaStore globally available for debugging
        window.pharmaStore = pharmaStore;
        
        console.log('PharmaStore initialized successfully');
    } catch (error) {
        console.error('Failed to initialize PharmaStore:', error);
        
        // Show error message to user
        const loginMessage = document.getElementById('loginMessage');
        if (loginMessage) {
            loginMessage.textContent = 'Failed to initialize the application. Please check the console for details.';
            loginMessage.style.color = 'red';
            loginMessage.style.display = 'block';
        }
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Also try to initialize if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initializeApp, 1);
}

// Global functions for HTML onclick handlers
function showSection(sectionId) {
    pharmaStore.showSection(sectionId);
}

function toggleDrugForm() {
    pharmaStore.toggleDrugForm();
}

function cancelDrugForm() {
    pharmaStore.cancelDrugForm();
}

function printReceipt() {
    pharmaStore.printReceipt();
}

function printReport() {
    pharmaStore.printReport();
}

function generateReport() {
    pharmaStore.generateReport();
}

function exportData() {
    pharmaStore.exportData();
}

function importData() {
    pharmaStore.importData();
}

function clearAllData() {
    pharmaStore.clearAllData();
}

function backupData() {
    pharmaStore.backupData();
}

function filterAuditTrail() {
    pharmaStore.filterAuditTrail();
}

function clearAuditFilters() {
    pharmaStore.clearAuditFilters();
}

function cancelEditUser() {
    pharmaStore.cancelEditUser();
}

function toggleEmployeeForm() {
    pharmaStore.toggleEmployeeForm();
}

function cancelEmployeeForm() {
    pharmaStore.cancelEmployeeForm();
}

function savePettyCashBalance() {
    pharmaStore.savePettyCashBalance();
}

function cancelBalanceUpdate() {
    pharmaStore.cancelBalanceUpdate();
}

// After class (or in your existing DOM ready block) wire the UI for multi-sale if not already wired
document.addEventListener('DOMContentLoaded', () => {
    // ensure sale selects are populated
    if (pharmaStore && typeof pharmaStore.populateSalesDrugs === 'function') {
        pharmaStore.populateSalesDrugs();
    }

    document.getElementById('addSaleItemBtn')?.addEventListener('click', () => {
        if (pharmaStore && typeof pharmaStore.addSaleItem === 'function') pharmaStore.addSaleItem();
    });

    document.getElementById('processMultiSaleBtn')?.addEventListener('click', () => {
        if (pharmaStore && typeof pharmaStore.processMultiSale === 'function') pharmaStore.processMultiSale();
    });

    // add an initial row for convenience (only if body empty)
    const body = document.getElementById('saleItemsBody');
    if (body && body.children.length === 0) {
        if (pharmaStore && typeof pharmaStore.addSaleItem === 'function') pharmaStore.addSaleItem();
    }
});
