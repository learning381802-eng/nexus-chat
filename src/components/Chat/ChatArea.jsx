import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAppStore, useAuthStore } from '../../store'
import { useSocket } from '../../context/SocketContext'
import { api } from '../../utils/api'
import { Hash, Pin, Search, Users, Bookmark, Command } from 'lucide-react'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import PinsModal from '../Modals/PinsModal'
import SearchPanel from './SearchPanel'
import ServerSearch from './ServerSearch'
import BookmarksPanel from './BookmarksPanel'
import Tooltip from '../UI/Tooltip'
import ThemeToggle from '../UI/ThemeToggle'
import UserProfilePopup from '../UI/UserProfilePopup'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'

export default function ChatArea() {
  const { serverId, channelId } = useParams()
  const { user } = useAuthStore()
  const { channels, messages, setMessages, markRead, toggleRightSidebar, serverSearchOpen, setServerSearchOpen, typing } = useAppStore()
  const { joinChannel, leaveChannel } = useSocket()
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [showPins, setShowPins] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [replyTo, setReplyTo] = useState(null)

  useKeyboardShortcuts()

  const serverChannels = channels[serverId] || []
  const channel = serverChannels.find(c => c.id === channelId)
  const channelMessages = messages[channelId] || []
  const channelTyping = typing[channelId] || {}
  const typingUsers = Object.values(channelTyping).filter(t => Date.now() - t.at < 5000)

  useEffect(() => {
    if (!channelId) return
    joinChannel(channelId)
    markRead(channelId)
    loadMessages()
    setReplyTo(null)
    return () => leaveChannel(channelId)
  }, [channelId])

  const loadMessages = async (before = null) => {
    if (loading) return
    setLoading(true)
    try {
      const params = { limit: 50 }
      if (before) params.before = before
      const msgs = await api.getMessages(channelId, params)
      if (before) {
        useAppStore.getState().prependMessages(channelId, msgs)
      } else {
        setMessages(channelId, msgs.reverse())
      }
      setHasMore(msgs.length === 50)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = useCallback(() => {
    const msgs = messages[channelId] || []
    if (msgs.length > 0) loadMessages(msgs[0].createdAt)
  }, [channelId, messages])

  if (!channel) return (
    <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-accent)' }}>
          <Hash size={28} style={{ color: 'var(--text-muted)' }} />
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Channel not found</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col flex-1 min-w-0" style={{ background: 'var(--bg-tertiary)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-12 flex-shrink-0 border-b"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
        <Hash size={18} className="flex-shrink-0" style={{ color: 'var(--interactive-normal)' }} />
        <h2 className="font-semibold text-sm" style={{ color: 'var(--header-primary)' }}>{channel.name}</h2>
        {channel.topic && (
          <>
            <div className="w-px h-4 mx-1" style={{ background: 'var(--border-subtle)' }} />
            <p className="text-sm truncate" style={{ color: 'var(--text-muted)', fontSize: 13 }}>{channel.topic}</p>
          </>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <Tooltip content="Pins"><button onClick={() => setShowPins(true)} className="p-1.5 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10" style={{ color: 'var(--interactive-normal)' }}><Pin size={18} /></button></Tooltip>
          <Tooltip content="Bookmarks"><button onClick={() => setShowBookmarks(v => !v)} className="p-1.5 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10" style={{ color: showBookmarks ? 'var(--brand-color)' : 'var(--interactive-normal)' }}><Bookmark size={18} /></button></Tooltip>
          <Tooltip content="Member List"><button onClick={toggleRightSidebar} className="p-1.5 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10" style={{ color: 'var(--interactive-normal)' }}><Users size={18} /></button></Tooltip>
          <Tooltip content="Search Channel"><button onClick={() => setShowSearch(!showSearch)} className="p-1.5 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10" style={{ color: showSearch ? 'var(--brand-color)' : 'var(--interactive-normal)' }}><Search size={18} /></button></Tooltip>
          <Tooltip content="Server Search (⌘K)"><button onClick={() => setServerSearchOpen(true)} className="p-1.5 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10" style={{ color: 'var(--interactive-normal)' }}><Command size={18} /></button></Tooltip>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          <MessageList
            messages={channelMessages}
            channelId={channelId}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            channelName={channel.name}
            typingUsers={typingUsers}
          />
          <MessageInput
            channelId={channelId}
            channelName={channel.name}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
          />
        </div>
        {showSearch && <SearchPanel channelId={channelId} messages={channelMessages} onClose={() => setShowSearch(false)} />}
        {showBookmarks && <BookmarksPanel onClose={() => setShowBookmarks(false)} />}
      </div>

      {showPins && <PinsModal channelId={channelId} onClose={() => setShowPins(false)} />}
      {serverSearchOpen && <ServerSearch />}
      <UserProfilePopup />
    </div>
  )
}
