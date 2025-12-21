"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

export default function DemoPage() {
  const [apiKey, setApiKey] = useState("")
  const [userIdentifier, setUserIdentifier] = useState("demo-user-123")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCreateConsent = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          user_identifier: userIdentifier,
          consent_type: "marketing",
          status: "granted",
          metadata: {
            source: "demo-page",
            timestamp: new Date().toISOString(),
          },
        }),
      })
      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setResponse(`Error: ${error}`)
    }
    setLoading(false)
  }

  const handleGetConsents = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/consent?user_identifier=${userIdentifier}`, {
        headers: {
          "x-api-key": apiKey,
        },
      })
      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setResponse(`Error: ${error}`)
    }
    setLoading(false)
  }

  const handleBatchConsents = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          user_identifier: userIdentifier,
          consents: [
            { consent_type: "marketing", status: "granted" },
            { consent_type: "analytics", status: "granted" },
            { consent_type: "functional", status: "granted" },
          ],
        }),
      })
      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setResponse(`Error: ${error}`)
    }
    setLoading(false)
  }

  const handleCreateProof = async () => {
    setLoading(true)
    try {
      // First get consents
      const consentsRes = await fetch(`/api/consent?user_identifier=${userIdentifier}`, {
        headers: {
          "x-api-key": apiKey,
        },
      })
      const consentsData = await consentsRes.json()

      if (!consentsData.success || !consentsData.data?.[0]?.id) {
        setResponse("No consents found. Create a consent first.")
        setLoading(false)
        return
      }

      const consentId = consentsData.data[0].id

      // Create proof
      const res = await fetch("/api/proof/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          consent_id: consentId,
        }),
      })
      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setResponse(`Error: ${error}`)
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Consent Management System Demo</h1>
        <p className="text-muted-foreground">Test the consent management, bot detection, and proof APIs</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Enter your API key from the database seed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Check the database organizations table for the API key, or look at the seed script output
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="userIdentifier">User Identifier</Label>
            <Input
              id="userIdentifier"
              placeholder="demo-user-123"
              value={userIdentifier}
              onChange={(e) => setUserIdentifier(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="consent" className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="consent">Consent Management</TabsTrigger>
          <TabsTrigger value="bot">Bot Detection</TabsTrigger>
          <TabsTrigger value="proof">Consent Proofs</TabsTrigger>
        </TabsList>

        <TabsContent value="consent">
          <Card>
            <CardHeader>
              <CardTitle>Consent Management APIs</CardTitle>
              <CardDescription>Create, retrieve, and manage user consents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleCreateConsent} disabled={loading || !apiKey}>
                  Create Single Consent
                </Button>
                <Button onClick={handleBatchConsents} disabled={loading || !apiKey} variant="outline">
                  Batch Create Consents
                </Button>
                <Button onClick={handleGetConsents} disabled={loading || !apiKey} variant="outline">
                  Get User Consents
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bot">
          <Card>
            <CardHeader>
              <CardTitle>Bot Detection</CardTitle>
              <CardDescription>Coming soon - bot detection and analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Use the bot detection SDK in your client app</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proof">
          <Card>
            <CardHeader>
              <CardTitle>Consent Proof System</CardTitle>
              <CardDescription>Generate cryptographic proofs of consent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleCreateProof} disabled={loading || !apiKey}>
                  Create Proof for Latest Consent
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>API Response</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            readOnly
            value={response || "Click a button above to see the response"}
            className="font-mono text-sm min-h-[300px]"
          />
        </CardContent>
      </Card>
    </div>
  )
}
