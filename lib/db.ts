import postgres from "postgres"

// HARDCODED FIX: Directly using the connection string to bypass Next.js root detection issues
const CONNECTION_STRING = "postgresql://postgres.gzirayzxakflvaemvuhx:Catsarecute7!hehe@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

// Standard Postgres connection for Supabase
export const sql = postgres(CONNECTION_STRING, {
  ssl: "require",
  prepare: false, // Disabling prepared statements for connection poolers
})
