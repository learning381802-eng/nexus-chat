import { useState } from 'react'
import { Flag, CheckCircle, XCircle, Clock, Eye, Trash2, Ban, UserMinus, X, AlertTriangle, Filter } from 'lucide-react'
import { useAppStore, useAuthStore } from '../../store'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', icon: Clock },
  reviewed: { label: 'Reviewed', color: '#818cf8', bg: 'rgba(129,140,248,0.1)', icon: Eye },
  actioned: { label: 'Actioned', color: '#34d399', bg: 'rgba(52,211,153,0.1)', icon: CheckCircle },
  dismissed: { label: 'Dismissed', color: '#64748b', bg: 'rgba(100,116,139,0.1)', icon: XCircle },
}

export default function ReportsDashboard({ onClose }) {
  const { user } = useAuthStore()
  const { reports = [], updateReport, removeReport } = useAppStore()
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter)

  const handleAction = (report, action) => {
    if (action === 'dismiss') {
      updateReport(report.id, { status: 'dismissed', reviewedBy: user.username, reviewedAt: new Date().toISOString() })
      toast.success('Report dismissed')
    } else if (action === 'action') {
      updateReport(report.id, { status: 'actioned', reviewedBy: user.username, reviewedAt: new Date().toISOString() })
      toast.success('Report marked as actioned')
    } else if (action === 'review') {
      updateReport(report.id, { status: 'reviewed', reviewedBy: user.username, reviewedAt: new Date().toISOString() })
    }
    setSelected(null)
  }

  const counts = {
    all: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    reviewed: reports.filter(r => r.status === 'reviewed').length,
    actioned: reports.filter(r => r.status === 'actioned').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  }

  return (
    <div className="fixed inset-0 z-50 flex modal-backdrop">
      <div className="flex w-full max-w-5xl mx-auto my-8 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>

        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 border-r py-6" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="px-4 mb-5">
            <div className="flex items-center gap-2 mb-1">
              <Flag size={16} style={{ color: 'var(--text-danger)' }} />
              <h2 className="font-bold text-sm" style={{ color: 'var(--header-primary)' }}>Reports Dashboard</h2>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Moderation Center</p>
          </div>

          {Object.entries(counts).map(([key, count]) => (
            <button key={key} onClick={() => setFilter(key)}
              className="w-full flex items-center justify-between px-4 py-2 text-sm rounded-lg transition-colors capitalize"
              style={{
                margin: '0 8px',
                width: 'calc(100% - 16px)',
                background: filter === key ? 'var(--bg-modifier-selected)' : 'transparent',
                color: filter === key ? 'var(--interactive-active)' : 'var(--interactive-normal)',
              }}>
              <span>{key === 'all' ? 'All Reports' : key.charAt(0).toUpperCase() + key.slice(1)}</span>
              {count > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: key === 'pending' ? 'rgba(251,191,36,0.2)' : 'var(--bg-accent)',
                    color: key === 'pending' ? '#fbbf24' : 'var(--text-muted)'
                  }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
            style={{ borderColor: 'var(--border-subtle)' }}>
            <h3 className="font-semibold" style={{ color: 'var(--header-primary)' }}>
              {filter === 'all' ? 'All Reports' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
                ({filtered.length})
              </span>
            </h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
              style={{ color: 'var(--interactive-normal)' }}>
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Report list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ maxWidth: selected ? 320 : '100%' }}>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: 'var(--bg-accent)' }}>
                    <Flag size={22} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <p className="font-semibold mb-1" style={{ color: 'var(--header-secondary)' }}>No reports</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {filter === 'all' ? 'No reports have been submitted yet' : `No ${filter} reports`}
                  </p>
                </div>
              ) : (
                filtered.map(report => {
                  const statusCfg = STATUS_CONFIG[report.status]
                  const isSelected = selected?.id === report.id
                  return (
                    <button key={report.id} onClick={() => setSelected(isSelected ? null : report)}
                      className="w-full text-left rounded-xl p-4 transition-all"
                      style={{
                        background: isSelected ? 'var(--bg-accent)' : 'var(--bg-tertiary)',
                        border: `1px solid ${isSelected ? 'var(--brand-color)' : 'var(--border-subtle)'}`,
                      }}>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ background: '#ef4444' }}>
                          {report.targetUser?.displayName?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm" style={{ color: 'var(--header-primary)' }}>
                              {report.categoryLabel}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: statusCfg.bg, color: statusCfg.color }}>
                              {statusCfg.label}
                            </span>
                          </div>
                          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                            Reported {report.type}: <strong style={{ color: 'var(--text-normal)' }}>
                              {report.targetUser?.displayName || report.targetUser?.username}
                            </strong>
                          </p>
                          {report.targetContent && (
                            <p className="text-xs truncate p-2 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                              "{report.targetContent}"
                            </p>
                          )}
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            By {report.reportedBy?.displayName} · {format(new Date(report.createdAt), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Detail panel */}
            {selected && (
              <div className="w-72 flex-shrink-0 border-l overflow-y-auto p-5 space-y-4"
                style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm" style={{ color: 'var(--header-primary)' }}>Report Details</h4>
                  <button onClick={() => setSelected(null)} style={{ color: 'var(--text-muted)' }}><X size={14} /></button>
                </div>

                {/* Status */}
                <div className="rounded-xl p-3" style={{ background: STATUS_CONFIG[selected.status].bg, border: `1px solid ${STATUS_CONFIG[selected.status].color}33` }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: STATUS_CONFIG[selected.status].color }}>
                    Status: {STATUS_CONFIG[selected.status].label}
                  </p>
                  {selected.reviewedBy && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Reviewed by {selected.reviewedBy}
                    </p>
                  )}
                </div>

                {/* Reporter */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Reported By</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: 'var(--brand-color)' }}>
                      {selected.reportedBy?.displayName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-normal)' }}>{selected.reportedBy?.displayName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{selected.reportedBy?.username}</p>
                    </div>
                  </div>
                </div>

                {/* Target */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Reported {selected.type === 'message' ? 'Message' : 'User'}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: '#ef4444' }}>
                      {selected.targetUser?.displayName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-normal)' }}>{selected.targetUser?.displayName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{selected.targetUser?.username}</p>
                    </div>
                  </div>
                  {selected.targetContent && (
                    <div className="p-3 rounded-xl text-sm" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-normal)' }}>
                      "{selected.targetContent}"
                    </div>
                  )}
                </div>

                {/* Category & details */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Category</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-normal)' }}>{selected.categoryLabel}</p>
                </div>

                {selected.details && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Additional Details</p>
                    <p className="text-sm p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-normal)', border: '1px solid var(--border-subtle)' }}>
                      {selected.details}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {selected.status === 'pending' && (
                  <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Actions</p>
                    <button onClick={() => handleAction(selected, 'action')}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
                      style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--text-danger)', border: '1px solid rgba(248,113,113,0.2)' }}>
                      <Ban size={14} /> Ban Reported User
                    </button>
                    <button onClick={() => handleAction(selected, 'review')}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
                      style={{ background: 'rgba(129,140,248,0.1)', color: 'var(--brand-color)', border: '1px solid rgba(129,140,248,0.2)' }}>
                      <Eye size={14} /> Mark as Reviewed
                    </button>
                    <button onClick={() => handleAction(selected, 'dismiss')}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
                      style={{ background: 'var(--bg-accent)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                      <XCircle size={14} /> Dismiss Report
                    </button>
                  </div>
                )}

                {selected.status !== 'pending' && (
                  <button onClick={() => removeReport(selected.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors"
                    style={{ background: 'var(--bg-accent)', color: 'var(--text-muted)' }}>
                    <Trash2 size={14} /> Delete Report
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
