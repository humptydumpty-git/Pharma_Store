// PharmaStore Management System
class PharmaStore {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.drugs = this.loadData('drugs') || [];
        this.sales = this.loadData('sales') || [];
        const loadedUsers = this.loadData('users');
        this.users = Array.isArray(loadedUsers) && loadedUsers.length > 0 ? loadedUsers : [
            { username: 'admin', password: 'password123', type: 'admin' },
            { username: 'user', password: 'user123', type: 'user' }
        ];
        this.auditLog = this.loadData('auditLog') || [];
        this.currentLanguage = this.loadData('language') || 'en';
        this.translations = this.getTranslations();
        this.isOnline = navigator.onLine;
        this.cloudSyncEnabled = this.loadData('cloudSyncEnabled') || false;
        this.firebaseInitialized = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDashboard();
        this.setLanguage(this.currentLanguage);
        this.initializeFirebase();
        this.setupOnlineOfflineListeners();
        this.updateSyncStatus();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showSection(btn.dataset.section);
            });
        });

        // Drug form
        document.getElementById('drugFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleDrugSubmit();
        });

        // Sales form
        document.getElementById('salesForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSaleSubmit();
        });

        // Drug search
        document.getElementById('drugSearch').addEventListener('input', (e) => {
            this.filterDrugs(e.target.value);
        });

        // Sales drug selection
        document.getElementById('saleDrug').addEventListener('change', (e) => {
            this.updateSalePrice(e.target.value);
        });

        // Report date change
        document.getElementById('reportDate').addEventListener('change', () => {
            this.updateReportDate();
        });

        // Change password modal controls
        document.getElementById('changePasswordBtn').addEventListener('click', () => {
            this.openChangePassword();
        });
        document.getElementById('cancelChangePassword').addEventListener('click', () => {
            this.closeChangePassword();
        });
        document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleChangePassword();
        });

        // Admin add user
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddUser();
            });
        }
    }

    // Authentication
    handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const userType = document.getElementById('userType').value;

        let user = this.users.find(u =>
            u.username === username && u.password === password && (userType ? u.type === userType : true)
        );

        if (user) {
            this.currentUser = user;
            this.isAdmin = user.type === 'admin';
            this.showMainApp();
            this.updateDashboard();
            this.populateSalesDrugs();
            this.renderDrugs();
            this.renderSales();
        } else {
            this.showMessage('Invalid credentials', 'error');
        }
    }

    handleLogout() {
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
        
        // Show/hide admin panel
        const adminBtn = document.querySelector('.admin-only');
        adminBtn.style.display = this.isAdmin ? 'flex' : 'none';

        // Render admin-only user management visibility
        const userMgmt = document.getElementById('userManagement');
        if (userMgmt) userMgmt.style.display = this.isAdmin ? 'block' : 'none';

        this.renderUsersTable();
        this.logAuditEvent('login', `User ${this.currentUser.username} logged in`);
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

        // Update specific sections
        if (sectionId === 'dashboard') {
            this.updateDashboard();
        } else if (sectionId === 'drugs') {
            this.renderDrugs();
        } else if (sectionId === 'sales') {
            this.renderSales();
        } else if (sectionId === 'reports') {
            this.updateReportDate();
        } else if (sectionId === 'analytics') {
            this.renderAnalytics();
        } else if (sectionId === 'audit') {
            this.renderAuditTrail();
        }
    }

    // Dashboard
    updateDashboard() {
        const totalDrugs = this.drugs.length;
        const lowStock = this.drugs.filter(drug => drug.quantity <= 10).length;
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

        this.saveDataWithSync('drugs', this.drugs);
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
                <td class="${drug.quantity <= 10 ? 'text-danger' : ''}">${drug.quantity}</td>
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
            this.saveDataWithSync('drugs', this.drugs);
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
        const select = document.getElementById('saleDrug');
        select.innerHTML = '<option value="">Select Drug</option>';
        
        this.drugs.forEach(drug => {
            if (drug.quantity > 0) {
                const option = document.createElement('option');
                option.value = drug.id;
                option.textContent = `${drug.name} (Stock: ${drug.quantity})`;
                select.appendChild(option);
            }
        });
    }

    updateSalePrice(drugId) {
        const drug = this.drugs.find(d => d.id === drugId);
        const priceInput = document.getElementById('salePrice');
        
        if (drug) {
            priceInput.value = drug.price;
        } else {
            priceInput.value = '';
        }
    }

    handleSaleSubmit() {
        const drugId = document.getElementById('saleDrug').value;
        const quantity = parseInt(document.getElementById('saleQuantity').value);
        const price = parseFloat(document.getElementById('salePrice').value);
        const customerName = document.getElementById('customerName').value;
        const paymentMethod = document.getElementById('paymentMethod').value;

        if (!drugId || !quantity || !price) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }

        const drug = this.drugs.find(d => d.id === drugId);
        if (!drug) {
            this.showMessage('Drug not found', 'error');
            return;
        }

        if (drug.quantity < quantity) {
            this.showMessage('Insufficient stock', 'error');
            return;
        }

        // Process sale
        const sale = {
            id: Date.now().toString(),
            drugId: drugId,
            drugName: drug.name,
            quantity: quantity,
            price: price,
            total: quantity * price,
            customerName: customerName || 'Walk-in Customer',
            paymentMethod: paymentMethod,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            soldBy: this.currentUser.username
        };

        this.sales.push(sale);
        drug.quantity -= quantity;

        this.saveDataWithSync('sales', this.sales);
        this.saveDataWithSync('drugs', this.drugs);
        
        this.renderSales();
        this.populateSalesDrugs();
        this.updateDashboard();
        this.showReceipt(sale);
        this.showMessage('Sale processed successfully', 'success');
        this.logAuditEvent('sale', `Sold ${quantity} units of ${sale.drugName} for $${sale.total.toFixed(2)}`);

        // Reset form
        document.getElementById('salesForm').reset();
    }

    showReceipt(sale) {
        const receiptContent = document.getElementById('receiptContent');
        receiptContent.innerHTML = `
            <div class="receipt">
                <h4>PharmaStore Receipt</h4>
                <p><strong>Date:</strong> ${this.formatDate(sale.date)}</p>
                <p><strong>Time:</strong> ${sale.time}</p>
                <p><strong>Sold by:</strong> ${sale.soldBy}</p>
                <hr>
                <p><strong>Drug:</strong> ${sale.drugName}</p>
                <p><strong>Quantity:</strong> ${sale.quantity}</p>
                <p><strong>Price per unit:</strong> $${sale.price.toFixed(2)}</p>
                <p><strong>Customer:</strong> ${sale.customerName}</p>
                <p><strong>Payment:</strong> ${sale.paymentMethod}</p>
                <hr>
                <p><strong>Total Amount:</strong> $${sale.total.toFixed(2)}</p>
                <hr>
                <p><em>Thank you for your business!</em></p>
            </div>
        `;
        
        document.getElementById('receiptContainer').style.display = 'block';
    }

    printReceipt() {
        const receiptContent = document.getElementById('receiptContent').innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Receipt</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .receipt { max-width: 400px; margin: 0 auto; }
                        h4 { text-align: center; color: #333; }
                        hr { border: none; border-top: 1px solid #ccc; margin: 10px 0; }
                        p { margin: 5px 0; }
                    </style>
                </head>
                <body>
                    ${receiptContent}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    renderSales() {
        const tbody = document.getElementById('salesTableBody');
        tbody.innerHTML = '';

        const recentSales = this.sales.slice(-20).reverse(); // Show last 20 sales
        
        recentSales.forEach(sale => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(sale.date)} ${sale.time}</td>
                <td>${sale.drugName}</td>
                <td>${sale.quantity}</td>
                <td>$${sale.price.toFixed(2)}</td>
                <td>$${sale.total.toFixed(2)}</td>
                <td>${sale.customerName}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-secondary" onclick="pharmaStore.reprintReceipt('${sale.id}')" title="Print">
                            <i class="fas fa-print"></i>
                        </button>
                        <button class="btn-delete" onclick="pharmaStore.deleteSale('${sale.id}')" title="Delete & Restock">
                            <i class="fas fa-undo"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    reprintReceipt(saleId) {
        const sale = this.sales.find(s => s.id === saleId);
        if (sale) {
            this.showReceipt(sale);
            setTimeout(() => this.printReceipt(), 500);
        }
    }

    // Reports
    updateReportDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('reportDate').value = today;
    }

    generateReport() {
        const reportType = document.getElementById('reportType').value;
        const reportDate = document.getElementById('reportDate').value;
        
        let filteredSales = [];
        let title = '';
        
        switch (reportType) {
            case 'daily':
                filteredSales = this.getDailySales(reportDate);
                title = `Daily Sales Report - ${this.formatDate(reportDate)}`;
                break;
            case 'weekly':
                filteredSales = this.getWeeklySales(reportDate);
                title = `Weekly Sales Report - Week of ${this.formatDate(reportDate)}`;
                break;
            case 'monthly':
                filteredSales = this.getMonthlySales(reportDate);
                title = `Monthly Sales Report - ${new Date(reportDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
                break;
            case 'yearly':
                filteredSales = this.getYearlySales(reportDate);
                title = `Yearly Sales Report - ${new Date(reportDate).getFullYear()}`;
                break;
            case 'inventory':
                this.generateInventoryReport();
                return;
        }
        
        this.displaySalesReport(filteredSales, title);
    }

    getDailySales(date) {
        return this.sales.filter(sale => sale.date === date);
    }

    getWeeklySales(date) {
        const targetDate = new Date(date);
        const weekStart = new Date(targetDate);
        weekStart.setDate(targetDate.getDate() - targetDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        return this.sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= weekStart && saleDate <= weekEnd;
        });
    }

    getMonthlySales(date) {
        const targetDate = new Date(date);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        
        return this.sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate.getFullYear() === year && saleDate.getMonth() === month;
        });
    }

    getYearlySales(date) {
        const year = new Date(date).getFullYear();
        return this.sales.filter(sale => {
            return new Date(sale.date).getFullYear() === year;
        });
    }

    displaySalesReport(sales, title) {
        const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
        const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0);
        
        document.getElementById('reportTitle').textContent = title;
        document.getElementById('totalSalesAmount').textContent = `$${totalSales.toFixed(2)}`;
        document.getElementById('totalItemsSold').textContent = totalItems;
        document.getElementById('totalTransactions').textContent = sales.length;
        
        let reportContent = `
            <div class="report-table">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Drug</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                            <th>Customer</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        sales.forEach(sale => {
            reportContent += `
                <tr>
                    <td>${this.formatDate(sale.date)}</td>
                    <td>${sale.drugName}</td>
                    <td>${sale.quantity}</td>
                    <td>$${sale.price.toFixed(2)}</td>
                    <td>$${sale.total.toFixed(2)}</td>
                    <td>${sale.customerName}</td>
                </tr>
            `;
        });
        
        reportContent += `
                    </tbody>
                </table>
            </div>
        `;
        
        document.getElementById('reportContent').innerHTML = reportContent;
        document.getElementById('reportContainer').style.display = 'block';
    }

    generateInventoryReport() {
        const title = 'Inventory Report';
        document.getElementById('reportTitle').textContent = title;
        
        const totalValue = this.drugs.reduce((sum, drug) => sum + (drug.quantity * drug.price), 0);
        const lowStockItems = this.drugs.filter(drug => drug.quantity <= 10);
        const expiringSoon = this.drugs.filter(drug => {
            const expiryDate = new Date(drug.expiry);
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            return expiryDate <= thirtyDaysFromNow;
        });
        
        document.getElementById('totalSalesAmount').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('totalItemsSold').textContent = this.drugs.length;
        document.getElementById('totalTransactions').textContent = lowStockItems.length;
        
        let reportContent = `
            <div class="inventory-summary">
                <h4>Inventory Summary</h4>
                <p><strong>Total Items:</strong> ${this.drugs.length}</p>
                <p><strong>Total Value:</strong> $${totalValue.toFixed(2)}</p>
                <p><strong>Low Stock Items:</strong> ${lowStockItems.length}</p>
                <p><strong>Expiring Soon:</strong> ${expiringSoon.length}</p>
            </div>
            <div class="report-table">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Value</th>
                            <th>Expiry Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        this.drugs.forEach(drug => {
            const value = drug.quantity * drug.price;
            const isLowStock = drug.quantity <= 10;
            const isExpiringSoon = new Date(drug.expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            let status = 'OK';
            
            if (isLowStock && isExpiringSoon) {
                status = 'Low Stock & Expiring Soon';
            } else if (isLowStock) {
                status = 'Low Stock';
            } else if (isExpiringSoon) {
                status = 'Expiring Soon';
            }
            
            reportContent += `
                <tr class="${isLowStock || isExpiringSoon ? 'text-danger' : ''}">
                    <td>${drug.name}</td>
                    <td>${drug.category}</td>
                    <td>${drug.quantity}</td>
                    <td>$${drug.price.toFixed(2)}</td>
                    <td>$${value.toFixed(2)}</td>
                    <td>${this.formatDate(drug.expiry)}</td>
                    <td>${status}</td>
                </tr>
            `;
        });
        
        reportContent += `
                    </tbody>
                </table>
            </div>
        `;
        
        document.getElementById('reportContent').innerHTML = reportContent;
        document.getElementById('reportContainer').style.display = 'block';
    }

    printReport() {
        const reportContent = document.getElementById('reportContent').innerHTML;
        const reportTitle = document.getElementById('reportTitle').textContent;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${reportTitle}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .inventory-summary { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                        th { background-color: #667eea; color: white; }
                        .text-danger { color: #dc3545; }
                        h4 { color: #333; margin-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <h1>${reportTitle}</h1>
                    <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Generated by:</strong> ${this.currentUser.username}</p>
                    ${reportContent}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    // Sales deletion with restock
    deleteSale(saleId) {
        const saleIndex = this.sales.findIndex(s => s.id === saleId);
        if (saleIndex === -1) return;

        const sale = this.sales[saleIndex];
        if (!confirm(`Delete this sale and restock ${sale.quantity} of ${sale.drugName}?`)) return;

        // Restock
        const drug = this.drugs.find(d => d.id === sale.drugId);
        if (drug) {
            drug.quantity += sale.quantity;
        }

        // Remove sale
        this.sales.splice(saleIndex, 1);
        this.saveData('sales', this.sales);
        this.saveData('drugs', this.drugs);

        this.renderSales();
        this.populateSalesDrugs();
        this.updateDashboard();
        this.showMessage('Sale deleted and inventory restocked', 'success');
        this.logAuditEvent('delete_sale', `Deleted sale of ${sale.quantity} units of ${sale.drugName} and restocked inventory`);
    }

    // Admin Functions
    exportData() {
        const data = {
            drugs: this.drugs,
            sales: this.sales,
            users: this.users,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `pharmastore-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showMessage('Data exported successfully', 'success');
        this.logAuditEvent('export_data', 'System data exported');
    }

    importData() {
        document.getElementById('fileInput').click();
        document.getElementById('fileInput').onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (confirm('This will replace all current data. Are you sure?')) {
                        this.drugs = data.drugs || [];
                        this.sales = data.sales || [];
                        this.users = data.users || this.users; // Keep current users
                        
                        this.saveData('drugs', this.drugs);
                        this.saveData('sales', this.sales);
                        this.saveData('users', this.users);
                        
                        this.renderDrugs();
                        this.renderSales();
                        this.populateSalesDrugs();
                        this.updateDashboard();
                        
                        this.showMessage('Data imported successfully', 'success');
                        this.logAuditEvent('import_data', 'System data imported from file');
                    }
                } catch (error) {
                    this.showMessage('Invalid file format', 'error');
                }
            };
            reader.readAsText(file);
        };
    }

    clearAllData() {
        if (confirm('This will permanently delete all data. Are you absolutely sure?')) {
            if (confirm('This action cannot be undone. Click OK to continue.')) {
                this.drugs = [];
                this.sales = [];
                this.users = [
                    { username: 'admin', password: 'password123', type: 'admin' },
                    { username: 'user', password: 'user123', type: 'user' }
                ];
                
                this.saveData('drugs', this.drugs);
                this.saveData('sales', this.sales);
                this.saveData('users', this.users);
                
                this.renderDrugs();
                this.renderSales();
                this.populateSalesDrugs();
                this.updateDashboard();
                
                this.showMessage('All data cleared successfully', 'success');
            }
        }
    }

    backupData() {
        const backup = {
            drugs: this.drugs,
            sales: this.sales,
            users: this.users,
            backupDate: new Date().toISOString(),
            version: '1.0'
        };
        
        localStorage.setItem('pharmastore_backup', JSON.stringify(backup));
        this.showMessage('Data backed up to local storage', 'success');
    }

    // Password change
    openChangePassword() {
        document.getElementById('changePasswordModal').style.display = 'flex';
    }

    closeChangePassword() {
        document.getElementById('changePasswordModal').style.display = 'none';
        document.getElementById('changePasswordForm').reset();
    }

    handleChangePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword1 = document.getElementById('newPassword1').value;
        const newPassword2 = document.getElementById('newPassword2').value;

        if (!this.currentUser) {
            this.showMessage('No user session', 'error');
            return;
        }
        if (newPassword1 !== newPassword2) {
            this.showMessage('New passwords do not match', 'error');
            return;
        }
        if (currentPassword !== this.currentUser.password) {
            this.showMessage('Current password is incorrect', 'error');
            return;
        }

        // Update password in users array
        const idx = this.users.findIndex(u => u.username === this.currentUser.username && u.type === this.currentUser.type);
        if (idx !== -1) {
            this.users[idx].password = newPassword1;
            this.currentUser.password = newPassword1;
            this.saveData('users', this.users);
            this.showMessage('Password updated successfully', 'success');
            this.closeChangePassword();
            this.logAuditEvent('change_password', 'Password changed successfully');
        }
    }

    // Admin-only: add user
    handleAddUser() {
        if (!this.isAdmin) {
            this.showMessage('Only admin can add users', 'error');
            return;
        }
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value;
        const type = document.getElementById('newUserType').value;

        if (!username || !password || !type) {
            this.showMessage('Please fill all fields', 'error');
            return;
        }
        const exists = this.users.some(u => u.username === username);
        if (exists) {
            this.showMessage('Username already exists', 'error');
            return;
        }
        this.users.push({ username, password, type });
        this.saveData('users', this.users);
        document.getElementById('addUserForm').reset();
        this.renderUsersTable();
        this.showMessage('User added successfully', 'success');
        this.logAuditEvent('add_user', `Added new user: ${username} (${type})`);
    }

    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        const totalUsersEl = document.getElementById('totalUsers');
        if (!tbody || !totalUsersEl) return;

        tbody.innerHTML = '';
        this.users.forEach(u => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${u.username}</td>
                <td>${u.type}</td>
            `;
            tbody.appendChild(row);
        });
        totalUsersEl.textContent = String(this.users.length);
    }

    // Utility Functions
    loadData(key) {
        try {
            const raw = localStorage.getItem(`pharmastore_${key}`);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    }

    saveData(key, data) {
        try {
            localStorage.setItem(`pharmastore_${key}`, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getTodaySales() {
        const today = new Date().toISOString().split('T')[0];
        return this.sales.filter(sale => sale.date === today);
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        // Insert at the top of main content
        const mainContent = document.querySelector('.main-content');
        mainContent.insertBefore(messageDiv, mainContent.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    // Analytics Dashboard
    renderAnalytics() {
        this.renderSalesChart();
        this.renderTopDrugsChart();
        this.renderCategoryChart();
        this.renderMonthlyChart();
        this.generateInsights();
    }

    renderSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        const last7Days = this.getLast7DaysSales();
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.map(day => day.date),
                datasets: [{
                    label: 'Daily Sales',
                    data: last7Days.map(day => day.total),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderTopDrugsChart() {
        const ctx = document.getElementById('topDrugsChart');
        if (!ctx) return;

        const topDrugs = this.getTopSellingDrugs(5);
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: topDrugs.map(drug => drug.name),
                datasets: [{
                    data: topDrugs.map(drug => drug.totalSold),
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#f5576c',
                        '#4facfe'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    renderCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        const categorySales = this.getCategorySales();
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categorySales.map(cat => cat.category),
                datasets: [{
                    label: 'Sales by Category',
                    data: categorySales.map(cat => cat.total),
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderMonthlyChart() {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;

        const monthlyData = this.getMonthlySalesData();
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyData.map(month => month.month),
                datasets: [{
                    label: 'Monthly Sales',
                    data: monthlyData.map(month => month.total),
                    backgroundColor: '#764ba2'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    getLast7DaysSales() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const daySales = this.sales.filter(sale => sale.date === dateStr);
            const total = daySales.reduce((sum, sale) => sum + sale.total, 0);
            
            days.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                total: total
            });
        }
        return days;
    }

    getTopSellingDrugs(limit = 5) {
        const drugSales = {};
        this.sales.forEach(sale => {
            if (drugSales[sale.drugName]) {
                drugSales[sale.drugName].totalSold += sale.quantity;
                drugSales[sale.drugName].revenue += sale.total;
            } else {
                drugSales[sale.drugName] = {
                    name: sale.drugName,
                    totalSold: sale.quantity,
                    revenue: sale.total
                };
            }
        });

        return Object.values(drugSales)
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, limit);
    }

    getCategorySales() {
        const categorySales = {};
        this.sales.forEach(sale => {
            const drug = this.drugs.find(d => d.name === sale.drugName);
            if (drug) {
                const category = drug.category;
                if (categorySales[category]) {
                    categorySales[category] += sale.total;
                } else {
                    categorySales[category] = sale.total;
                }
            }
        });

        return Object.entries(categorySales)
            .map(([category, total]) => ({ category, total }))
            .sort((a, b) => b.total - a.total);
    }

    getMonthlySalesData() {
        const monthlyData = {};
        this.sales.forEach(sale => {
            const date = new Date(sale.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].total += sale.total;
            } else {
                monthlyData[monthKey] = { month: monthName, total: sale.total };
            }
        });

        return Object.values(monthlyData)
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6); // Last 6 months
    }

    generateInsights() {
        const insightsContainer = document.getElementById('insightsContainer');
        if (!insightsContainer) return;

        const insights = [
            {
                title: 'Best Selling Drug',
                content: this.getTopSellingDrugs(1)[0]?.name || 'No sales yet'
            },
            {
                title: 'Total Revenue',
                content: `$${this.sales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}`
            },
            {
                title: 'Total Transactions',
                content: this.sales.length.toString()
            },
            {
                title: 'Average Sale Value',
                content: this.sales.length > 0 ? 
                    `$${(this.sales.reduce((sum, sale) => sum + sale.total, 0) / this.sales.length).toFixed(2)}` : 
                    '$0.00'
            },
            {
                title: 'Low Stock Items',
                content: this.drugs.filter(drug => drug.quantity <= 10).length.toString()
            },
            {
                title: 'Expiring Soon',
                content: this.drugs.filter(drug => {
                    const expiryDate = new Date(drug.expiry);
                    const thirtyDaysFromNow = new Date();
                    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                    return expiryDate <= thirtyDaysFromNow;
                }).length.toString()
            }
        ];

        insightsContainer.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <h4>${insight.title}</h4>
                <p>${insight.content}</p>
            </div>
        `).join('');
    }

    // Audit Trail
    logAuditEvent(action, details = '', ipAddress = '127.0.0.1') {
        if (!this.currentUser) return;

        const auditEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            user: this.currentUser.username,
            action: action,
            details: details,
            ipAddress: ipAddress
        };

        this.auditLog.push(auditEntry);
        this.saveData('auditLog', this.auditLog);
    }

    renderAuditTrail() {
        this.populateAuditUsers();
        this.filterAuditTrail();
    }

    populateAuditUsers() {
        const select = document.getElementById('auditUser');
        if (!select) return;

        const users = [...new Set(this.auditLog.map(log => log.user))];
        select.innerHTML = '<option value="">All Users</option>';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user;
            option.textContent = user;
            select.appendChild(option);
        });
    }

    filterAuditTrail() {
        const tbody = document.getElementById('auditTableBody');
        if (!tbody) return;

        const userFilter = document.getElementById('auditUser')?.value || '';
        const actionFilter = document.getElementById('auditAction')?.value || '';
        const dateFilter = document.getElementById('auditDate')?.value || '';

        let filteredLogs = this.auditLog;

        if (userFilter) {
            filteredLogs = filteredLogs.filter(log => log.user === userFilter);
        }

        if (actionFilter) {
            filteredLogs = filteredLogs.filter(log => log.action === actionFilter);
        }

        if (dateFilter) {
            filteredLogs = filteredLogs.filter(log => log.timestamp.startsWith(dateFilter));
        }

        // Show most recent first
        filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        tbody.innerHTML = filteredLogs.slice(0, 100).map(log => `
            <tr>
                <td>${new Date(log.timestamp).toLocaleString()}</td>
                <td>${log.user}</td>
                <td>${log.action.replace('_', ' ').toUpperCase()}</td>
                <td>${log.details}</td>
                <td>${log.ipAddress}</td>
            </tr>
        `).join('');
    }

    clearAuditFilters() {
        document.getElementById('auditUser').value = '';
        document.getElementById('auditAction').value = '';
        document.getElementById('auditDate').value = '';
        this.filterAuditTrail();
    }

    // Multi-language Support
    getTranslations() {
        return {
            en: {
                changePassword: 'Change Password',
                logout: 'Logout',
                dashboard: 'Dashboard',
                manageDrugs: 'Manage Drugs',
                sales: 'Sales',
                reports: 'Reports',
                analytics: 'Analytics',
                auditTrail: 'Audit Trail',
                adminPanel: 'Admin Panel'
            },
            es: {
                changePassword: 'Cambiar Contraseña',
                logout: 'Cerrar Sesión',
                dashboard: 'Panel',
                manageDrugs: 'Gestionar Medicamentos',
                sales: 'Ventas',
                reports: 'Reportes',
                analytics: 'Análisis',
                auditTrail: 'Registro de Auditoría',
                adminPanel: 'Panel de Administración'
            },
            fr: {
                changePassword: 'Changer le Mot de Passe',
                logout: 'Déconnexion',
                dashboard: 'Tableau de Bord',
                manageDrugs: 'Gérer les Médicaments',
                sales: 'Ventes',
                reports: 'Rapports',
                analytics: 'Analytique',
                auditTrail: 'Piste d\'Audit',
                adminPanel: 'Panneau d\'Administration'
            }
        };
    }

    changeLanguage(language) {
        this.currentLanguage = language;
        this.saveData('language', language);
        this.setLanguage(language);
    }

    setLanguage(language) {
        const langSelect = document.getElementById('languageSelect');
        if (langSelect) langSelect.value = language;

        const elements = document.querySelectorAll('[data-key]');
        elements.forEach(element => {
            const key = element.getAttribute('data-key');
            if (this.translations[language] && this.translations[language][key]) {
                element.textContent = this.translations[language][key];
            }
        });
    }

    // Cloud Sync and Online/Offline Functionality
    initializeFirebase() {
        // Wait for Firebase to be available
        const checkFirebase = () => {
            if (window.Firebase && window.Firebase.firestore && window.Firebase.writeBatch) {
                this.firebaseInitialized = true;
                console.log('Firebase initialized successfully');
                this.updateSyncStatus();
                
                // Set up real-time listeners if cloud sync is enabled
                if (this.cloudSyncEnabled) {
                    this.setupFirestoreListeners();
                }
            } else {
                console.log('Waiting for Firebase to initialize...');
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    }

    setupOnlineOfflineListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateSyncStatus();
            this.showMessage('Connection restored', 'success');
            
            // Auto-sync when connection is restored
            if (this.cloudSyncEnabled) {
                setTimeout(() => this.syncToCloud(), 1000);
            }
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateSyncStatus();
            this.showMessage('Working offline', 'info');
        });
    }

    updateSyncStatus() {
        const syncStatus = document.getElementById('syncStatus');
        const syncBtn = document.getElementById('syncBtn');
        
        if (!syncStatus || !syncBtn) return;

        if (!this.firebaseInitialized) {
            syncStatus.className = 'status-indicator offline';
            syncStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span>No Cloud</span>';
            syncBtn.disabled = true;
            return;
        }

        if (!this.isOnline) {
            syncStatus.className = 'status-indicator offline';
            syncStatus.innerHTML = '<i class="fas fa-wifi-slash"></i> <span>Offline</span>';
            syncBtn.disabled = true;
        } else if (!this.cloudSyncEnabled) {
            syncStatus.className = 'status-indicator offline';
            syncStatus.innerHTML = '<i class="fas fa-cloud-slash"></i> <span>Local Only</span>';
            syncBtn.disabled = false;
        } else {
            syncStatus.className = 'status-indicator online';
            syncStatus.innerHTML = '<i class="fas fa-cloud-check"></i> <span>Online</span>';
            syncBtn.disabled = false;
        }
    }

    async syncToCloud() {
        if (!this.isOnline) {
            this.showMessage('Cannot sync: No internet connection', 'error');
            return;
        }
        
        if (!this.firebaseInitialized) {
            this.showMessage('Firebase not configured. Please set up Firebase configuration first.', 'error');
            return;
        }

        try {
            this.setSyncStatus('syncing');
            
            const db = window.Firebase.firestore;
            const batch = window.Firebase.writeBatch(db);

            // Sync drugs
            const drugsRef = window.Firebase.doc(db, 'pharmastore', 'drugs');
            batch.set(drugsRef, { data: this.drugs, lastUpdated: new Date() });

            // Sync sales
            const salesRef = window.Firebase.doc(db, 'pharmastore', 'sales');
            batch.set(salesRef, { data: this.sales, lastUpdated: new Date() });

            // Sync users
            const usersRef = window.Firebase.doc(db, 'pharmastore', 'users');
            batch.set(usersRef, { data: this.users, lastUpdated: new Date() });

            // Sync audit log
            const auditRef = window.Firebase.doc(db, 'pharmastore', 'auditLog');
            batch.set(auditRef, { data: this.auditLog, lastUpdated: new Date() });

            await batch.commit();
            
            // Update last sync time
            this.saveData('lastSyncTime', new Date().toISOString());
            
            this.showMessage('Data synced to cloud successfully', 'success');
            this.logAuditEvent('sync_to_cloud', 'Data synchronized to cloud storage');
            
        } catch (error) {
            console.error('Sync error:', error);
            this.showMessage('Failed to sync to cloud: ' + error.message, 'error');
        } finally {
            this.updateSyncStatus();
        }
    }

    async syncFromCloud() {
        if (!this.isOnline) {
            this.showMessage('Cannot sync: No internet connection', 'error');
            return;
        }
        
        if (!this.firebaseInitialized) {
            this.showMessage('Firebase not configured. Please set up Firebase configuration first.', 'error');
            return;
        }

        try {
            this.setSyncStatus('syncing');
            
            const db = window.Firebase.firestore;
            
            // Get data from cloud using proper Firebase v9+ syntax
            const drugsSnapshot = await window.Firebase.getDoc(window.Firebase.doc(db, 'pharmastore', 'drugs'));
            const salesSnapshot = await window.Firebase.getDoc(window.Firebase.doc(db, 'pharmastore', 'sales'));
            const usersSnapshot = await window.Firebase.getDoc(window.Firebase.doc(db, 'pharmastore', 'users'));
            const auditSnapshot = await window.Firebase.getDoc(window.Firebase.doc(db, 'pharmastore', 'auditLog'));

            let hasChanges = false;

            // Update local data if cloud data is newer
            if (drugsSnapshot.exists()) {
                const cloudDrugs = drugsSnapshot.data().data;
                const cloudTime = drugsSnapshot.data().lastUpdated.toDate();
                const localTime = new Date(this.loadData('lastSyncTime') || 0);
                
                if (cloudTime > localTime) {
                    this.drugs = cloudDrugs;
                    this.saveData('drugs', this.drugs);
                    hasChanges = true;
                }
            }

            if (salesSnapshot.exists()) {
                const cloudSales = salesSnapshot.data().data;
                const cloudTime = salesSnapshot.data().lastUpdated.toDate();
                const localTime = new Date(this.loadData('lastSyncTime') || 0);
                
                if (cloudTime > localTime) {
                    this.sales = cloudSales;
                    this.saveData('sales', this.sales);
                    hasChanges = true;
                }
            }

            if (usersSnapshot.exists()) {
                const cloudUsers = usersSnapshot.data().data;
                const cloudTime = usersSnapshot.data().lastUpdated.toDate();
                const localTime = new Date(this.loadData('lastSyncTime') || 0);
                
                if (cloudTime > localTime) {
                    this.users = cloudUsers;
                    this.saveData('users', this.users);
                    hasChanges = true;
                }
            }

            if (auditSnapshot.exists()) {
                const cloudAudit = auditSnapshot.data().data;
                const cloudTime = auditSnapshot.data().lastUpdated.toDate();
                const localTime = new Date(this.loadData('lastSyncTime') || 0);
                
                if (cloudTime > localTime) {
                    this.auditLog = cloudAudit;
                    this.saveData('auditLog', this.auditLog);
                    hasChanges = true;
                }
            }

            if (hasChanges) {
                this.renderDrugs();
                this.renderSales();
                this.renderUsersTable();
                this.updateDashboard();
                this.showMessage('Data synced from cloud successfully', 'success');
                this.logAuditEvent('sync_from_cloud', 'Data synchronized from cloud storage');
            } else {
                this.showMessage('Local data is up to date', 'info');
            }
            
        } catch (error) {
            console.error('Sync error:', error);
            this.showMessage('Failed to sync from cloud: ' + error.message, 'error');
        } finally {
            this.updateSyncStatus();
        }
    }

    setSyncStatus(status) {
        const syncStatus = document.getElementById('syncStatus');
        if (!syncStatus) return;

        switch (status) {
            case 'syncing':
                syncStatus.className = 'status-indicator syncing';
                syncStatus.innerHTML = '<i class="fas fa-sync-alt"></i> <span>Syncing...</span>';
                break;
            case 'online':
                syncStatus.className = 'status-indicator online';
                syncStatus.innerHTML = '<i class="fas fa-cloud-check"></i> <span>Online</span>';
                break;
            case 'offline':
                syncStatus.className = 'status-indicator offline';
                syncStatus.innerHTML = '<i class="fas fa-wifi-slash"></i> <span>Offline</span>';
                break;
        }
    }

    setupCloudBackup() {
        if (!this.firebaseInitialized) {
            this.showMessage('Firebase not initialized. Please check your configuration.', 'error');
            return;
        }

        const enable = confirm('Enable automatic cloud backup? This will sync your data to the cloud every 30 minutes.');
        
        if (enable) {
            this.cloudSyncEnabled = true;
            this.saveData('cloudSyncEnabled', true);
            this.updateSyncStatus();
            this.setupFirestoreListeners();
            
            // Set up automatic sync
            this.setupAutoSync();
            
            this.showMessage('Cloud backup enabled', 'success');
            this.logAuditEvent('setup_cloud_backup', 'Automatic cloud backup enabled');
        }
    }

    setupFirestoreListeners() {
        if (!this.firebaseInitialized || !this.cloudSyncEnabled) return;

        const db = window.Firebase.firestore;
        
        // Listen for real-time updates using proper Firebase v9+ syntax
        window.Firebase.onSnapshot(window.Firebase.doc(db, 'pharmastore', 'drugs'), (doc) => {
            if (doc.exists()) {
                const cloudDrugs = doc.data().data;
                const cloudTime = doc.data().lastUpdated.toDate();
                const localTime = new Date(this.loadData('lastSyncTime') || 0);
                
                if (cloudTime > localTime) {
                    this.drugs = cloudDrugs;
                    this.saveData('drugs', this.drugs);
                    this.renderDrugs();
                    this.updateDashboard();
                    console.log('Drugs updated from cloud');
                }
            }
        });

        // Similar listeners for sales, users, and audit log
        window.Firebase.onSnapshot(window.Firebase.doc(db, 'pharmastore', 'sales'), (doc) => {
            if (doc.exists()) {
                const cloudSales = doc.data().data;
                const cloudTime = doc.data().lastUpdated.toDate();
                const localTime = new Date(this.loadData('lastSyncTime') || 0);
                
                if (cloudTime > localTime) {
                    this.sales = cloudSales;
                    this.saveData('sales', this.sales);
                    this.renderSales();
                    this.updateDashboard();
                    console.log('Sales updated from cloud');
                }
            }
        });
    }

    setupAutoSync() {
        // Sync every 30 minutes
        setInterval(() => {
            if (this.isOnline && this.cloudSyncEnabled) {
                this.syncToCloud();
            }
        }, 30 * 60 * 1000); // 30 minutes

        // Also sync on visibility change (when user returns to app)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isOnline && this.cloudSyncEnabled) {
                setTimeout(() => this.syncFromCloud(), 1000);
            }
        });
    }

    // Enhanced data saving with cloud sync
    saveDataWithSync(key, data) {
        this.saveData(key, data);
        
        // Auto-sync to cloud if enabled and online
        if (this.cloudSyncEnabled && this.isOnline && this.firebaseInitialized) {
            setTimeout(() => this.syncToCloud(), 1000);
        }
    }
}

// Initialize the application
let pharmaStore;

document.addEventListener('DOMContentLoaded', () => {
    pharmaStore = new PharmaStore();
});

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
