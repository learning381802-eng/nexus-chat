import { useState, useEffect } from 'react'
import { api } from '../../utils/api'
import { useAuthStore } from '../../store'
import { X, Plus, Trash2, Smile } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ServerEmojiModal({ server, onClose }) {
  const { user } = useAuthStore()
  const [emojis, setEmojis] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const isOwner = server.ownerId === user?.id

  useEffect(() => {
    api.getServerEmojis(server.id).then(data => { setEmojis(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const handleUpload = async () => {
    if (!name || !file) { toast.error('Name and image required'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('image', file)
      const emoji = await api.createServerEmoji(server.id, formData)
      setEmojis(e => [...e, emoji])
      setName(''); setFile(null)
      toast.success(`Emoji :${emoji.name}: added!`)
    } catch (err) { toast.error(err.message) }
    finally { setUploading(false) }
  }

  const handleDelete = async (emojiId) => {
    try {
      await api.deleteServerEmoji(server.id, emojiId)
      setEmojis(e => e.filter(em => em.id !== emojiId))
      toast.success('Emoji deleted')
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={onClose}>
      <div className="rounded-2xl overflow-hidden shadow-2xl w-full mx-4 max-w-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--brand-gradient)' }}>
            <Smile size={16} color="white" />
          </div>
          <h2 className="font-bold text-lg" style={{ color: 'var(--header-primary)' }}>Server Emoji</h2>
          <button onClick={onClose} className="ml-auto" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>

        <div className="p-6 max-h-80 overflow-y-auto">
          {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading...</p> : (
            <div className="grid grid-cols-4 gap-3">
              {emojis.map(emoji => (
                <div key={emoji.id} className="group relative flex flex-col items-center gap-1 p-2 rounded-xl transition-colors"
                  style={{ background: 'var(--bg-tertiary)' }}>
                  <img src={emoji.url} alt={emoji.name} className="w-10 h-10 object-contain rounded" />
                  <span className="text-xs truncate w-full text-center" style={{ color: 'var(--text-muted)' }}>:{emoji.name}:</span>
                  {isOwner && (
                    <button onClick={() => handleDelete(emoji.id)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                      style={{ background: 'var(--text-danger)', color: 'white' }}>
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
              {emojis.length === 0 && (
                <div className="col-span-4 text-center py-6">
                  <Smile size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No custom emoji yet</p>
                </div>
              )}
            </div>
          )}
        </div>

        {isOwner && (
          <div className="px-6 pb-6 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Upload New Emoji</p>
            <div className="flex gap-2">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="emoji_name"
                className="input-base flex-1" style={{ fontSize: 13 }} />
              <label className="btn-ghost cursor-pointer flex items-center gap-1 text-sm px-3">
                <Plus size={14} /> Image
                <input type="file" className="hidden" accept="image/*" onChange={e => setFile(e.target.files[0])} />
              </label>
              <button onClick={handleUpload} disabled={!name || !file || uploading} className="btn-primary px-4 text-sm">
                {uploading ? '...' : 'Add'}
              </button>
            </div>
            {file && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Selected: {file.name}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
