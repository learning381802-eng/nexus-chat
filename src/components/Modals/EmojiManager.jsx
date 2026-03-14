import { useState, useRef } from 'react'
import { X, Plus, Smile, Trash2, Upload } from 'lucide-react'
import { useAppStore } from '../../store'
import toast from 'react-hot-toast'

export default function EmojiManager({ serverId, onClose }) {
  const { serverEmoji = {}, addServerEmoji, removeServerEmoji } = useAppStore()
  const emojis = serverEmoji[serverId] || []
  const [name, setName] = useState('')
  const fileRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleAdd = () => {
    if (!name.trim() || !preview) { toast.error('Need a name and image'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(name)) { toast.error('Name can only contain letters, numbers, underscores'); return }
    if (emojis.find(e => e.name === name)) { toast.error('Emoji name already exists'); return }
    addServerEmoji(serverId, { name: name.trim(), url: preview, id: Date.now().toString() })
    setName('')
    setPreview(null)
    setFile(null)
    toast.success(`Emoji :${name}: added!`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl mx-4"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Smile size={18} style={{ color: 'var(--brand-color)' }} />
            <h2 className="font-bold text-lg" style={{ color: 'var(--header-primary)' }}>Custom Emoji</h2>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <div className="p-6">
          {/* Upload new */}
          <div className="p-4 rounded-xl mb-6" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--header-primary)' }}>Upload Emoji</p>
            <div className="flex items-center gap-3">
              <button onClick={() => fileRef.current?.click()}
                className="w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1 border-2 border-dashed transition-colors"
                style={{ borderColor: preview ? 'var(--brand-color)' : 'var(--border-subtle)', background: 'var(--bg-accent)' }}>
                {preview ? (
                  <img src={preview} alt="preview" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <>
                    <Upload size={16} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Upload</span>
                  </>
                )}
              </button>
              <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={handleFile} />
              <div className="flex-1">
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Emoji Name</label>
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--text-muted)' }}>:</span>
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="my_emoji"
                    className="input-base flex-1" style={{ padding: '8px 12px' }} />
                  <span style={{ color: 'var(--text-muted)' }}>:</span>
                </div>
              </div>
            </div>
            <button onClick={handleAdd} disabled={!name || !preview}
              className="btn-primary mt-3 w-full flex items-center justify-center gap-2"
              style={{ opacity: (!name || !preview) ? 0.5 : 1 }}>
              <Plus size={16} /> Add Emoji
            </button>
          </div>

          {/* Existing emoji */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Server Emoji — {emojis.length}
            </p>
            {emojis.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                <Smile size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No custom emoji yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-8 gap-2">
                {emojis.map(emoji => (
                  <div key={emoji.id} className="relative group">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center p-1 cursor-pointer transition-colors"
                      style={{ background: 'var(--bg-accent)' }}
                      title={`:${emoji.name}:`}>
                      <img src={emoji.url} alt={emoji.name} className="w-full h-full object-contain" />
                    </div>
                    <button onClick={() => { removeServerEmoji(serverId, emoji.id); toast.success('Emoji removed') }}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'var(--text-danger)', color: 'white' }}>
                      <X size={8} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
