// Simplified Reddit Firewall
(function () {
  'use strict';

  const API_ENDPOINT = 'http://localhost:3000/api';
  const API_KEY = 'demo_api_key_12345678901234567890123456789012';

  console.log('🔒 Privacy Manager Active');

  // 1. Always ensure the Badge is visible for configuration
  function injectBadge() {
    if (document.getElementById('p-badge')) return;
    const b = document.createElement('div');
    b.id = 'p-badge';
    b.style.cssText = `
      position: fixed; bottom: 20px; left: 20px; z-index: 2147483647;
      background: #7c3aed; color: white; padding: 12px 18px; border-radius: 50px;
      font-family: sans-serif; font-weight: bold; cursor: pointer;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    `;
    b.innerText = "🛡️ Privacy Controls";
    b.onclick = () => showSettings();
    document.documentElement.appendChild(b);
  }

  function showSettings() {
    const ai = confirm("Block AI Scraping for this draft/post?") ? 'denied' : 'granted';
    const post_id = 'demo_post_' + Date.now();

    fetch(`${API_ENDPOINT}/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({
        user_identifier: 'owner@reddit.com',
        consent_type: 'marketing',
        status: ai,
        metadata: { post_id, platform: 'reddit' }
      })
    }).then(() => {
      alert(`✅ Privacy Set: AI Training is ${ai === 'denied' ? 'OFF 🚫' : 'ON ✅'}\n\nThis rule is now stored in the database.`);
      localStorage.setItem('last_protected_post', post_id);
    });
  }

  // 2. The Blocking Logic
  // 2. The Blocking Logic
  async function applyFirewall(force = false) {
    chrome.storage.local.get(['isBotDetected'], async (res) => {
      // If triggered by event (force) or stored state says bot is here
      if (!res.isBotDetected && !force) return;

      const posts = document.querySelectorAll('shreddit-post, [data-testid="post-container"], div[id^="t3_"]');

      // DEMO MODE: If on localhost, blur immediately efficiently
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log("🔥 DEMO MODE: Blurring content due to bot signal");
        posts.forEach(post => {
          post.style.transition = 'filter 0.5s ease';
          post.style.filter = 'blur(12px)';
          post.style.pointerEvents = 'none';
          post.setAttribute('data-blurred', 'true');
        });
        return;
      }

      const lastId = localStorage.getItem('last_protected_post');
      if (!lastId) return;

      // Calculate post IDs for real check
      const postIds = Array.from(posts).map(p => p.getAttribute('id') || p.getAttribute('data-post-id')).filter(Boolean);

      // Use background script to fetch to avoid CORS issues
      chrome.runtime.sendMessage({
        action: 'checkPostConsents',
        postIds: postIds
      }, (data) => {
        if (data && data.success && data.consents) {
          posts.forEach(post => {
            const id = post.getAttribute('id') || post.getAttribute('data-post-id');
            if (id && data.consents[id] === false) {
              post.style.filter = 'blur(20px)';
              post.style.pointerEvents = 'none';
            }
          });
        }
      });
    });
  }

  // Monitor for Bot Message
  window.addEventListener('privacy-bot-detected', () => {
    console.log("⚡ Received Bot Signal! Applying Firewall...");
    applyFirewall(true);
  });

  setInterval(() => {
    injectBadge();
    // Periodically check local storage state too
    applyFirewall(false);
  }, 2000);

})();
