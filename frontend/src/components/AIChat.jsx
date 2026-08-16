import { useCallback, useEffect, useRef, useState } from 'react'
import { Bot, Clock3, History, MessageCircle, Plus, Send, Sparkles, Trash2, User } from 'lucide-react'
import { accountRequest } from '../accountApi.js'
import { API_BASE_URL } from '../api'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLanguage } from '../contexts/LanguageContext'

const CHAT_HISTORY_PREFIX = 'greenvista_chat_history'
const MAX_LOCAL_CONVERSATIONS = 50

function historyStorageKey(currentUser) {
  return `${CHAT_HISTORY_PREFIX}:${currentUser?.id || currentUser?.email || 'guest'}`
}

function readLocalHistory(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function writeLocalHistory(key, conversations) {
  try {
    localStorage.setItem(key, JSON.stringify(conversations.slice(0, MAX_LOCAL_CONVERSATIONS)))
  } catch (error) {
    console.error('Local chat history save error:', error)
  }
}

function mergeConversations(primary, fallback) {
  const merged = new Map()
  for (const conversation of [...primary, ...fallback]) {
    if (conversation?.id && !merged.has(conversation.id)) merged.set(conversation.id, conversation)
  }
  return [...merged.values()]
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    .slice(0, MAX_LOCAL_CONVERSATIONS)
}

function displayMessage(content) {
  return content
    .replace(/\*\*/g, '')
    .replace(/(^|\n)#{1,6}\s*/g, '$1')
    .replace(/\s+\*\s+/g, '\n• ')
}

export default function AIChat() {
  const { t, language } = useLanguage()
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState([{ role: 'assistant', content: t('chat.welcome') }])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const messagesEndRef = useRef(null)
  const streamedTextRef = useRef('')
  const activeConversationIdRef = useRef(null)
  const storageKey = historyStorageKey(currentUser)

  const storeConversations = useCallback((update) => {
    setConversations((items) => {
      const next = typeof update === 'function' ? update(items) : update
      writeLocalHistory(storageKey, next)
      return next
    })
  }, [storageKey])

  const startNewChat = useCallback(() => {
    activeConversationIdRef.current = null
    setActiveConversationId(null)
    setMessages([{ role: 'assistant', content: t('chat.welcome') }])
    setInput('')
    setHistoryError('')
  }, [t])

  useEffect(() => {
    if (!activeConversationId && messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([{ role: 'assistant', content: t('chat.welcome') }])
    }
  }, [language])

  useEffect(() => {
    const localConversations = readLocalHistory(storageKey)
    setConversations(localConversations)
    activeConversationIdRef.current = null
    setActiveConversationId(null)
    if (!currentUser) return

    setHistoryLoading(true)
    setHistoryError('')
    accountRequest('/account/chat-conversations')
      .then((items) => {
        const merged = mergeConversations(items || [], localConversations)
        setConversations(merged)
        writeLocalHistory(storageKey, merged)
      })
      .catch(() => {
        setConversations(localConversations)
        setHistoryError(t('chat.historyError'))
      })
      .finally(() => setHistoryLoading(false))
  }, [currentUser, storageKey, t])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const persistConversation = async (completedMessages) => {
    const storedMessages = completedMessages.filter((message) => message.content.trim())
    const firstQuestion = storedMessages.find((message) => message.role === 'user')?.content || t('chat.newChat')
    const title = firstQuestion.length > 54 ? `${firstQuestion.slice(0, 54).trim()}…` : firstQuestion
    const payload = { title, language, messages: storedMessages }
    const now = new Date().toISOString()
    const currentId = activeConversationIdRef.current
    const localId = currentId || `local-${crypto.randomUUID()}`
    const localConversation = { ...payload, id: localId, createdAt: now, updatedAt: now }

    activeConversationIdRef.current = localId
    setActiveConversationId(localId)
    storeConversations((items) => [
      localConversation,
      ...items.filter((item) => item.id !== localId),
    ].slice(0, MAX_LOCAL_CONVERSATIONS))

    if (!currentUser) return

    try {
      if (currentId && !currentId.startsWith('local-')) {
        const updated = await accountRequest(`/account/chat-conversations/${currentId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        storeConversations((items) => [updated, ...items.filter((item) => item.id !== updated.id)])
      } else {
        const created = await accountRequest('/account/chat-conversations', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        activeConversationIdRef.current = created.id
        setActiveConversationId(created.id)
        storeConversations((items) => [
          created,
          ...items.filter((item) => item.id !== localId && item.id !== created.id),
        ])
      }
    } catch (error) {
      console.error('Chat history save error:', error)
      setHistoryError(t('chat.saveError'))
    }
  }

  const sendMessage = async (content) => {
    const cleanContent = content.trim()
    if (!cleanContent || isTyping) return

    const userMessage = { role: 'user', content: cleanContent }
    const currentMessages = [...messages, userMessage]
    setMessages(currentMessages)
    setInput('')
    setIsTyping(true)
    setHistoryError('')
    streamedTextRef.current = ''

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages, language }),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      if (!response.body) throw new Error('ReadableStream not supported.')

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      setMessages([...currentMessages, { role: 'assistant', content: '' }])
      let buffer = ''
      let streamDone = false

      while (!streamDone) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.substring(6))
            if (data.content) {
              streamedTextRef.current += data.content
              setMessages([...currentMessages, { role: 'assistant', content: streamedTextRef.current }])
            }
            if (data.done) streamDone = true
          } catch {
            // Ignore a malformed streaming event and continue reading.
          }
        }
      }

      if (!streamedTextRef.current.trim()) throw new Error('The LLM returned an empty response.')
      await persistConversation([...currentMessages, { role: 'assistant', content: streamedTextRef.current }])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages([...currentMessages, { role: 'assistant', content: t('chat.error') }])
    } finally {
      setIsTyping(false)
    }
  }

  const openConversation = (conversation) => {
    if (isTyping) return
    activeConversationIdRef.current = conversation.id
    setActiveConversationId(conversation.id)
    setMessages(conversation.messages || [])
    setHistoryError('')
  }

  const deleteConversation = async (conversationId) => {
    if (!window.confirm(t('chat.deleteConfirm'))) return
    storeConversations((items) => items.filter((item) => item.id !== conversationId))
    if (activeConversationIdRef.current === conversationId) startNewChat()
    if (!currentUser || conversationId.startsWith('local-')) return

    try {
      await accountRequest(`/account/chat-conversations/${conversationId}`, { method: 'DELETE' })
    } catch (error) {
      console.error('Chat history delete error:', error)
      setHistoryError(t('chat.deleteError'))
    }
  }

  const starters = language === 'my' ? [
    'မြန်မာနိုင်ငံ အပူပိုင်းဇုန်မှာ ဘယ်သီးနှံတွေ အဖြစ်ထွန်းဆုံးလဲ?',
    'မိုးရေချိန်က စပါးအထွက်နှုန်းအပေါ် ဘယ်လိုသက်ရောက်မှုရှိလဲ?',
    'NDVI ဆိုတာဘာလဲ၊ အပင်ကျန်းမာရေးကို ဘယ်လိုတိုင်းတာလဲ?',
    'အက်စစ်ဓာတ်များတဲ့ မြေနဲ့ မိုးများတဲ့နေရာအတွက် သီးနှံအကြံပြုပေးပါ',
  ] : [
    "What crops grow best in Myanmar's dry zone?",
    'How does rainfall affect rice yields?',
    'What is NDVI and how does it measure vegetation health?',
    'Recommend crops for acidic soil with high rainfall',
  ]

  return (
    <div className="chat-workspace">
      <aside className="chat-history-panel" aria-label={t('chat.history')}>
        <div className="chat-history-heading">
          <div><History size={18} /><strong>{t('chat.history')}</strong></div>
          <button type="button" onClick={startNewChat} disabled={isTyping}><Plus size={17} /> {t('chat.newChat')}</button>
        </div>

        {!currentUser && <p className="chat-history-empty">{t('chat.signInHistory')}</p>}
        {historyLoading ? (
          <p className="chat-history-empty">{t('common.loading')}</p>
        ) : conversations.length ? (
          <div className="chat-history-list">
            {conversations.map((conversation) => (
              <div className={conversation.id === activeConversationId ? 'active' : ''} key={conversation.id}>
                <button type="button" className="chat-history-open" onClick={() => openConversation(conversation)} disabled={isTyping}>
                  <strong>{conversation.title}</strong>
                  <span><Clock3 size={12} /> {conversation.updatedAt ? new Date(conversation.updatedAt).toLocaleDateString(language === 'my' ? 'my-MM' : 'en-US') : ''}</span>
                </button>
                <button type="button" className="chat-history-delete" aria-label={t('chat.deleteChat')} onClick={() => deleteConversation(conversation.id)}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        ) : (
          <p className="chat-history-empty">{t('chat.noHistory')}</p>
        )}
        {historyError && <p className="chat-history-error" role="alert">{historyError}</p>}
      </aside>

      <div className="chat-container">
        <div className="chat-header">
          <h2 className="m-0 text-xl font-semibold"><MessageCircle size={28} /> {activeConversationId ? conversations.find((item) => item.id === activeConversationId)?.title || t('chat.title') : t('chat.title')}</h2>
          <div className="llm-badge"><Sparkles size={14} /> {t('chat.powered')}</div>
        </div>

        <div className="glass-panel chat-messages">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>
              <div className={`message-avatar ${message.role === 'user' ? 'user-avatar' : 'bot-avatar'}`}>
                {message.role === 'user' ? <User size={20} color="white" /> : <Bot size={20} color="white" />}
              </div>
              <div className={`message-bubble ${message.role === 'user' ? 'user-bubble' : 'bot-bubble'} ${isTyping && index === messages.length - 1 && message.role === 'assistant' ? 'streaming-cursor' : ''}`}>
                {displayMessage(message.content)}
              </div>
            </div>
          ))}

          {isTyping && messages[messages.length - 1]?.role === 'user' && (
            <div className="chat-message assistant">
              <div className="message-avatar bot-avatar"><Bot size={20} color="white" /></div>
              <div className="message-bubble bot-bubble typing-indicator"><span /><span /><span /></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="starter-chips">
            {starters.map((question) => <button key={question} className="starter-chip" type="button" onClick={() => sendMessage(question)}>{question}</button>)}
          </div>
        )}

        <form className="chat-input-container" onSubmit={(event) => { event.preventDefault(); sendMessage(input) }}>
          <input type="text" value={input} onChange={(event) => setInput(event.target.value)} placeholder={t('chat.placeholder')} disabled={isTyping} />
          <button type="submit" className="btn btn-primary" aria-label={t('chat.send')} disabled={!input.trim() || isTyping}><Send size={20} /></button>
        </form>
      </div>
    </div>
  )
}
