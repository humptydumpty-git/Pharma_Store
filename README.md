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
- Advanced analytics
- Multi-location support
- Customer management
- Supplier management
- Automated reordering
- Integration with external systems

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
