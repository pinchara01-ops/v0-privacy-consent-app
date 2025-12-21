// Production-Ready Reddit Privacy Consent Manager
(function () {
  'use strict';

  const API_ENDPOINT = 'http://localhost:3000/api';
  const API_KEY = 'demo_api_key_12345678901234567890123456789012';

  console.log('🔒 Privacy Consent Manager initialized');

  // Store for tracking processed posts
  const processedPosts = new Set();

  // Inject consent controls into Reddit posts
  function injectConsentControls() {
    const posts = document.querySelectorAll('shreddit-post, [data-testid="post-container"]');

    posts.forEach(post => {
      // Get unique post ID
      const postId = post.getAttribute('id') ||
        post.getAttribute('data-post-id') ||
        'post_' + Math.random().toString(36).substr(2, 9);

      // Skip if already processed
      if (processedPosts.has(postId)) return;
      processedPosts.add(postId);

      // Load saved consent state
      const savedConsents = JSON.parse(localStorage.getItem(`consent_${postId}`) || '{}');
      const consents = {
        advertisers: savedConsents.advertisers !== undefined ? savedConsents.advertisers : false,
        analytics: savedConsents.analytics !== undefined ? savedConsents.analytics : true,
        public: savedConsents.public !== undefined ? savedConsents.public : true,
        ai: savedConsents.ai !== undefined ? savedConsents.ai : false,
      };

      // Create consent panel
      const panel = createConsentPanel(postId, consents);

      // Insert at the top of the post
      post.insertBefore(panel, post.firstChild);
    });
  }

  function createConsentPanel(postId, consents) {
    const panel = document.createElement('div');
    panel.className = 'privacy-consent-panel';
    panel.style.cssText = `
      margin: 0 0 12px 0;
      padding: 12px 16px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-bottom: 2px solid #dee2e6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const isExpanded = sessionStorage.getItem(`expanded_${postId}`) === 'true';

    panel.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span style="font-weight: 600; font-size: 13px; color: #495057;">Privacy Consent for This Post</span>
        </div>
        <button 
          id="toggle-${postId}" 
          style="
            background: #7c3aed;
            color: white;
            border: none;
            padding: 6px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          "
          onmouseover="this.style.background='#6d28d9'"
          onmouseout="this.style.background='#7c3aed'"
        >
          ${isExpanded ? 'Hide' : 'Settings'}
        </button>
      </div>
      
      <div id="options-${postId}" style="display: ${isExpanded ? 'block' : 'none'}; margin-top: 12px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-bottom: 10px;">
          ${createConsentButton('advertisers', '🎯 Advertisers', consents.advertisers, postId)}
          ${createConsentButton('analytics', '📊 Analytics', consents.analytics, postId)}
          ${createConsentButton('public', '🌍 Public', consents.public, postId)}
          ${createConsentButton('ai', '🤖 AI Training', consents.ai, postId)}
        </div>
        <div style="
          padding: 10px;
          background: white;
          border-radius: 6px;
          font-size: 11px;
          color: #6c757d;
          border-left: 3px solid #7c3aed;
        ">
          💡 <strong>Your Privacy, Your Control:</strong> Toggle each setting to control how this specific post is used. Changes are saved instantly and synced to our secure backend.
        </div>
      </div>
    `;

    // Add event listeners after DOM insertion
    setTimeout(() => {
      const toggleBtn = document.getElementById(`toggle-${postId}`);
      const optionsDiv = document.getElementById(`options-${postId}`);

      if (toggleBtn && optionsDiv) {
        toggleBtn.addEventListener('click', () => {
          const isHidden = optionsDiv.style.display === 'none';
          optionsDiv.style.display = isHidden ? 'block' : 'none';
          toggleBtn.textContent = isHidden ? 'Hide' : 'Settings';
          sessionStorage.setItem(`expanded_${postId}`, isHidden);
        });

        // Add consent button listeners
        ['advertisers', 'analytics', 'public', 'ai'].forEach(type => {
          const btn = document.getElementById(`consent-${type}-${postId}`);
          if (btn) {
            btn.addEventListener('click', () => toggleConsent(postId, type, btn));
          }
        });
      }
    }, 50);

    return panel;
  }

  function createConsentButton(type, label, isEnabled, postId) {
    const bgColor = isEnabled ? '#fff3cd' : '#d1f4e0';
    const textColor = isEnabled ? '#856404' : '#155724';
    const borderColor = isEnabled ? '#ffc107' : '#28a745';
    const emoji = isEnabled ? '✅' : '🚫';

    return `
      <button 
        id="consent-${type}-${postId}"
        data-enabled="${isEnabled}"
        data-type="${type}"
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: ${bgColor};
          color: ${textColor};
          border: 2px solid ${borderColor};
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        "
        onmouseover="this.style.transform='scale(1.03)'"
        onmouseout="this.style.transform='scale(1)'"
      >
        <span>${label}</span>
        <span style="font-size: 16px;">${emoji}</span>
      </button>
    `;
  }

  async function toggleConsent(postId, consentType, button) {
    const isCurrentlyEnabled = button.getAttribute('data-enabled') === 'true';
    const newState = !isCurrentlyEnabled;

    // Update button appearance
    button.setAttribute('data-enabled', newState);
    const bgColor = newState ? '#fff3cd' : '#d1f4e0';
    const textColor = newState ? '#856404' : '#155724';
    const borderColor = newState ? '#ffc107' : '#28a745';
    const emoji = newState ? '✅' : '🚫';

    button.style.background = bgColor;
    button.style.color = textColor;
    button.style.borderColor = borderColor;
    button.querySelector('span:last-child').textContent = emoji;

    // Save to localStorage
    const savedConsents = JSON.parse(localStorage.getItem(`consent_${postId}`) || '{}');
    savedConsents[consentType] = newState;
    localStorage.setItem(`consent_${postId}`, JSON.stringify(savedConsents));

    // Show toast notification
    showToast(`${consentType.charAt(0).toUpperCase() + consentType.slice(1)}: ${newState ? 'Enabled ✅' : 'Disabled 🚫'}`);

    // Send to backend
    try {
      const response = await fetch(`${API_ENDPOINT}/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          user_identifier: getUserIdentifier(),
          consent_type: consentType === 'advertisers' ? 'marketing' : 'analytics',
          status: newState ? 'granted' : 'denied',
          metadata: {
            post_id: postId,
            platform: 'reddit',
            consent_category: consentType,
            timestamp: new Date().toISOString(),
            url: window.location.href,
          },
        }),
      });

      if (response.ok) {
        console.log('✅ Consent synced to backend:', consentType, newState);
      } else {
        console.warn('⚠️ Backend sync failed, but local save succeeded');
      }
    } catch (error) {
      console.error('❌ Error syncing consent:', error);
      showToast('⚠️ Saved locally (backend offline)');
    }
  }

  function getUserIdentifier() {
    // Try to get Reddit username
    const usernameEl = document.querySelector('[slot="username"]');
    if (usernameEl) {
      return usernameEl.textContent.trim() + '@reddit.com';
    }

    // Fallback to anonymous ID
    let anonymousId = localStorage.getItem('privacy_user_id');
    if (!anonymousId) {
      anonymousId = 'reddit_user_' + Date.now();
      localStorage.setItem('privacy_user_id', anonymousId);
    }
    return anonymousId;
  }

  function showToast(message) {
    // Remove existing toast
    const existing = document.getElementById('privacy-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'privacy-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 70px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 14px 24px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      z-index: 999999;
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // Inject CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // Initial injection
  setTimeout(injectConsentControls, 2000);

  // Re-inject on scroll (for infinite scroll)
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(injectConsentControls, 500);
  });

  // Watch for new posts (MutationObserver)
  const observer = new MutationObserver(() => {
    injectConsentControls();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('🔒 Privacy Consent Manager active and monitoring Reddit');

})();
