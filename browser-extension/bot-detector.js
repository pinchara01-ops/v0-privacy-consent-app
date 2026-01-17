// Bot Detection Engine with Corrected BotD Bridge
(function () {
    'use strict';

    console.log('🤖 Bot Detection Engine Active (Forensics Enabled)');

    const behavioralData = {
        mouse_trace: [],
        request_timestamps: [],
        botd_score: 0.1,
        detected_kind: null
    };

    document.addEventListener('mousemove', (e) => {
        if (behavioralData.mouse_trace.length < 50) {
            behavioralData.mouse_trace.push({ x: e.clientX, y: e.clientY, t: Date.now() });
        }
    });

    const originalFetch = window.fetch;
    window.fetch = function () {
        behavioralData.request_timestamps.push(Date.now());
        return originalFetch.apply(this, arguments);
    };

    chrome.storage.local.get(['allowBotScraping'], (result) => {
        if (!(result.allowBotScraping || false)) runDetections();
    });

    async function runDetections() {
        // A. TECHNICAL: Corrected BotD Bridge
        try {
            const loader = window.Botd || (window.default && window.default.Botd);
            if (loader) {
                // Try both patterns: .load() directly or .default.load()
                const botd = await (loader.load ? loader.load({ token: 'demo' }) : loader.default.load({ token: 'demo' }));
                const signals = botd.sources || {};

                let points = 0;
                if (signals.s13?.value) points++; // WebDriver
                if (/Headless/.test(navigator.userAgent)) points++;
                if (navigator.webdriver) points++;

                behavioralData.botd_score = points / 3;
                if (behavioralData.botd_score > 0.3) triggerBotBlock('BotD Engine: Technical Signature');
            }
        } catch (err) { }

        // B. BEHAVIORAL: Scraper Extension Signatures
        const selectors = ['#web-scraper-panel', '.selector-toolbar', '.webscraper-attribute-select'];
        setInterval(() => {
            selectors.forEach(s => {
                if (document.querySelector(s)) triggerBotBlock('Web Scraper Extension');
            });
        }, 1500);

        // C. Manual Demo Trigger
        window.addEventListener('demo-trigger-bot-block', () => triggerBotBlock('Manual Simulation'));

        // D. Trap: Metadata Probe
        try {
            Object.defineProperty(window, '__SCRAPER_METADATA__', {
                get: () => triggerBotBlock('Property Probe Trap'),
                configurable: true
            });
        } catch (e) { }

        // E. Behavioral Honeypot: Monitor the trap element on the dashboard
        setInterval(() => {
            const trap = document.getElementById('honeypot-trap');
            if (trap && !trap.hasAttribute('data-hooked')) {
                trap.setAttribute('data-hooked', 'true');
                trap.addEventListener('mouseenter', () => triggerBotBlock('Behavioral Honeypot Trigger'));
                console.log('🔗 Honeypot Trap Hooked!');
            }
        }, 2000);
    }

    function triggerBotBlock(kind) {
        if (behavioralData.detected_kind) return;
        behavioralData.detected_kind = kind;

        const packet = {
            action: 'botBlocked',
            result: {
                botKind: kind,
                score: behavioralData.botd_score,
                mouse_trace: behavioralData.mouse_trace,
                network_logs: behavioralData.request_timestamps
            },
            url: window.location.href,
            timestamp: new Date().toISOString()
        };

        console.log('🚨 BOT BLOCKED:', kind);
        console.log('📦 SENDING FORENSIC PACKET:', packet);

        chrome.storage.local.set({ isBotDetected: true, detectedBotKind: kind });
        chrome.runtime.sendMessage(packet);

        const toast = document.createElement('div');
        toast.style.cssText = `position:fixed;bottom:85px;left:30px;z-index:9999999;background:#ef4444;color:white;padding:12px 18px;border-radius:10px;font-family:sans-serif;font-weight:bold;animation:slideIn 0.3s;`;
        toast.innerHTML = `🚨 Bot Detected: ${kind}`;
        document.documentElement.appendChild(toast);

        window.dispatchEvent(new CustomEvent('privacy-bot-detected', { detail: { kind } }));
    }
})();
