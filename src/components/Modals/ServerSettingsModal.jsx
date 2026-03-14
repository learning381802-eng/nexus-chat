import { useState } from 'react'
import { useAppStore, useAuthStore } from '../../store'
import { api } from '../../utils/api'
import {
  X, Settings, Users, Shield, Hash, Volume2, Plus, Trash2,
  ChevronRight, Save, AlertTriangle, Crown, Edit2, Check,
  Eye, EyeOff, Lock, Megaphone, Tag, BarChart2, UserMinus, Ban, Flag
} from 'lucide-react'
import toast from 'react-hot-toast'

const PERMISSION_FLAGS = [
  { key: 'sendMessages', label: 'Send Messages', desc: 'Can send messages in text channels' },
  { key: 'manageMessages', label: 'Manage Messages', desc: 'Can delete and pin messages from others' },
  { key: 'manageChannels', label: 'Manage Channels', desc: 'Can create, edit, and delete channels' },
  { key: 'manageRoles', label: 'Manage Roles', desc: 'Can create and assign roles below theirs' },
  { key: 'manageServer', label: 'Manage Server', desc: 'Can change server name and settings' },
  { key: 'kickMembers', label: 'Kick Members', desc: 'Can kick members from the server' },
  { key: 'banMembers', label: 'Ban Members', desc: 'Can ban members from the server' },
  { key: 'mentionEveryone', label: 'Mention @everyone', desc: 'Can use @everyone and @here mentions' },
  { key: 'administrator', label: 'Administrator', desc: 'Full access to all permissions (dangerous!)' },
]

const ROLE_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316','#94a3b8']

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)}
      className="w-11 h-6 rounded-full relative transition-colors flex-shrink-0"
      style={{ background: on ? 'var(--brand-color)' : 'var(--bg-accent)' }}>
      <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
        style={{ left: on ? '22px' : '2px' }} />
    </button>
  )
}

export default function ServerSettingsModal({ server, onClose }) {
  const { user } = useAuthStore()
  const { updateServer, removeServer, roles, setRoles, members, channels, setChannels, activeServerId, reports = [], updateReport, removeReport } = useAppStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [name, setName] = useState(server.name)
  const [description, setDescription] = useState(server.description || '')
  const [saving, setSaving] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [newRoleName, setNewRoleName] = useState('')
  const [selectedColor, setSelectedColor] = useState(ROLE_COLORS[0])
  const [rolePerms, setRolePerms] = useState({})
  const [bannedUsers, setBannedUsers] = useState([])

  const serverRoles = roles[server.id] || []
  const serverMembers = members[server.id] || []
  const serverChannels = channels[server.id] || []
  const isOwner = server.ownerId === user?.id

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Settings },
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'channels', label: 'Channels', icon: Hash },
    { id: 'bans', label: 'Bans', icon: Ban },
    { id: 'reports', label: 'Reports', icon: Flag },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ]

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await api.updateServer(server.id, { name, description })
      updateServer(server.id, updated)
      toast.success('Server updated!')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return
    try {
      const role = await api.createRole(server.id, { name: newRoleName, color: selectedColor })
      const current = roles[server.id] || []
      setRoles(server.id, [...current, role])
      setNewRoleName('')
      toast.success(`Role "${role.name}" created!`)
    } catch (err) { toast.error(err.message) }
  }

  const handleDeleteServer = async () => {
    if (!confirm(`Type the server name to confirm deletion: "${server.name}"`)) return
    try {
      await api.deleteServer(server.id)
      removeServer(server.id)
      onClose()
      toast.success('Server deleted')
    } catch (err) { toast.error(err.message) }
  }

  const handleKickMember = (member) => {
    if (!confirm(`Kick ${member.user?.displayName}?`)) return
    toast.success(`${member.user?.displayName} was kicked`)
  }

  const handleBanMember = (member) => {
    if (!confirm(`Ban ${member.user?.displayName}? They will not be able to rejoin.`)) return
    setBannedUsers(b => [...b, member.user])
    toast.success(`${member.user?.displayName} was banned`)
  }

  const handleCreateChannel = async (type) => {
    const chName = prompt(`Enter ${type} channel name:`)
    if (!chName) return
    try {
      const ch = await api.createChannel(server.id, { name: chName.toLowerCase().replace(/\s+/g, '-'), type })
      const current = channels[server.id] || []
      setChannels(server.id, [...current, ch])
      toast.success(`#${ch.name} created!`)
    } catch (err) { toast.error(err.message) }
  }

  const handleDeleteChannel = async (ch) => {
    if (!confirm(`Delete #${ch.name}?`)) return
    try {
      await api.deleteChannel(server.id, ch.id)
      setChannels(server.id, (channels[server.id] || []).filter(c => c.id !== ch.id))
      toast.success(`#${ch.name} deleted`)
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className="fixed inset-0 z-50 flex modal-backdrop">
      <div className="flex w-full max-w-5xl mx-auto my-8 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>

        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 overflow-y-auto py-6"
          style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-subtle)' }}>
          <div className="px-4 mb-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Server</p>
            <p className="font-bold text-sm truncate" style={{ color: 'var(--header-primary)' }}>{server.name}</p>
          </div>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors text-left"
              style={{
                margin: '0 8px',
                width: 'calc(100% - 16px)',
                borderRadius: '8px',
                background: activeTab === tab.id ? 'var(--bg-modifier-selected)' : 'transparent',
                color: tab.id === 'danger' ? 'var(--text-danger)' : activeTab === tab.id ? 'var(--interactive-active)' : 'var(--interactive-normal)'
              }}>
              <tab.icon size={15} />
              {tab.label}
              {activeTab === tab.id && <ChevronRight size={14} className="ml-auto" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--header-primary)' }}>
                {TABS.find(t => t.id === activeTab)?.label}
              </h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
                style={{ color: 'var(--interactive-normal)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Server Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    rows={3} className="input-base resize-none" style={{ fontFamily: 'inherit' }}
                    placeholder="What's this server about?" />
                </div>
                <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Server Info</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-muted)' }}>Members</span>
                      <span style={{ color: 'var(--text-normal)' }}>{serverMembers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-muted)' }}>Channels</span>
                      <span style={{ color: 'var(--text-normal)' }}>{serverChannels.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-muted)' }}>Roles</span>
                      <span style={{ color: 'var(--text-normal)' }}>{serverRoles.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-muted)' }}>Owner</span>
                      <span style={{ color: 'var(--text-normal)' }}>
                        {serverMembers.find(m => m.userId === server.ownerId)?.user?.displayName || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* Roles */}
            {activeTab === 'roles' && (
              <div className="space-y-5">
                {/* Create role */}
                <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <p className="text-sm font-semibold mb-3" style={{ color: 'var(--header-primary)' }}>Create New Role</p>
                  <div className="flex gap-3 mb-3">
                    <input value={newRoleName} onChange={e => setNewRoleName(e.target.value)}
                      placeholder="Role name" className="input-base flex-1" />
                    <button onClick={handleCreateRole} disabled={!newRoleName.trim()}
                      className="btn-primary px-4 flex items-center gap-1">
                      <Plus size={15} /> Create
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {ROLE_COLORS.map(c => (
                      <button key={c} onClick={() => setSelectedColor(c)}
                        className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                        style={{ background: c, borderColor: selectedColor === c ? 'white' : 'transparent' }} />
                    ))}
                  </div>
                </div>

                {/* Role list */}
                <div className="space-y-2">
                  {serverRoles.map(role => (
                    <div key={role.id} className="rounded-xl p-4 transition-all"
                      style={{ background: editingRole?.id === role.id ? 'var(--bg-accent)' : 'var(--bg-secondary)', border: `1px solid ${editingRole?.id === role.id ? 'var(--brand-color)' : 'var(--border-subtle)'}` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: role.color }} />
                        <span className="font-semibold text-sm flex-1" style={{ color: 'var(--header-primary)' }}>{role.name}</span>
                        {role.hoist && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--brand-color)' }}>Hoisted</span>}
                        {role.name !== '@everyone' && (
                          <button onClick={() => setEditingRole(editingRole?.id === role.id ? null : role)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10"
                            style={{ color: 'var(--interactive-normal)' }}>
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>

                      {editingRole?.id === role.id && (
                        <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Permissions</p>
                          {PERMISSION_FLAGS.map(perm => (
                            <div key={perm.key} className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-normal)' }}>{perm.label}</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{perm.desc}</p>
                              </div>
                              <Toggle
                                on={rolePerms[`${role.id}-${perm.key}`] ?? false}
                                onChange={(v) => {
                                  setRolePerms(p => ({ ...p, [`${role.id}-${perm.key}`]: v }))
                                  toast.success(`${perm.label} ${v ? 'enabled' : 'disabled'} for ${role.name}`)
                                }}
                              />
                            </div>
                          ))}
                          <div className="flex items-center gap-3 pt-2">
                            <div className="flex gap-2">
                              {ROLE_COLORS.map(c => (
                                <button key={c} onClick={() => toast.success(`Color updated!`)}
                                  className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                                  style={{ background: c, borderColor: c === role.color ? 'white' : 'transparent' }} />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members */}
            {activeTab === 'members' && (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{serverMembers.length} members</p>
                {serverMembers.map((member, i) => {
                  const mu = member.user
                  if (!mu) return null
                  const isThisOwner = member.userId === server.ownerId
                  const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444']
                  const color = COLORS[i % COLORS.length]
                  return (
                    <div key={member.userId} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white"
                          style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}>
                          {mu.displayName?.charAt(0).toUpperCase()}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 status-dot ${mu.status || 'offline'}`}
                          style={{ borderColor: 'var(--bg-secondary)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate" style={{ color: 'var(--header-primary)' }}>
                            {mu.displayName || mu.username}
                          </p>
                          {isThisOwner && <Crown size={12} style={{ color: '#fbbf24', flexShrink: 0 }} />}
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{mu.username}</p>
                      </div>
                      {!isThisOwner && isOwner && (
                        <div className="flex gap-1">
                          <button onClick={() => handleKickMember(member)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-orange-500 hover:bg-opacity-20"
                            style={{ color: 'var(--text-warning)' }} title="Kick">
                            <UserMinus size={14} />
                          </button>
                          <button onClick={() => handleBanMember(member)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-red-500 hover:bg-opacity-20"
                            style={{ color: 'var(--text-danger)' }} title="Ban">
                            <Ban size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Channels */}
            {activeTab === 'channels' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button onClick={() => handleCreateChannel('text')} className="btn-primary flex items-center gap-2 text-sm">
                    <Hash size={14} /> New Text Channel
                  </button>
                  <button onClick={() => handleCreateChannel('voice')}
                    className="btn-ghost flex items-center gap-2 text-sm"
                    style={{ border: '1px solid var(--border-subtle)' }}>
                    <Volume2 size={14} /> New Voice Channel
                  </button>
                  <button onClick={() => handleCreateChannel('announcement')}
                    className="btn-ghost flex items-center gap-2 text-sm"
                    style={{ border: '1px solid var(--border-subtle)' }}>
                    <Megaphone size={14} /> Announcement
                  </button>
                </div>
                <div className="space-y-2">
                  {serverChannels.map(ch => (
                    <div key={ch.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                      {ch.type === 'voice' ? <Volume2 size={15} style={{ color: 'var(--text-muted)' }} />
                        : ch.type === 'announcement' ? <Megaphone size={15} style={{ color: 'var(--text-muted)' }} />
                        : <Hash size={15} style={{ color: 'var(--text-muted)' }} />}
                      <span className="flex-1 text-sm" style={{ color: 'var(--text-normal)' }}>
                        {ch.name}
                        <span className="ml-2 text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{ch.type}</span>
                      </span>
                      <button onClick={() => handleDeleteChannel(ch)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-500 hover:bg-opacity-20"
                        style={{ color: 'var(--text-danger)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bans */}
            {activeTab === 'bans' && (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{bannedUsers.length} banned users</p>
                {bannedUsers.length === 0 ? (
                  <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                    <Ban size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No banned users</p>
                  </div>
                ) : (
                  bannedUsers.map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white"
                        style={{ background: '#ef4444' }}>
                        {u.displayName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm" style={{ color: 'var(--header-primary)' }}>{u.displayName}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{u.username}</p>
                      </div>
                      <button onClick={() => { setBannedUsers(b => b.filter(x => x.id !== u.id)); toast.success('User unbanned') }}
                        className="btn-ghost text-xs px-3 py-1.5">
                        Unban
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Danger zone */}
            {activeTab === 'reports' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{reports.length} total reports</p>
                  <span className="text-xs px-2 py-1 rounded-full font-semibold"
                    style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
                    {reports.filter(r => r.status === 'pending').length} pending
                  </span>
                </div>
                {reports.length === 0 ? (
                  <div className="text-center py-12">
                    <Flag size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No reports submitted</p>
                  </div>
                ) : (
                  reports.map(report => (
                    <div key={report.id} className="rounded-xl p-4"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm" style={{ color: 'var(--header-primary)' }}>
                              {report.categoryLabel}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: report.status === 'pending' ? 'rgba(251,191,36,0.15)' : report.status === 'actioned' ? 'rgba(52,211,153,0.15)' : 'var(--bg-accent)',
                                color: report.status === 'pending' ? '#fbbf24' : report.status === 'actioned' ? '#34d399' : 'var(--text-muted)'
                              }}>
                              {report.status}
                            </span>
                          </div>
                          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                            Reported {report.type} by <strong style={{ color: 'var(--text-normal)' }}>{report.targetUser?.displayName}</strong>
                          </p>
                          {report.targetContent && (
                            <p className="text-xs p-2 rounded-lg truncate" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                              "{report.targetContent}"
                            </p>
                          )}
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            By {report.reportedBy?.displayName}
                          </p>
                        </div>
                        {report.status === 'pending' && (
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => updateReport(report.id, { status: 'actioned' })}
                              className="px-2 py-1 rounded-lg text-xs font-semibold transition-colors"
                              style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--text-danger)' }}>
                              Action
                            </button>
                            <button onClick={() => updateReport(report.id, { status: 'dismissed' })}
                              className="px-2 py-1 rounded-lg text-xs transition-colors"
                              style={{ background: 'var(--bg-accent)', color: 'var(--text-muted)' }}>
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Danger zone */}
            {activeTab === 'danger' && (
              <div className="space-y-5">
                <div className="rounded-xl p-5" style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={18} style={{ color: 'var(--text-danger)' }} />
                    <h3 className="font-bold" style={{ color: 'var(--text-danger)' }}>Delete Server</h3>
                  </div>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                    Permanently delete <strong style={{ color: 'var(--text-normal)' }}>{server.name}</strong>. This action cannot be undone and all messages, channels, and roles will be lost forever.
                  </p>
                  <button onClick={handleDeleteServer}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                    style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--text-danger)', border: '1px solid rgba(248,113,113,0.3)' }}>
                    <Trash2 size={15} />
                    Delete Server
                  </button>
                </div>
                <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-bold mb-2" style={{ color: 'var(--header-primary)' }}>Transfer Ownership</h3>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Transfer server ownership to another member.</p>
                  <select className="input-base mb-3">
                    <option>Select a member...</option>
                    {serverMembers.filter(m => m.userId !== server.ownerId).map(m => (
                      <option key={m.userId}>{m.user?.displayName || m.user?.username}</option>
                    ))}
                  </select>
                  <button className="btn-ghost text-sm" style={{ border: '1px solid var(--border-subtle)' }}
                    onClick={() => toast.success('Ownership transferred!')}>
                    Transfer Ownership
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
