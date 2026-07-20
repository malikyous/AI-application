import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:5000'

export function useSocket(sessionId) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [aiTyping, setAiTyping] = useState(false)

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] })

    socketRef.current.on('connect', () => setConnected(true))
    socketRef.current.on('disconnect', () => setConnected(false))
    socketRef.current.on('ai_typing', () => setAiTyping(true))
    socketRef.current.on('ai_done', () => setAiTyping(false))

    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!socketRef.current || !sessionId) return

    socketRef.current.emit('join_session', { session_id: sessionId })

    return () => {
      socketRef.current?.emit('leave_session', { session_id: sessionId })
    }
  }, [sessionId])

  const sendMessage = (content) => {
    if (!socketRef.current || !sessionId) return
    socketRef.current.emit('send_message', { session_id: sessionId, content })
  }

  const onNewMessage = (callback) => {
    if (!socketRef.current) return () => {}
    socketRef.current.on('new_message', callback)
    return () => socketRef.current?.off('new_message', callback)
  }

  return { connected, aiTyping, sendMessage, onNewMessage }
}
