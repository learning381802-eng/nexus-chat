import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'

export default function SearchPanel({ messages, onClose }) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return messages.filter(m => m.content?.toLowerCase().includes(q)).slice(-20)
  }, [query, messages])

  return (
    <div className="flex flex-col border-l overflow-hidden" style={{ width: 360, minWidth: 360, background: 'var(--bg-tertiary)', borderColor: 'rgba(0,0,0,0.2)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.2)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--header-primary)' }}>Search</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>
        <div className="flex items-center gap-2 rounded px-3 py-2" style={{ background: 'var(--bg-primary)' }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 outline-none bg-transparent text-sm"
            style={{ color: 'var(--text-normal)' }}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {query && results.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No results for "{query}"</p>
        )}
        {results.map(msg => (
          <div key={msg.id} className="p-3 rounded mb-2" style={{ background: 'var(--bg-secondary)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--header-secondary)' }}>{msg.author?.username}</p>
            <p className="text-sm" style={{ color: 'var(--text-normal)' }}>{msg.content}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(msg.createdAt).toLocaleString()}</p>
          </div>
        ))}
        {!query && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Type to search messages in this channel</p>
        )}
      </div>
    </div>
  )
}
