# PharmaStore Management System

A comprehensive offline drugstore management system built with HTML, CSS, and JavaScript. This system provides complete inventory management, sales tracking, reporting, and user authentication features.

## Features

### 🔐 User Authentication
- **Admin Login**: Full access to all features including admin panel
- **User Login**: Limited access for sales and basic operations
- **Default Credentials**:
  - Admin: `admin` / `password123`
  - User: `user` / `user123`

### 💊 Drug Management
- **Add New Drugs**: Complete drug information including name, category, quantity, price, expiry date, and supplier
- **Edit Drugs**: Update existing drug information
- **Delete Drugs**: Remove drugs from inventory with confirmation
- **Search & Filter**: Quick search through drug inventory
- **Low Stock Alerts**: Visual indicators for low stock items
- **Expiry Tracking**: Monitor drugs approaching expiration

### 🛒 Sales Management
- **Process Sales**: Select drugs, enter quantities, and process transactions
- **Customer Information**: Record customer names and payment methods
- **Receipt Generation**: Automatic receipt creation with professional formatting
- **Inventory Updates**: Automatic stock deduction after sales
- **Sales History**: View recent sales transactions

### 📊 Reporting System
- **Daily Sales Reports**: Track sales for specific days
- **Weekly Sales Reports**: Analyze weekly performance
- **Monthly Sales Reports**: Monthly sales analysis
- **Yearly Sales Reports**: Annual sales overview
- **Inventory Reports**: Complete inventory status and value
- **Print Reports**: Professional report printing

### 🖨️ Print Functionality
- **Receipt Printing**: Print individual sales receipts
- **Report Printing**: Print formatted reports
- **Professional Layout**: Clean, printable format for all documents

### 👨‍💼 Admin Panel
- **Data Export**: Export all data to JSON file
- **Data Import**: Import previously exported data
- **Data Backup**: Local storage backup
- **Clear All Data**: Reset system (with confirmation)
- **System Statistics**: Overview of system usage

### 📱 Responsive Design
- **Mobile Friendly**: Optimized for mobile devices
- **Tablet Support**: Works on tablets and tablets
- **Desktop Optimized**: Full-featured desktop experience
- **Touch Friendly**: Easy touch navigation

## File Structure

```
drugstore business/
├── index.html          # Main application file
├── styles.css          # Complete styling and responsive design
├── app.js             # Application logic and functionality
├── drugs.html         # Original file (can be removed)
├── drugs.css          # Original file (can be removed)
├── drugs.js           # Original file (can be removed)
└── README.md          # This documentation
```

## Installation & Usage

1. **Download Files**: Save all files in the same directory
2. **Open Application**: Open `index.html` in any modern web browser
3. **Login**: Use the default credentials or create new users
4. **Start Using**: Begin adding drugs and processing sales

## System Requirements

- **Browser**: Any modern web browser (Chrome, Firefox, Safari, Edge)
- **JavaScript**: Must be enabled
- **Storage**: Uses localStorage for data persistence
- **Internet**: Not required (fully offline)

## Data Storage

The system uses browser localStorage to store all data:
- **Drugs**: Complete inventory information
- **Sales**: All sales transactions and history
- **Users**: User accounts and authentication
- **Backups**: Automatic backup functionality

## Key Features Breakdown

### Dashboard
- Real-time statistics display
- Quick action buttons
- Low stock and expiry alerts
- Today's sales summary

### Drug Management
- Comprehensive drug information tracking
- Category-based organization
- Stock level monitoring
- Expiry date management
- Supplier information

### Sales Processing
- Quick drug selection
- Automatic price calculation
- Customer information capture
- Payment method tracking
- Professional receipt generation

### Reporting
- Multiple report types (daily, weekly, monthly, yearly)
- Inventory valuation
- Sales analytics
- Export capabilities
- Professional print formatting

### Admin Functions
- Complete data management
- Import/export functionality
- System maintenance tools
- User management capabilities

## Security Features

- **User Authentication**: Secure login system
- **Role-based Access**: Different permissions for admin and users
- **Data Validation**: Input validation and error handling
- **Confirmation Dialogs**: Important actions require confirmation
- **Local Storage**: Data stays on user's device

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

The system is built with modern CSS and is easily customizable:
- **Colors**: Modify CSS variables for different color schemes
- **Layout**: Adjust grid systems and spacing
- **Features**: Add new functionality by extending the JavaScript class
- **Styling**: Update CSS for different visual themes

## Troubleshooting

### Common Issues

1. **Data Not Saving**: Ensure JavaScript is enabled and localStorage is available
2. **Print Issues**: Check browser print settings and ensure pop-ups are allowed
3. **Mobile Issues**: Ensure responsive design is working on your device
4. **Login Problems**: Verify credentials and user type selection

### Data Recovery

- Use the backup feature regularly
- Export data before making major changes
- Import functionality allows data restoration
- Local storage backup provides additional safety

## Future Enhancements

Potential features for future development:
- Barcode scanning
- Multi-location support
- Integration with external systems

## Packaging as a Desktop App (Electron)

You can wrap PharmaStore as a **Windows desktop application** so clients install it like a normal app (with an icon and Start menu entry) using [Electron](https://www.electronjs.org/). These steps are for **you as the developer**; your client only receives the final installer.

### 1. Prerequisites (on your development machine)

- **Windows 10+**
- **Node.js** (LTS) from `https://nodejs.org`
- Basic command‑line familiarity (PowerShell or Command Prompt)

### 2. Initialise npm and install Electron

From the `Pharma_Store` project folder:

```bash
npm init -y
npm install --save-dev electron electron-builder
```

This creates a `package.json` and installs the tools needed to run and build the desktop app.

### 3. Create the Electron main process file

Create a new file in the project root named `main.js`:

```js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true
    }
  });

  // Load the existing PharmaStore UI
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

This simply opens your existing `index.html` inside a desktop window; no server is required for the packaged app.

### 4. Configure `package.json` for building

Open `package.json` and adjust it to include at least:

```json
{
  "name": "pharmastore",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "dist": "electron-builder"
  },
  "build": {
    "appId": "com.yourcompany.pharmastore",
    "productName": "PharmaStore",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "index.html",
      "app.js",
      "style.css",
      "fonts.css",
      "icons.css",
      "manifest.json",
      "offline.html",
      "sw.js",
      "src/**/*"
    },
    "win": {
      "target": "nsis",
      "icon": "icon.ico"
    }
  },
  "devDependencies": {
    "electron": "^30.0.0",
    "electron-builder": "^24.0.0"
  }
}
```

- Replace `icon.ico` with the path to your app icon (a `.ico` file with your logo).
- Adjust `appId` and `productName` to match your brand.

### 5. Run the app in development

While developing, you can run the desktop app directly:

```bash
npm start
```

This opens PharmaStore in an Electron window using your local source files.

### 6. Build a Windows installer (`.exe`)

To produce the installer for your client:

```bash
npm run dist
```

Electron Builder will create a `dist/` folder containing:

- An `.exe` **installer** (NSIS) for Windows.
- Optionally a portable executable, depending on your config.

You deliver **only** the installer (and any PDF docs) to your client; they do **not** need Node.js or the project source.

### 7. What the client sees

When the client runs the installer:

- A standard **Windows setup wizard** appears (with your app name and icon).
- After installation they get:
  - A **desktop shortcut** (icon).
  - A **Start Menu** entry for PharmaStore.
  - An entry in **Add/Remove Programs** to uninstall.

The underlying HTML/CSS/JS is bundled inside the Electron app and is not exposed as loose files.

## Admin Quick Start (Production Deployment)

This is a short checklist for setting up PharmaStore on a client machine:

1. **Install the app**
   - Run the generated `.exe` from the `dist/` folder on the client Windows PC.
   - Follow the installer steps until completion.
2. **First login as admin**
   - Launch PharmaStore from the desktop icon.
   - Log in with the default admin credentials:
     - Username: `admin`
     - Password: `password123`
   - Immediately go to the **Change Password** dialog and set a strong new password.
3. **Set Admin PIN for sensitive actions**
   - Attempt to use **Import Data** or **Clear All Data**.
   - When prompted, set a **4-digit admin PIN** known only to the owner/manager.
   - This PIN will be required for future imports or data wipes.
4. **Configure basics**
   - Review default **tax rate** and **discount** settings in Sales.
   - Check the **default OTC drugs list** in Drugs, and adjust quantities, prices, and suppliers.
5. **Test backup and restore once**
   - From **Dashboard** or **Reports**, run **Backup now / Export Data** and save the JSON to a USB drive.
   - On a test machine, install the app, then use **Import Data** with that file to confirm data restores correctly.
6. **Train staff**
   - Provide staff with the `STAFF-SOP.md` (or a PDF copy) for:
     - Login / logout.
     - Sales and receipts.
     - Petty cash and EOD.
     - Running backups.

With these steps, you can deliver PharmaStore as a polished desktop application while keeping your source code and build process under your control.

## Support

This is a standalone offline system. For support or modifications:
1. Check browser console for error messages
2. Verify all files are in the same directory
3. Ensure JavaScript is enabled
4. Check localStorage availability

## License

This system is provided as-is for educational and business use. Modify and customize as needed for your specific requirements.

---

**PharmaStore Management System** - Complete offline drugstore management solution built with modern web technologies.
