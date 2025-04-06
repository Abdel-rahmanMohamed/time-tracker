# TimeTracker Implementation & Setup Guide

## Action Items for You

### Phase 1: Initial Setup

1. [>>> USER INPUT REQUIRED <<<] Choose a name for your app (default is "TimeTracker")
2. [>>> USER INPUT REQUIRED <<<] Choose a color scheme (default primary color is #4285f4)
3. Set up local development environment:
   ```bash
   # Install Node.js from https://nodejs.org/ if not already installed
   
   # Create project directory
   mkdir time-tracker
   cd time-tracker
   
   # Initialize project
   npm init -y
   
   # Install development dependencies
   npm install --save-dev http-server
   
   # Create the file structure
   mkdir -p css js img/icons
   ```

4. Create app icons and screenshots:
   - The app requires several icon sizes (see manifest.json)
   - You can use tools like Canva, Figma, or Adobe Express to create these icons
   - [>>> USER INPUT REQUIRED <<<] Place your icon files in the img/icons directory

### Phase 2: Implementing the App

1. Copy all the code files from the artifacts to your project directory:
   - index.html (main HTML structure)
   - css/styles.css (styling)
   - js/app.js (main application logic)
   - js/db.js (database implementation)
   - js/timer.js (timer functionality)
   - js/export.js (CSV and JSON export)
   - js/charts.js (data visualization)
   - js/encryption.js (data security)
   - js/drive-backup.js (Google Drive integration)
   - service-worker.js (offline functionality)
   - manifest.json (PWA configuration)
   - generate-test-data.js (test data generation)

2. [>>> USER INPUT REQUIRED <<<] Update Google Drive API credentials (if you want to use Google Drive backup):
   - Create a project in the Google Cloud Console (https://console.cloud.google.com/)
   - Enable the Google Drive API
   - Create OAuth 2.0 credentials
   - Replace the placeholders in js/drive-backup.js:
     ```javascript
     this.CLIENT_ID = '[>>> USER INPUT REQUIRED <<<]';
     this.API_KEY = '[>>> USER INPUT REQUIRED <<<]';
     ```

### Phase 3: Testing Locally

1. Start the local development server:
   ```bash
   npx http-server -c-1 -p 8080
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

3. Generate test data for development:
   - Open the browser console (F12 or right-click > Inspect > Console)
   - Copy and paste the following line:
   ```javascript
   generateTestData().then(stats => console.log('Generated:', stats));
   ```

4. Test all functionality:
   - Timer tracking
   - Manual activity entry
   - Category and tag creation
   - Data filtering and searching
   - Data visualization
   - CSV export
   - Data backup and restore
   - Encryption settings

### Phase 4: Testing on iPhone

1. Ensure your computer and iPhone are on the same Wi-Fi network
2. Find your computer's IP address:
   ```bash
   # On macOS/Linux
   ifconfig | grep "inet "
   # On Windows
   ipconfig
   ```

3. Start the server with your IP address:
   ```bash
   npx http-server -c-1 -p 8080 -a YOUR_IP_ADDRESS
   ```

4. On your iPhone:
   - Open Safari
   - Navigate to `http://YOUR_IP_ADDRESS:8080`
   - Test all functionality to ensure it works well on mobile

### Phase 5: Deployment

1. Choose a deployment method:
   - Option 1: GitHub Pages (easiest)
   - Option 2: Netlify
   - Option 3: Vercel
   - Option 4: Your own web server

2. For GitHub Pages deployment:
   - Create a GitHub account if you don't have one
   - Create a new repository
   - Push your code to the repository
   - Enable GitHub Pages in repository settings
   - The app will be available at `https://yourusername.github.io/repository-name/`

### Phase 6: Installing on iPhone

1. On your iPhone:
   - Open Safari
   - Navigate to your deployed app URL
   - Tap the Share button (square with up arrow)
   - Select "Add to Home Screen"
   - Give the app a name
   - Tap "Add"

2. The app will now appear on your home screen and function like a native app:
   - Working offline
   - Full-screen interface
   - Direct access from the home screen

## Security Notes

- All data is stored locally on your device in IndexedDB
- Enable encryption in the app settings for additional security
- Choose a strong encryption password and remember it (there's no recovery option)
- Regular backups are recommended (either to Google Drive or as downloaded JSON files)

## Ongoing Usage and Maintenance

1. To update the app in the future:
   - Make changes to your code
   - Deploy the updated version
   - On your iPhone, visit the web URL and refresh
   - The app will update automatically via the service worker

2. For major updates:
   - Increment the cache version in service-worker.js:
   ```javascript
   const CACHE_NAME = 'time-tracker-cache-v2';
   ```

## Troubleshooting Common Issues

1. App not installing on iPhone:
   - Make sure you're using Safari browser
   - Ensure the site is served over HTTPS for production
   - All required icon sizes must be present

2. Data not persisting:
   - Check browser storage permissions
   - Ensure you're not in private/incognito mode

3. PWA not working offline:
   - Visit the app once while online to cache assets
   - Check service worker registration in the browser console

4. Google Drive integration not working:
   - Verify your API credentials
   - Check allowed origins in Google Cloud Console

If you encounter any issues, review browser console for error messages.