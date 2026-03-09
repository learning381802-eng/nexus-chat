import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAppStore, useAuthStore } from '../../store'
import { useSocket } from '../../context/SocketContext'
import { api } from '../../utils/api'
import { Hash, AtSign, Pin, Search, Bell, Users, Inbox, HelpCircle } from 'lucide-react'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import PinsModal from '../Modals/PinsModal'
import SearchPanel from './SearchPanel'
import Tooltip from '../UI/Tooltip'

export default function ChatArea() {
  const { serverId, channelId } = useParams()
  const { user } = useAuthStore()
  const { channels, messages, setMessages, markRead, toggleRightSidebar } = useAppStore()
  const { joinChannel, leaveChannel } = useSocket()
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [showPins, setShowPins] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const serverChannels = channels[serverId] || []
  const channel = serverChannels.find(c => c.id === channelId)
  const channelMessages = messages[channelId] || []

  useEffect(() => {
    if (!channelId) return
    joinChannel(channelId)
    markRead(channelId)
    loadMessages()
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
      <p style={{ color: 'var(--text-muted)' }}>Channel not found</p>
    </div>
  )

  return (
    <div className="flex flex-col flex-1 min-w-0" style={{ background: 'var(--bg-tertiary)' }}>
      {/* Channel header */}
      <div className="flex items-center gap-2 px-4 h-12 flex-shrink-0 border-b" style={{ borderColor: 'rgba(0,0,0,0.2)', background: 'var(--bg-tertiary)' }}>
        <Hash size={20} className="flex-shrink-0" style={{ color: 'var(--interactive-normal)' }} />
        <h2 className="font-semibold text-sm" style={{ color: 'var(--header-primary)' }}>{channel.name}</h2>
        {channel.topic && (
          <>
            <div className="w-px h-5 mx-1" style={{ background: 'var(--bg-accent)' }} />
            <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{channel.topic}</p>
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Tooltip content="Pins"><button onClick={() => setShowPins(true)} className="p-1.5 rounded transition-colors hover:text-white" style={{ color: 'var(--interactive-normal)' }}><Pin size={20} /></button></Tooltip>
          <Tooltip content="Member List"><button onClick={toggleRightSidebar} className="p-1.5 rounded transition-colors hover:text-white" style={{ color: 'var(--interactive-normal)' }}><Users size={20} /></button></Tooltip>
          <Tooltip content="Search"><button onClick={() => setShowSearch(!showSearch)} className="p-1.5 rounded transition-colors hover:text-white" style={{ color: 'var(--interactive-normal)' }}><Search size={20} /></button></Tooltip>
          <Tooltip content="Inbox"><button className="p-1.5 rounded transition-colors hover:text-white" style={{ color: 'var(--interactive-normal)' }}><Inbox size={20} /></button></Tooltip>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Messages */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          <MessageList
            messages={channelMessages}
            channelId={channelId}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            channelName={channel.name}
          />
          <MessageInput channelId={channelId} channelName={channel.name} />
        </div>
        {showSearch && <SearchPanel channelId={channelId} messages={channelMessages} onClose={() => setShowSearch(false)} />}
      </div>

      {showPins && <PinsModal channelId={channelId} onClose={() => setShowPins(false)} />}
    </div>
  )
}
