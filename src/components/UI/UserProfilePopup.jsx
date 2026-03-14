import { useEffect, useRef } from 'react'
import { useAppStore, useAuthStore } from '../../store'
import { MessageCircle, UserMinus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const STATUS_COLORS = {
  online: '#23A559',
  idle: '#F0B132',
  dnd: '#F23F43',
  offline: '#80848E'
}

const STATUS_LABELS = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do Not Disturb',
  offline: 'Offline'
}

export default function UserProfilePopup() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const { profilePopup, setProfilePopup, setActiveDm, friends, removeFriend } = useAppStore()
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setProfilePopup(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!profilePopup) return null

  const user = profilePopup
  const isself = user.id === currentUser?.id
  const friendship = friends.find(f =>
    (f.user1 === currentUser?.id && f.user2 === user.id) ||
    (f.user1 === user.id && f.user2 === currentUser?.id)
  )
  const isFriend = friendship?.status === 'accepted'

  const handleDM = () => {
    setActiveDm(user.id)
    navigate(`/channels/@me/${user.id}`)
    setProfilePopup(null)
  }

  // Generate a consistent color from user id
  const colors = ['#5865F2', '#57F287', '#FEE75C', '#EB459E', '#ED4245', '#00AFF4', '#FF7070']
  const colorIndex = user.id ? user.id.charCodeAt(0) % colors.length : 0
  const bannerColor = colors[colorIndex]

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setProfilePopup(null)} />
      <div
        ref={ref}
        className="fixed z-50 rounded-lg overflow-hidden shadow-2xl"
        style={{
          background: 'var(--bg-secondary)',
          width: 300,
          top: profilePopup._popupY || '50%',
          left: profilePopup._popupX || '50%',
          transform: profilePopup._popupY ? 'none' : 'translate(-50%, -50%)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        {/* Banner */}
        <div className="h-20 relative" style={{ background: bannerColor }} />

        {/* Avatar */}
        <div className="px-4 pb-4">
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-3xl text-white border-4"
                style={{ background: '#5865F2', borderColor: 'var(--bg-secondary)' }}
              >
                {user.displayName?.charAt(0).toUpperCase()}
              </div>
              <span
                className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2"
                style={{ background: STATUS_COLORS[user.status || 'offline'], borderColor: 'var(--bg-secondary)' }}
              />
            </div>
            {!isself && (
              <div className="flex gap-2 mt-2">
                {isFriend && (
                  <button
                    onClick={handleDM}
                    className="p-2 rounded-full transition-colors"
                    style={{ background: 'var(--bg-accent)', color: 'var(--interactive-normal)' }}
                    title="Send Message"
                  >
                    <MessageCircle size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Name */}
          <div className="mb-3">
            <h3 className="font-bold text-lg leading-tight" style={{ color: 'var(--header-primary)' }}>
              {user.displayName || user.username}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {user.username}#{user.discriminator}
            </p>
            <p className="text-xs mt-0.5" style={{ color: STATUS_COLORS[user.status || 'offline'] }}>
              ● {STATUS_LABELS[user.status || 'offline']}
            </p>
          </div>

          {/* Custom status */}
          {user.customStatus && (
            <div className="mb-3 p-2 rounded text-sm" style={{ background: 'var(--bg-accent)', color: 'var(--text-normal)' }}>
              {user.customStatus}
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>About Me</p>
              <p className="text-sm" style={{ color: 'var(--text-normal)' }}>{user.bio}</p>
            </div>
          )}

          {/* Member since */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Member Since</p>
            <p className="text-sm" style={{ color: 'var(--text-normal)' }}>
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
            </p>
          </div>

          {/* Actions */}
          {!isself && (
            <div className="mt-4 flex flex-col gap-2">
              {!isFriend && (
                <button
                  className="w-full py-2 rounded text-sm font-medium text-white transition-colors"
                  style={{ background: '#5865F2' }}
                >
                  Send Friend Request
                </button>
              )}
              {isFriend && (
                <button
                  onClick={handleDM}
                  className="w-full py-2 rounded text-sm font-medium text-white transition-colors"
                  style={{ background: '#5865F2' }}
                >
                  Send Message
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
