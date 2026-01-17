"use client";

import React, { useState } from 'react';
import { Shield, Bot, Database, Key, Send, CheckCircle, AlertCircle, Copy, Terminal } from 'lucide-react';

const API_KEY = "demo_api_key_12345678901234567890123456789012";

const EndpointCard = ({ method, path, title, description, params, body, response }: any) => {
    const [copied, setCopied] = useState(false);

    const copyPath = () => {
        navigator.clipboard.writeText(`http://localhost:3000${path}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const methodColors: any = {
        GET: "bg-green-500",
        POST: "bg-blue-500",
        DELETE: "bg-red-500"
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-8 shadow-2xl">
            <div className="p-4 bg-slate-800/50 flex items-center justify-between border-bottom border-slate-700">
                <div className="flex items-center gap-3">
                    <span className={`${methodColors[method]} text-white px-3 py-1 rounded text-xs font-bold`}>{method}</span>
                    <code className="text-slate-300 font-mono text-sm">{path}</code>
                    <button onClick={copyPath} className="text-slate-500 hover:text-white transition">
                        {copied ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                </div>
                <span className="text-slate-400 text-xs font-medium uppercase tracking-widest">{title}</span>
            </div>

            <div className="p-6">
                <p className="text-slate-400 text-sm mb-6">{description}</p>

                {params && (
                    <div className="mb-4">
                        <h4 className="text-slate-300 text-xs font-bold uppercase mb-2">Query Parameters</h4>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                            {params.map((p: any) => (
                                <div key={p.name} className="flex gap-2 text-xs mb-1">
                                    <span className="text-blue-400 font-mono italic">{p.name}</span>
                                    <span className="text-slate-600">—</span>
                                    <span className="text-slate-400">{p.description}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-slate-300 text-xs font-bold uppercase mb-2">Example Request Header</h4>
                        <pre className="bg-slate-950 p-4 rounded-lg text-xs text-blue-300 overflow-x-auto border border-slate-800">
                            {`x-api-key: ${API_KEY}
Content-Type: application/json`}
                        </pre>
                    </div>
                    <div>
                        <h4 className="text-slate-300 text-xs font-bold uppercase mb-2">Sample Response</h4>
                        <pre className="bg-slate-950 p-4 rounded-lg text-xs text-green-300 overflow-x-auto border border-slate-800">
                            {JSON.stringify(response, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function ApiDocs() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <header className="mb-12 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
                            <Shield className="text-blue-500" /> PrivacyD <span className="text-slate-500 font-light">API Documentation</span>
                        </h1>
                        <p className="text-slate-500">Industry-Grade Bot Detection & Privacy Consent Ledger Reference</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center gap-3">
                        <Key className="text-blue-500" />
                        <div>
                            <div className="text-[10px] uppercase text-blue-500 font-bold">Your API Key</div>
                            <code className="text-xs text-blue-300 font-mono">{API_KEY}</code>
                        </div>
                    </div>
                </header>

                <section className="mb-16">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
                        <Bot className="text-green-500" /> Bot Detection & Forensics
                    </h2>

                    <EndpointCard
                        method="GET"
                        path="/api/admin/bot-audit"
                        title="Forensic Audit"
                        description="Returns the 20 most recent bot detection events with deep behavioral forensics including mouse traces, network probes, and BotD probability scores."
                        response={{
                            success: true,
                            total_records: 1,
                            events: [{
                                id: "uuid-123",
                                bot_kind: "Selenium Runner",
                                forensics: {
                                    bot_score: 0.85,
                                    mouse_point_count: 50,
                                    network_probe_count: 12
                                }
                            }]
                        }}
                    />

                    <EndpointCard
                        method="GET"
                        path="/api/bot-detection/blocked"
                        title="Live Stats"
                        description="Retrieve summary statistics for blocked bots over the last 24h, 7d, and all-time."
                        response={{
                            success: true,
                            data: {
                                last_24_hours: { bots_blocked: 12, total_detections: 45 },
                                all_time: { bots_blocked: 156 }
                            }
                        }}
                    />
                </section>

                <section className="mb-16">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
                        <Database className="text-purple-500" /> Privacy Consent Ledger
                    </h2>

                    <EndpointCard
                        method="GET"
                        path="/api/admin/consents"
                        title="Ledger Export"
                        description="Fetches the historical ledger of all privacy consent records stored on the Supabase backend."
                        params={[{ name: "limit", description: "Number of records to return (default 50)" }]}
                        response={{
                            success: true,
                            records: [{
                                post_id: "t3_restricted",
                                consent_type: "marketing",
                                status: "denied",
                                created_at: "2025-12-25T12:00:00Z"
                            }]
                        }}
                    />

                    <EndpointCard
                        method="GET"
                        path="/api/consent/check"
                        title="Firewall Check"
                        description="Internal endpoint used by the browser extension to verify if specific content elements (posts) are restricted from AI training."
                        params={[{ name: "post_ids", description: "Comma-separated list of Reddit/Mock IDs" }]}
                        response={{
                            success: true,
                            consents: { "post_123": false, "post_abc": true }
                        }}
                    />
                </section>

                <footer className="mt-24 pt-8 border-t border-slate-900 text-center text-slate-600 text-sm">
                    <p>© 2025 PrivacyD Research Project. Built for Advanced Bot Detection & User Autonomy.</p>
                </footer>
            </div>
        </div>
    );
}
