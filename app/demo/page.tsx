'use client'

import { useState, useEffect } from 'react'
import { Shield, Lock, Eye, EyeOff, Globe, Users, TrendingUp, AlertCircle } from 'lucide-react'

interface Post {
  id: string
  content: string
  author: string
  timestamp: Date
  consents: {
    shareWithAdvertisers: boolean
    allowAnalytics: boolean
    publicProfile: boolean
    allowAITraining: boolean
  }
  views: number
  engagement: number
}

export default function DemoPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostConsents, setNewPostConsents] = useState({
    shareWithAdvertisers: false,
    allowAnalytics: true,
    publicProfile: true,
    allowAITraining: false,
  })
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [currentUser] = useState('demo_user@example.com')
  const [stats, setStats] = useState({
    totalPosts: 0,
    protectedPosts: 0,
    dataShared: 0,
  })

  useEffect(() => {
    // Load demo posts
    const demoPosts: Post[] = [
      {
        id: '1',
        content: 'Just tried the new coffee shop downtown! ☕ Highly recommend!',
        author: 'demo_user@example.com',
        timestamp: new Date(Date.now() - 3600000),
        consents: {
          shareWithAdvertisers: true,
          allowAnalytics: true,
          publicProfile: true,
          allowAITraining: false,
        },
        views: 234,
        engagement: 45,
      },
      {
        id: '2',
        content: 'Working on my privacy-focused project. Excited to share soon! 🔒',
        author: 'demo_user@example.com',
        timestamp: new Date(Date.now() - 7200000),
        consents: {
          shareWithAdvertisers: false,
          allowAnalytics: false,
          publicProfile: true,
          allowAITraining: false,
        },
        views: 89,
        engagement: 12,
      },
    ]
    setPosts(demoPosts)
    updateStats(demoPosts)
  }, [])

  const updateStats = (postList: Post[]) => {
    const total = postList.length
    const protectedCount = postList.filter(p => !p.consents.shareWithAdvertisers).length
    const shared = postList.filter(p => p.consents.shareWithAdvertisers).length
    setStats({
      totalPosts: total,
      protectedPosts: protectedCount,
      dataShared: shared,
    })
  }

  const createPost = async () => {
    if (!newPostContent.trim()) return

    const newPost: Post = {
      id: Date.now().toString(),
      content: newPostContent,
      author: currentUser,
      timestamp: new Date(),
      consents: newPostConsents,
      views: 0,
      engagement: 0,
    }

    // Send consent to backend
    try {
      const response = await fetch('/api/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'demo_api_key_12345678901234567890123456789012',
        },
        body: JSON.stringify({
          user_identifier: currentUser,
          consent_type: 'marketing',
          status: newPostConsents.shareWithAdvertisers ? 'granted' : 'denied',
          metadata: {
            post_id: newPost.id,
            post_content: newPost.content,
            consents: newPostConsents,
            source: 'demo_social_media',
          },
        }),
      })

      if (response.ok) {
        console.log('Consent recorded successfully')
      }
    } catch (error) {
      console.error('Error recording consent:', error)
    }

    const updatedPosts = [newPost, ...posts]
    setPosts(updatedPosts)
    updateStats(updatedPosts)
    setNewPostContent('')
    setShowConsentModal(false)
  }

  const updatePostConsent = async (postId: string, consentType: keyof Post['consents']) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const newConsents = {
          ...post.consents,
          [consentType]: !post.consents[consentType],
        }

        // Send updated consent to backend
        fetch('/api/consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'demo_api_key_12345678901234567890123456789012',
          },
          body: JSON.stringify({
            user_identifier: currentUser,
            consent_type: consentType === 'shareWithAdvertisers' ? 'marketing' : 'analytics',
            status: newConsents[consentType] ? 'granted' : 'denied',
            metadata: {
              post_id: postId,
              action: 'update',
              source: 'demo_social_media',
            },
          }),
        })

        return { ...post, consents: newConsents }
      }
      return post
    })

    setPosts(updatedPosts)
    updateStats(updatedPosts)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  ConsentFlow
                </h1>
                <p className="text-sm text-gray-600">Privacy-First Social Media</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{currentUser}</p>
                <p className="text-xs text-gray-500">Demo Account</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                D
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Posts</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalPosts}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Protected Posts</p>
                <p className="text-3xl font-bold text-green-600">{stats.protectedPosts}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Data Shared</p>
                <p className="text-3xl font-bold text-orange-600">{stats.dataShared}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Create Post</h2>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
              />
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setShowConsentModal(!showConsentModal)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Privacy Settings
                </button>
                <button
                  onClick={createPost}
                  disabled={!newPostContent.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              </div>

              {/* Consent Modal */}
              {showConsentModal && (
                <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Privacy Consent for This Post
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'shareWithAdvertisers', label: 'Share with Advertisers', desc: 'Allow advertisers to use this post for targeting' },
                      { key: 'allowAnalytics', label: 'Allow Analytics', desc: 'Track views and engagement metrics' },
                      { key: 'publicProfile', label: 'Public Profile', desc: 'Show on your public profile' },
                      { key: 'allowAITraining', label: 'AI Training', desc: 'Use for AI model training' },
                    ].map(({ key, label, desc }) => (
                      <label key={key} className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{label}</p>
                          <p className="text-xs text-gray-500">{desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={newPostConsents[key as keyof typeof newPostConsents]}
                          onChange={(e) => setNewPostConsents({ ...newPostConsents, [key]: e.target.checked })}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Posts Feed */}
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    D
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{post.author}</p>
                        <p className="text-sm text-gray-500">
                          {post.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {post.consents.shareWithAdvertisers ? (
                          <Eye className="w-4 h-4 text-orange-500" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-green-500" />
                        )}
                        {!post.consents.allowAnalytics && (
                          <Lock className="w-4 h-4 text-purple-500" />
                        )}
                      </div>
                    </div>
                    <p className="text-gray-800 mb-4">{post.content}</p>

                    {/* Post Stats */}
                    <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                      <span>{post.views} views</span>
                      <span>{post.engagement} engagements</span>
                    </div>

                    {/* Consent Controls */}
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Privacy Settings for This Post:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'shareWithAdvertisers', label: 'Advertisers', icon: Users },
                          { key: 'allowAnalytics', label: 'Analytics', icon: TrendingUp },
                          { key: 'publicProfile', label: 'Public', icon: Globe },
                          { key: 'allowAITraining', label: 'AI Training', icon: AlertCircle },
                        ].map(({ key, label, icon: Icon }) => (
                          <button
                            key={key}
                            onClick={() => updatePostConsent(post.id, key as keyof Post['consents'])}
                            className={`flex items-center justify-between p-2 rounded-lg text-sm transition-all ${post.consents[key as keyof Post['consents']]
                              ? 'bg-orange-100 text-orange-700 border border-orange-300'
                              : 'bg-green-100 text-green-700 border border-green-300'
                              }`}
                          >
                            <span className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {label}
                            </span>
                            <span className="text-xs font-semibold">
                              {post.consents[key as keyof Post['consents']] ? 'ON' : 'OFF'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Privacy Score */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-bold text-lg mb-2">Privacy Score</h3>
              <div className="text-5xl font-bold mb-2">
                {Math.round((stats.protectedPosts / (stats.totalPosts || 1)) * 100)}%
              </div>
              <p className="text-purple-100 text-sm">
                {stats.protectedPosts} of {stats.totalPosts} posts are privacy-protected
              </p>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
              <h3 className="font-bold text-gray-900 mb-4">How It Works</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Create a Post</p>
                    <p className="text-xs text-gray-600">Write your content</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Set Privacy</p>
                    <p className="text-xs text-gray-600">Choose consent options</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Update Anytime</p>
                    <p className="text-xs text-gray-600">Change consent per post</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
