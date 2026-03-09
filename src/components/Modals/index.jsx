import { useState } from 'react'
import { api } from '../../utils/api'
import { useAppStore } from '../../store'
import { X, Hash, Volume2, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

function ModalBase({ title, onClose, children, width = 440 }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={onClose}>
      <div className="rounded-lg overflow-hidden shadow-2xl w-full mx-4" style={{ background: 'var(--bg-secondary)', maxWidth: width }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-xl font-bold" style={{ color: 'var(--header-primary)' }}>{title}</h2>
          <button onClick={onClose} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Join Server Modal ──────────────────────────────────────────────────────────
export function JoinServerModal({ onClose, onJoined }) {
  const { addServer, setChannels } = useAppStore()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    if (!code.trim()) return
    setLoading(true)
    try {
      const { server, channels } = await api.joinInvite(code.trim().toUpperCase())
      addServer(server)
      setChannels(server.id, channels)
      onJoined(server)
      onClose()
      toast.success(`Joined ${server.name}!`)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <ModalBase title="Join a Server" onClose={onClose}>
      <div className="px-6 pb-6 space-y-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Enter an invite code to join an existing server.</p>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Invite Code</label>
          <input autoFocus value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleJoin()}
            className="w-full px-3 py-2 rounded text-sm outline-none" style={{ background: 'var(--bg-primary)', color: 'var(--text-normal)' }} placeholder="ABCDEF" />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded text-sm" style={{ color: 'var(--text-muted)' }}>Back</button>
          <button onClick={handleJoin} disabled={!code.trim() || loading} className="px-4 py-2 rounded text-sm font-medium text-white" style={{ background: '#5865F2' }}>
            {loading ? 'Joining...' : 'Join Server'}
          </button>
        </div>
      </div>
    </ModalBase>
  )
}

// ── Create Channel Modal ───────────────────────────────────────────────────────
export function CreateChannelModal({ serverId, type = 'text', onClose }) {
  const { addChannel } = useAppStore()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const channel = await api.createChannel(serverId, { name: name.toLowerCase().replace(/\s+/g, '-'), type })
      addChannel(serverId, channel)
      onClose()
      toast.success(`Channel #${channel.name} created!`)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <ModalBase title={`Create ${type === 'voice' ? 'Voice' : 'Text'} Channel`} onClose={onClose}>
      <div className="px-6 pb-6 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Channel Name</label>
          <div className="flex items-center gap-2 px-3 py-2 rounded" style={{ background: 'var(--bg-primary)' }}>
            {type === 'text' ? <Hash size={16} style={{ color: 'var(--text-muted)' }} /> : <Volume2 size={16} style={{ color: 'var(--text-muted)' }} />}
            <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="flex-1 outline-none bg-transparent text-sm" style={{ color: 'var(--text-normal)' }} placeholder={type === 'text' ? 'new-channel' : 'New Voice'} />
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded text-sm" style={{ color: 'var(--text-muted)' }}>Cancel</button>
          <button onClick={handleCreate} disabled={!name.trim() || loading} className="px-4 py-2 rounded text-sm font-medium text-white" style={{ background: '#5865F2' }}>
            {loading ? 'Creating...' : 'Create Channel'}
          </button>
        </div>
      </div>
    </ModalBase>
  )
}

// ── Invite Modal ───────────────────────────────────────────────────────────────
export function InviteModal({ serverId, onClose }) {
  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateInvite = async () => {
    setLoading(true)
    try {
      const inv = await api.createInvite(serverId, {})
      setInvite(inv)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${invite.code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ModalBase title="Invite Friends" onClose={onClose}>
      <div className="px-6 pb-6 space-y-4">
        {!invite ? (
          <button onClick={generateInvite} disabled={loading} className="w-full py-2 rounded text-sm font-medium text-white" style={{ background: '#5865F2' }}>
            {loading ? 'Generating...' : 'Generate Invite Link'}
          </button>
        ) : (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Invite Link</label>
            <div className="flex gap-2">
              <input readOnly value={`${window.location.origin}/invite/${invite.code}`} className="flex-1 px-3 py-2 rounded text-sm outline-none" style={{ background: 'var(--bg-primary)', color: 'var(--text-normal)' }} />
              <button onClick={copyLink} className="px-4 py-2 rounded text-sm font-medium text-white flex items-center gap-1" style={{ background: copied ? '#57F287' : '#5865F2', transition: 'background 0.2s' }}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Code: <strong style={{ color: 'var(--text-normal)' }}>{invite.code}</strong></p>
          </div>
        )}
      </div>
    </ModalBase>
  )
}

// ── Server Settings Modal ──────────────────────────────────────────────────────
export function ServerSettingsModal({ server, onClose }) {
  const { updateServer, removeServer } = useAppStore()
  const [name, setName] = useState(server.name)
  const [description, setDescription] = useState(server.description || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await api.updateServer(server.id, { name, description })
      updateServer(server.id, updated)
      toast.success('Server updated!')
      onClose()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${server.name}"? This cannot be undone.`)) return
    try {
      await api.deleteServer(server.id)
      removeServer(server.id)
      onClose()
      toast.success('Server deleted')
    } catch (err) { toast.error(err.message) }
  }

  return (
    <ModalBase title="Server Settings" onClose={onClose} width={520}>
      <div className="px-6 pb-6 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Server Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded text-sm outline-none" style={{ background: 'var(--bg-primary)', color: 'var(--text-normal)' }} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
            className="w-full px-3 py-2 rounded text-sm outline-none resize-none" style={{ background: 'var(--bg-primary)', color: 'var(--text-normal)' }} />
        </div>
        <div className="flex gap-3 justify-between pt-2">
          <button onClick={handleDelete} className="px-4 py-2 rounded text-sm font-medium text-white" style={{ background: '#ED4245' }}>
            Delete Server
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded text-sm" style={{ color: 'var(--text-muted)' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded text-sm font-medium text-white" style={{ background: '#5865F2' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </ModalBase>
  )
}

// ── Pins Modal ─────────────────────────────────────────────────────────────────
export function PinsModal({ channelId, onClose }) {
  const [pins, setPins] = useState([])
  const [loading, setLoading] = useState(true)

  useState(() => {
    api.getPins(channelId).then(setPins).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <ModalBase title="Pinned Messages" onClose={onClose} width={480}>
      <div className="px-6 pb-6 max-h-96 overflow-y-auto">
        {loading && <p style={{ color: 'var(--text-muted)' }}>Loading...</p>}
        {!loading && pins.length === 0 && (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">📌</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No pinned messages yet.</p>
          </div>
        )}
        {pins.map(pin => (
          <div key={pin.id} className="flex gap-3 py-3 border-b" style={{ borderColor: 'var(--bg-accent)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: '#5865F2' }}>
              {pin.author?.displayName?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--header-primary)' }}>{pin.author?.displayName}</p>
              <p className="text-sm" style={{ color: 'var(--text-normal)' }}>{pin.content}</p>
            </div>
          </div>
        ))}
      </div>
    </ModalBase>
  )
}
