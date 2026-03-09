import { useAppStore, useAuthStore } from '../../store'
import { useSocket } from '../../context/SocketContext'
import { Volume2, Mic, MicOff, PhoneOff } from 'lucide-react'

export default function VoicePanel({ channel }) {
  const { user } = useAuthStore()
  const { voiceChannelId, voiceStates, voiceMuted, setVoiceChannel, setVoiceMuted } = useAppStore()
  const { joinVoice, leaveVoice, updateVoiceState } = useSocket()

  const isInChannel = voiceChannelId === channel.id
  const users = voiceStates[channel.id] || []

  const handleJoin = () => {
    if (isInChannel) {
      leaveVoice(channel.id)
      setVoiceChannel(null)
    } else {
      if (voiceChannelId) leaveVoice(voiceChannelId)
      joinVoice(channel.id)
      setVoiceChannel(channel.id)
    }
  }

  const toggleMute = (e) => {
    e.stopPropagation()
    const newMuted = !voiceMuted
    setVoiceMuted(newMuted)
    updateVoiceState(channel.id, { muted: newMuted })
  }

  return (
    <div>
      <button
        onClick={handleJoin}
        className={`channel-link w-full ${isInChannel ? 'active' : ''}`}
        style={{ color: isInChannel ? '#57F287' : undefined }}
      >
        <Volume2 size={16} className="flex-shrink-0" />
        <span className="truncate">{channel.name}</span>
        {isInChannel && (
          <div className="ml-auto flex gap-1">
            <button onClick={toggleMute} className="p-0.5 rounded hover:text-white" style={{ color: voiceMuted ? 'var(--text-danger)' : 'inherit' }}>
              {voiceMuted ? <MicOff size={12} /> : <Mic size={12} />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); leaveVoice(channel.id); setVoiceChannel(null) }} className="p-0.5 rounded hover:text-red-400" style={{ color: 'var(--text-muted)' }}>
              <PhoneOff size={12} />
            </button>
          </div>
        )}
      </button>
      {/* Voice users */}
      {users.map(vs => {
        // Look up user from global users cache (simplified)
        return (
          <div key={vs.userId} className="voice-user ml-6">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#5865F2' }}>
              {vs.userId.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{vs.userId.slice(0, 8)}...</span>
            {vs.muted && <MicOff size={10} style={{ color: 'var(--text-danger)', flexShrink: 0 }} />}
          </div>
        )
      })}
    </div>
  )
}
