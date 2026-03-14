import { useState } from 'react'
import { X, Flag, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react'
import { useAuthStore, useAppStore } from '../../store'
import toast from 'react-hot-toast'

const REPORT_CATEGORIES = [
  {
    id: 'spam',
    label: 'Spam',
    desc: 'Repeated, unwanted, or irrelevant messages',
    icon: '🚫',
  },
  {
    id: 'harassment',
    label: 'Harassment or Bullying',
    desc: 'Targeting, threatening, or bullying someone',
    icon: '😡',
  },
  {
    id: 'hate_speech',
    label: 'Hate Speech',
    desc: 'Slurs, discrimination, or attacks based on identity',
    icon: '⚠️',
  },
  {
    id: 'nsfw',
    label: 'Explicit or NSFW Content',
    desc: 'Sexual or graphic content in non-NSFW channels',
    icon: '🔞',
  },
  {
    id: 'misinformation',
    label: 'Misinformation',
    desc: 'False or misleading information',
    icon: '📰',
  },
  {
    id: 'threats',
    label: 'Threats or Violence',
    desc: 'Threatening harm to people or groups',
    icon: '🔪',
  },
  {
    id: 'doxxing',
    label: 'Sharing Personal Information',
    desc: 'Posting someone\'s private info without consent',
    icon: '🔍',
  },
  {
    id: 'other',
    label: 'Other',
    desc: 'Something else that violates the rules',
    icon: '📋',
  },
]

export default function ReportModal({ target, type, onClose }) {
  // target = { id, content, author } for messages, or { id, username } for users
  const { user } = useAuthStore()
  const { addReport } = useAppStore()
  const [step, setStep] = useState(1) // 1=category, 2=details, 3=done
  const [category, setCategory] = useState(null)
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!category) return
    setSubmitting(true)
    try {
      const report = {
        id: Date.now().toString(),
        type, // 'message' or 'user'
        targetId: target.id,
        targetContent: type === 'message' ? target.content : null,
        targetUser: type === 'message' ? target.author : target,
        reportedBy: { id: user.id, username: user.username, displayName: user.displayName },
        category,
        categoryLabel: REPORT_CATEGORIES.find(c => c.id === category)?.label,
        details,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      addReport(report)
      setStep(3)
    } catch (err) {
      toast.error('Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl mx-4 scale-in"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Flag size={16} style={{ color: 'var(--text-danger)' }} />
            <h2 className="font-bold" style={{ color: 'var(--header-primary)' }}>
              {step === 3 ? 'Report Submitted' : `Report ${type === 'message' ? 'Message' : 'User'}`}
            </h2>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>

        {/* Step 1 — Category */}
        {step === 1 && (
          <div className="p-4">
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              What's the issue with this {type}?
            </p>

            {/* Target preview */}
            {type === 'message' && target.content && (
              <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                <p className="font-semibold text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                  Message by {target.author?.displayName}
                </p>
                <p className="truncate" style={{ color: 'var(--text-normal)' }}>{target.content}</p>
              </div>
            )}

            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {REPORT_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => { setCategory(cat.id); setStep(2) }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-color)'; e.currentTarget.style.background = 'var(--bg-modifier-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-tertiary)' }}>
                  <span className="text-lg flex-shrink-0">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: 'var(--header-primary)' }}>{cat.label}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{cat.desc}</p>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Details */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-xl">{REPORT_CATEGORIES.find(c => c.id === category)?.icon}</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--header-primary)' }}>
                  {REPORT_CATEGORIES.find(c => c.id === category)?.label}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {REPORT_CATEGORIES.find(c => c.id === category)?.desc}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Additional Details <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
              </label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Describe what happened..."
                rows={4}
                className="input-base resize-none"
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <AlertTriangle size={14} style={{ color: 'var(--text-warning)', flexShrink: 0, marginTop: 2 }} />
              <p className="text-xs" style={{ color: 'var(--text-warning)' }}>
                False reports waste moderation resources and may result in action against your account.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-ghost flex-1" style={{ border: '1px solid var(--border-subtle)' }}>
                Back
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Flag size={14} />
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Done */}
        {step === 3 && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}>
              <CheckCircle size={28} style={{ color: 'var(--text-positive)' }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--header-primary)' }}>
              Report Received
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Thank you for keeping this server safe. Our moderators will review your report and take appropriate action.
            </p>
            <p className="text-xs mb-6 p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
              You can track report status in <strong style={{ color: 'var(--text-normal)' }}>Server Settings → Reports</strong>
            </p>
            <button onClick={onClose} className="btn-primary w-full">Done</button>
          </div>
        )}
      </div>
    </div>
  )
}
