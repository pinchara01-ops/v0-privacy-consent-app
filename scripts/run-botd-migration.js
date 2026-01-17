/**
 * Run Database Migration for BotD Integration
 * 
 * This script runs the BotD integration SQL migration to create the necessary tables
 * for bot detection results, blocking events, whitelist, and statistics.
 * 
 * Usage: node scripts/run-botd-migration.js
 */

import postgres from "postgres"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

async function runMigration() {
    console.log("🚀 Starting BotD Integration Migration...")
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

    try {
        // Read the migration SQL file
        const migrationPath = join(__dirname, "007_botd_integration.sql")
        console.log(`📄 Reading migration file: ${migrationPath}`)

        const migrationSQL = readFileSync(migrationPath, "utf-8")
        console.log(`✓ Migration file loaded (${migrationSQL.length} characters)`)
        console.log("")

        // Execute the migration
        console.log("🔧 Executing migration...")
        await sql.unsafe(migrationSQL)

        console.log("✓ Migration executed successfully!")
        console.log("")

        // Verify tables were created
        console.log("🔍 Verifying tables...")

        const tables = [
            "botd_detection_results",
            "botd_blocked_events",
            "bot_whitelist",
            "botd_statistics"
        ]

        for (const table of tables) {
            const exists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = ${table}
        )
      `

            if (exists[0].exists) {
                console.log(`  ✓ Table '${table}' exists`)
            } else {
                console.log(`  ❌ Table '${table}' NOT FOUND`)
            }
        }

        console.log("")
        console.log("✅ BotD Integration Migration Complete!")
        console.log("")
        console.log("📊 New Tables Created:")
        console.log("  - botd_detection_results  (detection results from browser)")
        console.log("  - botd_blocked_events     (bot blocking events)")
        console.log("  - bot_whitelist           (whitelisted bots)")
        console.log("  - botd_statistics         (aggregated statistics)")
        console.log("")
        console.log("🎉 Database is ready for BotD integration!")

        // Close connection and exit
        await sql.end()
        process.exit(0)

    } catch (error) {
        console.error("❌ Migration failed:", error)
        if (sql) await sql.end()
        process.exit(1)
    }
}

// Run migration
runMigration()
