import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore, useAppStore } from '../../store'
import { format, isToday, isYesterday } from 'date-fns'
import Message from './Message'
import { Hash, ArrowDown } from 'lucide-react'

function DateDivider({ date }) {
  const d = new Date(date)
  const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d, yyyy')
  return (
    <div className="divider px-4 my-4 select-none">
      <span className="px-3 py-0.5 rounded-full text-xs" style={{ background: 'var(--bg-accent)', color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}

function UnreadDivider() {
  return (
    <div className="flex items-center gap-3 px-4 my-2 select-none">
      <div className="flex-1 h-px" style={{ background: 'var(--text-danger)' }} />
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--text-danger)', color: 'white' }}>
        New Messages
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--text-danger)' }} />
    </div>
  )
}

function TypingIndicator({ typingUsers }) {
  if (!typingUsers?.length) return <div style={{ height: 24 }} />
  const names = typingUsers.slice(0, 3).map(u => u.username).join(', ')
  return (
    <div className="flex items-center gap-2 px-4 pb-1" style={{ color: 'var(--text-muted)', minHeight: 24 }}>
      <div className="flex gap-1">
        {[0,1,2].map(i => <span key={i} className="loading-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
      </div>
      <span className="text-sm">
        <strong style={{ color: 'var(--text-normal)' }}>{names}</strong>
        {' '}{typingUsers.length === 1 ? 'is' : 'are'} typing...
      </span>
    </div>
  )
}

export default function MessageList({ messages, channelId, loading, hasMore, onLoadMore, channelName, typingUsers = [] }) {
  const { user } = useAuthStore()
  const { bookmarks } = useAppStore()
  const bottomRef = useRef(null)
  const containerRef = useRef(null)
  const [atBottom, setAtBottom] = useState(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [unreadIndex, setUnreadIndex] = useState(null)
  const prevMessageCount = useRef(0)

  useEffect(() => {
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: prevMessageCount.current === 0 ? 'auto' : 'smooth' })
    prevMessageCount.current = messages.length
  }, [messages.length])

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const bottom = distFromBottom < 100
    setAtBottom(bottom)
    setShowScrollBtn(!bottom && distFromBottom > 300)
    if (el.scrollTop < 200 && hasMore && !loading) onLoadMore()
  }, [hasMore, loading, onLoadMore])

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setUnreadIndex(null)
  }

  // Group messages
  const grouped = []
  messages.forEach((msg, i) => {
    const prev = messages[i - 1]
    const isNewGroup = !prev || prev.author.id !== msg.author.id ||
      new Date(msg.createdAt) - new Date(prev.createdAt) > 5 * 60 * 1000
    const prevDate = prev ? new Date(prev.createdAt).toDateString() : null
    const curDate = new Date(msg.createdAt).toDateString()
    if (prevDate !== curDate) grouped.push({ type: 'date', date: msg.createdAt, key: `date-${msg.createdAt}` })
    if (i === unreadIndex) grouped.push({ type: 'unread', key: 'unread-divider' })
    grouped.push({ type: 'message', msg, isGroupStart: isNewGroup, key: msg.id })
  })

  return (
    <div className="relative flex-1 min-h-0">
      <div ref={containerRef} className="h-full overflow-y-auto flex flex-col" onScroll={handleScroll}>
        {/* Channel welcome */}
        {!hasMore && !loading && (
          <div className="px-6 pt-12 pb-6 fade-in">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'var(--brand-gradient)' }}>
              <Hash size={28} color="white" strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--header-primary)' }}>
              Welcome to #{channelName}!
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>This is the beginning of the <strong>#{channelName}</strong> channel.</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-6">
            <div className="flex gap-1">
              {[0,1,2].map(i => <span key={i} className="loading-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
            </div>
          </div>
        )}

        <div className="flex flex-col mt-auto pb-2">
          {grouped.map(item => {
            if (item.type === 'date') return <DateDivider key={item.key} date={item.date} />
            if (item.type === 'unread') return <UnreadDivider key={item.key} />
            return (
              <Message
                key={item.key}
                message={item.msg}
                isGroupStart={item.isGroupStart}
                isOwn={item.msg.author.id === user?.id}
                channelId={channelId}
              />
            )
          })}
        </div>

        <TypingIndicator typingUsers={typingUsers} />
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-xl transition-all scale-in"
          style={{ background: 'var(--brand-color)', color: 'white', border: '2px solid rgba(255,255,255,0.1)' }}
        >
          <ArrowDown size={18} />
        </button>
      )}
    </div>
  )
}
