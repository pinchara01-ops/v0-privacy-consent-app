import postgres from "postgres"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function runMigration() {
    console.log("🚀 Starting Full Database Migration...")
    console.log("")

    if (!process.env.DATABASE_URL) {
        console.error("❌ ERROR: DATABASE_URL environment variable is not set")
        process.exit(1)
    }

    // Use postgres driver for standard Postgres/Supabase
    const sql = postgres(process.env.DATABASE_URL, {
        ssl: "require",
        prepare: false,
    })

    async function runScript(filename) {
        console.log(`📄 Running script: ${filename}...`)
        const filePath = path.join(__dirname, filename)

        try {
            if (!fs.existsSync(filePath)) {
                console.error(`❌ File not found: ${filePath}`)
                return
            }

            const content = fs.readFileSync(filePath, "utf8")

            // Execute the entire script
            await sql.unsafe(content)
            console.log(`✅ Successfully ran ${filename}`)
        } catch (e) {
            // Ignore "already exists" errors
            if (e.code === '42710' || e.code === '42P07' || e.code === '23505') {
                console.log(`❕ Skipping existing objects in ${filename}`)
                return
            }
            console.error(`❌ Error running ${filename}:`, e.message)
            throw e
        }
    }

    try {
        // Run all migrations in order
        await runScript('001_create_schema.sql')
        await runScript('006_seed_with_api_key.sql')
        await runScript('007_botd_integration.sql')

        console.log("")
        console.log("✅ All migrations executed successfully!")
        console.log("")

        // Close connection and exit
        await sql.end()
        process.exit(0)

    } catch (error) {
        console.error("❌ Full migration failed:", error)
        if (sql) await sql.end()
        process.exit(1)
    }
}

runMigration()
