# ✅ Quick Setup Checklist - Privacy Consent Manager

## 🔑 **REQUIRED KEYS & CREDENTIALS**

### **1. Database URL (REQUIRED)**

**Get from Neon.tech (FREE):**
```
1. Visit https://neon.tech
2. Sign up with Google/GitHub
3. Create new project: "privacy-consent-db"
4. Copy connection string
5. Add to .env.local:
   DATABASE_URL=postgresql://username@host/database
```

**Alternative - Supabase:**
```
1. Visit https://supabase.com
2. Create project
3. Go to Settings → Database
4. Copy connection string (Transaction mode)
5. Add to .env.local
```

**Status:** [ ] NOT SET / [ ] READY

---

### **2. API Key (AUTO-GENERATED)**

**Current default in code:**
```javascript
// browser-extension/background.js
const API_KEY = 'demo_api_key_12345678901234567890123456789012';
```

**For Production - Generate new:**
```javascript
// In Node.js console
require('crypto').randomBytes(32).toString('hex')
```

**Status:** [ ] Using Default / [ ] Generated New

---

### **3. BotD Library (NO KEY NEEDED!)**

✅ **Good News:** BotD loads from public CDN
- No API key required
- Free MIT license
- Loads automatically

**Status:** ✅ READY (no action needed)

---

## 📋 **SETUP STEPS**

### **Step 1: Environment Setup**

```powershell
# Navigate to project
cd "c:\Users\inchara P\EL-SEM3\v0-privacy-consent-app"

# Check if .env.local exists
ls .env.local

# If not exists, create it:
New-Item .env.local

# Add DATABASE_URL
# (Copy from Neon.tech dashboard)
```

**Checklist:**
- [ ] .env.local file created
- [ ] DATABASE_URL added
- [ ] Connection tested

---

### **Step 2: Database Migration**

```powershell
# Run the migration
node scripts/run-botd-migration.js
```

**Expected output:**
```
🚀 Starting BotD Integration Migration...
✓ Migration file loaded
🔧 Executing migration...
✓ Migration executed successfully!
  ✓ Table 'botd_detection_results' exists
  ✓ Table 'botd_blocked_events' exists
  ✓ Table 'bot_whitelist' exists
  ✓ Table 'botd_statistics' exists
✅ BotD Integration Migration Complete!
```

**Checklist:**
- [ ] Migration ran successfully
- [ ] 4 tables created
- [ ] Whitelist populated (20+ bots)
- [ ] No errors

---

### **Step 3: Start Development Server**

```powershell
# Install dependencies (if not done)
npm install

# Start dev server
npm run dev
```

**Expected output:**
```
▲ Next.js 16.0.10 (Turbopack)
- Local:        http://localhost:3000
✓ Ready in 1.5s
```

**Checklist:**
- [ ] Server running on localhost:3000
- [ ] No compilation errors
- [ ] Can access http://localhost:3000

---

### **Step 4: Load Browser Extension**

```
1. Open Chrome
2. Navigate to: chrome://extensions/
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked"
5. Select folder: browser-extension
6. Extension should load with icon in toolbar
```

**Checklist:**
- [ ] Extension loaded successfully
- [ ] Icon appears in Chrome toolbar
- [ ] No errors in chrome://extensions/
- [ ] Can click icon to open popup

---

### **Step 5: Test Extension Popup**

```
1. Click extension icon
2. Popup should open showing:
   - Statistics (initially 0)
   - Consent toggles
   - Bot Detection section ← NEW!
   - Protection buttons
```

**Checklist:**
- [ ] Popup opens
- [ ] Bot Detection section visible
- [ ] Toggle switch present
- [ ] Status shows "Protection Active" (green)

---

### **Step 6: Test Bot Detection**

```powershell
# Test API endpoint
curl -X POST http://localhost:3000/api/bot-detection/result `
  -H "Content-Type: application/json" `
  -H "x-api-key: demo_api_key_12345678901234567890123456789012" `
  -d '{
    "bot_detected": true,
    "bot_kind": "Test",
    "url": "https://test.com"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "logged": true,
    "bot_detected": true
  }
}
```

**Checklist:**
- [ ] API responds with success
- [ ] Returns database ID
- [ ] Server logs show "📊 Bot Detection Result"

---

### **Step 7: Verify Database**

**Option A: Using SQL client**
```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'botd%';

-- View whitelist
SELECT pattern_value, description 
FROM bot_whitelist 
WHERE is_active = TRUE 
LIMIT 5;
```

**Option B: Using Node**
```javascript
// test-db.js
import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL)
const result = await sql`SELECT COUNT(*) FROM bot_whitelist`
console.log('Whitelist entries:', result[0].count)
```

**Checklist:**
- [ ] Can connect to database
- [ ] botd_* tables exist
- [ ] Whitelist has 20+ entries
- [ ] Can insert and query data

---

## 🎯 **DEMO PREPARATION**

### **Before Demo:**

- [ ] DATABASE_URL is configured
- [ ] Migration has run
- [ ] Dev server is running
- [ ] Extension is loaded
- [ ] API endpoints tested
- [ ] Have Selenium/Puppeteer ready (optional)
- [ ] Reviewed demo script (DEMO_SCRIPT.md)

### **Demo URLs to Use:**

- [ ] google.com (normal browsing)
- [ ] reddit.com (consent management)
- [ ] twitter.com (bot detection test)

### **Terminal Windows Needed:**

1. **Server Terminal:** `npm run dev`
2. **Testing Terminal:** For curl commands
3. **Logs Terminal:** Watch server logs
4. **Optional:** Browser DevTools console

---

## 📊 **VERIFICATION CHECKLIST**

### **Extension:**
- [ ] Loads without errors
- [ ] Popup displays correctly
- [ ] Bot toggle works
- [ ] Status updates (green/yellow)
- [ ] Statistics increment

### **Bot Detection:**
- [ ] Normal users NOT blocked
- [ ] Whitelisted bots NOT blocked
- [ ] Non-whitelisted bots ARE blocked
- [ ] Blocking overlay displays
- [ ] Events logged to backend

### **Backend:**
- [ ] API endpoints respond
- [ ] Database saves records
- [ ] Statistics update
- [ ] Audit logs created
- [ ] Console logs appear

### **Database:**
- [ ] All 4 tables exist
- [ ] Whitelist populated
- [ ] Can insert records
- [ ] Indexes created
- [ ] Queries are fast

---

## 🐛 **TROUBLESHOOTING**

### **Issue: DATABASE_URL not set**
```powershell
# Check if .env.local exists
cat .env.local

# If missing, create and add:
echo "DATABASE_URL=your_connection_string" >> .env.local
```

### **Issue: Migration fails**
```
1. Verify DATABASE_URL is correct
2. Test connection manually
3. Check database permissions
4. Run SQL manually in database client
```

### **Issue: Extension doesn't load**
```
1. Check manifest.json syntax
2. Verify all files exist
3. Check browser console for errors
4. Try reloading extension
```

### **Issue: API returns 401**
```
1. Check x-api-key header
2. Verify API key matches
3. Check organization exists in DB
4. Review server logs
```

### **Issue: Bot detection doesn't work**
```
1. Check toggle is OFF (blocking enabled)
2. Open browser console
3. Look for BotD errors
4. Verify CDN is accessible
5. Try fallback detection
```

---

## 📚 **DOCUMENTATION GUIDE**

**Complete Documentation:**
- `DEMO_SCRIPT.md` - Full demo script
- `USER_FLOW_DIAGRAMS.md` - Visual flows
- `DATABASE_SETUP.md` - Database guide
- `DEPLOYMENT_GUIDE.md` - Production deployment
- `COMPLETE_SUMMARY.md` - Feature summary
- `BOT_DETECTION.md` - Technical details

**Quick References:**
- `BOT_DETECTION_QUICKSTART.md` - 3-step quickstart
- `TESTING_CHECKLIST.md` - Testing guide
- `README.md` - Project overview

---

## ✅ **FINAL CHECKLIST**

**Ready for Demo:**
- [ ] All setup steps completed
- [ ] Extension working
- [ ] Backend responding
- [ ] Database connected
- [ ] Can demonstrate bot blocking
- [ ] Understand user flows
- [ ] Have talking points ready
- [ ] Documentation reviewed

**Optional Enhancements:**
- [ ] Generated new API key
- [ ] Customized blocking message
- [ ] Added custom bots to whitelist
- [ ] Built analytics dashboard
- [ ] Deployed to production

---

## 🎉 **YOU'RE READY!**

**Status:**
- ✅ Setup Complete
- ✅ Database Integrated
- ✅ Extension Ready
- ✅ Backend Operational
- ✅ Documentation Available

**Next:** Use `DEMO_SCRIPT.md` to present your project!

---

**Questions?** Check the documentation or ask!

**Good Luck! 🚀**
