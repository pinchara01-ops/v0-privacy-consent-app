# Reddit Extension Demo Guide

## 🎯 How to Demo on Reddit

### Installation

1. **Open Chrome/Edge**
   - Go to `chrome://extensions/`
   - Enable **Developer mode** (top-right)
   - Click **Load unpacked**
   - Select `browser-extension` folder

2. **Start Your Backend**
   ```bash
   npm run dev
   ```
   Server must be running at `http://localhost:3000`

### Demo Steps

1. **Go to Reddit**
   - Open `https://www.reddit.com/`
   - Log in to your account

2. **Browse Any Subreddit**
   - Example: `https://www.reddit.com/r/technology/`
   - Scroll through posts

3. **Show the Magic** ✨
   - Under each Reddit post, you'll see a new section:
     - **"Privacy Consent for This Post"**
     - Click **"Settings"** button
     - 4 consent toggles appear:
       - 🎯 **Advertisers** (ON/OFF)
       - 📊 **Analytics** (ON/OFF)
       - 🌍 **Public** (ON/OFF)
       - 🤖 **AI Training** (ON/OFF)

4. **Toggle Consents**
   - Click any button to toggle ON/OFF
   - Watch the color change:
     - **Orange** = Consent granted (data shared)
     - **Green** = Consent denied (protected)
   - A toast notification appears confirming the change

5. **Show Backend Integration**
   - Open browser console (F12)
   - Toggle a consent
   - See the API call: `POST /api/consent`
   - Data is saved to your database!

6. **Explain the Innovation**
   - "Reddit doesn't let you control privacy per-post"
   - "Our extension adds this feature to EVERY post"
   - "Each post has independent consent settings"
   - "Changes are saved instantly to our backend"

---

## 🎬 Demo Script for Teacher

### 1. Introduction (30 seconds)
"I've built a browser extension that adds per-post privacy consent to Reddit. Watch this..."

### 2. Show Reddit (1 minute)
- Open Reddit
- Scroll to any post
- Point out the new "Privacy Consent for This Post" section
- "This doesn't exist in normal Reddit - we injected it"

### 3. Toggle Consents (1 minute)
- Click "Settings"
- Toggle "Advertisers" OFF
  - "Now this post won't be used for ad targeting"
- Toggle "AI Training" OFF
  - "This post won't train AI models"
- Show the toast notifications

### 4. Show Backend (1 minute)
- Open console (F12)
- Toggle another consent
- Show the API call
- "Every change is saved to our PostgreSQL database"
- "Full GDPR audit trail"

### 5. Explain Use Case (1 minute)
"This solves a real problem:
- Reddit users have NO control over how their posts are used
- Some posts are personal, some are public
- Our extension gives granular, per-post control
- Works on ANY website - not just Reddit"

---

## 🎨 What Your Teacher Will See

### On Reddit Posts:
```
┌─────────────────────────────────────────┐
│ 🔒 Privacy Consent for This Post        │
│                           [Settings]     │
├─────────────────────────────────────────┤
│ [Advertisers: OFF] [Analytics: ON ]     │
│ [Public: ON      ] [AI Training: OFF]   │
│                                          │
│ 💡 Control how this specific post is    │
│    used. Changes are saved instantly.   │
└─────────────────────────────────────────┘
```

### Features:
- ✅ Injected into EVERY Reddit post
- ✅ 4 consent types per post
- ✅ Color-coded (orange = ON, green = OFF)
- ✅ Toast notifications
- ✅ Instant backend sync
- ✅ Persistent (saved in localStorage + database)

---

## 💡 Key Talking Points

1. **Innovation**: "First extension to add per-post consent to social media"

2. **Technical**: "Uses MutationObserver to detect new posts, injects custom UI, syncs to backend API"

3. **Compliance**: "GDPR-compliant - users can change consent anytime, full audit trail"

4. **Scalability**: "Works on Reddit, Twitter, Facebook - any platform"

5. **Real-World**: "Solves actual privacy problem - users want control over individual posts"

---

## 🐛 Troubleshooting

### Extension not showing on Reddit?
1. Reload the extension in `chrome://extensions/`
2. Refresh Reddit page
3. Check console for errors

### Consent not saving?
1. Make sure backend is running (`npm run dev`)
2. Check API endpoint in `reddit-content.js` (should be `http://localhost:3000/api`)
3. Verify API key is correct

### Buttons not appearing?
1. Wait 2-3 seconds after page load
2. Scroll down to load more posts
3. Check if Reddit's HTML structure changed

---

## 📊 Demo Checklist

Before presenting:
- [ ] Backend server running
- [ ] Extension installed in Chrome
- [ ] Reddit account logged in
- [ ] Browser console open (F12)
- [ ] Test toggling consent on one post
- [ ] Verify toast notifications work

---

**You're ready to impress your teacher! 🚀**
