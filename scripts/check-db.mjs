import postgres from 'postgres';
const connectionString = 'postgresql://postgres.gzirayzxakflvaemvuhx:Catsarecute7!hehe@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';
const sql = postgres(connectionString, { ssl: 'require' });

async function check() {
    console.log('📊 Checking Database for Bot Events...');
    try {
        const events = await sql`SELECT * FROM botd_blocked_events ORDER BY created_at DESC LIMIT 5`;
        if (events.length === 0) {
            console.log('❌ No Bot Events found yet.');
        } else {
            console.log(`✅ Found ${events.length} Bot Events:`);
            events.forEach(e => {
                console.log(`- [${e.created_at}] Blocked Bot on ${e.url} (Reason: ${e.block_reason})`);
            });
        }
    } catch (err) {
        console.error(err);
    } finally {
        await sql.end();
    }
}
check();
