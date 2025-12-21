// Background service worker for the extension
const API_ENDPOINT = 'http://localhost:3000/api';
const API_KEY = 'demo_api_key_12345678901234567890123456789012';

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('Privacy Consent Manager installed');

    // Set default settings
    chrome.storage.local.set({
        apiEndpoint: API_ENDPOINT,
        apiKey: API_KEY,
        autoDetectBots: true,
        blockTrackers: true,
        consentPreferences: {
            marketing: 'denied',
            analytics: 'denied',
            functional: 'granted',
            personalization: 'denied'
        }
    });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getConsentPreferences') {
        chrome.storage.local.get(['consentPreferences'], (result) => {
            sendResponse(result.consentPreferences);
        });
        return true;
    }

    if (request.action === 'updateConsent') {
        updateConsentOnServer(request.data)
            .then(response => sendResponse({ success: true, data: response }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'detectBot') {
        detectBotSession(request.sessionId, request.events)
            .then(response => sendResponse({ success: true, data: response }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

// Update consent on server
async function updateConsentOnServer(consentData) {
    const settings = await chrome.storage.local.get(['apiEndpoint', 'apiKey']);

    const response = await fetch(`${settings.apiEndpoint}/consent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': settings.apiKey
        },
        body: JSON.stringify(consentData)
    });

    return await response.json();
}

// Bot detection session
async function detectBotSession(sessionId, events) {
    const settings = await chrome.storage.local.get(['apiEndpoint', 'apiKey']);

    // Create session
    await fetch(`${settings.apiEndpoint}/bot-detection/session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': settings.apiKey
        },
        body: JSON.stringify({ session_id: sessionId })
    });

    // Record events
    for (const event of events) {
        await fetch(`${settings.apiEndpoint}/bot-detection/event`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': settings.apiKey
            },
            body: JSON.stringify({
                session_id: sessionId,
                event_type: event.type,
                event_data: event.data
            })
        });
    }

    // Analyze session
    const response = await fetch(`${settings.apiEndpoint}/bot-detection/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': settings.apiKey
        },
        body: JSON.stringify({ session_id: sessionId })
    });

    return await response.json();
}

// Block tracking scripts based on consent
chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        return new Promise((resolve) => {
            chrome.storage.local.get(['consentPreferences', 'blockTrackers'], (result) => {
                if (!result.blockTrackers) {
                    resolve({ cancel: false });
                    return;
                }

                const url = details.url.toLowerCase();

                // Block marketing trackers if consent denied
                if (result.consentPreferences?.marketing === 'denied') {
                    if (url.includes('google-analytics') ||
                        url.includes('facebook.com/tr') ||
                        url.includes('doubleclick.net') ||
                        url.includes('googleadservices')) {
                        console.log('Blocked marketing tracker:', url);
                        resolve({ cancel: true });
                        return;
                    }
                }

                // Block analytics if consent denied
                if (result.consentPreferences?.analytics === 'denied') {
                    if (url.includes('analytics') ||
                        url.includes('mixpanel') ||
                        url.includes('segment.io')) {
                        console.log('Blocked analytics tracker:', url);
                        resolve({ cancel: true });
                        return;
                    }
                }

                resolve({ cancel: false });
            });
        });
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
);
