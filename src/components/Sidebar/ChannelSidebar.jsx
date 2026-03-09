import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppStore, useAuthStore } from '../../store'
import { api } from '../../utils/api'
import { Hash, Volume2, Plus, Settings, ChevronDown, ChevronRight, Lock, Mic, MicOff, Headphones, PhoneOff, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import UserPanel from './UserPanel'
import CreateChannelModal from '../Modals/CreateChannelModal'
import ServerSettingsModal from '../Modals/ServerSettingsModal'
import InviteModal from '../Modals/InviteModal'
import VoicePanel from '../Voice/VoicePanel'

export default function ChannelSidebar() {
  const navigate = useNavigate()
  const { serverId, channelId } = useParams()
  const { user } = useAuthStore()
  const { servers, channels, voiceChannelId, voiceStates, activeServerId, setActiveChannel, friends, activeDmUserId, setActiveDm } = useAppStore()

  const [collapsed, setCollapsed] = useState({})
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showServerSettings, setShowServerSettings] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [hoveredChannel, setHoveredChannel] = useState(null)

  const isDms = !serverId || serverId === '@me'
  const server = servers.find(s => s.id === activeServerId)
  const serverChannels = channels[activeServerId] || []

  const textChannels = serverChannels.filter(c => c.type === 'text')
  const voiceChannels = serverChannels.filter(c => c.type === 'voice')

  const acceptedFriends = friends.filter(f => f.status === 'accepted')

  const handleChannelClick = (channel) => {
    if (channel.type === 'text') {
      setActiveChannel(channel.id)
      navigate(`/channels/${activeServerId}/${channel.id}`)
    }
  }

  const handleDeleteChannel = async (e, ch) => {
    e.stopPropagation()
    if (!confirm(`Delete #${ch.name}?`)) return
    try {
      await api.deleteChannel(activeServerId, ch.id)
      toast.success('Channel deleted')
    } catch (err) { toast.error(err.message) }
  }

  const getVoiceUsers = (channelId) => voiceStates[channelId] || []

  if (isDms) {
    return (
      <div className="flex flex-col" style={{ width: 240, minWidth: 240, background: 'var(--bg-secondary)' }}>
        <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--header-primary)' }}>Direct Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {acceptedFriends.map(f => {
            const friend = f.friend
            if (!friend) return null
            return (
              <button
                key={f.id}
                onClick={() => { setActiveDm(friend.id); navigate(`/channels/@me/${friend.id}`) }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left"
                style={{
                  background: activeDmUserId === friend.id ? 'var(--bg-modifier-selected)' : 'transparent',
                  color: activeDmUserId === friend.id ? 'var(--interactive-active)' : 'var(--interactive-normal)'
                }}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: '#5865F2', color: 'white' }}>
                    {friend.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 status-dot ${friend.status || 'offline'}`} style={{ borderColor: 'var(--bg-secondary)' }} />
                </div>
                <span className="text-sm font-medium truncate">{friend.displayName || friend.username}</span>
              </button>
            )
          })}
          {acceptedFriends.length === 0 && (
            <p className="text-xs px-2 py-1" style={{ color: 'var(--text-muted)' }}>No DMs yet. Add friends to start chatting!</p>
          )}
        </div>
        <UserPanel />
      </div>
    )
  }

  if (!server) return (
    <div style={{ width: 240, minWidth: 240, background: 'var(--bg-secondary)' }}>
      <UserPanel />
    </div>
  )

  return (
    <div className="flex flex-col" style={{ width: 240, minWidth: 240, background: 'var(--bg-secondary)' }}>
      {/* Server header */}
      <button
        className="flex items-center justify-between px-4 py-3 hover:bg-opacity-10 transition-colors border-b flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.04)', color: 'var(--header-primary)' }}
        onClick={() => setShowServerSettings(true)}
      >
        <span className="font-bold text-sm truncate">{server.name}</span>
        <ChevronDown size={16} />
      </button>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {/* Text channels */}
        <div className="mb-1">
          <button
            className="flex items-center gap-1 px-1 mb-1 w-full"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setCollapsed(c => ({ ...c, text: !c.text }))}
          >
            {collapsed.text ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
            <span className="text-xs font-semibold uppercase tracking-wide">Text Channels</span>
            {server.ownerId === user.id && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowCreateChannel('text') }}
                className="ml-auto hover:text-white transition-colors"
              >
                <Plus size={16} />
              </button>
            )}
          </button>

          {!collapsed.text && textChannels.map(ch => (
            <div
              key={ch.id}
              className="relative"
              onMouseEnter={() => setHoveredChannel(ch.id)}
              onMouseLeave={() => setHoveredChannel(null)}
            >
              <button
                className={`channel-link w-full ${channelId === ch.id ? 'active' : ''}`}
                onClick={() => handleChannelClick(ch)}
              >
                <Hash size={16} className="flex-shrink-0" />
                <span className="truncate">{ch.name}</span>
                {ch.nsfw && <Lock size={12} className="flex-shrink-0 opacity-50" />}
              </button>
              {hoveredChannel === ch.id && server.ownerId === user.id && (
                <button
                  onClick={(e) => handleDeleteChannel(e, ch)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Voice channels */}
        <div className="mb-1">
          <button
            className="flex items-center gap-1 px-1 mb-1 w-full"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setCollapsed(c => ({ ...c, voice: !c.voice }))}
          >
            {collapsed.voice ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
            <span className="text-xs font-semibold uppercase tracking-wide">Voice Channels</span>
            {server.ownerId === user.id && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowCreateChannel('voice') }}
                className="ml-auto hover:text-white transition-colors"
              >
                <Plus size={16} />
              </button>
            )}
          </button>

          {!collapsed.voice && voiceChannels.map(ch => (
            <div key={ch.id}>
              <VoicePanel channel={ch} />
            </div>
          ))}
        </div>
      </div>

      {/* Invite + User panel */}
      <div className="flex-shrink-0">
        <button
          onClick={() => setShowInvite(true)}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-opacity-10 transition-colors"
          style={{ color: 'var(--interactive-normal)' }}
        >
          <UserPlus size={16} />
          <span>Invite People</span>
        </button>
        <UserPanel />
      </div>

      {showCreateChannel && (
        <CreateChannelModal
          serverId={activeServerId}
          type={showCreateChannel}
          onClose={() => setShowCreateChannel(false)}
        />
      )}
      {showServerSettings && <ServerSettingsModal server={server} onClose={() => setShowServerSettings(false)} />}
      {showInvite && <InviteModal serverId={activeServerId} onClose={() => setShowInvite(false)} />}
    </div>
  )
}
