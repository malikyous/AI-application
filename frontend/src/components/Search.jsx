import { useState } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'
import { searchMessages } from '../api'

export default function Search({ onResultClick }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      const data = await searchMessages(query)
      setResults(data)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="search-container">
      <button
        className="btn-search"
        onClick={() => setIsOpen(!isOpen)}
        title="Search messages"
      >
        <FiSearch />
      </button>

      {isOpen && (
        <div className="search-modal">
          <div className="search-header">
            <h3>Search Messages</h3>
            <button onClick={() => setIsOpen(false)}><FiX /></button>
          </div>

          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search in all messages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          <div className="search-results">
            {results.length === 0 && query && !loading && (
              <p className="no-results">No results found</p>
            )}
            {results.map((msg) => (
              <div
                key={msg.id}
                className="search-result-item"
                onClick={() => {
                  onResultClick(msg.session_id, msg.id)
                  setIsOpen(false)
                }}
              >
                <div className="result-role">{msg.role === 'user' ? 'You' : 'AI'}</div>
                <div className="result-content">
                  {msg.content.substring(0, 150)}
                  {msg.content.length > 150 && '...'}
                </div>
                <div className="result-time">
                  {new Date(msg.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
