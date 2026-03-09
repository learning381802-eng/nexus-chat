import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppStore, useAuthStore } from '../../store'
import { api } from '../../utils/api'
import { MessageCircle } from 'lucide-react'
import MessageInput from './MessageInput'

export default function DMArea() {
  const { userId } = useParams()
  const { user } = useAuthStore()
  const { dmMessages, setDmMessages, users, cacheUser } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [friend, setFriend] = useState(null)

  useEffect(() => {
    if (!userId) return
    loadMessages()
    if (!users[userId]) {
      api.getUser(userId).then(u => { setFriend(u); cacheUser(u) }).catch(console.error)
    } else {
      setFriend(users[userId])
    }
  }, [userId])

  const loadMessages = async () => {
    setLoading(true)
    try {
      const msgs = await api.getDmMessages(userId)
      setDmMessages(userId, msgs.reverse())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const messages = dmMessages[userId] || []

  return (
    <div className="flex flex-col flex-1 min-w-0" style={{ background: 'var(--bg-tertiary)' }}>
      {/* DM header */}
      <div className="flex items-center gap-3 px-4 h-12 flex-shrink-0 border-b" style={{ borderColor: 'rgba(0,0,0,0.2)' }}>
        <div className="relative">
          <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: '#5865F2', color: 'white' }}>
            {friend?.displayName?.charAt(0).toUpperCase() || '?'}
          </div>
        </div>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--header-primary)' }}>
          {friend?.displayName || friend?.username || 'Loading...'}
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
        {!loading && messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#5865F2' }}>
              <span className="text-2xl font-bold text-white">{friend?.displayName?.charAt(0).toUpperCase()}</span>
            </div>
            <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--header-primary)' }}>
              {friend?.displayName || friend?.username}
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>This is the beginning of your direct message history.</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="flex items-start gap-3 py-0.5 group hover:bg-opacity-5 rounded px-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white" style={{ background: '#5865F2' }}>
              {msg.author?.displayName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="font-medium text-sm" style={{ color: 'var(--header-primary)' }}>{msg.author?.displayName || msg.author?.username}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(msg.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-normal)' }}>{msg.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 pb-6">
        <div className="rounded-lg flex items-center" style={{ background: 'var(--bg-accent)' }}>
          <textarea
            placeholder={`Message ${friend?.displayName || ''}`}
            className="flex-1 py-3 px-4 text-sm resize-none outline-none bg-transparent leading-relaxed"
            style={{ color: 'var(--text-normal)', maxHeight: 200 }}
            rows={1}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                const content = e.target.value.trim()
                if (!content) return
                e.target.value = ''
                try {
                  const msg = await api.sendDm(userId, { content })
                  useAppStore.getState().addDmMessage(userId, msg)
                } catch (err) { console.error(err) }
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
