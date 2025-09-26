# Invoice Creator App

## What This Is
This is a simple app that helps you create invoices for your customers. Think of it like a digital form that makes nice-looking bills you can send to people who owe you money.

## Getting Started

### What You Need First
Before you can use this app, you need to have these things on your computer:
- Node.js (this is like the engine that makes the app run)
- npm (this helps install the parts the app needs)

If you don't have these, ask someone to help you install them from nodejs.org

### Setting Up the App

1. **Open the Terminal** (or Command Prompt on Windows)
   - On Mac: Click the magnifying glass, type "Terminal" and press Enter
   - On Windows: Click Start, type "cmd" and press Enter

2. **Go to the app folder**
   Type this and press Enter:
   ```
   cd invoice-creator
   ```
   (Make sure you're in the right folder first!)

3. **Install what the app needs**
   Type this and press Enter:
   ```
   npm install
   ```
   Wait for it to finish (this might take a few minutes)

## Using the App

### To Start the App
Type this in the Terminal and press Enter:
```
npm start
```

The app will open in your web browser automatically. If it doesn't, open your browser and go to: http://localhost:3000

### To Stop the App
Press `Ctrl + C` in the Terminal (hold down Ctrl key and press C)

### To Make a Version for Your Customers
Type this and press Enter:
```
npm run build
```

This creates a folder called "build" with files you can put on a website.

## Common Problems and Fixes

### "Command not found" error
- This means Node.js isn't installed. Get help installing it from nodejs.org

### The app won't start
- Try closing the Terminal and opening it again
- Make sure you're in the right folder (invoice-creator)
- Try running `npm install` again

### Browser shows an error
- Refresh the page (press F5 or click the refresh button)
- Make sure the Terminal is still running the app
- Check if another program is using port 3000

## Getting Help
If something doesn't work:
1. Take a screenshot of the error
2. Write down what you were trying to do
3. Ask someone with computer experience for help

## What the Commands Do (Simple Explanations)

- **npm install** = Gets all the pieces the app needs to work
- **npm start** = Turns on the app so you can use it
- **npm run build** = Makes files you can put on a website
- **npm test** = Checks if the app is working correctly

## 🔒 Security Features

This app is built with professional security to protect your business and customer data:

- **Customer Information Protected** - All data is secured and validated
- **Safe File Uploads** - Only images and videos accepted, with size limits
- **Secure Storage** - Your data stays on your device, safely stored
- **Input Validation** - Prevents errors and protects against bad data
- **QuickBooks 2013/2014 Integration** - Enhanced export with class tracking and service dates
- **Trusted External Links** - Only connects to approved auto parts websites

For complete security details, see: [SECURITY.md](../SECURITY.md)

## Tips for Success

- Always save your work before closing the app
- Keep the Terminal window open while using the app
- If things look weird, try refreshing your browser
- Don't worry about the technical stuff - just follow the steps
- Use the app on a secure network (not public WiFi for sensitive data)

## Need More Help?
The app was made with something called React. If you need to change how it works, you might need help from someone who knows about web apps.