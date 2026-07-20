import { useState, useEffect } from 'react'
import { FiZap, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import { fetchTemplates, createTemplate, deleteTemplate } from '../api'

export default function Templates({ onSelectTemplate }) {
  const [templates, setTemplates] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '', category: 'general' })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const data = await fetchTemplates()
      setTemplates(data)
    } catch (err) {
      console.error('Failed to load templates:', err)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createTemplate(newTemplate.name, newTemplate.content, newTemplate.category)
      setNewTemplate({ name: '', content: '', category: 'general' })
      setShowCreate(false)
      loadTemplates()
    } catch (err) {
      alert('Failed to create template')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteTemplate(id)
      loadTemplates()
    } catch (err) {
      alert('Failed to delete template')
    }
  }

  const categories = ['general', 'coding', 'writing', 'analysis']

  return (
    <div className="templates-container">
      <button
        className="btn-templates"
        onClick={() => setIsOpen(!isOpen)}
        title="Quick Templates"
      >
        <FiZap />
      </button>

      {isOpen && (
        <div className="templates-dropdown">
          <div className="templates-header">
            <h3>Quick Templates</h3>
            <button onClick={() => setIsOpen(false)}><FiX /></button>
          </div>

          {!showCreate ? (
            <>
              <div className="templates-list">
                {templates.length === 0 ? (
                  <p className="empty-templates">No templates yet</p>
                ) : (
                  templates.map((template) => (
                    <div key={template.id} className="template-item">
                      <div
                        className="template-content"
                        onClick={() => {
                          onSelectTemplate(template.content)
                          setIsOpen(false)
                        }}
                      >
                        <span className="template-name">{template.name}</span>
                        <span className="template-category">{template.category}</span>
                      </div>
                      <button
                        className="btn-delete-template"
                        onClick={() => handleDelete(template.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <button
                className="btn-create-template"
                onClick={() => setShowCreate(true)}
              >
                <FiPlus /> Create Template
              </button>
            </>
          ) : (
            <form className="template-form" onSubmit={handleCreate}>
              <input
                type="text"
                placeholder="Template name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                required
              />
              <textarea
                placeholder="Template content"
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                required
                rows={4}
              />
              <select
                value={newTemplate.category}
                onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="template-form-actions">
                <button type="button" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit">Save</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
