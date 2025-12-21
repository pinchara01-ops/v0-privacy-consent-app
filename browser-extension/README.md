# Privacy Consent Manager - Browser Extension

A powerful browser extension that manages privacy consents across all websites with GDPR/CCPA compliance and bot detection.

## Features

✅ **Universal Consent Management** - Set your privacy preferences once, apply everywhere
✅ **Auto-Hide Cookie Banners** - Automatically hides annoying consent popups
✅ **Tracker Blocking** - Blocks marketing and analytics trackers based on your consent
✅ **Bot Detection** - Tracks user behavior to detect and prevent bot activity
✅ **GDPR Compliant** - Export and delete your data anytime
✅ **Beautiful UI** - Modern, gradient-based interface
✅ **Cross-Platform** - Works on Reddit, Twitter, Facebook, and all websites

## Installation

### Chrome/Edge

1. Open Chrome/Edge and navigate to `chrome://extensions/` or `edge://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `browser-extension` folder
5. The extension icon should appear in your toolbar

### Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Navigate to the `browser-extension` folder and select `manifest.json`

## Setup

1. **Start the Backend Server**
   ```bash
   cd ..
   npm run dev
   ```
   The server should be running at `http://localhost:3000`

2. **Click the Extension Icon**
   - Set your consent preferences
   - The extension will automatically apply them to all websites

3. **Browse Normally**
   - The extension will hide native cookie banners
   - Your preferences are synced across all sites
   - Trackers are blocked based on your settings

## How It Works

### 1. Consent Management
- You set your preferences once in the extension popup
- The extension stores them locally and syncs to the backend
- When you visit any website, the extension applies your preferences
- Native cookie banners are automatically hidden

### 2. Bot Detection
- The extension tracks mouse movements, clicks, and keypresses
- After 5 seconds, it sends this data to the backend for analysis
- The backend uses behavioral analysis to determine if you're human or bot
- Results are stored with confidence scores

### 3. Tracker Blocking
- Based on your consent preferences, the extension blocks:
  - **Marketing trackers**: Google Analytics, Facebook Pixel, DoubleClick
  - **Analytics trackers**: Mixpanel, Segment, etc.
- Functional cookies are always allowed (required for sites to work)

## API Integration

The extension communicates with your local backend:

- **Endpoint**: `http://localhost:3000/api`
- **API Key**: `demo_api_key_12345678901234567890123456789012`

You can change these in `background.js` if you deploy to production.

## Usage on Reddit, Twitter, etc.

1. **Visit any website** (e.g., reddit.com)
2. The extension will:
   - Hide Reddit's cookie banner
   - Show your custom consent banner (first visit only)
   - Block trackers based on your preferences
   - Track your behavior for bot detection

3. **Your preferences persist** across:
   - All Reddit pages
   - Twitter, Facebook, Instagram
   - Any website you visit

## GDPR Features

### Export Your Data
1. Click the extension icon
2. Click **Export My Data (GDPR)**
3. A JSON file will download with all your consent records

### Delete Your Data
1. Click the extension icon
2. Click **Delete All Data**
3. Confirm the deletion
4. All your data is removed from the backend

## Customization

### Change API Endpoint
Edit `background.js`:
```javascript
const API_ENDPOINT = 'https://your-production-api.com/api';
const API_KEY = 'your_production_api_key';
```

### Modify Consent Banner
Edit `content.js` - look for the `createConsentBanner()` function to customize the appearance.

### Add More Tracker Patterns
Edit `background.js` - add patterns to the `chrome.webRequest.onBeforeRequest` listener.

## Statistics

The extension tracks:
- **Sites Protected**: Number of unique domains visited
- **Trackers Blocked**: Total number of blocked tracking requests

View these in the extension popup.

## Troubleshooting

### Extension not working?
1. Make sure the backend server is running (`npm run dev`)
2. Check the browser console for errors (F12 → Console)
3. Verify the API endpoint in `background.js`

### Consent banner not showing?
1. Clear your browser cache
2. Reload the page
3. Check if you've already set preferences (banner only shows once)

### Trackers not being blocked?
1. Open the extension popup
2. Verify your consent preferences are set to "denied"
3. Check the background page console for blocked requests

## Development

To modify the extension:

1. Edit the files in `browser-extension/`
2. Go to `chrome://extensions/`
3. Click the **Reload** button on the extension card
4. Test your changes

## Security

- All API requests use the `x-api-key` header for authentication
- User data is encrypted in transit (use HTTPS in production)
- Consent preferences are stored locally in the browser
- No data is shared with third parties

## License

MIT

---

**Made with ❤️ for privacy-conscious users**
