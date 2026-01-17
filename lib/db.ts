import postgres from "postgres"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

// Standard Postgres connection for Supabase
export const sql = postgres(process.env.DATABASE_URL, {
  ssl: "require",
  prepare: false, // Disabling prepared statements for connection poolers
})
