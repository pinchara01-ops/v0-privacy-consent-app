// Bot Detection Engine with Corrected BotD Bridge
(function () {
    'use strict';

    console.log('🤖 Bot Detection Engine Loaded (Waiting for trigger)');

    const behavioralData = {
        mouse_trace: [],
        request_timestamps: [],
        botd_score: 0.1,
        detected_kind: null
    };

    let isCollecting = false;
    let collectionTimeout = null;

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

    // Listen for explicit trigger to start detection
    window.addEventListener('START_BOT_DETECTION', () => {
        console.log('🔓 Bot detection ENABLED by user action');
        startMonitoring();
    });

    // Check storage flag - if false, start detection
    chrome.storage.local.get(['allowBotScraping'], (result) => {
        if (result.allowBotScraping === true) {
            console.log('🎯 Bot scraping allowed - Detection DISABLED (waiting for trigger)');
            return;
        }
        console.log('⚠️ allowBotScraping not set or false - starting detection');
        startMonitoring();
    });

    function startMonitoring() {
        // Clear any existing timeout
        if (collectionTimeout) {
            clearTimeout(collectionTimeout);
        }

        // Reset data collection
        behavioralData.mouse_trace = [];
        behavioralData.request_timestamps = [];
        isCollecting = true;

        console.log('⏳ Collecting behavioral data...');
        console.log('   Warm-up window: 3 seconds');
        console.log('   Move your mouse to generate human-like patterns');

        // Wait 3 seconds before running detection analysis
        collectionTimeout = setTimeout(() => {
            isCollecting = false;
            console.log('✅ Data collection complete');
            console.log(`   Collected ${behavioralData.mouse_trace.length} mouse trace points`);
            console.log(`   Collected ${behavioralData.request_timestamps.length} network requests`);
            runDetectionAnalysis();
        }, 3000);
    }

    function runDetectionAnalysis() {
        console.log('🔬 === STARTING COMPREHENSIVE BOT DETECTION ===');
        runDetections();
    }

    async function runDetections() {
        const detectionResults = {
            layer1_behavioral: false,
            layer2_technical: false,
            layer3_network: false,
            botd_result: null,
            hf_result: null
        };
        
        // A. LAYER 2: BotD (FingerprintJS Bot Detection)
        console.log('🔍 LAYER 2: Running BotD Detection...');
        try {
            const loader = window.Botd || (window.default && window.default.Botd);
            if (loader) {
                console.log('✅ BotD library found, loading...');
                const botd = await (loader.load ? loader.load({ token: 'demo' }) : loader.default.load({ token: 'demo' }));
                
                // BotD doesn't have .detect(), it returns result directly
                const result = botd.bot !== undefined ? botd : { bot: false, botKind: 'unknown' };
                
                console.log('📊 BotD Result:', result);
                console.log('   Bot detected:', result.bot);
                console.log('   Bot kind:', result.botKind);
                
                // Check technical signatures
                let points = 0;
                if (navigator.webdriver) {
                    points++;
                    console.log('   ✓ navigator.webdriver = true');
                }
                if (/Headless/.test(navigator.userAgent)) {
                    points++;
                    console.log('   ✓ Headless browser detected');
                }
                if (window.document.documentElement.getAttribute('webdriver')) {
                    points++;
                    console.log('   ✓ WebDriver attribute detected');
                }

                behavioralData.botd_score = points / 3;
                console.log('📈 BotD Score:', behavioralData.botd_score);
                
                detectionResults.layer2_technical = result.bot || behavioralData.botd_score > 0.3;
                detectionResults.botd_result = result;
                
                if (detectionResults.layer2_technical) {
                    console.log('🚨 LAYER 2: Bot detected by BotD!');
                } else {
                    console.log('✅ LAYER 2: No bot detected by BotD');
                }
            } else {
                console.log('⚠️ BotD library not found');
            }
        } catch (err) {
            console.error('❌ BotD Error:', err);
        }
        
        // B. LAYER 1: Behavioral Analysis
        console.log('🎭 LAYER 1: Analyzing behavioral patterns...');
        
        // Check for data extraction patterns (bot signature)
        const extractionEvents = behavioralData.request_timestamps.filter((t, i, arr) => {
            if (i === 0) return false;
            return (t - arr[i-1]) < 100; // Requests within 100ms = bot
        });
        
        if (extractionEvents.length > 5) {
            console.log('   ✓ Rapid data extraction detected');
            detectionResults.layer1_behavioral = true;
        }
        
        if (behavioralData.mouse_trace.length < 5) {
            console.log('   ✓ Insufficient mouse movement detected');
            detectionResults.layer1_behavioral = true;
        }
        if (behavioralData.mouse_trace.length === 0) {
            console.log('   ✓ No mouse movement at all (bot signature)');
            detectionResults.layer1_behavioral = true;
        }
        
        // Check for programmatic DOM queries (scraping)
        const domQueries = performance.getEntriesByType('measure').filter(m => 
            m.name.includes('querySelector') || m.name.includes('querySelectorAll')
        );
        if (domQueries.length > 10) {
            console.log('   ✓ Excessive DOM queries detected');
            detectionResults.layer1_behavioral = true;
        }
        
        console.log(`   Mouse trace points: ${behavioralData.mouse_trace.length}`);
        console.log(`   Extraction events: ${extractionEvents.length}`);
        console.log(`   LAYER 1 Result: ${detectionResults.layer1_behavioral ? 'BOT' : 'HUMAN'}`);
        
        // C. LAYER 3: Network Analysis
        console.log('🌐 LAYER 3: Analyzing network patterns...');
        if (behavioralData.request_timestamps.length > 20) {
            console.log('   ✓ Excessive requests detected');
            detectionResults.layer3_network = true;
        }
        console.log(`   Network requests: ${behavioralData.request_timestamps.length}`);
        console.log(`   LAYER 3 Result: ${detectionResults.layer3_network ? 'BOT' : 'HUMAN'}`);
        
        // D. SEND TO HUGGINGFACE MODEL FOR FINAL DECISION
        console.log('🤖 Sending data to HuggingFace AI Model...');
        const forensicPayload = {
            mouse_trace: behavioralData.mouse_trace,
            network_timestamps: behavioralData.request_timestamps,
            botd_score: behavioralData.botd_score
        };
        
        try {
            const response = await fetch('http://localhost:3000/api/bot-detection/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'demo_api_key_12345678901234567890123456789012'
                },
                body: JSON.stringify(forensicPayload)
            });
            
            const hfResult = await response.json();
            detectionResults.hf_result = hfResult;
            
            console.log('✅ HuggingFace Model Response:');
            console.log('   Is Bot:', hfResult.is_bot);
            console.log('   Label:', hfResult.label);
            console.log('   Confidence:', (hfResult.confidence * 100).toFixed(1) + '%');
            console.log('   Fallback:', hfResult.fallback || false);
            
        } catch (err) {
            console.error('⚠️ HuggingFace Model unavailable:', err);
            detectionResults.hf_result = { is_bot: null, fallback: true };
        }
        
        // E. FINAL DECISION (Weighted voting)
        console.log('⚖️ === MAKING FINAL DECISION ===');
        console.log('   Layer 1 (Behavioral):', detectionResults.layer1_behavioral ? '🔴 BOT' : '🟢 HUMAN');
        console.log('   Layer 2 (Technical/BotD):', detectionResults.layer2_technical ? '🔴 BOT' : '🟢 HUMAN');
        console.log('   Layer 3 (Network):', detectionResults.layer3_network ? '🔴 BOT' : '🟢 HUMAN');
        console.log('   HF Model:', detectionResults.hf_result?.is_bot ? '🔴 BOT' : '🟢 HUMAN');
        
        // Weighted decision: HF model has highest weight, then BotD, then behavioral
        let botScore = 0;
        if (detectionResults.hf_result?.is_bot) botScore += 3; // HF model weight: 3
        if (detectionResults.layer2_technical) botScore += 2;  // BotD weight: 2
        if (detectionResults.layer1_behavioral) botScore += 1; // Behavioral weight: 1
        if (detectionResults.layer3_network) botScore += 1;    // Network weight: 1
        
        const threshold = 3; // Need at least 3 points to be considered a bot
        const isFinalBot = botScore >= threshold;
        
        console.log(`📊 Final Bot Score: ${botScore}/7 (threshold: ${threshold})`);
        console.log(`🎯 FINAL DECISION: ${isFinalBot ? '🚨 BOT DETECTED' : '✅ HUMAN'}`);
        
        if (isFinalBot) {
            const detectionSource = detectionResults.hf_result?.is_bot ? 'HuggingFace AI Model' :
                                   detectionResults.layer2_technical ? 'BotD Technical Analysis' :
                                   'Behavioral Pattern Analysis';
            triggerBotBlock(`Bot Detected (${detectionSource})`);
        }

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
        
        return detectionResults;
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

        console.log('🚨 BOT DETECTED:', kind);
        console.log('📊 Bot Score:', behavioralData.botd_score);
        console.log('🖱️ Mouse Trace Points:', behavioralData.mouse_trace.length);
        console.log('🌐 Network Requests:', behavioralData.request_timestamps.length);
        console.log('📦 SENDING FORENSIC PACKET:', packet);

        chrome.storage.local.set({ isBotDetected: true, detectedBotKind: kind });
        chrome.runtime.sendMessage(packet);

        // Show notification toast (NO BLOCKING OVERLAY)
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999998;
            background: #ffffff;
            color: #1a1a1a;
            padding: 16px 20px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-weight: 500;
            font-size: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideInRight 0.3s ease-out;
            max-width: 320px;
        `;
        toast.innerHTML = `
            <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">⚠️</div>
            <div>
                <div style="font-weight: 600; margin-bottom: 2px;">Bot Detected!</div>
                <div style="font-size: 12px; color: #64748b;">${kind}</div>
            </div>
        `;

        // Add animation keyframes
        if (!document.getElementById('privacy-shield-animations')) {
            const style = document.createElement('style');
            style.id = 'privacy-shield-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.documentElement.appendChild(toast);

        // Remove toast after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);

        window.dispatchEvent(new CustomEvent('privacy-bot-detected', { detail: { kind } }));
    }
})();
