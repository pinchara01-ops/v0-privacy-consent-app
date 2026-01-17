const postgres = require('postgres');
const sql = postgres('postgres://postgres.vptpysidrkptstqjoxio:inchara123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&prepare=false');

async function test() {
    try {
        const res = await sql`SELECT bot_kind, created_at, organization_id FROM botd_blocked_events ORDER BY created_at DESC LIMIT 5`;
        console.log('--- BLOCKED EVENTS ---');
        console.log(JSON.stringify(res, null, 2));

        const orgs = await sql`SELECT id, api_key FROM organizations`;
        console.log('\n--- ORGANIZATIONS ---');
        console.log(JSON.stringify(orgs, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
