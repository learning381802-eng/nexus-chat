import { useState } from 'react'
import { X, Tag, Check } from 'lucide-react'
import { useAppStore, useAuthStore } from '../../store'
import { api } from '../../utils/api'
import toast from 'react-hot-toast'

export default function RoleAssignment({ serverId, onClose }) {
  const { roles, members } = useAppStore()
  const { user } = useAuthStore()
  const serverRoles = (roles[serverId] || []).filter(r => r.name !== '@everyone')
  const serverMembers = members[serverId] || []
  const myMember = serverMembers.find(m => m.userId === user?.id)
  const myRoles = myMember?.roles || []

  const assignableRoles = serverRoles.filter(r => r.selfAssignable !== false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl mx-4"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Tag size={18} style={{ color: 'var(--brand-color)' }} />
            <h2 className="font-bold text-lg" style={{ color: 'var(--header-primary)' }}>Self-Assign Roles</h2>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <div className="p-6">
          {assignableRoles.length === 0 ? (
            <div className="text-center py-8">
              <Tag size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No self-assignable roles available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignableRoles.map(role => {
                const hasRole = myRoles.includes(role.id)
                return (
                  <button key={role.id}
                    onClick={() => toast.success(hasRole ? `Removed ${role.name}` : `Got ${role.name} role!`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                    style={{
                      background: hasRole ? `${role.color}15` : 'var(--bg-tertiary)',
                      border: `1px solid ${hasRole ? role.color : 'var(--border-subtle)'}`,
                    }}>
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: role.color }} />
                    <span className="flex-1 font-medium text-sm" style={{ color: 'var(--header-primary)' }}>{role.name}</span>
                    {hasRole && <Check size={16} style={{ color: role.color }} />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
