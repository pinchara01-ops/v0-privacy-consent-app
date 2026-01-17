// Content script - runs on every page
(function () {
    'use strict';

    const sessionId = generateSessionId();
    const events = [];
    let mouseMovements = 0;
    let clicks = 0;
    let keyPresses = 0;

    // Generate unique session ID
    function generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Track user behavior for bot detection
    // Track user behavior for bot detection
    document.addEventListener('mousemove', (e) => {
        mouseMovements++;
        // Capture specific points for forensic analysis (throttled)
        if (mouseMovements % 5 === 0) {
            events.push({
                type: 'mousemove',
                data: {
                    x: e.clientX,
                    y: e.clientY,
                    timestamp: Date.now()
                }
            });
        }
    });

    document.addEventListener('click', (e) => {
        clicks++;
        events.push({
            type: 'click',
            data: { x: e.clientX, y: e.clientY, timestamp: Date.now() }
        });
    });

    document.addEventListener('keypress', () => {
        keyPresses++;
        events.push({
            type: 'keypress',
            data: { count: keyPresses, timestamp: Date.now() }
        });
    });

    // Detect and block consent banners
    function hideConsentBanners() {
        const selectors = [
            '[class*="cookie"]',
            '[class*="consent"]',
            '[id*="cookie"]',
            '[id*="consent"]',
            '[class*="gdpr"]',
            '[class*="privacy-banner"]'
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Check if it's likely a consent banner
                const text = el.textContent.toLowerCase();
                if (text.includes('cookie') ||
                    text.includes('consent') ||
                    text.includes('privacy') ||
                    text.includes('gdpr')) {
                    el.style.display = 'none';
                    console.log('Hidden consent banner:', el);
                }
            });
        });
    }

    // Inject our own consent banner
    function injectConsentBanner() {
        chrome.storage.local.get(['consentPreferences'], (result) => {
            // Only show if user hasn't set preferences
            if (!result.consentPreferences) {
                const banner = createConsentBanner();
                document.body.appendChild(banner);
            }
        });
    }

    function createConsentBanner() {
        const banner = document.createElement('div');
        banner.id = 'privacy-consent-banner';
        banner.innerHTML = `
      <div style="position: fixed; bottom: 0; left: 0; right: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; box-shadow: 0 -4px 20px rgba(0,0,0,0.3); z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 20px;">
          <div style="flex: 1;">
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">🔒 Privacy Consent Manager</h3>
            <p style="margin: 0; font-size: 14px; opacity: 0.95;">We use your consent preferences across all websites. Manage your privacy settings.</p>
          </div>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button id="consent-accept-all" style="background: white; color: #667eea; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; transition: transform 0.2s;">
              Accept All
            </button>
            <button id="consent-reject-all" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid white; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; transition: transform 0.2s;">
              Reject All
            </button>
            <button id="consent-customize" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid white; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; transition: transform 0.2s;">
              Customize
            </button>
          </div>
        </div>
      </div>
    `;

        // Add hover effects
        banner.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.05)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
            });
        });

        // Handle button clicks
        banner.querySelector('#consent-accept-all').addEventListener('click', () => {
            updateConsent({
                marketing: 'granted',
                analytics: 'granted',
                functional: 'granted',
                personalization: 'granted'
            });
            banner.remove();
        });

        banner.querySelector('#consent-reject-all').addEventListener('click', () => {
            updateConsent({
                marketing: 'denied',
                analytics: 'denied',
                functional: 'granted',
                personalization: 'denied'
            });
            banner.remove();
        });

        banner.querySelector('#consent-customize').addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'openPopup' });
            banner.remove();
        });

        return banner;
    }

    function updateConsent(preferences) {
        const userEmail = getUserEmail();

        chrome.storage.local.set({ consentPreferences: preferences });

        // Send to server
        Object.keys(preferences).forEach(type => {
            chrome.runtime.sendMessage({
                action: 'updateConsent',
                data: {
                    user_identifier: userEmail || 'anonymous_' + sessionId,
                    consent_type: type,
                    status: preferences[type],
                    metadata: {
                        source: window.location.hostname,
                        timestamp: new Date().toISOString()
                    }
                }
            });
        });
    }

    function getUserEmail() {
        // Try to detect user email from common patterns
        const metaTags = document.querySelectorAll('meta[name*="email"], meta[property*="email"]');
        for (const tag of metaTags) {
            const content = tag.getAttribute('content');
            if (content && content.includes('@')) return content;
        }

        // Check localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            if (value && value.includes('@') && value.includes('.')) {
                const emailMatch = value.match(/[\w.-]+@[\w.-]+\.\w+/);
                if (emailMatch) return emailMatch[0];
            }
        }

        return null;
    }

    // Initialize
    setTimeout(() => {
        hideConsentBanners();
        injectConsentBanner();
    }, 1000);

    // Send bot detection data after 5 seconds
    setTimeout(() => {
        if (events.length > 0) {
            chrome.runtime.sendMessage({
                action: 'detectBot',
                sessionId: sessionId,
                events: events
            }, (response) => {
                if (response?.success) {
                    console.log('Bot detection result:', response.data);
                }
            });
        }
    }, 5000);

})();
