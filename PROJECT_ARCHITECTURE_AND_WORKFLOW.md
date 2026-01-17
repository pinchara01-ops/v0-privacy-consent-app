# 🛡️ Privacy Consent & AI Bot Defense System - Project Documentation

## 1. Project Overview
This project is a dual-purpose privacy and security platform designed to empower users with control over their digital footprint while protecting content from unauthorized AI scrapers and bots.

It consists of two main components:
1.  **The "Privacy Shield" (Browser Extension):** A user-facing tool that manages cookie consents automatically and physically blocks tracking scripts (Google, Facebook, etc.) at the network level.
2.  **The "Bot Defense" (Extension + Backend):** An advanced forensic system that detects non-human behavior using AI, protecting content (specifically demoed on Reddit) from being scraped by training models.

---

## 2. System Architecture

### A. The Browser Extension (The "Edge")
Acts as the first line of defense and data collector running directly in the user's browser.
*   **`content.js`**:
    *   **Forensic Recorder**: Captures raw mouse movements (`x, y` coordinates) and network request timestamps.
    *   **Consent Injector**: Injects a custom privacy banner if none exists.
    *   **UI Enforcer**: Blurs content (e.g., Reddit posts) if the user is identified as a bot.
*   **`background.js`**:
    *   **Network Firewall**: Intercepts HTTP requests. If a user says "No Marketing", it drops requests to `google-analytics.com` etc. before they leave the browser.
    *   **Hub**: Routes data between the content script and your Next.js backend.
*   **`bot-detector.js`**:
    *   **Heuristics**: Checks for "Headless" browsers, WebDriver flags, and inhuman behavior constants.

### B. The Backend (Next.js + Postgres)
The central intelligence processing data and storing records.
*   **API Routes (`/api/bot-detection/*`)**: Receives forensic data blocks and session logs.
*   **Analysis Service (`lib/botD-service.ts`)**: The core logic engine that decides if a session is "Human" or "Bot".
*   **Database**: Stores audit logs, blocked events, and raw forensic data for future training.

### C. The AI Brain (Hugging Face Integration)
*   **External Intelligence**: Connects to a custom model hosted on Hugging Face Spaces (`Aadhya-R/Bot-Detection`).
*   **Forensic Analysis**: The backend sends the raw mouse traces to this model to get a probability score (e.g., "98% confident this is a bot").

---

## 3. Key Workflows explained

### Workflow 1: The "Privacy Shield" (Tracker Blocking)
**Goal:** Stop companies from tracking the user.
1.  **User Action:** User opens the Extension Popup and toggles "Marketing: Denied".
2.  **Extension:** Saves valid preference to `chrome.storage`.
3.  **Active Protection:** The user visits `example.com`. The site tries to load `analytics.js`.
4.  **Intervention:** `background.js` sees the requestUrl matches a blacklist. It cancels the request immediately.
5.  **Result:** The tracker never loads. User privacy is preserved.

### Workflow 2: Advanced Bot Detection (AI-Powered)
**Goal:** Detect a sophisticated bot trying to scrape data.
1.  **Surveillance:** The user (or bot) enters the site. `content.js` silently records the path of the mouse cursor every 50ms.
2.  **Data Transmission:** This "Behavioral Biometric" data is sent to your backend.
3.  **AI Analysis:**
    *   The backend packages the mouse trace: `[{x:1, y:10, t:0}, {x:5, y:20, t:50}...]`.
    *   It sends this payload to the **Hugging Face Model**.
4.  **Verdict:**
    *   **Scenario A (Human):** Smooth, erratic mouse curves. Model returns: `Is_Bot: False`.
    *   **Scenario B (Bot):** Instant jumps or perfectly linear movement. Model returns: `Is_Bot: True`.
5.  **Response:** The backend updates the session verdict in the database.

### Workflow 3: The Content Firewall (Reddit Demo)
**Goal:** Prevent the detected bot from reading content.
1.  **Trigger:** The backend or local heuristics flag the user as a "Bot".
2.  **Signal:** The extension broadcasts a `privacy-bot-detected` event.
3.  **Action:** The `reddit-content.js` script catches this event.
4.  **Enforcement:** It applies a heavy CSS `filter: blur(20px)` to all `shreddit-post` elements (Reddit posts).
5.  **Result:** The bot can load the page, but the actual text content is unreadable, rendering the scrape useless.

---

## 4. Technical specifications

### Data Flow for Forensics
1.  **Capture:** Browser `mousemove` event -> Arrays of `{x,y,timestamp}`.
2.  **Transport:** `fetch` POST to `/api/bot-detection/analyze`.
3.  **Storage:** Postgres `jsonb` column in `bot_detection_events` table.
4.  **Export:** `/api/admin/bot-audit` endpoint returns the exact JSON structure needed to train new models.

### Integration Points
*   **Hugging Face:** Uses standard REST API integration. It does not require the heavy Python client, making the Next.js app lightweight.
*   **BotD:** Uses FingerprintJS's open-source library for basic signal detection (browser fingerprinting) as a fallback layer.

---

## 5. Why this is Unique
Most privacy extensions only block cookies. Most bot detectors only look at IP addresses.
**This project combines both:**
1.  It gives **Users** control (Privacy).
2.  It gives **Site Owners** protection (Bot Defense).
3.  It uses **Behavioral AI** (Mouse movement analysis) which is much harder to fake than simple User-Agent strings.
