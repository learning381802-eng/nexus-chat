import { useAppStore } from '../../store'
import { Bookmark, X, Hash } from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

export default function BookmarksPanel({ onClose }) {
  const navigate = useNavigate()
  const { bookmarks = [], removeBookmark, channels, activeServerId, setActiveChannel } = useAppStore()

  const handleJump = (bookmark) => {
    const serverId = activeServerId
    const allChannels = Object.values(channels).flat()
    const channel = allChannels.find(c => c.id === bookmark.channelId)
    if (channel) {
      setActiveChannel(channel.id)
      navigate(`/channels/${serverId}/${channel.id}`)
    }
    onClose()
  }

  return (
    <div className="flex flex-col border-l overflow-hidden"
      style={{ width: 320, minWidth: 320, background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <Bookmark size={16} style={{ color: '#fbbf24' }} />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--header-primary)' }}>Bookmarks</h3>
        </div>
        <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'var(--bg-accent)' }}>
              <Bookmark size={20} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--header-secondary)' }}>No bookmarks yet</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Hover a message and click the bookmark icon to save it
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookmarks.map(b => (
              <div key={b.id} className="rounded-xl p-3 cursor-pointer transition-colors"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
                onClick={() => handleJump(b)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-color)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: 'var(--brand-color)' }}>
                      {b.author?.displayName?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--header-secondary)' }}>
                      {b.author?.displayName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {format(new Date(b.createdAt), 'MMM d')}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); removeBookmark(b.id) }}
                      className="p-0.5 rounded hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>
                      <X size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-sm line-clamp-2" style={{ color: 'var(--text-normal)' }}>{b.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
