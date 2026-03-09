import { useState } from 'react'
import { useAuthStore } from '../../store'
import { api } from '../../utils/api'
import { X, User, Shield, Bell, Paintbrush, Keyboard, Mic, Monitor, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'my-account', label: 'My Account', icon: User, section: 'User Settings' },
  { id: 'profile', label: 'Profile', icon: User, section: null },
  { id: 'privacy', label: 'Privacy & Safety', icon: Shield, section: null },
  { id: 'notifications', label: 'Notifications', icon: Bell, section: null },
  { id: 'appearance', label: 'Appearance', icon: Paintbrush, section: 'App Settings' },
  { id: 'voice', label: 'Voice & Video', icon: Mic, section: null },
  { id: 'keybinds', label: 'Keybinds', icon: Keyboard, section: null },
]

export default function SettingsModal() {
  const { user, updateUser, logout, setSettingsOpen } = useAuthStore()
  const [activeTab, setActiveTab] = useState('my-account')
  const [form, setForm] = useState({ displayName: user?.displayName || '', bio: user?.bio || '', customStatus: user?.customStatus || '' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await api.updateMe(form)
      updateUser(updated)
      toast.success('Settings saved!')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="fixed inset-0 z-50 flex modal-backdrop">
      <div className="flex w-full max-w-5xl mx-auto my-auto h-[85vh] rounded-lg overflow-hidden shadow-2xl" style={{ background: 'var(--bg-tertiary)' }}>
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 py-16 pr-2 pl-16 overflow-y-auto" style={{ background: 'var(--bg-secondary)' }}>
          {TABS.map((tab, i) => (
            <div key={tab.id}>
              {tab.section && (
                <p className="text-xs font-bold uppercase tracking-wide px-2 mt-4 mb-1" style={{ color: 'var(--text-muted)' }}>{tab.section}</p>
              )}
              <button
                onClick={() => setActiveTab(tab.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors"
                style={{
                  background: activeTab === tab.id ? 'var(--bg-modifier-selected)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--interactive-active)' : 'var(--interactive-normal)'
                }}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            </div>
          ))}
          <div className="h-px my-2" style={{ background: 'var(--bg-accent)' }} />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors"
            style={{ color: 'var(--text-danger)' }}
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-16 px-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold" style={{ color: 'var(--header-primary)' }}>
              {TABS.find(t => t.id === activeTab)?.label}
            </h2>
            <button onClick={() => setSettingsOpen(false)} className="p-1 rounded hover:bg-opacity-20 transition-colors" style={{ color: 'var(--interactive-normal)' }}>
              <X size={20} />
            </button>
          </div>

          {activeTab === 'my-account' && (
            <div className="space-y-6">
              {/* Profile card */}
              <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                <div className="h-24" style={{ background: 'linear-gradient(135deg, #5865F2, #7289DA)' }} />
                <div className="px-4 pb-4">
                  <div className="flex items-end gap-4 -mt-10 mb-4">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl text-white border-4" style={{ background: '#5865F2', borderColor: 'var(--bg-secondary)' }}>
                      {user?.displayName?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <p className="font-bold text-lg" style={{ color: 'var(--header-primary)' }}>{user?.displayName || user?.username}</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.username}#{user?.discriminator}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Display Name</label>
                  <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                    className="w-full px-3 py-2 rounded text-sm outline-none" style={{ background: 'var(--bg-primary)', color: 'var(--text-normal)' }} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Custom Status</label>
                  <input value={form.customStatus} onChange={e => setForm(f => ({ ...f, customStatus: e.target.value }))}
                    placeholder="Set a custom status..."
                    className="w-full px-3 py-2 rounded text-sm outline-none" style={{ background: 'var(--bg-primary)', color: 'var(--text-normal)' }} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>About Me</label>
                  <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    className="w-full px-3 py-2 rounded text-sm outline-none resize-none" rows={3}
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-normal)' }} />
                </div>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded text-sm font-medium text-white" style={{ background: '#5865F2' }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Customize how Nexus looks for you.</p>
              <div className="rounded p-4" style={{ background: 'var(--bg-secondary)' }}>
                <p className="font-semibold mb-3" style={{ color: 'var(--header-primary)' }}>Theme</p>
                <div className="flex gap-3">
                  <div className="p-3 rounded border-2 cursor-pointer" style={{ background: '#313338', borderColor: '#5865F2' }}>
                    <p className="text-xs font-medium text-white">Dark</p>
                  </div>
                  <div className="p-3 rounded border-2 cursor-pointer" style={{ background: '#f2f3f5', borderColor: 'transparent' }}>
                    <p className="text-xs font-medium text-gray-900">Light</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Configure notification preferences.</p>
              {['Enable Desktop Notifications', 'Enable Sound', 'Suppress @everyone and @here', 'Suppress All Role @mentions'].map(label => (
                <div key={label} className="flex items-center justify-between p-3 rounded" style={{ background: 'var(--bg-secondary)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-normal)' }}>{label}</span>
                  <div className="w-10 h-6 rounded-full cursor-pointer flex items-center px-1" style={{ background: '#5865F2' }}>
                    <div className="w-4 h-4 rounded-full bg-white ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage your privacy and safety settings.</p>
              {['Allow Direct Messages from Server Members', 'Allow Friend Requests from Server Members', 'Show current activity to others'].map(label => (
                <div key={label} className="flex items-center justify-between p-3 rounded" style={{ background: 'var(--bg-secondary)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-normal)' }}>{label}</span>
                  <div className="w-10 h-6 rounded-full cursor-pointer flex items-center px-1" style={{ background: '#5865F2' }}>
                    <div className="w-4 h-4 rounded-full bg-white ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {(activeTab === 'voice' || activeTab === 'keybinds' || activeTab === 'profile') && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-4xl mb-4">🚧</div>
              <p style={{ color: 'var(--text-muted)' }}>This section is coming soon!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
