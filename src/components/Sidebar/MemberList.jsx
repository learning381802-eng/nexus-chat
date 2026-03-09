import { useAppStore } from '../../store'

function StatusDot({ status }) {
  return <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 status-dot ${status || 'offline'}`} />
}

export default function MemberList() {
  const { members, activeServerId, roles } = useAppStore()
  const serverMembers = members[activeServerId] || []
  const serverRoles = roles[activeServerId] || []

  const online = serverMembers.filter(m => m.user?.status === 'online')
  const offline = serverMembers.filter(m => m.user?.status !== 'online')

  const renderMember = (member) => {
    const user = member.user
    if (!user) return null
    return (
      <div key={member.userId} className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-opacity-10 transition-colors" style={{ color: 'var(--interactive-normal)' }}>
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: '#5865F2', color: 'white', opacity: user.status === 'offline' ? 0.5 : 1 }}>
            {user.displayName?.charAt(0).toUpperCase()}
          </div>
          <StatusDot status={user.status} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: user.status === 'offline' ? 'var(--text-muted)' : 'var(--interactive-normal)' }}>
            {member.nickname || user.displayName || user.username}
          </p>
          {user.customStatus && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.customStatus}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto py-4 scrollbar-thin" style={{ width: 240, minWidth: 240, background: 'var(--bg-secondary)' }}>
      {online.length > 0 && (
        <div className="mb-2">
          <p className="px-4 mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Online — {online.length}
          </p>
          {online.map(renderMember)}
        </div>
      )}
      {offline.length > 0 && (
        <div>
          <p className="px-4 mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Offline — {offline.length}
          </p>
          {offline.map(renderMember)}
        </div>
      )}
    </div>
  )
}
