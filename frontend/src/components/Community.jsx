import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { AlertTriangle, ImagePlus, LoaderCircle, MapPin, MessageCircle, Plus, RefreshCw, Send, Sprout, Trophy, Trash2, Users, X } from 'lucide-react'
import { API_BASE_URL } from '../api.js'
import { useAuth } from '../contexts/AuthContext.jsx'

const postTypes = {
  field_condition: { label: 'Field condition', description: 'Share what is happening in your field', icon: Sprout, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  production_loss: { label: 'Need suggestions', description: 'Ask farmers for help with low production', icon: AlertTriangle, badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  success_story: { label: 'Success story', description: 'Share a harvest result that worked well', icon: Trophy, badge: 'bg-lime-50 text-lime-700 border-lime-200' },
}

const emptyPost = { postType: 'field_condition', title: '', body: '', crop: '', region: '', productionSummary: '' }

function displayName(email = '') {
  const name = email.split('@')[0].replace(/[._-]+/g, ' ').trim()
  return name ? name.replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Farmer'
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function Community() {
  const { currentUser } = useAuth()
  const authorName = useMemo(() => displayName(currentUser?.email), [currentUser])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [composerOpen, setComposerOpen] = useState(false)
  const [postForm, setPostForm] = useState(emptyPost)
  const [posting, setPosting] = useState(false)
  const [mediaFiles, setMediaFiles] = useState([])
  const [commentDrafts, setCommentDrafts] = useState({})
  const [commentingOn, setCommentingOn] = useState(null)

  const loadPosts = async () => {
    setLoading(true)
    setError('')
    try {
      const params = filter === 'all' ? {} : { post_type: filter }
      const response = await axios.get(`${API_BASE_URL}/community/posts`, { params })
      setPosts(response.data)
    } catch (requestError) {
      console.error('Community posts error:', requestError)
      setError('Unable to load the farmer community. Check the API and MongoDB connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [filter])

  const updatePostForm = (event) => {
    const { name, value } = event.target
    setPostForm((current) => ({ ...current, [name]: value }))
  }

  const selectMedia = (event) => {
    const availableSlots = 6 - mediaFiles.length
    const selected = Array.from(event.target.files || []).slice(0, availableSlots)
    const valid = []
    for (const file of selected) {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024
      if ((!isImage && !isVideo) || file.size > maxSize) {
        setError(`${file.name} is not supported or exceeds the ${isImage ? '10 MB' : '50 MB'} limit.`)
        continue
      }
      valid.push({ file, preview: URL.createObjectURL(file), mediaType: isImage ? 'image' : 'video' })
    }
    setMediaFiles((current) => [...current, ...valid])
    event.target.value = ''
  }

  const removeMedia = (index) => {
    setMediaFiles((current) => {
      URL.revokeObjectURL(current[index].preview)
      return current.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const createPost = async (event) => {
    event.preventDefault()
    setPosting(true)
    setError('')
    try {
      const media = await Promise.all(mediaFiles.map(async ({ file }) => {
        const upload = new FormData()
        upload.append('file', file)
        const response = await axios.post(`${API_BASE_URL}/community/media`, upload)
        return response.data
      }))
      const response = await axios.post(`${API_BASE_URL}/community/posts`, {
        ...postForm,
        authorName,
        productionSummary: postForm.productionSummary || null,
        media,
      })
      setPosts((current) => [response.data, ...current])
      setPostForm(emptyPost)
      mediaFiles.forEach(({ preview }) => URL.revokeObjectURL(preview))
      setMediaFiles([])
      setComposerOpen(false)
      setFilter('all')
    } catch (requestError) {
      console.error('Create community post error:', requestError)
      setError(requestError.response?.data?.detail || 'Your post could not be shared.')
    } finally {
      setPosting(false)
    }
  }

  const addComment = async (event, postId) => {
    event.preventDefault()
    const body = commentDrafts[postId]?.trim()
    if (!body) return
    setCommentingOn(postId)
    setError('')
    try {
      const response = await axios.post(`${API_BASE_URL}/community/posts/${postId}/comments`, { authorName, body })
      setPosts((current) => current.map((post) => (post.id === postId ? response.data : post)))
      setCommentDrafts((current) => ({ ...current, [postId]: '' }))
    } catch (requestError) {
      console.error('Community comment error:', requestError)
      setError(requestError.response?.data?.detail || 'Your comment could not be added.')
    } finally {
      setCommentingOn(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="overflow-hidden rounded-[2rem] bg-myanglow-navy px-6 py-7 text-white shadow-xl shadow-myanglow-navy/10 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-myanglow-bright-lime"><Users size={15} /> Farmer to farmer</div>
            <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Field Community</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-myanglow-sage sm:text-base">Share field problems, learn from other farmers, and celebrate successful harvests together.</p>
          </div>
          <button type="button" onClick={() => setComposerOpen((open) => !open)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-myanglow-bright-lime px-5 py-3 text-sm font-semibold text-myanglow-navy transition hover:-translate-y-0.5 hover:bg-white">
            {composerOpen ? <X size={18} /> : <Plus size={18} />}{composerOpen ? 'Close form' : 'Share an update'}
          </button>
        </div>
      </header>

      {composerOpen ? (
        <form onSubmit={createPost} className="mt-5 rounded-[2rem] border border-myanglow-sage bg-white p-5 shadow-lg shadow-myanglow-navy/5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-myanglow-medium">New community post</p><h2 className="mt-2 text-2xl font-semibold text-myanglow-navy">What would you like to share?</h2></div>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-myanglow-sage/50 text-myanglow-forest"><Sprout size={21} /></div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {Object.entries(postTypes).map(([value, type]) => {
              const Icon = type.icon
              const selected = postForm.postType === value
              return <button key={value} type="button" onClick={() => setPostForm((current) => ({ ...current, postType: value }))} className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-myanglow-forest bg-myanglow-sage/35 ring-2 ring-myanglow-forest/10' : 'border-slate-200 hover:border-myanglow-soft'}`}><Icon size={20} className={selected ? 'text-myanglow-forest' : 'text-slate-400'} /><p className="mt-3 text-sm font-semibold text-myanglow-navy">{type.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{type.description}</p></button>
            })}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-myanglow-navy">Crop<input required name="crop" value={postForm.crop} onChange={updatePostForm} placeholder="e.g. Rice" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-myanglow-medium focus:ring-4 focus:ring-myanglow-sage/30" /></label>
            <label className="text-sm font-semibold text-myanglow-navy">Region or township<input required name="region" value={postForm.region} onChange={updatePostForm} placeholder="e.g. Taunggyi, Shan State" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-myanglow-medium focus:ring-4 focus:ring-myanglow-sage/30" /></label>
          </div>
          <label className="mt-4 block text-sm font-semibold text-myanglow-navy">Post title<input required minLength={3} maxLength={160} name="title" value={postForm.title} onChange={updatePostForm} placeholder="Summarize your field update" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-myanglow-medium focus:ring-4 focus:ring-myanglow-sage/30" /></label>
          <label className="mt-4 block text-sm font-semibold text-myanglow-navy">Field details<textarea required minLength={10} maxLength={5000} rows={5} name="body" value={postForm.body} onChange={updatePostForm} placeholder="Describe the crop condition, what you tried, and the advice you need..." className="mt-2 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 font-normal leading-6 outline-none transition focus:border-myanglow-medium focus:ring-4 focus:ring-myanglow-sage/30" /></label>
          <label className="mt-4 block text-sm font-semibold text-myanglow-navy">Production result <span className="font-normal text-slate-400">(optional)</span><input maxLength={300} name="productionSummary" value={postForm.productionSummary} onChange={updatePostForm} placeholder="e.g. 75 baskets per acre, or 30% lower than last season" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-myanglow-medium focus:ring-4 focus:ring-myanglow-sage/30" /></label>
          <div className="mt-5">
            <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-myanglow-navy">Photos and videos <span className="font-normal text-slate-400">(up to 6)</span></p><p className="text-xs text-slate-400">Images 10 MB · Videos 50 MB</p></div>
            {mediaFiles.length ? <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{mediaFiles.map((media, index) => <div key={media.preview} className="group relative aspect-video overflow-hidden rounded-2xl bg-slate-100">{media.mediaType === 'image' ? <img src={media.preview} alt={media.file.name} className="h-full w-full object-cover" /> : <video src={media.preview} className="h-full w-full object-cover" muted />}<button type="button" onClick={() => removeMedia(index)} aria-label={`Remove ${media.file.name}`} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-slate-900/75 text-white opacity-90 transition hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={14} /></button><span className="absolute bottom-2 left-2 max-w-[80%] truncate rounded-full bg-slate-900/70 px-2 py-1 text-[0.65rem] text-white">{media.file.name}</span></div>)}</div> : null}
            {mediaFiles.length < 6 ? <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-myanglow-soft bg-myanglow-sage/15 px-4 py-4 text-sm font-semibold text-myanglow-forest transition hover:bg-myanglow-sage/30"><ImagePlus size={19} />Add photos or videos<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" onChange={selectMedia} className="sr-only" /></label> : null}
          </div>
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-5"><p className="text-sm text-slate-500">Posting as <span className="font-semibold text-myanglow-forest">{authorName}</span></p><button disabled={posting} type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-myanglow-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-myanglow-medium disabled:cursor-not-allowed disabled:opacity-60">{posting ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}Publish post</button></div>
        </form>
      ) : null}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">{[['all', 'All posts'], ...Object.entries(postTypes).map(([key, value]) => [key, value.label])].map(([key, label]) => <button key={key} type="button" onClick={() => setFilter(key)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === key ? 'bg-myanglow-forest text-white' : 'border border-myanglow-sage bg-white text-slate-600 hover:bg-myanglow-sage/35'}`}>{label}</button>)}</div>
        <button type="button" onClick={loadPosts} className="inline-flex items-center gap-2 self-start rounded-xl px-3 py-2 text-sm font-semibold text-myanglow-forest hover:bg-white"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>
      </div>

      {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}
      {loading ? <div className="grid min-h-72 place-items-center"><div className="text-center text-slate-500"><LoaderCircle className="mx-auto animate-spin text-myanglow-forest" size={30} /><p className="mt-3 text-sm">Loading community posts...</p></div></div> : posts.length === 0 ? (
        <div className="mt-6 rounded-[2rem] border border-dashed border-myanglow-soft bg-white/70 px-6 py-16 text-center"><Users size={34} className="mx-auto text-myanglow-medium" /><h2 className="mt-4 text-xl font-semibold text-myanglow-navy">No posts here yet</h2><p className="mt-2 text-sm text-slate-500">Be the first farmer to share an update with the community.</p></div>
      ) : (
        <div className="mt-6 space-y-5">{posts.map((post) => {
          const type = postTypes[post.postType] || postTypes.field_condition
          const TypeIcon = type.icon
          return <article key={post.id} className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-lg shadow-myanglow-navy/[0.04]">
            <div className="p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-full bg-myanglow-forest font-semibold text-white">{post.authorName.charAt(0).toUpperCase()}</div><div><p className="font-semibold text-myanglow-navy">{post.authorName}</p><p className="mt-0.5 text-xs text-slate-400">{formatDate(post.createdAt)}</p></div></div><span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${type.badge}`}><TypeIcon size={14} />{type.label}</span></div>
              <h2 className="mt-5 text-xl font-semibold text-myanglow-navy sm:text-2xl">{post.title}</h2>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold"><span className="inline-flex items-center gap-1.5 rounded-full bg-myanglow-sage/35 px-3 py-1.5 text-myanglow-forest"><Sprout size={13} />{post.crop}</span><span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-slate-600"><MapPin size={13} />{post.region}</span></div>
              <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600 sm:text-base">{post.body}</p>
              {post.media?.length ? <div className={`mt-5 grid gap-2 overflow-hidden rounded-2xl ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>{post.media.map((media) => media.mediaType === 'image' ? <a key={media.url} href={media.url} target="_blank" rel="noreferrer" className="block overflow-hidden bg-slate-100"><img src={media.url} alt={media.originalName} loading="lazy" className="max-h-[32rem] w-full object-cover transition duration-300 hover:scale-[1.02]" /></a> : <video key={media.url} src={media.url} controls preload="metadata" className="max-h-[32rem] w-full bg-slate-950" aria-label={media.originalName} />)}</div> : null}
              {post.productionSummary ? <div className="mt-5 rounded-2xl border border-myanglow-sage bg-myanglow-sage/20 px-4 py-3 text-sm"><span className="font-semibold text-myanglow-navy">Production result:</span> <span className="text-slate-600">{post.productionSummary}</span></div> : null}
            </div>
            <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-2 text-sm font-semibold text-myanglow-navy"><MessageCircle size={17} className="text-myanglow-medium" />{post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}</div>
              {post.comments.length ? <div className="mt-4 space-y-3">{post.comments.map((comment) => <div key={comment.id} className="rounded-2xl bg-white px-4 py-3 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-myanglow-navy">{comment.authorName}</p><p className="text-[0.7rem] text-slate-400">{formatDate(comment.createdAt)}</p></div><p className="mt-1.5 text-sm leading-6 text-slate-600">{comment.body}</p></div>)}</div> : null}
              <form onSubmit={(event) => addComment(event, post.id)} className="mt-4 flex items-end gap-2"><label className="flex-1"><span className="sr-only">Write a comment</span><textarea rows={1} maxLength={1500} value={commentDrafts[post.id] || ''} onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))} placeholder="Share a suggestion or encouragement..." className="block w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-myanglow-medium focus:ring-4 focus:ring-myanglow-sage/30" /></label><button disabled={commentingOn === post.id || !commentDrafts[post.id]?.trim()} type="submit" aria-label="Post comment" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-myanglow-forest text-white transition hover:bg-myanglow-medium disabled:cursor-not-allowed disabled:opacity-40">{commentingOn === post.id ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />}</button></form>
            </div>
          </article>
        })}</div>
      )}
    </div>
  )
}

export default Community
