import { useState } from 'react'
import { useAuthStore, useAppStore } from '../../store'
import { api } from '../../utils/api'
import {
  X, User, Shield, Bell, Paintbrush, Keyboard, Mic, LogOut,
  ChevronRight, Camera, Save, Eye, EyeOff, Trash2, AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import ThemeToggle from '../UI/ThemeToggle'

const SECTIONS = [
  {
    label: 'User Settings',
    tabs: [
      { id: 'account', label: 'My Account', icon: User },
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'privacy', label: 'Privacy & Safety', icon: Shield },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ]
  },
  {
    label: 'App Settings',
    tabs: [
      { id: 'appearance', label: 'Appearance', icon: Paintbrush },
      { id: 'voice', label: 'Voice & Video', icon: Mic },
      { id: 'keybinds', label: 'Keybinds', icon: Keyboard },
    ]
  }
]

function NotifToggle({ label, defaultOn = true }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
      <span className="text-sm" style={{ color: 'var(--text-normal)' }}>{label}</span>
      <button onClick={() => setOn(!on)}
        className="w-11 h-6 rounded-full relative transition-colors"
        style={{ background: on ? 'var(--brand-color)' : 'var(--bg-accent)' }}>
        <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
          style={{ left: on ? '22px' : '2px' }} />
      </button>
    </div>
  )
}

export default function SettingsModal() {
  const { user, updateUser, logout, setSettingsOpen } = useAuthStore()
  const { theme, setTheme } = useAppStore()
  const [activeTab, setActiveTab] = useState('account')
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    customStatus: user?.customStatus || '',
    email: user?.email || '',
  })
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await api.updateMe(form)
      updateUser(updated)
      toast.success('Settings saved!')
    } catch (err) {
      toast.error(err.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleLogout = () => { logout(); window.location.href = '/login' }

  const AVATAR_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899']
  const avatarColor = user?.id ? AVATAR_COLORS[user.id.charCodeAt(0) % AVATAR_COLORS.length] : '#6366f1'

  return (
    <div className="fixed inset-0 z-50 flex modal-backdrop">
      <div className="flex w-full max-w-5xl mx-auto my-8 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>

        {/* Sidebar */}
        <div className="w-60 flex-shrink-0 overflow-y-auto py-6"
          style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-subtle)' }}>
          {SECTIONS.map(section => (
            <div key={section.label} className="mb-4">
              <p className="px-4 mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                {section.label}
              </p>
              {section.tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg mx-2 transition-colors text-left"
                  style={{
                    width: 'calc(100% - 16px)',
                    background: activeTab === tab.id ? 'var(--bg-modifier-selected)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--interactive-active)' : 'var(--interactive-normal)'
                  }}>
                  <tab.icon size={15} />
                  {tab.label}
                  {activeTab === tab.id && <ChevronRight size={14} className="ml-auto" />}
                </button>
              ))}
            </div>
          ))}

          <div className="mx-2 h-px my-2" style={{ background: 'var(--border-subtle)' }} />

          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg mx-2 transition-colors"
            style={{ width: 'calc(100% - 16px)', color: 'var(--text-danger)' }}>
            <LogOut size={15} />
            Log Out
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold" style={{ color: 'var(--header-primary)' }}>
                {SECTIONS.flatMap(s => s.tabs).find(t => t.id === activeTab)?.label}
              </h2>
              <button onClick={() => setSettingsOpen(false)}
                className="p-2 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10"
                style={{ color: 'var(--interactive-normal)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Account */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                {/* Profile card */}
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                  <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}88)` }}>
                    <div className="absolute inset-0 opacity-20" style={{ background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                  </div>
                  <div className="px-6 pb-6" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="flex items-end justify-between -mt-12 mb-4">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl text-white border-4"
                          style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}88)`, borderColor: 'var(--bg-secondary)' }}>
                          {(user?.displayName || user?.username)?.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity border-4"
                          style={{ borderColor: 'var(--bg-secondary)' }}>
                          <Camera size={20} color="white" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--header-primary)' }}>
                      {user?.displayName || user?.username}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {user?.username}#{user?.discriminator}
                    </p>
                  </div>
                </div>

                {/* Fields */}
                <div className="space-y-4">
                  {[
                    { key: 'displayName', label: 'Display Name', placeholder: 'Your display name' },
                    { key: 'email', label: 'Email', placeholder: 'your@email.com', type: 'email' },
                    { key: 'customStatus', label: 'Custom Status', placeholder: 'What\'s on your mind?' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                        {field.label}
                      </label>
                      <input type={field.type || 'text'} value={form[field.key]}
                        onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        placeholder={field.placeholder} className="input-base" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>About Me</label>
                    <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                      placeholder="Tell others about yourself..." rows={3}
                      className="input-base resize-none" style={{ fontFamily: 'inherit' }} />
                  </div>
                  <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                    <Save size={15} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                {/* Change password */}
                <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-semibold mb-4" style={{ color: 'var(--header-primary)' }}>Change Password</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'current', label: 'Current Password' },
                      { key: 'new', label: 'New Password' },
                      { key: 'confirm', label: 'Confirm New Password' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                        <div className="relative">
                          <input type={showPw ? 'text' : 'password'} value={pwForm[f.key]}
                            onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                            className="input-base pr-10" />
                          <button onClick={() => setShowPw(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    ))}
                    <button className="btn-primary" onClick={() => toast.success('Password updated!')}>
                      Update Password
                    </button>
                  </div>
                </div>

                {/* Danger zone */}
                <div className="rounded-xl p-5" style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} style={{ color: 'var(--text-danger)' }} />
                    <h3 className="font-semibold" style={{ color: 'var(--text-danger)' }}>Danger Zone</h3>
                  </div>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                    Deleting your account is permanent and cannot be undone.
                  </p>
                  <button
                    onClick={() => toast.error('Account deletion is disabled in this demo')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--text-danger)', border: '1px solid rgba(248,113,113,0.3)' }}>
                    <Trash2 size={14} />
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-semibold mb-4" style={{ color: 'var(--header-primary)' }}>Avatar Color</h3>
                  <div className="flex gap-3 flex-wrap">
                    {['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316'].map(color => (
                      <button key={color} className="w-10 h-10 rounded-full border-2 transition-transform hover:scale-110"
                        style={{ background: color, borderColor: color === avatarColor ? 'white' : 'transparent' }}
                        onClick={() => toast.success('Avatar color updated!')} />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--header-primary)' }}>Profile Preview</h3>
                  <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white"
                      style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}88)` }}>
                      {(user?.displayName || user?.username)?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--header-primary)' }}>{user?.displayName}</p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.customStatus || 'No status set'}</p>
                      {user?.bio && <p className="text-sm mt-1" style={{ color: 'var(--text-normal)' }}>{user.bio}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-semibold mb-4" style={{ color: 'var(--header-primary)' }}>Desktop Notifications</h3>
                  <NotifToggle label="Enable Desktop Notifications" defaultOn={true} />
                  <NotifToggle label="Enable Notification Sounds" defaultOn={true} />
                  <NotifToggle label="Notify for All Messages" defaultOn={false} />
                  <NotifToggle label="Notify for @mentions Only" defaultOn={true} />
                  <NotifToggle label="Notify for Direct Messages" defaultOn={true} />
                </div>
                <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-semibold mb-4" style={{ color: 'var(--header-primary)' }}>Suppress Notifications</h3>
                  <NotifToggle label="Suppress @everyone and @here" defaultOn={false} />
                  <NotifToggle label="Suppress All Role @mentions" defaultOn={false} />
                  <NotifToggle label="Mute New Messages in Muted Channels" defaultOn={true} />
                </div>
              </div>
            )}

            {/* Privacy */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-semibold mb-4" style={{ color: 'var(--header-primary)' }}>Privacy Settings</h3>
                  <NotifToggle label="Allow DMs from Server Members" defaultOn={true} />
                  <NotifToggle label="Allow Friend Requests from Server Members" defaultOn={true} />
                  <NotifToggle label="Show Current Activity Status" defaultOn={true} />
                  <NotifToggle label="Show Online Status to Everyone" defaultOn={true} />
                </div>
                <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-semibold mb-4" style={{ color: 'var(--header-primary)' }}>Safety</h3>
                  <NotifToggle label="Filter Explicit Media Content" defaultOn={true} />
                  <NotifToggle label="Enable Two-Factor Authentication" defaultOn={false} />
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-semibold mb-4" style={{ color: 'var(--header-primary)' }}>Theme</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-normal)' }}>
                        Current theme: <strong>{theme === 'dark' ? 'Dark' : 'Light'}</strong>
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Toggle between dark and light mode</p>
                    </div>
                    <ThemeToggle />
                  </div>
                </div>
                <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-semibold mb-4" style={{ color: 'var(--header-primary)' }}>Accent Color</h3>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { name: 'Indigo', color: '#6366f1' },
                      { name: 'Purple', color: '#8b5cf6' },
                      { name: 'Cyan', color: '#06b6d4' },
                      { name: 'Green', color: '#10b981' },
                      { name: 'Pink', color: '#ec4899' },
                      { name: 'Orange', color: '#f97316' },
                    ].map(c => (
                      <button key={c.color} title={c.name}
                        className="w-10 h-10 rounded-full border-2 transition-transform hover:scale-110"
                        style={{ background: c.color, borderColor: 'transparent' }}
                        onClick={() => toast.success(`${c.name} theme applied!`)} />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-semibold mb-4" style={{ color: 'var(--header-primary)' }}>Font Size</h3>
                  <input type="range" min={12} max={20} defaultValue={15} className="w-full" />
                  <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    <span>Small</span><span>Medium</span><span>Large</span>
                  </div>
                </div>
                <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--header-primary)' }}>Display Options</h3>
                  <NotifToggle label="Show Message Timestamps" defaultOn={true} />
                  <NotifToggle label="Compact Message Mode" defaultOn={false} />
                  <NotifToggle label="Show Avatar in Messages" defaultOn={true} />
                  <NotifToggle label="Animate Emoji" defaultOn={true} />
                </div>
              </div>
            )}

            {/* Voice */}
            {activeTab === 'voice' && (
              <div className="space-y-6">
                <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-semibold mb-4" style={{ color: 'var(--header-primary)' }}>Input Device</h3>
                  <select className="input-base">
                    <option>Default Microphone</option>
                    <option>Built-in Microphone</option>
                  </select>
                  <div className="mt-3">
                    <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Input Volume</label>
                    <input type="range" min={0} max={100} defaultValue={80} className="w-full" />
                  </div>
                </div>
                <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-semibold mb-4" style={{ color: 'var(--header-primary)' }}>Output Device</h3>
                  <select className="input-base">
                    <option>Default Speakers</option>
                    <option>Built-in Speakers</option>
                  </select>
                  <div className="mt-3">
                    <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Output Volume</label>
                    <input type="range" min={0} max={100} defaultValue={100} className="w-full" />
                  </div>
                </div>
                <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--header-primary)' }}>Advanced</h3>
                  <NotifToggle label="Noise Suppression" defaultOn={true} />
                  <NotifToggle label="Echo Cancellation" defaultOn={true} />
                  <NotifToggle label="Automatic Gain Control" defaultOn={true} />
                  <NotifToggle label="Push to Talk" defaultOn={false} />
                </div>
              </div>
            )}

            {/* Keybinds */}
            {activeTab === 'keybinds' && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                <div className="px-5 py-3 border-b" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
                  <h3 className="font-semibold" style={{ color: 'var(--header-primary)' }}>Keyboard Shortcuts</h3>
                </div>
                {[
                  { action: 'Server Search', keys: ['⌘', 'K'] },
                  { action: 'Open Settings', keys: ['⌘', ','] },
                  { action: 'Previous Channel', keys: ['Alt', '↑'] },
                  { action: 'Next Channel', keys: ['Alt', '↓'] },
                  { action: 'Send Message', keys: ['Enter'] },
                  { action: 'New Line', keys: ['Shift', 'Enter'] },
                  { action: 'Edit Last Message', keys: ['↑'] },
                  { action: 'Close Modal', keys: ['Esc'] },
                  { action: 'Upload File', keys: ['⌘', 'U'] },
                ].map(kb => (
                  <div key={kb.action} className="flex items-center justify-between px-5 py-3 border-b"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
                    <span className="text-sm" style={{ color: 'var(--text-normal)' }}>{kb.action}</span>
                    <div className="flex gap-1">
                      {kb.keys.map((key, i) => (
                        <kbd key={i} className="px-2 py-0.5 rounded text-xs font-semibold"
                          style={{ background: 'var(--bg-accent)', color: 'var(--text-normal)', border: '1px solid var(--border-subtle)' }}>
                          {key}
                        </kbd>
                      ))}
                    </div>
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
