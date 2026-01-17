import postgres from 'postgres';
const connectionString = 'postgresql://postgres.gzirayzxakflvaemvuhx:Catsarecute7!hehe@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';
const sql = postgres(connectionString, { ssl: 'require' });

async function getID() {
    console.log('🔍 Finding Real Org ID...');
    try {
        const key = 'demo_api_key_12345678901234567890123456789012';
        const res = await sql`SELECT id FROM organizations WHERE api_key = ${key}`;

        if (res.length > 0) {
            console.log('✅ FOUND ID:', res[0].id);
        } else {
            console.log('❌ Key not found (unexpected)');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await sql.end();
    }
}

getID();
