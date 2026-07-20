import { useRef, useState } from 'react'
import { FiSend, FiPaperclip, FiX } from 'react-icons/fi'

export default function MessageInput({ onSend, onUpload, disabled }) {
  const [text, setText] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) setSelectedFile(file)
  }

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="message-input-wrapper">
      {selectedFile && (
        <div className="file-preview">
          <FiPaperclip />
          <span>{selectedFile.name}</span>
          <button onClick={() => { setSelectedFile(null); fileInputRef.current.value = '' }}>
            <FiX />
          </button>
          <button className="btn-upload" onClick={handleUpload} disabled={disabled}>
            Upload & Send
          </button>
        </div>
      )}

      <form className="message-input" onSubmit={handleSubmit}>
        <button
          type="button"
          className="btn-attach"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Attach file"
        >
          <FiPaperclip />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleFileSelect}
          accept=".txt,.pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.csv,.json,.md"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          disabled={disabled}
        />
        <button type="submit" className="btn-send" disabled={!text.trim() || disabled}>
          <FiSend />
        </button>
      </form>
    </div>
  )
}
