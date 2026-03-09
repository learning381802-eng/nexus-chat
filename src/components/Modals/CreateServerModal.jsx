import { useState } from 'react'
import { api } from '../../utils/api'
import { X, Hash, Volume2, Copy, Check } from 'lucide-react'
import { useAppStore } from '../../store'
import toast from 'react-hot-toast'

// ── Modal base ─────────────────────────────────────────────────────────────────
export function ModalBase({ title, onClose, children, width = 440 }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={onClose}>
      <div
        className="rounded-lg overflow-hidden shadow-2xl w-full mx-4"
        style={{ background: 'var(--bg-secondary)', maxWidth: width }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-xl font-bold" style={{ color: 'var(--header-primary)' }}>{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-opacity-10 transition-colors" style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Create Server Modal ────────────────────────────────────────────────────────
export default function CreateServerModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const { server } = await api.createServer({ name: name.trim() })
      onCreated(server)
      onClose()
      toast.success(`Server "${server.name}" created!`)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <ModalBase title="Create Your Server" onClose={onClose}>
      <div className="px-6 pb-6 space-y-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Give your server a personality by choosing a name and icon.</p>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Server Name</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="w-full px-3 py-2 rounded text-sm outline-none"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-normal)' }}
            placeholder="My Awesome Server"
          />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded text-sm" style={{ color: 'var(--text-muted)' }}>Back</button>
          <button onClick={handleCreate} disabled={!name.trim() || loading} className="px-4 py-2 rounded text-sm font-medium text-white" style={{ background: '#5865F2', opacity: !name.trim() ? 0.5 : 1 }}>
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </ModalBase>
  )
}
