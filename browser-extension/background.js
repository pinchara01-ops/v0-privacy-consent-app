// Background service worker for the extension
const API_ENDPOINT = 'http://localhost:3000/api';
const API_KEY = 'demo_api_key_12345678901234567890123456789012';

// Initialize extension
function initializeSettings() {
    console.log('🔄 Refreshing Extension Settings...');
    chrome.storage.local.set({
        apiEndpoint: API_ENDPOINT,
        apiKey: API_KEY,
        autoDetectBots: true,
        blockTrackers: true,
        allowBotScraping: false
    }, () => {
        console.log('✅ Settings synced with:', API_ENDPOINT);
    });
}

chrome.runtime.onInstalled.addListener(initializeSettings);
chrome.runtime.onStartup.addListener(initializeSettings);

// Heartbeat to server to verify connection
setTimeout(() => {
    console.log('💓 Sending Heartbeat to:', API_ENDPOINT);
    fetch(`${API_ENDPOINT}/admin/bot-audit?api_key=${API_KEY}`)
        .then(() => console.log('✅ Connection to Backend verified'))
        .catch(err => console.error('❌ Connection to Backend failed:', err));
}, 1000);

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

    if (request.action === 'botDetectionResult') {
        console.log('🔍 Bot Detection Result:', request.result);

        // Store bot detection result
        chrome.storage.local.get(['botDetectionLog'], (result) => {
            const log = result.botDetectionLog || [];
            log.push({
                result: request.result,
                timestamp: request.timestamp,
                url: request.url
            });

            // Keep only last 100 entries
            if (log.length > 100) {
                log.shift();
            }

            chrome.storage.local.set({ botDetectionLog: log });
        });

        // Send to server for logging (including human/false results for audit)
        console.log(`📡 Sending detection result to server: Bot=${request.result.bot}, Kind=${request.result.botKind}`);
        sendBotDetectionToServer(request);

        sendResponse({ success: true });
        return true;
    }

    if (request.action === 'botBlocked') {
        console.warn('🚫 Bot Blocked:', request.result);

        // Increment blocked bots counter
        chrome.storage.local.get(['stats'], (result) => {
            const stats = result.stats || { sitesProtected: 0, trackersBlocked: 0, botsBlocked: 0 };
            stats.botsBlocked = (stats.botsBlocked || 0) + 1;
            chrome.storage.local.set({ stats });
        });

        // Send to server
        console.log('🛡️ [FORENSIC AUDIT] Bot detected with the following telemetry:');
        console.table({
            bot_kind: data.result.botKind,
            probability_score: data.result.score,
            mouse_traces: data.result.mouse_trace.length,
            network_probes: data.result.network_logs.length
        });

        sendBotBlockedToServer(request);

        sendResponse({ success: true });
        return true;
    }

    if (request.action === 'updateBotDetection') {
        // Broadcast to all tabs
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'updateBotDetection',
                    allowBotScraping: request.allowBotScraping
                }).catch(() => {
                    // Ignore errors for tabs that don't have the content script
                });
            });
        });
        return true;
    }

    if (request.action === 'checkPostConsents') {
        const url = `${API_ENDPOINT}/consent/check?post_ids=${request.postIds.join(',')}`;
        fetch(url)
            .then(res => res.json())
            .then(data => sendResponse(data))
            .catch(err => sendResponse({ success: false, error: err.message }));
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

// Send bot detection result to server
async function sendBotDetectionToServer(data) {
    try {
        const settings = await chrome.storage.local.get(['apiEndpoint', 'apiKey']);

        await fetch(`${settings.apiEndpoint}/bot-detection/result`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': settings.apiKey
            },
            body: JSON.stringify({
                bot_detected: data.result.bot,
                bot_kind: data.result.botKind,
                url: data.url,
                timestamp: data.timestamp,
                user_agent: navigator.userAgent
            })
        });
    } catch (error) {
        console.error('Failed to send bot detection to server:', error);
    }
}

// Send bot blocked event to server
async function sendBotBlockedToServer(data) {
    try {
        const settings = await chrome.storage.local.get(['apiEndpoint', 'apiKey']);

        const res = await fetch(`${settings.apiEndpoint}/bot-detection/blocked`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': settings.apiKey
            },
            body: JSON.stringify({
                bot_kind: data.result.botKind,
                url: data.url,
                timestamp: data.timestamp,
                blocked: true,
                metadata: {
                    bot_score: data.result.score,
                    mouse_trace: data.result.mouse_trace,
                    network_timestamps: data.result.network_logs,
                    is_behavioral: true
                }
            })
        });

        const resText = await res.text();
        console.log('📡 Server Response:', res.status, resText);
    } catch (error) {
        console.error('❌ FATAL: Failed to send bot blocked to server:', error);
    }
}
