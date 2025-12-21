"use client"

import { sql } from "@/lib/db"

export default async function ApiKeysPage() {
  const organizations = await sql`
    SELECT id, name, api_key, created_at 
    FROM organizations 
    ORDER BY created_at DESC
  `

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">API Keys</h1>
        <p className="text-muted-foreground mb-8">Copy an API key to use in the demo page</p>

        <div className="space-y-4">
          {organizations.map((org: any) => (
            <div key={org.id} className="border rounded-lg p-6 bg-card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{org.name}</h2>
                  <p className="text-sm text-muted-foreground">ID: {org.id}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  Created: {new Date(org.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="bg-muted p-4 rounded-md">
                <p className="text-xs text-muted-foreground mb-2">API Key:</p>
                <code className="text-sm font-mono break-all">{org.api_key}</code>
              </div>

              <button
                onClick={() => navigator.clipboard.writeText(org.api_key)}
                className="mt-4 text-sm text-primary hover:underline"
              >
                Copy to clipboard
              </button>
            </div>
          ))}

          {organizations.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No organizations found. Run the seed script to create demo data.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
