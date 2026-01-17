# 🎯 Supabase Database Setup Guide

## Your Supabase Connection String

```
postgresql://postgres.gzirayzxakflvaemvuhx:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
```

---

## ✅ Step-by-Step Setup

### **Step 1: Get Your Database Password**

1. Go to: https://supabase.com/dashboard
2. Select your project: `gzirayzxakflvaemvuhx`
3. Click: **Settings** (bottom left)
4. Click: **Database**
5. Scroll to: **Connection string**
6. Find: **Connection pooling** section
7. Click: **Transaction** mode
8. Copy the password (or reset if you forgot it)

**OR Reset Password:**
- Same Settings → Database page
- Click: **Reset Database Password**
- Copy the new password

---

### **Step 2: Create/Update .env.local File**

```powershell
# Navigate to project root
cd "c:\Users\inchara P\EL-SEM3\v0-privacy-consent-app"

# Create .env.local (if doesn't exist)
New-Item -ItemType File -Path .env.local -Force

# Open in notepad
notepad .env.local
```

**Add this line** (replace `YOUR-ACTUAL-PASSWORD`):
```env
DATABASE_URL=postgresql://postgres.gzirayzxakflvaemvuhx:YOUR-ACTUAL-PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
```

**Example:**
```env
DATABASE_URL=postgresql://postgres.gzirayzxakflvaemvuhx:MySecureP@ssw0rd123@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
```

---

### **Step 3: Test Database Connection**

```powershell
# Quick connection test
node -e "import('@neondatabase/serverless').then(async ({ neon }) => { const sql = neon(process.env.DATABASE_URL); const result = await sql\`SELECT NOW()\`; console.log('✅ Connected!', result[0]); })"
```

**Expected output:**
```
✅ Connected! { now: 2025-12-25T07:58:53.000Z }
```

**If error:**
- Check password is correct
- No special characters need escaping
- Connection string is complete

---

### **Step 4: Run Database Migration**

```powershell
# Run the BotD integration migration
node scripts/run-botd-migration.js
```

**Expected output:**
```
🚀 Starting BotD Integration Migration...

📄 Reading migration file: scripts\007_botd_integration.sql
✓ Migration file loaded (12345 characters)

🔧 Executing migration...
✓ Migration executed successfully!

🔍 Verifying tables...
  ✓ Table 'botd_detection_results' exists
  ✓ Table 'botd_blocked_events' exists
  ✓ Table 'bot_whitelist' exists
  ✓ Table 'botd_statistics' exists

✅ BotD Integration Migration Complete!

📊 New Tables Created:
  - botd_detection_results  (detection results from browser)
  - botd_blocked_events     (bot blocking events)
  - bot_whitelist           (whitelisted bots)
  - botd_statistics         (aggregated statistics)

🎉 Database is ready for BotD integration!
```

---

### **Step 5: Verify in Supabase Dashboard**

1. Go to: https://supabase.com/dashboard
2. Your project → **Table Editor** (left sidebar)
3. You should see new tables:
   - `botd_detection_results`
   - `botd_blocked_events`
   - `bot_whitelist`
   - `botd_statistics`

4. Click `bot_whitelist` table
5. You should see ~20 pre-populated whitelisted bots:
   - Googlebot
   - Bingbot
   - Facebook crawler
   - etc.

---

### **Step 6: Start Development Server**

```powershell
# Start Next.js dev server
npm run dev
```

**Expected output:**
```
▲ Next.js 16.0.10 (Turbopack)
- Local:        http://localhost:3000
- Environments: .env.local

✓ Starting...
✓ Ready in 1.5s
```

---

### **Step 7: Test API Endpoints**

```powershell
# Test bot detection result endpoint
curl -X POST http://localhost:3000/api/bot-detection/result `
  -H "Content-Type: application/json" `
  -H "x-api-key: demo_api_key_12345678901234567890123456789012" `
  -d '{
    "bot_detected": true,
    "bot_kind": "Selenium",
    "url": "https://test.com",
    "timestamp": "2025-12-25T13:30:00Z"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "logged": true,
    "bot_detected": true,
    "timestamp": "2025-12-25T13:30:00.000Z"
  }
}
```

**Check in Supabase:**
1. Go to Table Editor
2. Click `botd_detection_results`
3. You should see your test record!

---

## 🔍 Troubleshooting

### **Error: "DATABASE_URL is not set"**

**Solution:**
```powershell
# Check if .env.local exists
cat .env.local

# Should show:
# DATABASE_URL=postgresql://postgres.gzirayzxakflvaemvuhx:...

# If not, create it:
echo "DATABASE_URL=your-connection-string-here" > .env.local
```

### **Error: "password authentication failed"**

**Solution:**
1. Password is incorrect
2. Go to Supabase → Settings → Database
3. Click "Reset Database Password"
4. Copy new password
5. Update .env.local

### **Error: "could not translate host name"**

**Solution:**
- Check internet connection
- Verify connection string is complete
- No extra spaces in DATABASE_URL

### **Error: "relation does not exist"**

**Solution:**
- Migration didn't run successfully
- Run migration again: `node scripts/run-botd-migration.js`
- Or run SQL manually in Supabase SQL Editor

---

## 📊 Verify Everything Works

### **Check 1: Tables Exist**

In Supabase SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'botd%'
ORDER BY table_name;
```

**Expected Result:**
```
bot_whitelist
botd_blocked_events
botd_detection_results
botd_statistics
```

### **Check 2: Whitelist Populated**

```sql
SELECT COUNT(*) as whitelist_count
FROM bot_whitelist
WHERE is_active = TRUE;
```

**Expected Result:**
```
whitelist_count
20 (or more)
```

### **Check 3: Can Insert Data**

```sql
-- Test insert
INSERT INTO botd_detection_results (
  organization_id,
  bot_detected,
  bot_kind,
  url
) 
SELECT id, TRUE, 'TestBot', 'https://test.com'
FROM organizations 
LIMIT 1;

-- Check it worked
SELECT * FROM botd_detection_results 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## ✅ Success Checklist

- [ ] Got password from Supabase
- [ ] Created .env.local file
- [ ] Added DATABASE_URL with correct password
- [ ] Tested connection (SELECT NOW() works)
- [ ] Ran migration successfully
- [ ] Verified 4 tables exist in Supabase
- [ ] Whitelist has 20+ entries
- [ ] Can insert test data
- [ ] API endpoints return success
- [ ] Server logs show "📊 Bot Detection Result"

---

## 🎉 You're All Set!

**Your database is now:**
- ✅ Connected to Supabase
- ✅ Migrated with bot detection tables
- ✅ Pre-populated with whitelisted bots
- ✅ Ready for production use

**Next Steps:**
1. Load browser extension
2. Test bot detection
3. Run demo!

**Useful Supabase Features:**
- **Table Editor:** View/edit data visually
- **SQL Editor:** Run custom queries
- **Auth:** User authentication (if needed later)
- **Storage:** File storage (if needed)
- **Realtime:** Subscribe to DB changes

---

## 📝 Your Supabase Project Details

**Project Reference:** `gzirayzxakflvaemvuhx`
**Region:** AWS Mumbai (ap-south-1)
**Database:** PostgreSQL 15
**Pool Mode:** Transaction (Port 6543)

**Dashboard:** https://supabase.com/dashboard/project/gzirayzxakflvaemvuhx

---

**Need Help?**
- Supabase Docs: https://supabase.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Your project docs: See DEMO_SCRIPT.md

**Ready to demo! 🚀**
