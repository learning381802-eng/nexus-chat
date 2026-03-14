import { useState, useEffect } from 'react'
import { api } from '../../utils/api'
import { useAuthStore } from '../../store'
import { X, Plus, Trash2, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'

export default function ServerRulesModal({ server, onClose }) {
  const { user } = useAuthStore()
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const isOwner = server.ownerId === user?.id

  useEffect(() => {
    api.getRules(server.id).then(data => { setRules(data.rules || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const addRule = () => setRules(r => [...r, { id: Date.now().toString(), title: '', description: '' }])
  const removeRule = (id) => setRules(r => r.filter(rule => rule.id !== id))
  const updateRule = (id, field, value) => setRules(r => r.map(rule => rule.id === id ? { ...rule, [field]: value } : rule))

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateRules(server.id, { rules })
      toast.success('Rules saved!')
      onClose()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={onClose}>
      <div className="rounded-2xl overflow-hidden shadow-2xl w-full mx-4 max-w-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--brand-gradient)' }}>
            <BookOpen size={16} color="white" />
          </div>
          <h2 className="font-bold text-lg" style={{ color: 'var(--header-primary)' }}>Server Rules</h2>
          <button onClick={onClose} className="ml-auto" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><div className="loading-dot" /></div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>No rules set yet.</p>
              {isOwner && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Add some rules to keep your server safe.</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, i) => (
                <div key={rule.id} className="rounded-xl p-4" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                  {isOwner ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'var(--brand-color)' }}>{i + 1}</span>
                        <input value={rule.title} onChange={e => updateRule(rule.id, 'title', e.target.value)}
                          className="flex-1 outline-none bg-transparent font-semibold text-sm" placeholder="Rule title"
                          style={{ color: 'var(--header-primary)' }} />
                        <button onClick={() => removeRule(rule.id)} style={{ color: 'var(--text-danger)' }}><Trash2 size={14} /></button>
                      </div>
                      <textarea value={rule.description} onChange={e => updateRule(rule.id, 'description', e.target.value)}
                        className="w-full outline-none bg-transparent text-sm resize-none" rows={2}
                        placeholder="Rule description..." style={{ color: 'var(--text-normal)' }} />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'var(--brand-color)' }}>{i + 1}</span>
                        <p className="font-semibold text-sm" style={{ color: 'var(--header-primary)' }}>{rule.title}</p>
                      </div>
                      {rule.description && <p className="text-sm ml-8" style={{ color: 'var(--text-muted)' }}>{rule.description}</p>}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {isOwner && (
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={addRule} className="btn-ghost flex items-center gap-2 flex-1">
              <Plus size={16} /> Add Rule
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : 'Save Rules'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
