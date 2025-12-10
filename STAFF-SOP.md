## PharmaStore – Staff SOP (Standard Operating Procedures)

### 1. Logging in and out

- Open the PharmaStore app in your browser (Chrome/Edge recommended).
- Enter your **username** and **password** and click **Login**.
- If this is your regular workstation, tick **“Remember me on this device”** to pre-fill your username next time.
- When you finish work, click **Logout** in the top-right corner.
- The system will automatically log you out after **10 minutes** of no activity.

### 2. Basic daily workflow

1. **Start of day**
   - Log in.
   - Check the **Dashboard** for:
     - Total drugs in stock.
     - Low stock alerts.
     - Drugs expiring soon.
2. **During the day**
   - Record all **sales** in the **Sales** section.
   - Record small expenses (fuel, stationery, etc.) in **Petty Cash**.
   - If you have permission, update stock levels using **Stock** (Stock Adjustment).

### 3. Adding and managing drugs

- Go to **Drugs**.
- To add a new drug:
  - Click **Add Drug**.
  - Fill in **Name**, **Category**, **Quantity**, **Unit Price**, **Expiry Date**, and **Supplier**.
  - Click **Save Drug**.
- To edit an existing drug:
  - Click the **edit icon** on the row.
  - Update the fields and save.
- To delete a drug:
  - Click the **trash icon** and confirm.

> Only delete drugs when you are sure you no longer need their records.

### 4. Processing sales and printing receipts

- Go to **Sales**.
- In the sales table:
  - Click **Add Item**.
  - Select the **Drug**, enter **Quantity**; unit price fills automatically.
  - Repeat for each item in the sale.
- Fill **Customer** name (or leave as “Walk-in Customer”).
- Choose **Payment Method** (Cash, POS, Transfer).
- Optional: set **Tax %**, **Discount %**, and **Cash Received**.
- Click **Process Sale**:
  - Stock will be reduced automatically.
  - A **Receipt** appears below.
- To print the receipt:
  - Click **Print** on the receipt; only the receipt prints.

### 5. Petty cash expenses

- Go to **Petty Cash**.
- Confirm the **Current Balance** at the top (ask admin if it needs updating).
- To record an expense:
  - In **Record Expense**:
    - Select **Date**, **Category**, and **Payment Method**.
    - Enter **Description** and **Amount**.
    - (Optional) Add **Notes**.
  - Click **Add Expense**.
- The new entry appears in **Petty Cash History**.

### 6. Payroll & payslips (admin only)

- Go to **Payroll** (admins only).
- **Add Employee**:
  - Click **Add Employee**.
  - Enter basic details (Name, Position, Start Date, Contact).
  - Enter **Gross Pay**, **Allowances**, and all **Deductions** (Tax, SSNIT, Insurance).
  - The **Net Salary** field updates automatically.
  - Click **Save Employee**.
- **Record Salary Payment**:
  - Under **Process Salary Payment**:
    - Select **Employee**, choose **Month**, enter **Amount** (usually net salary), **Method**, and **Notes**.
    - Click **Record Payment**.
  - The payment appears in the **Salary Payments** table.
- **Print Payslip**:
  - In the **Salary Payments** table, click the **print icon** on a row to open a detailed payslip and print it.

### 7. Reports and analytics

- Go to **Reports**:
  - Choose **Report Type** (Daily/Weekly/Monthly/Yearly/Inventory).
  - Select a **Date**.
  - (Optional) filter by **Drug**, **User**, or **Payment Method**.
  - Click **Generate** to see the report.
  - Use **Print** to print the report.
- Go to **Analytics**:
  - See **Sales for the last 7 days**.
  - See **Top selling drugs**.

### 8. End of Day (EOD) and backups

- At the end of each working day:
  - Go to **Dashboard**.
  - Click **End of Day (EOD)**.
  - Review the summary: total **Sales**, **Expenses**, and **Net**.
  - When prompted, choose **Yes** to download a backup file (JSON).
  - Save the file to a safe location (USB drive, external disk, or secure cloud folder).

> Best practice: keep at least one backup copy off the pharmacy computer.

### 9. Restoring from backup (admin)

- Log in as admin.
- Go to **Reports** or **Admin**.
- Click **Import Data**.
- Select the correct backup JSON file.
- Confirm overwrite when prompted.
- Verify that **Drugs**, **Sales**, **Petty Cash**, **Employees**, and **Users** look correct.

### 10. Security notes for staff

- Never share your **password** or the **admin PIN**.
- Always **log out** when leaving the counter.
- Only trusted admin staff should:
  - Access **Admin**, **Payroll**, and **Audit** sections.
  - Use **Import Data** or **Clear All Data** (they are PIN-protected).


