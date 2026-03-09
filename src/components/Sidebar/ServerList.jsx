import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '../../store'
import { api } from '../../utils/api'
import { Plus, Compass, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import CreateServerModal from '../Modals/CreateServerModal'
import JoinServerModal from '../Modals/JoinServerModal'
import Tooltip from '../UI/Tooltip'

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
    <div className="flex flex-col items-center py-3 gap-2 overflow-y-auto scrollbar-thin" style={{ width: 72, background: 'var(--bg-primary)', minWidth: 72 }}>
      {/* DMs button */}
      <Tooltip content="Direct Messages" placement="right">
        <button
          onClick={() => { setActiveServer(null); navigate('/channels/@me') }}
          className="server-icon relative group"
          style={{ background: serverId === '@me' || !serverId ? '#5865F2' : undefined, borderRadius: serverId === '@me' || !serverId ? 16 : undefined }}
        >
          <MessageCircle size={24} />
        </button>
      </Tooltip>

      <div className="w-8 h-px" style={{ background: 'var(--bg-accent)' }} />

      {/* Server icons */}
      {servers.map(server => (
        <Tooltip key={server.id} content={server.name} placement="right">
          <button
            onClick={() => handleServerClick(server)}
            className="server-icon relative"
            style={{
              background: activeServerId === server.id ? '#5865F2' : undefined,
              borderRadius: activeServerId === server.id ? 16 : undefined
            }}
          >
            {server.icon ? (
              <img src={server.icon} alt={server.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="font-bold text-sm">{server.name.slice(0, 2).toUpperCase()}</span>
            )}
            {/* Unread indicator */}
            <span className="absolute left-0 w-1 h-4 rounded-r-full" style={{ background: '#DBDEE1', display: 'none' }} />
          </button>
        </Tooltip>
      ))}

      {/* Add server */}
      <Tooltip content="Add a Server" placement="right">
        <button
          onClick={() => setShowCreate(true)}
          className="server-icon"
          style={{ color: '#57F287', background: 'rgba(87, 242, 135, 0.1)' }}
        >
          <Plus size={24} />
        </button>
      </Tooltip>

      {/* Discover servers */}
      <Tooltip content="Explore Public Servers" placement="right">
        <button
          onClick={() => setShowJoin(true)}
          className="server-icon"
          style={{ color: '#00AFF4', background: 'rgba(0, 175, 244, 0.1)' }}
        >
          <Compass size={24} />
        </button>
      </Tooltip>

      {showCreate && <CreateServerModal onClose={() => setShowCreate(false)} onCreated={(server) => { addServer(server); handleServerClick(server) }} />}
      {showJoin && <JoinServerModal onClose={() => setShowJoin(false)} onJoined={(server) => { addServer(server); handleServerClick(server) }} />}
    </div>
  )
}
