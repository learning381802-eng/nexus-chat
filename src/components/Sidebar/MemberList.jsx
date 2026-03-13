import { useAppStore } from '../../store'
import { Crown, Shield } from 'lucide-react'

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6']

function MemberItem({ member, index }) {
  const user = member.user
  if (!user) return null
  const isOffline = user.status !== 'online'
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length]

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg cursor-pointer transition-colors mx-2"
      style={{ opacity: isOffline ? 0.5 : 1 }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-modifier-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}>
          {(user.displayName || user.username)?.charAt(0).toUpperCase()}
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 status-dot ${user.status || 'offline'}`}
          style={{ borderColor: 'var(--bg-secondary)', width: 10, height: 10 }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="text-sm font-medium truncate" style={{ color: isOffline ? 'var(--text-muted)' : 'var(--interactive-normal)' }}>
            {member.nickname || user.displayName || user.username}
          </p>
        </div>
        {user.customStatus && (
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)', fontSize: 11 }}>{user.customStatus}</p>
        )}
      </div>
    </div>
  )
}

export default function MemberList() {
  const { members, activeServerId } = useAppStore()
  const serverMembers = members[activeServerId] || []
  const online = serverMembers.filter(m => m.user?.status === 'online')
  const offline = serverMembers.filter(m => m.user?.status !== 'online')

  return (
    <div className="overflow-y-auto py-4" style={{ width: 240, minWidth: 240, background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-subtle)' }}>
      {online.length > 0 && (
        <div className="mb-3">
          <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--status-online)' }} />
            Online — {online.length}
          </p>
          {online.map((m, i) => <MemberItem key={m.userId} member={m} index={i} />)}
        </div>
      )}
      {offline.length > 0 && (
        <div>
          <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--status-offline)' }} />
            Offline — {offline.length}
          </p>
          {offline.map((m, i) => <MemberItem key={m.userId} member={m} index={online.length + i} />)}
        </div>
      )}
    </div>
  )
}
