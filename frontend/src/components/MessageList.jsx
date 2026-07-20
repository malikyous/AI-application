import ReactMarkdown from 'react-markdown'
import { FiUser, FiCpu, FiPaperclip } from 'react-icons/fi'

export default function MessageList({ messages, aiTyping }) {
  return (
    <div className="message-list">
      {messages.length === 0 && !aiTyping && (
        <div className="welcome">
          <div className="welcome-icon">💬</div>
          <h2>Welcome to AI Chat</h2>
          <p>Start a conversation or upload a file to get started.</p>
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg.id} className={`message ${msg.role}`}>
          <div className="message-avatar">
            {msg.role === 'user' ? <FiUser /> : <FiCpu />}
          </div>
          <div className="message-body">
            {msg.file_name && (
              <div className="file-badge">
                <FiPaperclip /> {msg.file_name}
              </div>
            )}
            <div className="message-content">
              {msg.role === 'assistant' ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
            <span className="message-time">
              {new Date(msg.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      ))}

      {aiTyping && (
        <div className="message assistant">
          <div className="message-avatar"><FiCpu /></div>
          <div className="message-body">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
