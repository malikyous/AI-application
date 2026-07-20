import { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import MessageList from './components/MessageList'
import MessageInput from './components/MessageInput'
import Templates from './components/Templates'
import Search from './components/Search'
import { useSocket } from './hooks/useSocket'
import {
  fetchSessions,
  createSession,
  fetchSession,
  deleteSession,
  uploadFile,
  checkHealth,
  exportSession,
} from './api'

export default function App() {
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [aiConfigured, setAiConfigured] = useState(false)
  const [theme, setTheme] = useState('dark')
  const messagesEndRef = useRef(null)

  const { connected, aiTyping, sendMessage, onNewMessage } = useSocket(activeSessionId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, aiTyping])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    async function init() {
      try {
        const health = await checkHealth()
        setAiConfigured(health.ai_configured)

        const sessionList = await fetchSessions()
        setSessions(sessionList)

        if (sessionList.length > 0) {
          setActiveSessionId(sessionList[0].id)
        } else {
          const newSession = await createSession()
          setSessions([newSession])
          setActiveSessionId(newSession.id)
        }
      } catch (err) {
        console.error('Init error:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!activeSessionId) return

    async function loadMessages() {
      try {
        const data = await fetchSession(activeSessionId)
        setMessages(data.messages)
      } catch (err) {
        console.error('Failed to load messages:', err)
      }
    }
    loadMessages()
  }, [activeSessionId])

  useEffect(() => {
    const cleanup = onNewMessage((msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    })
    return cleanup
  }, [onNewMessage, activeSessionId])

  const handleNewChat = async () => {
    const session = await createSession()
    setSessions((prev) => [session, ...prev])
    setActiveSessionId(session.id)
    setMessages([])
  }

  const handleSelectSession = (id) => {
    setActiveSessionId(id)
  }

  const handleDeleteSession = async (id) => {
    await deleteSession(id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (activeSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id)
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id)
      } else {
        const newSession = await createSession()
        setSessions([newSession])
        setActiveSessionId(newSession.id)
        setMessages([])
      }
    }
  }

  const handleSend = useCallback(
    (content) => {
      sendMessage(content)
      const optimistic = {
        id: Date.now(),
        session_id: activeSessionId,
        role: 'user',
        content,
        file_name: null,
        file_path: null,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, optimistic])
    },
    [sendMessage, activeSessionId],
  )

  const handleUpload = async (file) => {
    try {
      const result = await uploadFile(activeSessionId, file)
      setMessages((prev) => [...prev, result.user_message, result.ai_message])
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, title: `File: ${file.name.slice(0, 40)}`, updated_at: new Date().toISOString() }
            : s,
        ),
      )
    } catch (err) {
      alert(err.message)
    }
  }

  const handleSelectTemplate = (content) => {
    handleSend(content)
  }

  const handleSearchResult = (sessionId, messageId) => {
    setActiveSessionId(sessionId)
  }

  const handleExport = async () => {
    try {
      const blob = await exportSession(activeSessionId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat_export_${activeSessionId}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to export chat')
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading AI Chat...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelect={handleSelectSession}
        onNew={handleNewChat}
        onDelete={handleDeleteSession}
      />

      <main className="chat-area">
        <header className="chat-header">
          <div className="status-indicators">
            <span className={`status-dot ${connected ? 'online' : 'offline'}`} />
            <span className="status-text">{connected ? 'Connected' : 'Disconnected'}</span>
            {!aiConfigured && (
              <span className="ai-warning">AI not configured — set GOOGLE_AI_API_KEY</span>
            )}
          </div>
          <div className="header-actions">
            <button 
              className="btn-theme" 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <Search onResultClick={handleSearchResult} />
            <Templates onSelectTemplate={handleSelectTemplate} />
            <button className="btn-export" onClick={handleExport} title="Export chat">
              Export
            </button>
          </div>
        </header>

        <MessageList messages={messages} aiTyping={aiTyping} />
        <div ref={messagesEndRef} />

        <MessageInput
          onSend={handleSend}
          onUpload={handleUpload}
          disabled={!connected || aiTyping}
        />
      </main>
    </div>
  )
}
