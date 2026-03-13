import { useAuthStore, useAppStore } from '../../store'
import { Mic, MicOff, Headphones, Settings, LogOut, Sun, Moon } from 'lucide-react'
import Tooltip from '../UI/Tooltip'

export default function UserPanel() {
  const { user, logout } = useAuthStore()
  const { setSettingsOpen, voiceMuted, voiceDeafened, setVoiceMuted, setVoiceDeafened, theme, setTheme } = useAppStore()

  if (!user) return null

  const colors = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899']
  const colorIndex = user.id ? user.id.charCodeAt(0) % colors.length : 0
  const avatarColor = colors[colorIndex]

  return (
    <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'var(--bg-primary)', borderTop: '1px solid var(--border-subtle)', minHeight: 56 }}>
      {/* Avatar */}
      <button onClick={() => setSettingsOpen(true)} className="relative flex-shrink-0 group">
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white transition-transform group-hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}99)` }}>
          {(user.displayName || user.username)?.charAt(0).toUpperCase()}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 status-dot online"
          style={{ borderColor: 'var(--bg-primary)', width: 11, height: 11 }} />
      </button>

      {/* Name */}
      <button onClick={() => setSettingsOpen(true)} className="flex-1 min-w-0 text-left group">
        <p className="text-sm font-semibold truncate transition-colors group-hover:text-white" style={{ color: 'var(--header-primary)', lineHeight: '16px' }}>
          {user.displayName || user.username}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)', lineHeight: '14px' }}>
          {user.customStatus || `#${user.discriminator || '0000'}`}
        </p>
      </button>

      {/* Controls */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Tooltip content={voiceMuted ? 'Unmute' : 'Mute'} placement="top">
          <button onClick={() => setVoiceMuted(!voiceMuted)}
            className="p-1.5 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10"
            style={{ color: voiceMuted ? 'var(--text-danger)' : 'var(--interactive-normal)' }}>
            {voiceMuted ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
        </Tooltip>
        <Tooltip content={voiceDeafened ? 'Undeafen' : 'Deafen'} placement="top">
          <button onClick={() => setVoiceDeafened(!voiceDeafened)}
            className="p-1.5 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10"
            style={{ color: voiceDeafened ? 'var(--text-danger)' : 'var(--interactive-normal)' }}>
            <Headphones size={15} />
          </button>
        </Tooltip>
        <Tooltip content="User Settings" placement="top">
          <button onClick={() => setSettingsOpen(true)}
            className="p-1.5 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10"
            style={{ color: 'var(--interactive-normal)' }}>
            <Settings size={15} />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
