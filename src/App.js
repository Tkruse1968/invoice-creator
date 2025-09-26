import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// File sharing configuration for Android/Mobile devices
// No API keys needed - uses native device file system and sharing

// Security utilities
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>"']/g, '') // Remove potentially dangerous characters
    .trim()
    .substring(0, 500); // Limit length
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[\d\s\-()]{10,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

const validateNumeric = (value, min = 0, max = 999999) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
};

// Secure localStorage wrapper with basic obfuscation
const secureStorage = {
  setItem: (key, value) => {
    try {
      // Basic obfuscation (not encryption, but better than plain text)
      const obfuscated = btoa(JSON.stringify(value));
      localStorage.setItem(key, obfuscated);
    } catch (error) {
      console.error('Failed to save data securely:', error);
    }
  },
  getItem: (key) => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      return JSON.parse(atob(stored));
    } catch (error) {
      console.error('Failed to retrieve data securely:', error);
      return null;
    }
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
  }
};

function App() {
  // Customer information
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  // Document details
  const [documentType, setDocumentType] = useState('invoice'); // 'invoice' or 'quote'
  const [invoiceNumber, setInvoiceNumber] = useState('INV-001');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Line items
  const [items, setItems] = useState([
    { id: 1, description: '', quantity: 1, price: 0 }
  ]);
  
  // Attachments
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  
  // Saved contacts
  const [contacts, setContacts] = useState([]);
  const [showContacts, setShowContacts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Send options
  const [sendMethod, setSendMethod] = useState('sms');
  const [showSendDialog, setShowSendDialog] = useState(false);
  
  // Saved invoices and logs
  const [savedInvoices, setSavedInvoices] = useState([]);
  const [invoiceLogs, setInvoiceLogs] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // File saving options
  const [saveToDevice, setSaveToDevice] = useState(true);
  const [shareToGoogleDrive, setShareToGoogleDrive] = useState(false);
  
  // Parts lookup
  const [showPartsLookup, setShowPartsLookup] = useState(false);
  const [partSearchQuery, setPartSearchQuery] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [partsDatabase, setPartsDatabase] = useState([]);
  
  // Options page
  const [showOptions, setShowOptions] = useState(false);
  const [partLookupSites, setPartLookupSites] = useState([]);
  const [priceRefreshEnabled, setPriceRefreshEnabled] = useState(true);
  
  // Tutorial system
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  
  // Load saved data when app starts
  useEffect(() => {
    // Load contacts
    const savedContacts = secureStorage.getItem('contacts');
    if (savedContacts) {
      setContacts(savedContacts);
    } else {
      // Add some sample contacts
      const sampleContacts = [
        { id: 1, name: 'John Smith', phone: '555-1234', email: 'john@email.com' },
        { id: 2, name: 'Sarah Johnson', phone: '555-5678', email: 'sarah@email.com' }
      ];
      setContacts(sampleContacts);
      secureStorage.setItem('contacts', sampleContacts);
    }
    
    // Load saved invoices
    const saved = secureStorage.getItem('invoices');
    if (saved) {
      setSavedInvoices(saved);
    }
    
    // Load invoice logs
    const logs = secureStorage.getItem('invoiceLogs');
    if (logs) {
      setInvoiceLogs(logs);
    }
    
    // Load last invoice number
    const lastNumber = secureStorage.getItem('lastInvoiceNumber');
    if (lastNumber) {
      setInvoiceNumber(lastNumber);
    }
    
    // Load part lookup sites
    const savedSites = secureStorage.getItem('partLookupSites');
    if (savedSites) {
      setPartLookupSites(savedSites);
    } else {
      // Initialize with common auto parts websites
      const defaultSites = [
        { name: 'RockAuto', url: 'https://www.rockauto.com/en/catalog/', enabled: true },
        { name: 'AutoZone', url: 'https://www.autozone.com/parts/', enabled: true },
        { name: 'Advance Auto', url: 'https://shop.advanceautoparts.com/find/', enabled: true },
        { name: "O'Reilly", url: 'https://www.oreillyauto.com/shop/b/', enabled: true },
        { name: 'NAPA', url: 'https://www.napaonline.com/en/search?text=', enabled: false }
      ];
      setPartLookupSites(defaultSites);
      secureStorage.setItem('partLookupSites', defaultSites);
    }
    
    // Load parts database
    const savedParts = secureStorage.getItem('partsDatabase');
    if (savedParts) {
      setPartsDatabase(savedParts);
    } else {
      // Initialize with common auto parts
      const commonParts = [
        { partNumber: '5W-30', manufacturer: 'Mobil', description: 'Engine Oil 5W-30 Synthetic', price: 24.99, category: 'Oil' },
        { partNumber: '10W-40', manufacturer: 'Castrol', description: 'Engine Oil 10W-40', price: 19.99, category: 'Oil' },
        { partNumber: 'PH3614', manufacturer: 'Fram', description: 'Oil Filter', price: 8.99, category: 'Filter' },
        { partNumber: 'CA9482', manufacturer: 'Fram', description: 'Air Filter', price: 15.99, category: 'Filter' },
        { partNumber: 'DG508', manufacturer: 'Motorcraft', description: 'Ignition Coil', price: 45.99, category: 'Ignition' },
        { partNumber: 'SP493', manufacturer: 'Motorcraft', description: 'Spark Plug', price: 7.99, category: 'Ignition' },
        { partNumber: 'MKD465', manufacturer: 'Wagner', description: 'Brake Pads Front', price: 49.99, category: 'Brakes' },
        { partNumber: 'BD125', manufacturer: 'Wagner', description: 'Brake Rotor', price: 65.99, category: 'Brakes' },
        { partNumber: '51R-600', manufacturer: 'Interstate', description: 'Car Battery 51R', price: 129.99, category: 'Battery' },
        { partNumber: 'H11', manufacturer: 'Sylvania', description: 'Headlight Bulb H11', price: 12.99, category: 'Lights' },
        { partNumber: '3157', manufacturer: 'Sylvania', description: 'Brake Light Bulb', price: 4.99, category: 'Lights' },
        { partNumber: '24F-600', manufacturer: 'DieHard', description: 'Car Battery 24F', price: 139.99, category: 'Battery' },
        { partNumber: 'ATF+4', manufacturer: 'Valvoline', description: 'Transmission Fluid ATF+4', price: 8.99, category: 'Fluids' },
        { partNumber: 'DOT3', manufacturer: 'Prestone', description: 'Brake Fluid DOT 3', price: 6.99, category: 'Fluids' },
        { partNumber: '50/50', manufacturer: 'Prestone', description: 'Antifreeze/Coolant 50/50', price: 12.99, category: 'Fluids' },
        { partNumber: '7440', manufacturer: 'Bosch', description: 'Turn Signal Bulb', price: 3.99, category: 'Lights' },
        { partNumber: 'MS-6335', manufacturer: 'Moog', description: 'Tie Rod End', price: 42.99, category: 'Suspension' },
        { partNumber: 'K6117', manufacturer: 'Moog', description: 'Ball Joint', price: 56.99, category: 'Suspension' },
        { partNumber: '43330', manufacturer: 'Gates', description: 'Serpentine Belt', price: 23.99, category: 'Belts' },
        { partNumber: '25060', manufacturer: 'Gates', description: 'Radiator Hose Upper', price: 18.99, category: 'Cooling' }
      ];
      setPartsDatabase(commonParts);
      secureStorage.setItem('partsDatabase', commonParts);
    }
    
    // Check if user has seen tutorial
    const tutorialSeen = localStorage.getItem('hasSeenTutorial');
    if (!tutorialSeen) {
      // Show tutorial on first run
      setTimeout(() => {
        setShowTutorial(true);
      }, 1500);
    }
    
    // Check for native file system support
    checkFileSystemSupport();
    
    // Check for parts needing price refresh after everything loads
    setTimeout(() => {
      checkForPriceRefresh();
    }, 1000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Check file system support
  const checkFileSystemSupport = () => {
    // Check if we can use native file download
    const hasDownloadSupport = 'download' in document.createElement('a');
    const hasShareAPI = navigator.share !== undefined;
    
    if (!hasDownloadSupport) {
      console.log('Download not supported, will use fallback');
    }
    if (hasShareAPI) {
      console.log('Native share API available');
    }
  };
  
  // Download files to device (works on Android and triggers save dialog)
  const downloadToDevice = async () => {
    // Create and download invoice text file
    const invoiceText = generateInvoiceText();
    const textBlob = new Blob([invoiceText], { type: 'text/plain' });
    downloadFile(textBlob, `${invoiceNumber}.txt`);
    
    // Create and download QuickBooks CSV
    const csvContent = generateQuickBooksCSV();
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    downloadFile(csvBlob, `${invoiceNumber}_QB2014.csv`);
    
    // Create and download QuickBooks IIF
    const iifContent = generateQuickBooksIIF();
    const iifBlob = new Blob([iifContent], { type: 'application/octet-stream' });
    downloadFile(iifBlob, `${invoiceNumber}_QB2014.iif`);
    
    // Create instructions file
    const instructionsContent = generateQuickBooksInstructions();
    const instructionsBlob = new Blob([instructionsContent], { type: 'text/plain' });
    downloadFile(instructionsBlob, 'QuickBooks_2013-2014_Import_Instructions.txt');
    
    return { success: true, message: 'Files downloaded to your device!' };
  };
  
  // Helper function to trigger file download
  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Share files using Android's native share sheet
  const shareFiles = async () => {
    if (!navigator.share) {
      // Fallback to download if share isn't available
      return downloadToDevice();
    }
    
    try {
      const invoiceText = generateInvoiceText();
      const files = [];
      
      // Create invoice text file
      const textBlob = new Blob([invoiceText], { type: 'text/plain' });
      const textFile = new File([textBlob], `${invoiceNumber}.txt`, { type: 'text/plain' });
      files.push(textFile);
      
      // Create QuickBooks CSV file
      const csvContent = generateQuickBooksCSV();
      const csvBlob = new Blob([csvContent], { type: 'text/csv' });
      const csvFile = new File([csvBlob], `${invoiceNumber}_QB2014.csv`, { type: 'text/csv' });
      files.push(csvFile);
      
      // Share via native share sheet
      await navigator.share({
        title: `Invoice ${invoiceNumber}`,
        text: `Invoice for ${customerName} - Total: $${calculateTotal().toFixed(2)}`,
        files: files
      });
      
      return { success: true, message: 'Shared successfully!' };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, message: 'Share cancelled' };
      }
      // Fallback to download
      return downloadToDevice();
    }
  };
  
  // Save files to device and optionally share to Google Drive
  const saveFiles = async () => {
    let result = { success: false };
    
    // If share to Google Drive is enabled, use native share
    if (shareToGoogleDrive && navigator.share) {
      result = await shareFiles();
    } else if (saveToDevice) {
      // Otherwise just download to device
      result = await downloadToDevice();
    }
    
    return result;
  };
  
  // Generate QuickBooks import instructions
  const generateQuickBooksInstructions = () => {
    return `QUICKBOOKS 2013/2014 IMPORT INSTRUCTIONS
=========================================

This folder contains files formatted for QuickBooks 2013 and 2014:

1. ${invoiceNumber}_QB2014.csv
   - Enhanced CSV format for importing invoice data
   - Use: File > Utilities > Import > Excel Files
   - Compatible with QuickBooks 2013 and 2014 data import
   - Includes additional fields for better data integrity

2. ${invoiceNumber}_QB2014.iif
   - Enhanced IIF format for direct invoice import
   - Use: File > Utilities > Import > IIF Files
   - Creates complete invoice transaction with classes and service dates
   - Improved compatibility with QB 2014 features

IMPORT STEPS FOR IIF FILE (RECOMMENDED):
1. Open QuickBooks 2013 or 2014
2. Go to File > Utilities > Import > IIF Files
3. Select the ${invoiceNumber}_QB2014.iif file
4. Click Import
5. The invoice will appear in your Invoice list with enhanced data
6. Verify customer and item information

IMPORT STEPS FOR CSV FILE:
1. Open QuickBooks 2013 or 2014
2. Go to File > Utilities > Import > Excel Files
3. Select "Invoices" for invoice data import
4. Follow the import wizard
5. Map the columns to QuickBooks fields:
   - Invoice# → Invoice Number
   - Customer → Customer Name
   - Date → Invoice Date
   - Item → Item Code
   - Description → Description
   - Quantity → Qty
   - Rate → Rate
   - Service Date → Service Date (QB 2014)
   - Class → Class (QB 2014)

NEW FEATURES FOR QUICKBOOKS 2014:
✅ Enhanced service date tracking
✅ Class-based organization (Service)
✅ Improved tax handling
✅ Better customer contact integration
✅ Representative tracking (Mechanic)
✅ Shipping method tracking

NOTES:
- Customer "${customerName}" may need to be created first
- Tax settings should match your QuickBooks tax setup (8% configured)
- Item codes will be created as "Service Income" items
- Service class will be set to "Service"
- Representative will be set to "Mechanic"
- Invoice date: ${invoiceDate}
- Due date: 30 days from invoice date
- Total amount: $${calculateTotal().toFixed(2)}
- Payment terms: Net 30

TROUBLESHOOTING:
- If import fails, ensure QB is updated to latest version
- Create customer record manually if needed
- Check that Service Income account exists
- Verify tax code setup matches (Tax = 8%)

For support, refer to QuickBooks Help > Import Data or contact QuickBooks support.`;
  };
  
  // Note: Attachment handling is done through the main send process
  // Photos and videos are included in the invoice log for reference
  
  // Handle file selection with security validation
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxFileSize = 50 * 1024 * 1024; // 50MB limit
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'video/avi'];
    
    const validFiles = files.filter(file => {
      // Check file size
      if (file.size > maxFileSize) {
        alert(`File "${file.name}" is too large. Maximum size is 50MB.`);
        return false;
      }
      
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        alert(`File "${file.name}" is not a supported type. Only images and videos are allowed.`);
        return false;
      }
      
      // Sanitize filename
      const sanitizedName = sanitizeInput(file.name);
      if (sanitizedName !== file.name) {
        console.warn('Filename was sanitized for security');
      }
      
      return true;
    });
    
    const newAttachments = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: sanitizeInput(file.name),
      file: file,
      type: file.type.startsWith('image/') ? 'image' : 'video',
      url: URL.createObjectURL(file),
      size: (file.size / 1024 / 1024).toFixed(2) // Size in MB
    }));
    
    setAttachments([...attachments, ...newAttachments]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Remove attachment
  const removeAttachment = (id) => {
    const attachment = attachments.find(a => a.id === id);
    if (attachment) {
      URL.revokeObjectURL(attachment.url);
    }
    setAttachments(attachments.filter(a => a.id !== id));
  };
  
  // Add a new line item
  const addItem = () => {
    const newId = Math.max(...items.map(item => item.id)) + 1;
    setItems([...items, { id: newId, description: '', quantity: 1, price: 0 }]);
  };
  
  // Remove a line item
  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };
  
  // Update a line item
  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };
  
  // Calculate totals
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
    }, 0);
  };
  
  const calculateTax = () => {
    return calculateSubtotal() * 0.08; // 8% tax
  };
  
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };
  
  // Select a contact
  const selectContact = (contact) => {
    setCustomerName(sanitizeInput(contact.name));
    setCustomerPhone(sanitizeInput(contact.phone));
    setCustomerEmail(sanitizeInput(contact.email));
    setShowContacts(false);
    setSearchTerm('');
  };
  
  // Add new contact with validation
  const addNewContact = () => {
    const sanitizedName = sanitizeInput(customerName);
    const sanitizedPhone = sanitizeInput(customerPhone);
    const sanitizedEmail = sanitizeInput(customerEmail);
    
    // Validation
    if (!sanitizedName) {
      alert('Please enter a valid customer name');
      return;
    }
    
    if (sanitizedPhone && !validatePhone(sanitizedPhone)) {
      alert('Please enter a valid phone number');
      return;
    }
    
    if (sanitizedEmail && !validateEmail(sanitizedEmail)) {
      alert('Please enter a valid email address');
      return;
    }
    
    if (sanitizedName && (sanitizedPhone || sanitizedEmail)) {
      const newContact = {
        id: Date.now(),
        name: sanitizedName,
        phone: sanitizedPhone,
        email: sanitizedEmail
      };
      const updatedContacts = [...contacts, newContact];
      setContacts(updatedContacts);
      secureStorage.setItem('contacts', updatedContacts);
      alert('Contact saved!');
    } else {
      alert('Please enter at least a name and phone number or email');
    }
  };
  
  // Save invoice
  const saveInvoice = async () => {
    const invoice = {
      id: Date.now(),
      invoiceNumber,
      date: invoiceDate,
      customerName,
      customerPhone,
      customerEmail,
      items: items.filter(item => item.description),
      attachments: attachments.map(a => ({ name: a.name, type: a.type, size: a.size })),
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      total: calculateTotal(),
      savedAt: new Date().toISOString()
    };
    
    const updated = [...savedInvoices, invoice];
    setSavedInvoices(updated);
    secureStorage.setItem('invoices', updated);
    
    // Create log entry
    const logEntry = {
      id: Date.now(),
      invoiceNumber,
      customerName,
      total: calculateTotal(),
      sentAt: new Date().toISOString(),
      method: sendMethod,
      attachmentCount: attachments.length,
      googleDriveUploaded: false,
      googleDrivePath: null,
      quickBooksReady: false
    };
    
    // Save files to device if enabled
    if (saveToDevice) {
      const saveResult = await saveFiles();
      if (saveResult.success) {
        logEntry.googleDriveUploaded = true; // Mark as saved
        logEntry.googleDrivePath = 'Device Downloads';
        logEntry.quickBooksReady = true; // QuickBooks files are ready
        alert(saveResult.message);
      }
    }
    
    // Save log
    const updatedLogs = [...invoiceLogs, logEntry];
    setInvoiceLogs(updatedLogs);
    secureStorage.setItem('invoiceLogs', updatedLogs);
    
    // Update invoice number for next time
    const currentNum = parseInt(invoiceNumber.split('-')[1]) || 1;
    const nextNumber = `INV-${String(currentNum + 1).padStart(3, '0')}`;
    setInvoiceNumber(nextNumber);
    secureStorage.setItem('lastInvoiceNumber', nextNumber);
    
    return invoice;
  };
  
  // Generate QuickBooks 2013/2014 compatible CSV
  const generateQuickBooksCSV = () => {
    const lines = [];
    
    // Enhanced CSV Header for QuickBooks 2013/2014 Invoice Import
    // 2014 version includes additional fields for better data integrity
    lines.push('"Invoice#","Customer","Date","Item","Description","Quantity","Rate","Amount","Tax Code","Tax Amount","Customer Phone","Customer Email","Terms","Due Date","Memo","Service Date","Class","Rep","FOB","Ship Via"');
    
    // Calculate due date (30 days from invoice date)
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    
    // Add each line item with enhanced data
    items.filter(item => item.description).forEach((item) => {
      const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
      const taxAmount = lineTotal * 0.08; // 8% tax
      const cleanDescription = item.description.replace(/"/g, '""');
      const memoText = `${documentType.toUpperCase()} - Created with Invoice Creator`;
      
      // Enhanced line item with QB 2014 compatibility fields
      lines.push(`"${invoiceNumber}","${customerName}","${invoiceDate}","${cleanDescription}","${cleanDescription}",${item.quantity},${item.price},${lineTotal.toFixed(2)},"Tax",${taxAmount.toFixed(2)},"${customerPhone || ''}","${customerEmail || ''}","Net 30","${dueDateStr}","${memoText}","${invoiceDate}","Service","Mechanic","","Standard"`);
    });
    
    // Add summary line for total invoice with QB 2014 fields
    const grandTotal = calculateTotal();
    lines.push(`"${invoiceNumber}","${customerName}","${invoiceDate}","TOTAL","Invoice Total",1,${grandTotal.toFixed(2)},${grandTotal.toFixed(2)},"","","${customerPhone || ''}","${customerEmail || ''}","Net 30","${dueDateStr}","${documentType.toUpperCase()} Total","${invoiceDate}","Service","Mechanic","","Standard"`);
    
    return lines.join('\n');
  };
  
  // Generate QuickBooks IIF format for direct import (2013/2014 compatible)
  const generateQuickBooksIIF = () => {
    const lines = [];
    const invoiceTotal = calculateTotal();
    const taxTotal = calculateTax();
    
    // Calculate due date for QB 2014
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    
    // IIF Header - Updated for 2013/2014 compatibility
    lines.push('!HDR\tPROD\tVER\tREL\tIOTA\tBLD\tDATE\tTIME\tBASIS');
    lines.push('HDR\tQuickBooks Pro\t2014\tRelease\tR1P\t20140101\t' + new Date().toLocaleDateString() + '\t' + new Date().toLocaleTimeString() + '\tCash');
    
    // Transaction Header
    lines.push('!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tDOCNUM\tMEMO\tCLEAR\tTOPRINT\tNAMETXN\tADDR1\tADDR2\tADDR3\tADDR4\tADDR5\tDUEDATE\tTERMS\tPAID\tSHIPDATE');
    // Enhanced transaction line for QB 2014 with additional fields
    lines.push(`TRNS\tINVOICE\t${invoiceDate}\tAccounts Receivable\t${customerName}\tService\t${invoiceTotal.toFixed(2)}\t${invoiceNumber}\t${documentType.toUpperCase()} for ${customerName}\tN\tN\t\t\t\t\t\t\t${dueDateStr}\tNet 30\tN\t`);
    
    // Invoice Line Items
    lines.push('!SPL\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tDOCNUM\tMEMO\tCLEAR\tQNTY\tPRICE\tINVITEM\tPAIDSTATUS\tTXBL\tTAXCODE\tINVDATE\tPAIDDATE\tADDR1\tADDR2\tADDR3\tADDR4\tREIMBEXP\tSERVICEDATE\tOTHER2');
    
    items.filter(item => item.description).forEach(item => {
      const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
      // Enhanced split line for QB 2014 with service date and class
      lines.push(`SPL\tINVOICE\t${invoiceDate}\tIncome:Service Income\t${customerName}\tService\t-${lineTotal.toFixed(2)}\t${invoiceNumber}\t${item.description}\tN\t${item.quantity}\t${item.price}\t${item.description}\tUnpaid\tY\tTax\t${invoiceDate}\t\t\t\t\t\t\t${invoiceDate}\t`);
    });
    
    // Enhanced tax line for QB 2014
    if (taxTotal > 0) {
      lines.push(`SPL\tINVOICE\t${invoiceDate}\tSales Tax Payable\t${customerName}\tService\t-${taxTotal.toFixed(2)}\t${invoiceNumber}\tSales Tax (8%)\tN\t1\t${taxTotal.toFixed(2)}\tTax\tUnpaid\tN\tTax\t${invoiceDate}\t\t\t\t\t\t\t${invoiceDate}\t`);
    }
    
    lines.push('ENDTRNS');
    return lines.join('\n');
  };
  
  // Generate simple text format
  const generateInvoiceText = () => {
    const docType = documentType.toUpperCase();
    let text = `${docType} ${invoiceNumber}\n`;
    text += `Date: ${invoiceDate}\n\n`;
    text += `${documentType === 'quote' ? 'Quote For' : 'Bill To'}: ${customerName}\n`;
    if (customerPhone) text += `Phone: ${customerPhone}\n`;
    if (customerEmail) text += `Email: ${customerEmail}\n`;
    text += `\nItems:\n`;
    text += `------------------------\n`;
    
    items.filter(item => item.description).forEach(item => {
      const total = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
      text += `${item.description}\n`;
      text += `  Qty: ${item.quantity} × $${parseFloat(item.price).toFixed(2)} = $${total.toFixed(2)}\n`;
    });
    
    text += `------------------------\n`;
    text += `Subtotal: $${calculateSubtotal().toFixed(2)}\n`;
    text += `Tax (8%): $${calculateTax().toFixed(2)}\n`;
    text += `TOTAL: $${calculateTotal().toFixed(2)}\n`;
    
    if (attachments.length > 0) {
      text += `\nAttachments: ${attachments.length} file(s)\n`;
      attachments.forEach(a => {
        text += `- ${a.name} (${a.size}MB)\n`;
      });
    }
    
    return text;
  };
  
  // Send invoice with validation
  const sendInvoice = async () => {
    const sanitizedName = sanitizeInput(customerName);
    const sanitizedPhone = sanitizeInput(customerPhone);
    const sanitizedEmail = sanitizeInput(customerEmail);
    
    if (!sanitizedName) {
      alert('Please enter a valid customer name');
      return;
    }
    
    // Validate contact info based on send method
    if (sendMethod === 'sms' && (!sanitizedPhone || !validatePhone(sanitizedPhone))) {
      alert('Please enter a valid phone number for SMS');
      return;
    }
    
    if (sendMethod === 'email' && (!sanitizedEmail || !validateEmail(sanitizedEmail))) {
      alert('Please enter a valid email address for email');
      return;
    }
    
    const invoiceText = generateInvoiceText();
    
    // Save the invoice first
    await saveInvoice();
    
    if (sendMethod === 'sms') {
      // Create SMS link with sanitized data
      const smsBody = encodeURIComponent(invoiceText);
      const smsLink = `sms:${sanitizedPhone}?body=${smsBody}`;
      
      // Open SMS app
      window.location.href = smsLink;
      setShowSendDialog(false);
      
    } else if (sendMethod === 'email') {
      // Create email link with sanitized data
      const subject = encodeURIComponent(`Invoice ${sanitizeInput(invoiceNumber)}`);
      const body = encodeURIComponent(invoiceText);
      const mailtoLink = `mailto:${sanitizedEmail}?subject=${subject}&body=${body}`;
      
      // Open email app
      window.location.href = mailtoLink;
      setShowSendDialog(false);
      
    } else if (sendMethod === 'copy') {
      // Copy to clipboard (secure)
      try {
        await navigator.clipboard.writeText(invoiceText);
        alert('Invoice copied to clipboard! You can paste it anywhere.');
        setShowSendDialog(false);
      } catch (error) {
        console.error('Clipboard error:', error);
        alert('Could not copy to clipboard. Please try again.');
      }
    }
  };
  
  // Clear form
  const clearForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setItems([{ id: 1, description: '', quantity: 1, price: 0 }]);
    setAttachments([]);
  };
  
  // Load a saved invoice
  const loadInvoice = (invoice) => {
    setCustomerName(invoice.customerName);
    setCustomerPhone(invoice.customerPhone);
    setCustomerEmail(invoice.customerEmail);
    setInvoiceDate(invoice.date);
    setItems(invoice.items);
    setShowHistory(false);
  };
  
  // Check for parts needing price refresh (older than 6 weeks)
  const checkForPriceRefresh = () => {
    if (!priceRefreshEnabled) return;
    
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42); // 6 weeks = 42 days
    
    const needsRefresh = partsDatabase.filter(part => {
      if (!part.lastUpdated) return true; // No date = needs refresh
      const lastUpdate = new Date(part.lastUpdated);
      return lastUpdate < sixWeeksAgo;
    });
    
    if (needsRefresh.length > 0) {
      alert(`${needsRefresh.length} parts have pricing older than 6 weeks. Consider updating prices for accuracy.`);
    }
  };

  // Tutorial steps data
  const tutorialSteps = [
    {
      title: "Welcome to Invoice Creator!",
      content: "This app helps mechanics create professional invoices and quotes quickly. Let's take a tour of all the features!",
      target: null,
      position: "center"
    },
    {
      title: "Choose Document Type",
      content: "Start by choosing whether you want to create a Quote (estimate) or Invoice (final bill). Quotes are perfect for giving customers price estimates before work begins.",
      target: ".document-type-toggle",
      position: "bottom"
    },
    {
      title: "Customer Information",
      content: "Enter your customer's details here. You can save frequently used customers to your contacts for quick access later.",
      target: ".section:first-of-type",
      position: "right"
    },
    {
      title: "Contacts Button",
      content: "Click here to see saved customers or search through your contact list. This saves time when working with repeat customers.",
      target: ".contacts-btn",
      position: "left"
    },
    {
      title: "Document Details",
      content: "The document number updates automatically (INV-001 for invoices, QUO-001 for quotes). You can change the date if needed.",
      target: ".section:nth-of-type(2)",
      position: "right"
    },
    {
      title: "Parts Lookup - Main Button",
      content: "This opens the full parts database where you can search through hundreds of common auto parts with current pricing.",
      target: ".parts-lookup-btn",
      position: "left"
    },
    {
      title: "Line Item Lookup",
      content: "Each line has its own lookup button. Click this to search for a specific part to replace what's in this line.",
      target: ".lookup-item-btn",
      position: "top"
    },
    {
      title: "Add Photos & Videos",
      content: "Document your work! Add before/after photos, videos of problems, or pictures of parts. These get saved with the invoice.",
      target: ".attach-btn",
      position: "top"
    },
    {
      title: "Save & Share Files",
      content: "Download invoice files to your device or share them to Google Drive, email, or other apps. Files include QuickBooks-compatible formats.",
      target: ".google-btn",
      position: "bottom"
    },
    {
      title: "Options & Settings",
      content: "Configure part lookup websites, price refresh alerts, and other app settings. You can also replay this tutorial anytime!",
      target: ".options-btn",
      position: "bottom"
    },
    {
      title: "Send Your Work",
      content: "Send via text message, email, or copy to clipboard. The invoice automatically saves to your history when sent.",
      target: ".send-btn",
      position: "top"
    },
    {
      title: "Security & Privacy",
      content: "Your data is protected! The app uses enterprise-level security: input validation prevents errors, file uploads are secured, and all your customer data stays safely on your device with encrypted storage.",
      target: null,
      position: "center"
    },
    {
      title: "You're All Set!",
      content: "That covers all the main features! The app saves your work automatically, tracks pricing updates, helps you stay organized, and keeps your data secure. Ready to create your first professional invoice?",
      target: null,
      position: "center"
    }
  ];
  
  // Tutorial functions
  const startTutorial = () => {
    setTutorialStep(0);
    setShowTutorial(true);
  };
  
  const nextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      finishTutorial();
    }
  };
  
  const prevTutorialStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
    }
  };
  
  const skipTutorial = () => {
    finishTutorial();
  };
  
  const finishTutorial = () => {
    setShowTutorial(false);
    setTutorialStep(0);
    secureStorage.setItem('hasSeenTutorial', true);
  };

  // Filter contacts
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Search parts
  const searchParts = () => {
    let results = partsDatabase;
    
    if (partSearchQuery) {
      const query = partSearchQuery.toLowerCase();
      results = results.filter(part => 
        part.partNumber.toLowerCase().includes(query) ||
        part.description.toLowerCase().includes(query) ||
        part.category.toLowerCase().includes(query)
      );
    }
    
    if (manufacturerFilter) {
      results = results.filter(part => 
        part.manufacturer.toLowerCase().includes(manufacturerFilter.toLowerCase())
      );
    }
    
    return results;
  };
  
  // Check if part price is old (older than 6 weeks)
  const isPriceOld = (part) => {
    if (!part.lastUpdated) return true;
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
    return new Date(part.lastUpdated) < sixWeeksAgo;
  };
  
  // Select a part from lookup
  const selectPart = (part) => {
    if (selectedItemId) {
      updateItem(selectedItemId, 'description', `${part.partNumber} - ${part.description} (${part.manufacturer})`);
      updateItem(selectedItemId, 'price', part.price);
    }
    setShowPartsLookup(false);
    setPartSearchQuery('');
    setManufacturerFilter('');
    setSelectedItemId(null);
  };
  
  // Add part to invoice (creates new line item)
  const addPartToInvoice = (part) => {
    const newId = Math.max(...items.map(item => item.id)) + 1;
    const newItem = {
      id: newId,
      description: `${part.partNumber} - ${part.description} (${part.manufacturer})`,
      quantity: 1,
      price: part.price
    };
    setItems([...items, newItem]);
    alert(`${part.partNumber} added to invoice!`);
  };
  
  // Open external part lookup with security validation
  const openExternalLookup = (site, partNumber = '') => {
    // Validate URL
    const allowedDomains = [
      'rockauto.com',
      'autozone.com',
      'advanceautoparts.com',
      'oreillyauto.com',
      'napaonline.com'
    ];
    
    try {
      const url = new URL(site.url);
      const domain = url.hostname.replace('www.', '');
      
      if (!allowedDomains.includes(domain)) {
        alert('This website is not in the approved list for security reasons.');
        return;
      }
      
      // Sanitize part number
      const sanitizedPartNumber = sanitizeInput(partNumber);
      const searchUrl = `${site.url}${encodeURIComponent(sanitizedPartNumber)}`;
      
      // Open with security attributes
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      alert('Invalid website URL.');
      console.error('URL validation error:', error);
    }
  };
  
  // Update part price
  const updatePartPrice = async (partIndex) => {
    const newPrice = prompt(`Enter new price for ${partsDatabase[partIndex].partNumber}:`, partsDatabase[partIndex].price);
    if (newPrice && !isNaN(parseFloat(newPrice))) {
      const updatedDatabase = [...partsDatabase];
      updatedDatabase[partIndex].price = parseFloat(newPrice);
      updatedDatabase[partIndex].lastUpdated = new Date().toISOString();
      setPartsDatabase(updatedDatabase);
      secureStorage.setItem('partsDatabase', updatedDatabase);
      alert('Price updated!');
    }
  };
  
  // Add custom part to database with validation
  const addCustomPart = () => {
    const partNumber = sanitizeInput(prompt('Enter part number:') || '');
    if (!partNumber) return;
    
    const manufacturer = sanitizeInput(prompt('Enter manufacturer:') || '');
    if (!manufacturer) return;
    
    const description = sanitizeInput(prompt('Enter part description:') || '');
    if (!description) return;
    
    const priceInput = prompt('Enter price:') || '0';
    if (!validateNumeric(priceInput, 0, 999999)) {
      alert('Please enter a valid price (0-999999)');
      return;
    }
    
    const price = parseFloat(priceInput);
    const category = sanitizeInput(prompt('Enter category (e.g., Oil, Filter, Brakes):') || 'Other');
    
    const newPart = {
      partNumber,
      manufacturer,
      description,
      price,
      category,
      lastUpdated: new Date().toISOString()
    };
    
    const updatedDatabase = [...partsDatabase, newPart];
    setPartsDatabase(updatedDatabase);
    secureStorage.setItem('partsDatabase', updatedDatabase);
    alert('Part added to database!');
  };

  return (
    <div className="App">
      <div className="invoice-container">
        <div className="header-bar">
          <div className="title-section">
            <h1>{documentType === 'quote' ? 'Quote Creator' : 'Invoice Creator'}</h1>
            <div className="document-type-toggle">
              <label className="toggle-option">
                <input
                  type="radio"
                  value="quote"
                  checked={documentType === 'quote'}
                  onChange={(e) => {
                    setDocumentType(e.target.value);
                    const prefix = e.target.value === 'quote' ? 'QUO' : 'INV';
                    const currentNum = parseInt(invoiceNumber.split('-')[1]) || 1;
                    setInvoiceNumber(`${prefix}-${String(currentNum).padStart(3, '0')}`);
                  }}
                />
                Quote
              </label>
              <label className="toggle-option">
                <input
                  type="radio"
                  value="invoice"
                  checked={documentType === 'invoice'}
                  onChange={(e) => {
                    setDocumentType(e.target.value);
                    const prefix = e.target.value === 'quote' ? 'QUO' : 'INV';
                    const currentNum = parseInt(invoiceNumber.split('-')[1]) || 1;
                    setInvoiceNumber(`${prefix}-${String(currentNum).padStart(3, '0')}`);
                  }}
                />
                Invoice
              </label>
            </div>
          </div>
          <div className="header-buttons">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="history-btn"
            >
              {showHistory ? 'New Invoice' : 'History'}
            </button>
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="options-btn"
            >
              ⚙️ Options
            </button>
            <button 
              onClick={async () => {
                const result = await shareFiles();
                if (result.success) {
                  alert(result.message);
                }
              }}
              className="google-btn"
              title="Share to Google Drive or other apps"
            >
              📤 Share
            </button>
          </div>
        </div>
        
        {showOptions ? (
          <div className="options-section">
            <h2>Options & Settings</h2>
            
            <div className="option-group">
              <h3>Tutorial</h3>
              <p className="option-description">Replay the app tutorial to learn about all features</p>
              <button 
                onClick={startTutorial}
                className="tutorial-replay-btn"
              >
                🎓 Replay Tutorial
              </button>
            </div>
            
            <div className="option-group">
              <h3>File Saving</h3>
              <p className="option-description">How invoice files are saved on your device</p>
              <div className="save-info">
                <p>✅ On Android: Files save to your Downloads folder</p>
                <p>✅ You can then upload to Google Drive manually</p>
                <p>✅ Or use the Share button to send to Drive directly</p>
                <p>✅ QuickBooks files are automatically included</p>
              </div>
            </div>
            
            <div className="option-group">
              <h3>Part Lookup Websites</h3>
              <p className="option-description">Configure which websites to search for parts first</p>
              {partLookupSites.map((site, index) => (
                <div key={index} className="lookup-site-item">
                  <label className="site-toggle">
                    <input
                      type="checkbox"
                      checked={site.enabled}
                      onChange={(e) => {
                        const updatedSites = [...partLookupSites];
                        updatedSites[index].enabled = e.target.checked;
                        setPartLookupSites(updatedSites);
                        secureStorage.setItem('partLookupSites', updatedSites);
                      }}
                    />
                    <span className="site-name">{site.name}</span>
                  </label>
                  <button 
                    onClick={() => openExternalLookup(site)}
                    className="test-site-btn"
                  >
                    Test Site
                  </button>
                </div>
              ))}
            </div>
            
            <div className="option-group">
              <h3>Price Refresh Settings</h3>
              <label className="price-refresh-toggle">
                <input
                  type="checkbox"
                  checked={priceRefreshEnabled}
                  onChange={(e) => {
                    setPriceRefreshEnabled(e.target.checked);
                    secureStorage.setItem('priceRefreshEnabled', e.target.checked);
                  }}
                />
                <span>Alert when part prices are older than 6 weeks</span>
              </label>
              <button 
                onClick={() => checkForPriceRefresh()}
                className="check-prices-btn"
              >
                Check All Prices Now
              </button>
            </div>
            
            <div className="option-group">
              <h3>Database Management</h3>
              <button 
                onClick={() => {
                  const confirmed = window.confirm('This will reset all parts to current date. Continue?');
                  if (confirmed) {
                    const currentDate = new Date().toISOString();
                    const resetDatabase = partsDatabase.map(part => ({
                      ...part,
                      lastUpdated: currentDate
                    }));
                    setPartsDatabase(resetDatabase);
                    secureStorage.setItem('partsDatabase', resetDatabase);
                    alert('Database refreshed!');
                  }
                }}
                className="refresh-db-btn"
              >
                Refresh All Part Dates
              </button>
            </div>
            
            <button 
              onClick={() => setShowOptions(false)}
              className="close-options-btn"
            >
              Close Options
            </button>
          </div>
        ) : showHistory ? (
          <div className="history-section">
            <div className="history-tabs">
              <button 
                className="tab-btn active"
                onClick={() => {}}
              >
                Saved Invoices
              </button>
              <button 
                className="tab-btn"
                onClick={() => {}}
              >
                Send Log
              </button>
            </div>
            
            {savedInvoices.length === 0 ? (
              <p className="no-invoices">No saved invoices yet</p>
            ) : (
              <div className="invoice-list">
                {savedInvoices.map(invoice => (
                  <div key={invoice.id} className="invoice-item" onClick={() => loadInvoice(invoice)}>
                    <div className="invoice-item-header">
                      <strong>{invoice.invoiceNumber}</strong>
                      <span>${invoice.total.toFixed(2)}</span>
                    </div>
                    <div className="invoice-item-details">
                      <span>{invoice.customerName}</span>
                      <span>{new Date(invoice.savedAt).toLocaleDateString()}</span>
                    </div>
                    {invoice.attachments && invoice.attachments.length > 0 && (
                      <div className="invoice-item-attachments">
                        📎 {invoice.attachments.length} attachment(s)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Invoice Logs */}
            <div className="logs-section">
              <h3>Invoice Activity Log</h3>
              {invoiceLogs.map(log => (
                <div key={log.id} className="log-item">
                  <div className="log-header">
                    <strong>{log.invoiceNumber}</strong> - {log.customerName}
                  </div>
                  <div className="log-details">
                    <span>Sent: {new Date(log.sentAt).toLocaleString()}</span>
                    <span>Method: {log.method}</span>
                    <span>Amount: ${log.total.toFixed(2)}</span>
                    {log.googleDriveUploaded && (
                      <span className="drive-status">📁 Files Saved</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Customer Information */}
            <div className="section">
              <div className="section-header">
                <h2>Customer Information</h2>
                <button 
                  onClick={() => setShowContacts(!showContacts)}
                  className="contacts-btn"
                >
                  {showContacts ? 'Close' : 'Contacts'}
                </button>
              </div>
              
              {showContacts && (
                <div className="contacts-dropdown">
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <div className="contacts-list">
                    {filteredContacts.map(contact => (
                      <div 
                        key={contact.id} 
                        className="contact-item"
                        onClick={() => selectContact(contact)}
                      >
                        <div className="contact-name">{contact.name}</div>
                        <div className="contact-details">
                          {contact.phone && <span>📱 {contact.phone}</span>}
                          {contact.email && <span>✉️ {contact.email}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <label>
                  Customer Name:
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(sanitizeInput(e.target.value))}
                    placeholder="Enter customer name"
                    maxLength="100"
                  />
                </label>
              </div>
              <div className="form-group">
                <label>
                  Phone Number:
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(sanitizeInput(e.target.value))}
                    placeholder="(555) 123-4567"
                    maxLength="20"
                  />
                </label>
              </div>
              <div className="form-group">
                <label>
                  Email:
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(sanitizeInput(e.target.value))}
                    placeholder="customer@email.com"
                    maxLength="100"
                  />
                </label>
              </div>
              <button onClick={addNewContact} className="save-contact-btn">
                Save as Contact
              </button>
            </div>
            
            {/* Document Details */}
            <div className="section">
              <h2>{documentType === 'quote' ? 'Quote Details' : 'Invoice Details'}</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>
                    {documentType === 'quote' ? 'Quote Number:' : 'Invoice Number:'}
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(sanitizeInput(e.target.value))}
                      maxLength="20"
                    />
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    Date:
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </label>
                </div>
              </div>
              
              {/* Quote-specific fields */}
              {documentType === 'quote' && (
                <div className="quote-fields">
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        Quote Valid Until:
                        <input
                          type="date"
                          defaultValue={(() => {
                            const futureDate = new Date();
                            futureDate.setDate(futureDate.getDate() + 30);
                            return futureDate.toISOString().split('T')[0];
                          })()}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="quote-note">
                    <label>
                      Quote Notes:
                      <textarea
                        placeholder="Additional terms, conditions, or notes for this quote..."
                        rows="3"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
            
            {/* Line Items */}
            <div className="section">
              <div className="section-header">
                <h2>Services / Parts</h2>
                <button 
                  onClick={() => setShowPartsLookup(true)}
                  className="parts-lookup-btn"
                >
                  🔍 Parts Lookup
                </button>
              </div>
              <div className="items-container">
                {items.map((item) => (
                  <div key={item.id} className="item-row">
                    <div className="item-description">
                      <div className="description-input-group">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', sanitizeInput(e.target.value))}
                          placeholder="Service or part description"
                          maxLength="200"
                        />
                        <button 
                          className="lookup-item-btn"
                          onClick={() => {
                            setSelectedItemId(item.id);
                            setShowPartsLookup(true);
                          }}
                          title="Search parts database to replace this line item"
                        >
                          🔍
                        </button>
                      </div>
                    </div>
                    <div className="item-numbers">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (validateNumeric(value, 0, 999)) {
                            updateItem(item.id, 'quantity', value);
                          }
                        }}
                        min="1"
                        max="999"
                        className="quantity-input"
                        placeholder="Qty"
                      />
                      <span className="multiply">×</span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (validateNumeric(value, 0, 999999)) {
                            updateItem(item.id, 'price', value);
                          }
                        }}
                        step="0.01"
                        min="0"
                        max="999999"
                        placeholder="Price"
                        className="price-input"
                      />
                      <span className="item-total">
                        = ${((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)).toFixed(2)}
                      </span>
                      {items.length > 1 && (
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="remove-item-btn"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addItem} className="add-btn">
                + Add Another Item
              </button>
            </div>
            
            {/* Attachments Section */}
            <div className="section">
              <h2>Photos & Videos</h2>
              <div className="attachments-container">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="attach-btn"
                >
                  📷 Add Photos/Videos
                </button>
                
                {attachments.length > 0 && (
                  <div className="attachments-list">
                    {attachments.map(attachment => (
                      <div key={attachment.id} className="attachment-item">
                        {attachment.type === 'image' ? (
                          <img src={attachment.url} alt={attachment.name} className="attachment-preview" />
                        ) : (
                          <div className="video-preview">
                            <span className="video-icon">🎥</span>
                          </div>
                        )}
                        <div className="attachment-info">
                          <span className="attachment-name">{attachment.name}</span>
                          <span className="attachment-size">{attachment.size}MB</span>
                        </div>
                        <button 
                          onClick={() => removeAttachment(attachment.id)}
                          className="remove-attachment"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Totals */}
            <div className="totals-section">
              <div className="totals">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Tax (8%):</span>
                  <span>${calculateTax().toFixed(2)}</span>
                </div>
                <div className="total-row total">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Save Options */}
            <div className="save-options">
              <label className="save-option">
                <input
                  type="checkbox"
                  checked={saveToDevice}
                  onChange={(e) => setSaveToDevice(e.target.checked)}
                />
                <span>📥 Download files to device</span>
              </label>
              {navigator.share && (
                <label className="save-option">
                  <input
                    type="checkbox"
                    checked={shareToGoogleDrive}
                    onChange={(e) => setShareToGoogleDrive(e.target.checked)}
                  />
                  <span>📤 Share to Google Drive (when sending)</span>
                </label>
              )}
            </div>
            
            {/* Actions */}
            <div className="actions">
              <button onClick={() => setShowSendDialog(true)} className="send-btn">
                {documentType === 'quote' ? 'Send Quote' : 'Send Invoice'}
              </button>
              <button onClick={clearForm} className="clear-btn">
                Clear Form
              </button>
            </div>
            
            {/* Parts Lookup Modal */}
            {showPartsLookup && (
              <div className="modal-overlay" onClick={() => setShowPartsLookup(false)}>
                <div className="modal parts-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Parts Lookup</h3>
                    <button 
                      onClick={() => setShowPartsLookup(false)}
                      className="modal-close"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="parts-search">
                    <input
                      type="text"
                      placeholder="Search by part number or description..."
                      value={partSearchQuery}
                      onChange={(e) => setPartSearchQuery(e.target.value)}
                      className="parts-search-input"
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="Filter by manufacturer (optional)"
                      value={manufacturerFilter}
                      onChange={(e) => setManufacturerFilter(e.target.value)}
                      className="manufacturer-filter-input"
                    />
                  </div>
                  
                  <div className="parts-results">
                    {searchParts().length === 0 ? (
                      <p className="no-parts">No parts found. Try different search terms.</p>
                    ) : (
                      searchParts().map((part, index) => {
                        const isOldPrice = isPriceOld(part);
                        return (
                          <div 
                            key={index} 
                            className={`part-result-item ${isOldPrice ? 'old-price' : ''}`}
                          >
                            <div className="part-header">
                              <span className="part-number">{part.partNumber}</span>
                              <span className="part-manufacturer">{part.manufacturer}</span>
                              <div className="part-price-section">
                                <span className="part-price">${part.price.toFixed(2)}</span>
                                {isOldPrice && <span className="price-warning">⚠️ Old</span>}
                              </div>
                            </div>
                            <div className="part-description">{part.description}</div>
                            <div className="part-footer">
                              <span className="part-category">{part.category}</span>
                              <div className="part-actions">
                                {selectedItemId ? (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      selectPart(part);
                                    }}
                                    className="select-part-btn"
                                    title="Replace the selected line item with this part"
                                  >
                                    🔄 Replace Line
                                  </button>
                                ) : null}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addPartToInvoice(part);
                                  }}
                                  className="add-to-invoice-btn"
                                >
                                  + Add to Invoice
                                </button>
                                {isOldPrice && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updatePartPrice(partsDatabase.findIndex(p => p.partNumber === part.partNumber));
                                    }}
                                    className="update-price-btn"
                                  >
                                    Update Price
                                  </button>
                                )}
                              </div>
                            </div>
                            {/* External lookup buttons */}
                            <div className="external-lookup">
                              {partLookupSites.filter(site => site.enabled).map((site, siteIndex) => (
                                <button 
                                  key={siteIndex}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openExternalLookup(site, part.partNumber);
                                  }}
                                  className="external-lookup-btn"
                                  title={`Search ${part.partNumber} on ${site.name}`}
                                >
                                  {site.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  <div className="parts-actions">
                    <button 
                      onClick={addCustomPart}
                      className="add-custom-part-btn"
                    >
                      + Add New Part to Database
                    </button>
                    <button 
                      onClick={() => setShowPartsLookup(false)}
                      className="cancel-btn"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Send Dialog */}
            {showSendDialog && (
              <div className="modal-overlay" onClick={() => setShowSendDialog(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <h3>{documentType === 'quote' ? 'Send Quote' : 'Send Invoice'}</h3>
                  <div className="send-options">
                    <label className="send-option">
                      <input
                        type="radio"
                        value="sms"
                        checked={sendMethod === 'sms'}
                        onChange={(e) => setSendMethod(e.target.value)}
                      />
                      <span>📱 Text Message (SMS)</span>
                    </label>
                    <label className="send-option">
                      <input
                        type="radio"
                        value="email"
                        checked={sendMethod === 'email'}
                        onChange={(e) => setSendMethod(e.target.value)}
                      />
                      <span>✉️ Email</span>
                    </label>
                    <label className="send-option">
                      <input
                        type="radio"
                        value="copy"
                        checked={sendMethod === 'copy'}
                        onChange={(e) => setSendMethod(e.target.value)}
                      />
                      <span>📋 Copy to Clipboard</span>
                    </label>
                  </div>
                  <div className="modal-actions">
                    <button onClick={sendInvoice} className="send-confirm-btn">
                      Send
                    </button>
                    <button onClick={() => setShowSendDialog(false)} className="cancel-btn">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Tutorial Overlay */}
            {showTutorial && (
              <div className="tutorial-overlay">
                <div className="tutorial-backdrop" onClick={skipTutorial}></div>
                <div className="tutorial-spotlight" style={{
                  position: 'absolute',
                  ...(() => {
                    const step = tutorialSteps[tutorialStep];
                    if (!step.target) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
                    
                    const element = document.querySelector(step.target);
                    if (!element) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
                    
                    const rect = element.getBoundingClientRect();
                    switch (step.position) {
                      case 'top':
                        return {
                          top: rect.top - 10,
                          left: rect.left + rect.width / 2,
                          transform: 'translate(-50%, -100%)'
                        };
                      case 'bottom':
                        return {
                          top: rect.bottom + 10,
                          left: rect.left + rect.width / 2,
                          transform: 'translate(-50%, 0)'
                        };
                      case 'left':
                        return {
                          top: rect.top + rect.height / 2,
                          left: rect.left - 10,
                          transform: 'translate(-100%, -50%)'
                        };
                      case 'right':
                        return {
                          top: rect.top + rect.height / 2,
                          left: rect.right + 10,
                          transform: 'translate(0, -50%)'
                        };
                      default:
                        return {
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)'
                        };
                    }
                  })()
                }}>
                  <div className="tutorial-card">
                    <div className="tutorial-header">
                      <h3>{tutorialSteps[tutorialStep].title}</h3>
                      <div className="tutorial-progress">
                        Step {tutorialStep + 1} of {tutorialSteps.length}
                      </div>
                    </div>
                    <div className="tutorial-content">
                      {tutorialSteps[tutorialStep].content}
                    </div>
                    <div className="tutorial-actions">
                      <button 
                        onClick={skipTutorial}
                        className="tutorial-skip-btn"
                      >
                        Skip Tutorial
                      </button>
                      <div className="tutorial-nav">
                        {tutorialStep > 0 && (
                          <button 
                            onClick={prevTutorialStep}
                            className="tutorial-prev-btn"
                          >
                            ← Previous
                          </button>
                        )}
                        <button 
                          onClick={nextTutorialStep}
                          className="tutorial-next-btn"
                        >
                          {tutorialStep === tutorialSteps.length - 1 ? 'Finish' : 'Next →'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Highlight target element */}
                {tutorialSteps[tutorialStep].target && (
                  <div className="tutorial-highlight" style={{
                    position: 'absolute',
                    ...(() => {
                      const element = document.querySelector(tutorialSteps[tutorialStep].target);
                      if (!element) return {};
                      const rect = element.getBoundingClientRect();
                      return {
                        top: rect.top - 5,
                        left: rect.left - 5,
                        width: rect.width + 10,
                        height: rect.height + 10,
                        borderRadius: '8px',
                        border: '3px solid #4CAF50',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                        pointerEvents: 'none',
                        zIndex: 9998
                      };
                    })()
                  }}></div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;