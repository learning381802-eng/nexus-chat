import { useState } from 'react'
import { useAuthStore, useAppStore } from '../../store'
import { Mic, MicOff, Headphones, EarOff, Settings } from 'lucide-react'
import Tooltip from '../UI/Tooltip'

export default function UserPanel() {
  const { user, logout } = useAuthStore()
  const { setSettingsOpen, voiceMuted, voiceDeafened, setVoiceMuted, setVoiceDeafened } = useAppStore()
  const [hovered, setHovered] = useState(false)

  if (!user) return null

  return (
    <div
      className="flex items-center gap-2 px-2 py-2"
      style={{ background: 'var(--bg-primary)', minHeight: 52 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0 cursor-pointer" onClick={() => setSettingsOpen(true)}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: '#5865F2', color: 'white' }}>
          {user.displayName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase()}
        </div>
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 status-dot online`} style={{ borderColor: 'var(--bg-primary)', width: 10, height: 10 }} />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSettingsOpen(true)}>
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--header-primary)', lineHeight: '16px' }}>{user.displayName || user.username}</p>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)', lineHeight: '13px' }}>
          {user.customStatus || `#${user.discriminator || '0000'}`}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Tooltip content={voiceMuted ? 'Unmute' : 'Mute'} placement="top">
          <button
            onClick={() => setVoiceMuted(!voiceMuted)}
            className="p-1.5 rounded transition-colors"
            style={{ color: voiceMuted ? 'var(--text-danger)' : 'var(--interactive-normal)' }}
          >
            {voiceMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        </Tooltip>
        <Tooltip content={voiceDeafened ? 'Undeafen' : 'Deafen'} placement="top">
          <button
            onClick={() => setVoiceDeafened(!voiceDeafened)}
            className="p-1.5 rounded transition-colors"
            style={{ color: voiceDeafened ? 'var(--text-danger)' : 'var(--interactive-normal)' }}
          >
            {voiceDeafened ? <EarOff size={16} /> : <Headphones size={16} />}
          </button>
        </Tooltip>
        <Tooltip content="User Settings" placement="top">
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 rounded transition-colors hover:text-white"
            style={{ color: 'var(--interactive-normal)' }}
          >
            <Settings size={16} />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
