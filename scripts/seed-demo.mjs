import postgres from 'postgres';

// Hardcoded connection string that we know works
const connectionString = 'postgresql://postgres.gzirayzxakflvaemvuhx:Catsarecute7!hehe@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';

const sql = postgres(connectionString, { ssl: 'require' });

async function seed() {
    console.log('🌱 Seeding Demo Organization...');

    try {
        const demokey = 'demo_api_key_12345678901234567890123456789012';
        const demoId = '00000000-0000-0000-0000-000000000000';

        // Insert Organization
        // We use ON CONFLICT to ensure it's idempotent
        await sql`
      INSERT INTO organizations (id, name, api_key, settings)
      VALUES (${demoId}, 'Demo Organization', ${demokey}, '{}')
      ON CONFLICT (id) DO UPDATE 
      SET api_key = ${demokey};
    `;

        console.log('✅ Demo Organization Inserted Successfully!');
    } catch (err) {
        console.error('❌ Error seeding:', err);
    } finally {
        await sql.end();
    }
}

seed();
