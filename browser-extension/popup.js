// Popup script
const API_ENDPOINT = 'http://localhost:3000/api';

// Load current preferences
document.addEventListener('DOMContentLoaded', () => {
    loadPreferences();
    loadStats();
    setupEventListeners();
});

function loadPreferences() {
    chrome.storage.local.get(['consentPreferences', 'allowBotScraping'], (result) => {
        if (result.consentPreferences) {
            document.getElementById('consent-marketing').checked =
                result.consentPreferences.marketing === 'granted';
            document.getElementById('consent-analytics').checked =
                result.consentPreferences.analytics === 'granted';
            document.getElementById('consent-functional').checked =
                result.consentPreferences.functional === 'granted';
            document.getElementById('consent-personalization').checked =
                result.consentPreferences.personalization === 'granted';
        }

        // Load bot detection preference (default: false - bots are blocked)
        const allowBotScraping = result.allowBotScraping !== undefined ? result.allowBotScraping : false;
        document.getElementById('allow-bot-scraping').checked = allowBotScraping;
        updateBotStatus(allowBotScraping);
    });
}

function loadStats() {
    chrome.storage.local.get(['stats'], (result) => {
        const stats = result.stats || { sitesProtected: 0, trackersBlocked: 0 };
        document.getElementById('sites-protected').textContent = stats.sitesProtected || 0;
        document.getElementById('trackers-blocked').textContent = stats.trackersBlocked || 0;
    });
}

function setupEventListeners() {
    // Consent toggles
    ['marketing', 'analytics', 'personalization'].forEach(type => {
        document.getElementById(`consent-${type}`).addEventListener('change', (e) => {
            updateConsent(type, e.target.checked ? 'granted' : 'denied');
        });
    });

    // Bot detection toggle
    document.getElementById('allow-bot-scraping').addEventListener('change', (e) => {
        const allowBotScraping = e.target.checked;
        chrome.storage.local.set({ allowBotScraping });
        updateBotStatus(allowBotScraping);
        showNotification(allowBotScraping ? '🤖 Bot scraping allowed' : '🛡️ Bot scraping blocked');

        // Notify all tabs about the change
        chrome.runtime.sendMessage({
            action: 'updateBotDetection',
            allowBotScraping
        });
    });

    // Export data button
    document.getElementById('export-data').addEventListener('click', exportData);

    // Delete data button
    document.getElementById('delete-data').addEventListener('click', deleteData);
}

async function updateConsent(type, status) {
    // Update local storage
    chrome.storage.local.get(['consentPreferences'], (result) => {
        const preferences = result.consentPreferences || {};
        preferences[type] = status;
        chrome.storage.local.set({ consentPreferences: preferences });
    });

    // Send to server
    try {
        const settings = await chrome.storage.local.get(['apiEndpoint', 'apiKey']);
        const userEmail = await getUserIdentifier();

        const response = await fetch(`${settings.apiEndpoint}/consent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': settings.apiKey
            },
            body: JSON.stringify({
                user_identifier: userEmail,
                consent_type: type,
                status: status,
                metadata: {
                    source: 'extension',
                    timestamp: new Date().toISOString()
                }
            })
        });

        const data = await response.json();
        console.log('Consent updated:', data);

        // Show success notification
        showNotification('✅ Consent updated successfully');
    } catch (error) {
        console.error('Error updating consent:', error);
        showNotification('❌ Failed to update consent');
    }
}

async function exportData() {
    try {
        const settings = await chrome.storage.local.get(['apiEndpoint', 'apiKey']);
        const userEmail = await getUserIdentifier();

        const response = await fetch(
            `${settings.apiEndpoint}/consent/export?user_identifier=${encodeURIComponent(userEmail)}`,
            {
                headers: {
                    'x-api-key': settings.apiKey
                }
            }
        );

        const data = await response.json();

        // Download as JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `privacy-data-${new Date().toISOString()}.json`;
        a.click();

        showNotification('✅ Data exported successfully');
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('❌ Failed to export data');
    }
}

async function deleteData() {
    if (!confirm('Are you sure you want to delete all your consent data? This action cannot be undone.')) {
        return;
    }

    try {
        const settings = await chrome.storage.local.get(['apiEndpoint', 'apiKey']);
        const userEmail = await getUserIdentifier();

        const response = await fetch(`${settings.apiEndpoint}/consent`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': settings.apiKey
            },
            body: JSON.stringify({
                user_identifier: userEmail
            })
        });

        if (response.ok) {
            // Clear local storage
            chrome.storage.local.clear();
            showNotification('✅ All data deleted successfully');

            // Reload popup
            setTimeout(() => window.location.reload(), 1500);
        }
    } catch (error) {
        console.error('Error deleting data:', error);
        showNotification('❌ Failed to delete data');
    }
}

async function getUserIdentifier() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['userEmail'], (result) => {
            if (result.userEmail) {
                resolve(result.userEmail);
            } else {
                // Generate anonymous ID
                const anonymousId = 'anonymous_' + Date.now();
                chrome.storage.local.set({ userEmail: anonymousId });
                resolve(anonymousId);
            }
        });
    });
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.9);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    animation: slideDown 0.3s ease;
  `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

function updateBotStatus(allowBotScraping) {
    const indicator = document.getElementById('bot-indicator');
    const statusText = document.getElementById('bot-status-text');
    const statusDetail = document.getElementById('bot-status-detail');

    if (allowBotScraping) {
        indicator.style.background = '#fbbf24'; // Yellow/amber
        statusText.textContent = 'Bots Allowed';
        statusDetail.textContent = 'AI and bots can scrape content from this page.';
    } else {
        indicator.style.background = '#4ade80'; // Green
        statusText.textContent = 'Protection Active';
        statusDetail.textContent = 'Bot detection is running. Bots will be blocked.';
    }
}

