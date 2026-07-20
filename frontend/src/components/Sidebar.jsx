import { FiPlus, FiTrash2, FiMessageSquare } from 'react-icons/fi'

export default function Sidebar({ sessions, activeSessionId, onSelect, onNew, onDelete }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>AI Chat</h1>
        <button className="btn-new" onClick={onNew} title="New chat">
          <FiPlus />
        </button>
      </div>

      <div className="session-list">
        {sessions.length === 0 && (
          <p className="empty-state">No chats yet. Start a new conversation!</p>
        )}
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`session-item ${session.id === activeSessionId ? 'active' : ''}`}
            onClick={() => onSelect(session.id)}
          >
            <FiMessageSquare className="session-icon" />
            <span className="session-title">{session.title}</span>
            <button
              className="btn-delete"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(session.id)
              }}
              title="Delete chat"
            >
              <FiTrash2 />
            </button>
          </div>
        ))}
      </div>
    </aside>
  )
}
