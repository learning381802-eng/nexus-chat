import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '../../store'
import { api } from '../../utils/api'
import { Plus, Compass, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import CreateServerModal from '../Modals/CreateServerModal'
import JoinServerModal from '../Modals/JoinServerModal'
import Tooltip from '../UI/Tooltip'

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6']

export default function ServerList() {
  const navigate = useNavigate()
  const { serverId } = useParams()
  const { servers, activeServerId, setActiveServer, setChannels, setMembers, setRoles, addServer } = useAppStore()
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)

  const handleServerClick = async (server) => {
    setActiveServer(server.id)
    try {
      const [channels, members, roles] = await Promise.all([
        api.getChannels(server.id),
        api.getMembers(server.id),
        api.getRoles(server.id),
      ])
      setChannels(server.id, channels)
      setMembers(server.id, members)
      setRoles(server.id, roles)
      const firstText = channels.find(c => c.type === 'text')
      if (firstText) navigate(`/channels/${server.id}/${firstText.id}`)
      else navigate(`/channels/${server.id}`)
    } catch (err) {
      toast.error('Failed to load server')
    }
  }

  return (
    <div className="flex flex-col items-center py-3 gap-2 overflow-y-auto scrollbar-thin"
      style={{ width: 72, minWidth: 72, background: 'var(--bg-primary)', borderRight: '1px solid var(--border-subtle)' }}>
      
      {/* DMs */}
      <Tooltip content="Direct Messages" placement="right">
        <button
          onClick={() => { setActiveServer(null); navigate('/channels/@me') }}
          className={`server-icon ${(!serverId || serverId === '@me') ? 'active' : ''}`}
        >
          <MessageSquare size={22} strokeWidth={1.8} />
        </button>
      </Tooltip>

      <div className="w-8 h-px mx-auto" style={{ background: 'var(--border-subtle)' }} />

      {/* Servers */}
      {servers.map((server, i) => {
        const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
        const isActive = activeServerId === server.id
        return (
          <Tooltip key={server.id} content={server.name} placement="right">
            <button onClick={() => handleServerClick(server)}
              className={`server-icon relative ${isActive ? 'active' : ''}`}
              style={{ background: isActive ? `linear-gradient(135deg, ${color}, ${color}bb)` : undefined }}>
              {server.icon ? (
                <img src={server.icon} alt={server.name} className="w-full h-full object-cover" style={{ borderRadius: 'inherit' }} />
              ) : (
                <span className="font-bold text-sm">{server.name.slice(0, 2).toUpperCase()}</span>
              )}
              {isActive && (
                <span className="absolute -left-1 w-1 h-8 rounded-r-full" style={{ background: 'white' }} />
              )}
            </button>
          </Tooltip>
        )
      })}

      <div className="w-8 h-px mx-auto" style={{ background: 'var(--border-subtle)' }} />

      {/* Add server */}
      <Tooltip content="Add a Server" placement="right">
        <button onClick={() => setShowCreate(true)} className="server-icon"
          style={{ color: 'var(--text-positive)', background: 'rgba(52,211,153,0.1)' }}>
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </Tooltip>

      <Tooltip content="Explore Servers" placement="right">
        <button onClick={() => setShowJoin(true)} className="server-icon"
          style={{ color: 'var(--text-link)', background: 'rgba(129,140,248,0.1)' }}>
          <Compass size={20} strokeWidth={1.8} />
        </button>
      </Tooltip>

      {showCreate && <CreateServerModal onClose={() => setShowCreate(false)} onCreated={(server) => { addServer(server); handleServerClick(server) }} />}
      {showJoin && <JoinServerModal onClose={() => setShowJoin(false)} onJoined={(server) => { addServer(server); handleServerClick(server) }} />}
    </div>
  )
}
