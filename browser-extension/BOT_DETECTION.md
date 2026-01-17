# Bot Detection Integration Guide

## Overview

This browser extension now includes **advanced bot detection** powered by [Fingerprint's BotD library](https://github.com/fingerprintjs/BotD). Users can control whether automated bots and AI scrapers are allowed to access their content through a simple toggle in the extension popup.

## How It Works

### User Flow

1. **User Opens Extension Popup**
   - Sees a "Bot Detection" section with a toggle for "Allow AI/Bot Scraping"
   - Default setting: **OFF** (bots are blocked)

2. **User Toggles Setting**
   - **OFF (Default)**: Bot detection is active. Detected bots will be blocked from accessing the page.
   - **ON**: Bot detection is disabled. Bots can freely scrape content.

3. **Bot Detection Process**
   - When a page loads, the `bot-detector.js` script runs automatically
   - If bot blocking is enabled, it uses BotD library to detect automation tools
   - Detected bots see a blocking overlay and cannot access the page content

### Technical Implementation

#### Files Added/Modified

1. **`bot-detector.js`** (NEW)
   - Main bot detection script
   - Loads BotD library from CDN dynamically
   - Detects bots using advanced fingerprinting
   - Blocks page access for detected bots
   - Falls back to basic detection if BotD fails

2. **`popup.html`** (MODIFIED)
   - Added "Bot Detection" section
   - Toggle switch for "Allow AI/Bot Scraping"
   - Real-time status indicator

3. **`popup.js`** (MODIFIED)
   - Handles bot detection toggle events
   - Updates bot status UI dynamically
   - Broadcasts setting changes to all tabs

4. **`background.js`** (MODIFIED)
   - Handles bot detection results
   - Logs bot blocking events
   - Sends data to server API
   - Tracks bot statistics

5. **`manifest.json`** (MODIFIED)
   - Added `bot-detector.js` as content script running on all URLs
   - Runs at `document_start` for early detection

## Bot Detection Methods

### Primary: BotD Library
- Uses Fingerprint's BotD for advanced bot detection
- Detects:
  - Selenium
  - Puppeteer
  - Playwright
  - Headless Chrome
  - PhantomJS
  - And many more automation tools

### Fallback: Basic Detection
If BotD fails to load, the script falls back to basic heuristics:
- WebDriver detection
- Headless browser patterns
- Missing browser features
- Unusual navigation patterns

## User Interface

### Popup Controls

```
🤖 Bot Detection
┌─────────────────────────────────────┐
│ Allow AI/Bot Scraping     [Toggle]  │
│                                      │
│ Status Indicator:                   │
│ • Protection Active (Green)          │
│   Bot detection is running.         │
│   Bots will be blocked.             │
│                                      │
│ OR                                   │
│                                      │
│ • Bots Allowed (Yellow/Amber)       │
│   AI and bots can scrape content.   │
└─────────────────────────────────────┘
```

### Bot Block Screen

When a bot is detected and blocking is enabled, the bot sees:

```
┌─────────────────────────────────────┐
│              🤖                      │
│                                      │
│         Bot Detected                │
│                                      │
│  This website uses advanced bot     │
│  detection to protect user privacy. │
│  We've detected that you're using   │
│  automated tools.                   │
│                                      │
│  Detection Details:                 │
│  • Bot Type: HeadlessChrome         │
│  • Detection Method: BotD Advanced  │
│  • Timestamp: [Current Time]        │
│                                      │
│  If you believe this is an error,   │
│  please contact the website admin.  │
└─────────────────────────────────────┘
```

## API Integration

The extension sends bot detection events to your backend API:

### Endpoints Used

1. **POST `/api/bot-detection/result`**
   ```json
   {
     "bot_detected": true,
     "bot_kind": "HeadlessChrome",
     "url": "https://example.com",
     "timestamp": "2025-12-25T10:00:00Z",
     "user_agent": "Mozilla/5.0..."
   }
   ```

2. **POST `/api/bot-detection/blocked`**
   ```json
   {
     "bot_kind": "Selenium",
     "url": "https://example.com",
     "timestamp": "2025-12-25T10:00:00Z",
     "blocked": true
   }
   ```

## Statistics Tracking

The extension tracks:
- Number of sites protected
- Number of trackers blocked
- **Number of bots blocked** (NEW)

View these stats in the extension popup under "Statistics".

## Privacy & Security

### Privacy First
- Bot detection runs **100% client-side**
- No data sent to third-party servers (except your configured API)
- User has full control over bot detection

### No Server Required
- BotD library runs entirely in the browser
- Works offline (with fallback detection)
- No external dependencies required

## Development

### Testing Bot Detection

#### Test as Human
1. Open any website
2. Extension popup should show "Protection Active"
3. Page loads normally

#### Test as Bot (Simulated)
1. Use Chrome with `--enable-automation` flag:
   ```bash
   chrome.exe --enable-automation
   ```
2. Open any website
3. Should see bot blocking overlay

#### Test with Selenium
```python
from selenium import webdriver
driver = webdriver.Chrome()
driver.get('https://example.com')
# Should be blocked
```

### Local Development

1. Load extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `browser-extension` folder

2. Test the toggle:
   - Click extension icon
   - Toggle "Allow AI/Bot Scraping"
   - Observe status changes

3. Check console logs:
   - Open DevTools
   - Look for bot detection messages
   - Verify BotD library loads successfully

## Configuration

### Default Settings
- Bot scraping: **BLOCKED** (allowBotScraping = false)
- Auto-detect bots: **ON**
- Block trackers: **ON**

### Changing Defaults
Edit `background.js`:
```javascript
chrome.storage.local.set({
    allowBotScraping: true, // Allow bots by default
    // ... other settings
});
```

## Troubleshooting

### BotD Library Not Loading
- Check internet connection (library loads from CDN)
- Verify Content Security Policy allows external scripts
- Check browser console for errors
- Fallback detection will activate automatically

### Bot Detection Too Strict
- Adjust detection thresholds in `bot-detector.js`
- Modify `checkBasicBotSignals()` function
- Reduce required signals from 2 to 3 or more

### Bot Detection Too Lenient
- Increase detection signals
- Add custom detection rules
- Enable additional BotD features

## Future Enhancements

Potential improvements:
- [ ] Whitelist trusted bots (e.g., Google Bot, Bing Bot)
- [ ] CAPTCHA integration for suspected bots
- [ ] Machine learning-based bot scoring
- [ ] Detailed bot analytics dashboard
- [ ] Custom blocking messages
- [ ] Temporary bot access passes

## Resources

- [BotD Documentation](https://github.com/fingerprintjs/BotD)
- [BotD API Reference](https://github.com/fingerprintjs/BotD/blob/main/docs/api.md)
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/)
- [Bot Detection Best Practices](https://www.fingerprint.com/blog/bot-detection/)

## License

Bot detection powered by BotD, licensed under MIT.
Extension code licensed under your project's license.

---

**Last Updated**: December 25, 2025
**Version**: 1.0.0
