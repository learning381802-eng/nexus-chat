import { useState, useMemo } from 'react'
import { useAppStore } from '../../store'
import { Search, X, Hash, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

export default function ServerSearch() {
  const navigate = useNavigate()
  const { messages, channels, activeServerId, setServerSearchOpen, setActiveChannel } = useAppStore()
  const [query, setQuery] = useState('')

  const serverChannels = channels[activeServerId] || []

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return []
    const q = query.toLowerCase()
    const found = []
    serverChannels.forEach(channel => {
      const channelMessages = messages[channel.id] || []
      channelMessages.forEach(msg => {
        if (msg.content?.toLowerCase().includes(q)) {
          found.push({ ...msg, channelName: channel.name, channelId: channel.id })
        }
      })
    })
    return found.slice(-30).reverse()
  }, [query, messages, serverChannels])

  const handleResultClick = (result) => {
    setActiveChannel(result.channelId)
    navigate(`/channels/${activeServerId}/${result.channelId}`)
    setServerSearchOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 modal-backdrop">
      <div className="w-full max-w-xl rounded-lg overflow-hidden shadow-2xl" style={{ background: 'var(--bg-secondary)' }}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--bg-accent)' }}>
          <Search size={20} style={{ color: 'var(--text-muted)' }} />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search messages in this server..."
            className="flex-1 outline-none bg-transparent text-base"
            style={{ color: 'var(--text-normal)' }}
          />
          <button onClick={() => setServerSearchOpen(false)} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {query.length < 2 && (
            <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
              <Search size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Type at least 2 characters to search</p>
            </div>
          )}
          {query.length >= 2 && results.length === 0 && (
            <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          )}
          {results.map(msg => (
            <button
              key={msg.id}
              onClick={() => handleResultClick(msg)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-opacity-10 transition-colors border-b"
              style={{ borderColor: 'var(--bg-accent)' }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white" style={{ background: '#5865F2' }}>
                {msg.author?.displayName?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-sm" style={{ color: 'var(--header-primary)' }}>{msg.author?.displayName}</span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Hash size={10} />
                    {msg.channelName}
                  </span>
                  <span className="text-xs ml-auto flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {format(new Date(msg.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                <p className="text-sm truncate" style={{ color: 'var(--text-normal)' }}>{msg.content}</p>
              </div>
            </button>
          ))}
        </div>

        {results.length > 0 && (
          <div className="px-4 py-2 text-xs" style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)' }}>
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </div>
        )}
      </div>
    </div>
  )
}
