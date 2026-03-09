import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, useAuthStore } from '../../store'
import { api } from '../../utils/api'
import { Users, UserCheck, UserX, Clock, MessageCircle, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'online', label: 'Online', icon: Users },
  { id: 'all', label: 'All', icon: Users },
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'blocked', label: 'Blocked', icon: UserX },
  { id: 'add', label: 'Add Friend', icon: UserPlus, accent: true },
]

export default function FriendsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { friends, setFriends, addFriend, updateFriend, removeFriend, setActiveDm } = useAppStore()
  const [activeTab, setActiveTab] = useState('online')
  const [addForm, setAddForm] = useState({ username: '', discriminator: '' })
  const [addLoading, setAddLoading] = useState(false)

  const accepted = friends.filter(f => f.status === 'accepted')
  const pending = friends.filter(f => f.status === 'pending')
  const online = accepted.filter(f => f.friend?.status === 'online')

  const handleAddFriend = async (e) => {
    e.preventDefault()
    if (!addForm.username || !addForm.discriminator) { toast.error('Enter username and discriminator'); return }
    setAddLoading(true)
    try {
      const f = await api.sendFriendRequest(addForm)
      addFriend(f)
      toast.success('Friend request sent!')
      setAddForm({ username: '', discriminator: '' })
    } catch (err) { toast.error(err.message) }
    finally { setAddLoading(false) }
  }

  const handleAccept = async (f) => {
    const updated = await api.respondFriendRequest(f.id, { status: 'accepted' })
    updateFriend(f.id, updated)
    toast.success('Friend request accepted!')
  }

  const handleDecline = async (f) => {
    await api.respondFriendRequest(f.id, { status: 'declined' })
    removeFriend(f.id)
  }

  const handleMessage = (friend) => {
    setActiveDm(friend.id)
    navigate(`/channels/@me/${friend.id}`)
  }

  const displayList = activeTab === 'online' ? online : activeTab === 'pending' ? pending : accepted

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg-tertiary)' }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 h-12 border-b flex-shrink-0" style={{ borderColor: 'rgba(0,0,0,0.2)' }}>
        <Users size={20} style={{ color: 'var(--interactive-normal)' }} />
        <span className="font-semibold text-sm" style={{ color: 'var(--header-primary)' }}>Friends</span>
        <div className="w-px h-6" style={{ background: 'var(--bg-accent)' }} />
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-3 py-1 rounded text-sm font-medium transition-colors"
            style={{
              background: activeTab === tab.id ? (tab.accent ? '#5865F2' : 'var(--bg-modifier-selected)') : 'transparent',
              color: tab.accent ? (activeTab === tab.id ? 'white' : '#57F287') : activeTab === tab.id ? 'var(--interactive-active)' : 'var(--interactive-normal)'
            }}
          >
            {tab.label}
            {tab.id === 'pending' && pending.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full text-xs bg-red-500 text-white w-4 h-4">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'add' ? (
          <div className="max-w-lg">
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--header-primary)' }}>Add Friend</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>You can add friends with their Nexus username and tag.</p>
            <div className="flex gap-2">
              <input
                value={addForm.username}
                onChange={e => setAddForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Username"
                className="flex-1 px-3 py-2 rounded text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-normal)' }}
              />
              <input
                value={addForm.discriminator}
                onChange={e => setAddForm(f => ({ ...f, discriminator: e.target.value }))}
                placeholder="#0000"
                className="w-24 px-3 py-2 rounded text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-normal)' }}
                maxLength={4}
              />
              <button
                onClick={handleAddFriend}
                disabled={addLoading}
                className="px-4 py-2 rounded text-sm font-medium text-white transition-colors"
                style={{ background: '#5865F2' }}
              >
                Send Friend Request
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              {activeTab === 'pending' ? `Pending — ${pending.length}` : `${activeTab === 'online' ? 'Online' : 'All'} Friends — ${displayList.length}`}
            </p>
            {displayList.length === 0 && (
              <div className="text-center py-16">
                <p className="text-5xl mb-4">👥</p>
                <p style={{ color: 'var(--text-muted)' }}>
                  {activeTab === 'pending' ? 'No pending requests' : 'No friends yet. Start by adding one!'}
                </p>
              </div>
            )}
            {displayList.map(f => {
              const friend = f.friend
              const isPending = f.status === 'pending'
              const isSender = f.user1 === user.id
              return (
                <div
                  key={f.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-opacity-10 transition-colors border-t"
                  style={{ borderColor: 'var(--bg-accent)' }}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: '#5865F2' }}>
                      {friend?.displayName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 status-dot ${friend?.status || 'offline'}`} style={{ borderColor: 'var(--bg-tertiary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--header-primary)' }}>
                      {friend?.displayName || friend?.username}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {isPending ? (isSender ? 'Outgoing request' : 'Incoming request') : friend?.status || 'offline'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {isPending && !isSender && (
                      <>
                        <button onClick={() => handleAccept(f)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-green-500 transition-colors" style={{ background: 'var(--bg-secondary)' }}>
                          <UserCheck size={16} style={{ color: '#57F287' }} />
                        </button>
                        <button onClick={() => handleDecline(f)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors" style={{ background: 'var(--bg-secondary)' }}>
                          <UserX size={16} style={{ color: 'var(--text-danger)' }} />
                        </button>
                      </>
                    )}
                    {!isPending && (
                      <button
                        onClick={() => handleMessage(friend)}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--interactive-normal)' }}
                      >
                        <MessageCircle size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
