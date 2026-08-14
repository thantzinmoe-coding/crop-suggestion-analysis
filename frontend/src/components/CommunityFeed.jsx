import { useEffect, useState } from 'react'
import { Heart, MessageCircle, Send, Share2, Sprout, ThumbsUp } from 'lucide-react'
import { API_BASE_URL, authHeaders } from '../api.js'
import { useAuth } from '../contexts/AuthContext.jsx'

const emptyForm = {
  content: '',
  crop: '',
  region: '',
}

export default function CommunityFeed() {
  const { currentUser } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [commentDrafts, setCommentDrafts] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filters, setFilters] = useState({ crop: '', region: '' })
  const [profile, setProfile] = useState({ displayName: '', region: '', farmSizeAcres: '', crops: [], bio: '' })
  const [savedAnalyses, setSavedAnalyses] = useState([])
  const [notifications, setNotifications] = useState([])
  const [profileSaved, setProfileSaved] = useState(false)

  const loadAccountData = async () => {
    if (!currentUser?.token) return
    const headers = authHeaders(currentUser.token)
    const [profileResponse, savedResponse, notificationResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/social/profile`, { headers }),
      fetch(`${API_BASE_URL}/social/saved-analyses`, { headers }),
      fetch(`${API_BASE_URL}/social/notifications`, { headers }),
    ])
    if (profileResponse.ok) setProfile(await profileResponse.json())
    if (savedResponse.ok) setSavedAnalyses(await savedResponse.json())
    if (notificationResponse.ok) setNotifications(await notificationResponse.json())
  }

  const loadPosts = async () => {
    try {
      const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value.trim()))
      const response = await fetch(`${API_BASE_URL}/community/posts?${query}`)
      const data = await response.json()
      if (response.ok) setPosts(data)
    } catch (error) {
      console.error('Failed to load community posts', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [filters])

  useEffect(() => {
    loadAccountData().catch((error) => console.error('Failed to load account data', error))
  }, [currentUser?.token])

  const saveProfile = async (event) => {
    event.preventDefault()
    const response = await fetch(`${API_BASE_URL}/social/profile`, {
      method: 'PUT', headers: authHeaders(currentUser.token, true), body: JSON.stringify(profile),
    })
    if (response.ok) {
      setProfile(await response.json())
      setProfileSaved(true)
      window.setTimeout(() => setProfileSaved(false), 1800)
    }
  }

  const handleCreatePost = async (event) => {
    event.preventDefault()
    if (!currentUser || !form.content.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/community/posts`, {
        method: 'POST',
        headers: authHeaders(currentUser.token, true),
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.email?.split('@')[0] || 'Farmer',
          content: form.content,
          postType: 'community',
          crop: form.crop || null,
          region: form.region || null,
        }),
      })

      if (!response.ok) throw new Error('Unable to create post')
      setForm(emptyForm)
      await loadPosts()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReact = async (postId, reaction) => {
    try {
      const response = await fetch(`${API_BASE_URL}/community/posts/${postId}/react?reaction=${reaction}`, {
        method: 'POST',
        headers: authHeaders(currentUser?.token),
      })
      if (response.ok) await loadPosts()
    } catch (error) {
      console.error('Reaction failed', error)
    }
  }

  const handleComment = async (postId) => {
    const text = (commentDrafts[postId] || '').trim()
    if (!text || !currentUser) return

    try {
      const response = await fetch(`${API_BASE_URL}/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: authHeaders(currentUser.token, true),
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.email?.split('@')[0] || 'Farmer',
          content: text,
        }),
      })

      if (response.ok) {
        setCommentDrafts((drafts) => ({ ...drafts, [postId]: '' }))
        await loadPosts()
      }
    } catch (error) {
      console.error('Comment failed', error)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">Community Feed</h1>
        <p className="mt-1 text-sm text-slate-600">Share field updates, crop advice, and saved analysis with other farmers.</p>

        <form onSubmit={saveProfile} className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-4">
          <input value={profile.displayName || ''} onChange={(event) => setProfile({ ...profile, displayName: event.target.value })} placeholder="Farmer name" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          <input value={profile.region || ''} onChange={(event) => setProfile({ ...profile, region: event.target.value })} placeholder="Farm region" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          <input value={profile.farmSizeAcres || ''} onChange={(event) => setProfile({ ...profile, farmSizeAcres: event.target.value ? Number(event.target.value) : null })} type="number" min="0" placeholder="Farm size (acres)" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          <button type="submit" className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-medium text-white">{profileSaved ? 'Saved' : 'Save profile'}</button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="rounded-full bg-emerald-50 px-3 py-1.5">Saved analyses: {savedAnalyses.length}</span>
          <span className="rounded-full bg-amber-50 px-3 py-1.5">Notifications: {notifications.filter((item) => !item.read).length}</span>
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl bg-emerald-50 p-3 md:grid-cols-2">
          <input value={filters.crop} onChange={(event) => setFilters({ ...filters, crop: event.target.value })} placeholder="Filter by crop" className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm outline-none" />
          <input value={filters.region} onChange={(event) => setFilters({ ...filters, region: event.target.value })} placeholder="Filter by region" className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm outline-none" />
        </div>

        <form onSubmit={handleCreatePost} className="mt-5 space-y-3">
          <textarea
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
            rows={4}
            placeholder="Share what is happening in your field..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-emerald-500"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={form.crop}
              onChange={(event) => setForm({ ...form, crop: event.target.value })}
              placeholder="Crop (optional)"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-emerald-500"
            />
            <input
              value={form.region}
              onChange={(event) => setForm({ ...form, region: event.target.value })}
              placeholder="Region (optional)"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={!currentUser || isSubmitting || !form.content.trim()}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {isSubmitting ? 'Posting...' : 'Post update'}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading community posts...</div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <article key={post.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-800">{post.userName}</h2>
                  <p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString()}</p>
                </div>
                {post.crop && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <Sprout size={12} /> {post.crop}
                  </span>
                )}
              </div>

              <p className="mt-4 whitespace-pre-wrap text-slate-700">{post.content}</p>

              {post.region && (
                <p className="mt-3 text-xs text-slate-500">Region: {post.region}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                <button type="button" onClick={() => handleReact(post.id, 'like')} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1.5 hover:bg-slate-200">
                  <ThumbsUp size={14} /> {post.reactions?.like ?? 0}
                </button>
                <button type="button" onClick={() => handleReact(post.id, 'love')} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1.5 hover:bg-slate-200">
                  <Heart size={14} /> {post.reactions?.love ?? 0}
                </button>
                <button type="button" onClick={() => handleReact(post.id, 'helpful')} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1.5 hover:bg-slate-200">
                  <MessageCircle size={14} /> {post.reactions?.helpful ?? 0}
                </button>
                <button type="button" onClick={() => handleReact(post.id, 'share')} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1.5 hover:bg-slate-200">
                  <Share2 size={14} /> {post.reactions?.share ?? 0}
                </button>
              </div>

              <div className="mt-5 border-t border-slate-200 pt-4">
                <div className="space-y-3">
                  {(post.comments || []).map((comment, index) => (
                    <div key={`${post.id}-comment-${index}`} className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-sm font-medium text-slate-700">{comment.userName}</div>
                      <div className="text-sm text-slate-600">{comment.content}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <input
                    value={commentDrafts[post.id] || ''}
                    onChange={(event) => setCommentDrafts({ ...commentDrafts, [post.id]: event.target.value })}
                    placeholder="Write a comment..."
                    className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleComment(post.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
                  >
                    <Send size={14} /> Comment
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
