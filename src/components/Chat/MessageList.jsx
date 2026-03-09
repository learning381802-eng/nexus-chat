import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../store'
import { format, isToday, isYesterday } from 'date-fns'
import Message from './Message'
import { Hash } from 'lucide-react'

function DateDivider({ date }) {
  const d = new Date(date)
  const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d, yyyy')
  return (
    <div className="divider px-4 my-4">
      <span className="px-2">{label}</span>
    </div>
  )
}

function TypingIndicator({ typingUsers }) {
  if (!typingUsers.length) return null
  const names = typingUsers.map(u => u.username).join(', ')
  return (
    <div className="flex items-center gap-1.5 px-4 pb-2 text-sm" style={{ color: 'var(--text-normal)', minHeight: 24 }}>
      <div className="flex gap-0.5 loading-dots">
        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--text-muted)', animation: 'pulse 1.4s infinite' }} />
        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--text-muted)', animation: 'pulse 1.4s infinite 0.2s' }} />
        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--text-muted)', animation: 'pulse 1.4s infinite 0.4s' }} />
      </div>
      <span><strong>{names}</strong> {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
    </div>
  )
}

export default function MessageList({ messages, channelId, loading, hasMore, onLoadMore, channelName, typingUsers = [] }) {
  const { user } = useAuthStore()
  const bottomRef = useRef(null)
  const containerRef = useRef(null)
  const [atBottom, setAtBottom] = useState(true)
  const prevScrollHeight = useRef(0)

  useEffect(() => {
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    setAtBottom(bottom)
    if (el.scrollTop < 200 && hasMore && !loading) onLoadMore()
  }

  // Group messages by author and time (5 min window)
  const grouped = []
  messages.forEach((msg, i) => {
    const prev = messages[i - 1]
    const isNewGroup = !prev || prev.author.id !== msg.author.id ||
      new Date(msg.createdAt) - new Date(prev.createdAt) > 5 * 60 * 1000

    const prevDate = prev ? new Date(prev.createdAt).toDateString() : null
    const curDate = new Date(msg.createdAt).toDateString()

    if (prevDate !== curDate) {
      grouped.push({ type: 'date', date: msg.createdAt, key: `date-${msg.createdAt}` })
    }
    grouped.push({ type: 'message', msg, isGroupStart: isNewGroup, key: msg.id })
  })

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto flex flex-col"
      style={{ overflowAnchor: 'none' }}
      onScroll={handleScroll}
    >
      {/* Channel welcome */}
      {!hasMore && !loading && (
        <div className="px-4 pt-10 pb-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--bg-accent)' }}>
            <Hash size={28} style={{ color: 'var(--interactive-normal)' }} />
          </div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--header-primary)' }}>Welcome to #{channelName}!</h2>
          <p style={{ color: 'var(--text-muted)' }}>This is the start of the #{channelName} channel.</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-4">
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading messages...</div>
        </div>
      )}

      {/* Messages */}
      <div className="flex flex-col min-h-0 mt-auto">
        {grouped.map(item => {
          if (item.type === 'date') return <DateDivider key={item.key} date={item.date} />
          return (
            <Message
              key={item.key}
              message={item.msg}
              isGroupStart={item.isGroupStart}
              isOwn={item.msg.author.id === user.id}
              channelId={channelId}
            />
          )
        })}
      </div>

      <TypingIndicator typingUsers={typingUsers} />
      <div ref={bottomRef} />
    </div>
  )
}
