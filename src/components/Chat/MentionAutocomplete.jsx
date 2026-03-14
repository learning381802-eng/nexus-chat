import { useAppStore } from '../../store'

export default function MentionAutocomplete({ query, onSelect, position }) {
  const { members, activeServerId } = useAppStore()
  const serverMembers = members[activeServerId] || []

  const matches = serverMembers
    .filter(m => m.user && (
      m.user.username?.toLowerCase().startsWith(query.toLowerCase()) ||
      m.user.displayName?.toLowerCase().startsWith(query.toLowerCase())
    ))
    .slice(0, 6)

  if (!matches.length) return null

  return (
    <div className="absolute bottom-full mb-2 left-0 right-0 rounded-xl overflow-hidden shadow-2xl z-50"
      style={{ background: 'var(--bg-floating)', border: '1px solid var(--border-subtle)' }}>
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b"
        style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}>
        Members
      </div>
      {matches.map(m => (
        <button
          key={m.userId}
          onClick={() => onSelect(m.user)}
          className="w-full flex items-center gap-3 px-3 py-2 transition-colors text-left"
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-modifier-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'var(--brand-color)' }}>
            {m.user.displayName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--header-primary)' }}>
              {m.user.displayName || m.user.username}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{m.user.username}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
