'use client'

import { useState, useEffect } from 'react'
import { Shield, Database, Activity, Users, CheckCircle, XCircle, Clock, Globe } from 'lucide-react'

interface ConsentRecord {
    id: string
    user_identifier: string
    consent_type: string
    status: string
    metadata: any
    created_at: string
    updated_at: string
    ip_address?: string
}

interface AuditLog {
    id: string
    action: string
    resource_type: string
    user_identifier: string
    created_at: string
    changes: any
}

export default function AdminPage() {
    const [consents, setConsents] = useState<ConsentRecord[]>([])
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
    const [stats, setStats] = useState({
        totalConsents: 0,
        granted: 0,
        headers: {
            'x-api-key': 'demo_api_key_12345678901234567890123456789012',
        },
    })

    if (response.ok) {
        const data = await response.json()
        setConsents(data.consents || [])
        setAuditLogs(data.auditLogs || [])

        // Calculate stats
        const uniqueUsers = new Set(data.consents?.map((c: ConsentRecord) => c.user_identifier) || [])
        const granted = data.consents?.filter((c: ConsentRecord) => c.status === 'granted').length || 0
        const denied = data.consents?.filter((c: ConsentRecord) => c.status === 'denied').length || 0

        setStats({
            totalConsents: data.consents?.length || 0,
            granted,
            denied,
            users: uniqueUsers.size,
        })
    }
    setLoading(false)
} catch (error) {
    console.error('Error fetching data:', error)
    setLoading(false)
}
    }

if (loading) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading dashboard...</p>
            </div>
        </div>
    )
}

return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-purple-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                            <Shield className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Admin Dashboard
                            </h1>
                            <p className="text-sm text-gray-600">Privacy Consent Management System</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-600">Live Updates</span>
                    </div>
                </div>
            </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
                    <div className="flex items-center justify-between mb-2">
                        <Database className="w-8 h-8 text-purple-600" />
                        <span className="text-3xl font-bold text-gray-900">{stats.totalConsents}</span>
                    </div>
                    <p className="text-sm text-gray-600">Total Consents</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <span className="text-3xl font-bold text-green-600">{stats.granted}</span>
                    </div>
                    <p className="text-sm text-gray-600">Granted</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-red-100">
                    <div className="flex items-center justify-between mb-2">
                        <XCircle className="w-8 h-8 text-red-600" />
                        <span className="text-3xl font-bold text-red-600">{stats.denied}</span>
                    </div>
                    <p className="text-sm text-gray-600">Denied</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="w-8 h-8 text-blue-600" />
                        <span className="text-3xl font-bold text-blue-600">{stats.users}</span>
                    </div>
                    <p className="text-sm text-gray-600">Unique Users</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Consent Records */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <Database className="w-6 h-6 text-purple-600" />
                        <h2 className="text-xl font-bold text-gray-900">Consent Records</h2>
                    </div>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {consents.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No consent records yet</p>
                                <p className="text-sm">Toggle consents on Reddit to see them here!</p>
                            </div>
                        ) : (
                            consents.map((consent) => (
                                <div key={consent.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900 text-sm">{consent.user_identifier}</p>
                                            <p className="text-xs text-gray-500">{new Date(consent.created_at).toLocaleString()}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${consent.status === 'granted'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {consent.status === 'granted' ? '✅ Granted' : '🚫 Denied'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-gray-500">Type:</span>
                                            <span className="ml-2 font-medium text-gray-900">{consent.consent_type}</span>
                                        </div>
                                        {consent.metadata?.platform && (
                                            <div>
                                                <span className="text-gray-500">Platform:</span>
                                                <span className="ml-2 font-medium text-gray-900">{consent.metadata.platform}</span>
                                            </div>
                                        )}
                                        {consent.metadata?.post_id && (
                                            <div className="col-span-2">
                                                <span className="text-gray-500">Post ID:</span>
                                                <span className="ml-2 font-mono text-xs text-gray-700">{consent.metadata.post_id}</span>
                                            </div>
                                        )}
                                        {consent.ip_address && (
                                            <div className="col-span-2">
                                                <span className="text-gray-500">IP:</span>
                                                <span className="ml-2 font-mono text-xs text-gray-700">{consent.ip_address}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Audit Logs */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <Activity className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-900">Audit Trail</h2>
                    </div>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {auditLogs.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No audit logs yet</p>
                                <p className="text-sm">All actions will be logged here</p>
                            </div>
                        ) : (
                            auditLogs.map((log) => (
                                <div key={log.id} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-gray-900 text-sm">{log.action}</span>
                                                <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                                            </div>
                                            <p className="text-xs text-gray-600 mb-2">
                                                {log.resource_type} • {log.user_identifier}
                                            </p>
                                            {log.changes && (
                                                <pre className="text-xs bg-white p-2 rounded border border-blue-100 overflow-x-auto">
                                                    {JSON.stringify(log.changes, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Instructions for Professor */}
            <div className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <Globe className="w-8 h-8" />
                    Demo Instructions
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold mb-2">📊 What This Shows:</h4>
                        <ul className="space-y-1 text-sm text-purple-100">
                            <li>• Real-time consent records from Reddit</li>
                            <li>• Complete audit trail (GDPR compliant)</li>
                            <li>• User privacy preferences per post</li>
                            <li>• Backend database integration</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">🎯 How to Demo:</h4>
                        <ul className="space-y-1 text-sm text-purple-100">
                            <li>1. Show this dashboard (live data)</li>
                            <li>2. Go to Reddit in another tab</li>
                            <li>3. Toggle consent on any post</li>
                            <li>4. Come back here - see it appear!</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
)
}
