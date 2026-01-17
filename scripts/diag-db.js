const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, {
    ssl: 'require',
    prepare: false,
});

async function checkData() {
    try {
        console.log('--- Checking botd_blocked_events ---');
        const blocks = await sql`SELECT id, bot_kind, url, created_at, metadata FROM botd_blocked_events ORDER BY created_at DESC LIMIT 5`;
        console.log(JSON.stringify(blocks, null, 2));

        console.log('\n--- Checking organizations ---');
        const orgs = await sql`SELECT id, name, api_key FROM organizations`;
        console.log(JSON.stringify(orgs, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkData();
