import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { useAuthStore, useAppStore } from '../../store'
import { api } from '../../utils/api'
import { Edit2, Trash2, Pin, Smile, Check, Bookmark, BookmarkCheck, Flag } from 'lucide-react'
import toast from 'react-hot-toast'
import EmojiPicker from 'emoji-picker-react'
import ReportModal from '../Modals/ReportModal'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '😮', '😢']
const AVATAR_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6']

function getAvatarColor(id) {
  if (!id) return AVATAR_COLORS[0]
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length]
}

function Avatar({ user, size = 40 }) {
  const color = getAvatarColor(user?.id)
  return (
    <div className="rounded-full flex items-center justify-center font-bold flex-shrink-0 text-white"
      style={{ width: size, height: size, minWidth: size, background: `linear-gradient(135deg, ${color}, ${color}99)`, fontSize: size * 0.38 }}>
      {(user?.displayName || user?.username)?.charAt(0).toUpperCase() || '?'}
    </div>
  )
}

function formatContent(content) {
  if (!content) return null
  let parts = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:var(--text-link);text-decoration:underline">$1</a>')
  return <span dangerouslySetInnerHTML={{ __html: parts }} />
}

export default function Message({ message, isGroupStart, isOwn, channelId }) {
  const { user } = useAuthStore()
  const { updateMessage, removeMessage, setProfilePopup, bookmarks = [], addBookmark, removeBookmark } = useAppStore()
  const isBookmarked = bookmarks.some(b => b.id === message.id)

  const toggleBookmark = () => {
    if (isBookmarked) { removeBookmark(message.id); toast.success('Bookmark removed') }
    else { addBookmark({ ...message, channelId }); toast.success('Bookmarked!') }
  }
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(null)
  const [showReport, setShowReport] = useState(false)

  const handleEdit = async () => {
    if (!editContent.trim()) return
    try {
      const updated = await api.editMessage(channelId, message.id, { content: editContent })
      updateMessage(channelId, message.id, updated)
      setEditing(false)
    } catch (err) { toast.error(err.message) }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this message?')) return
    try {
      await api.deleteMessage(channelId, message.id)
      removeMessage(channelId, message.id)
    } catch (err) { toast.error(err.message) }
  }

  const handleReaction = async (emoji) => {
    setShowEmojiPicker(false)
    try {
      const existing = message.reactions?.find(r => r.emoji === emoji)
      if (existing?.users?.includes(user.id)) {
        await api.removeReaction(channelId, message.id, emoji)
      } else {
        await api.addReaction(channelId, message.id, emoji)
      }
    } catch (err) { toast.error(err.message) }
  }

  const handlePin = async () => {
    try {
      await api.pinMessage(channelId, message.id)
      toast.success('Message pinned')
    } catch (err) { toast.error(err.message) }
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    setShowContextMenu({ x: Math.min(e.clientX, window.innerWidth - 220), y: Math.min(e.clientY, window.innerHeight - 200) })
  }

  const handleAvatarClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setProfilePopup({ ...message.author, _popupX: rect.right + 8, _popupY: rect.top })
  }

  return (
    <div
      className="relative px-4 py-0.5 group message-group"
      style={{ background: hovered ? 'var(--bg-message-hover)' : 'transparent', transition: 'background 0.1s' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowEmojiPicker(false) }}
      onContextMenu={handleContextMenu}
    >
      {/* Reply */}
      {message.replyTo && (
        <div className="flex items-center gap-2 ml-14 mb-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          <div className="w-4 h-4 border-l-2 border-t-2 rounded-tl ml-2 flex-shrink-0" style={{ borderColor: 'var(--text-muted)' }} />
          <Avatar user={message.replyTo.author} size={16} />
          <span className="font-medium text-xs" style={{ color: 'var(--header-secondary)' }}>
            {message.replyTo.author?.displayName}
          </span>
          <span className="truncate text-xs">{message.replyTo.content?.slice(0, 80)}</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar or timestamp */}
        {isGroupStart ? (
          <button onClick={handleAvatarClick} className="mt-0.5 flex-shrink-0 hover:opacity-80 transition-opacity">
            <Avatar user={message.author} />
          </button>
        ) : (
          <div className="w-10 flex-shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
              {format(new Date(message.createdAt), 'h:mm a')}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {isGroupStart && (
            <div className="flex items-baseline gap-2 mb-1">
              <button
                className="font-semibold text-sm hover:underline"
                style={{ color: 'var(--header-primary)' }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setProfilePopup({ ...message.author, _popupX: rect.left, _popupY: rect.bottom + 4 })
                }}
              >
                {message.author?.displayName || message.author?.username}
              </button>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {format(new Date(message.createdAt), 'MM/dd/yyyy h:mm a')}
              </span>
              {message.pinned && (
                <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--text-link)' }}>
                  <Pin size={10} /> Pinned
                </span>
              )}
            </div>
          )}

          {/* Content */}
          {editing ? (
            <div className="mt-1">
              <textarea autoFocus value={editContent} onChange={e => setEditContent(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit() } if (e.key === 'Escape') setEditing(false) }}
                className="chat-input text-sm rounded-lg px-3 py-2" rows={2}
                style={{ background: 'var(--bg-accent)', border: '1px solid var(--brand-color)' }} />
              <div className="flex gap-3 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>Esc to <button onClick={() => setEditing(false)} style={{ color: 'var(--text-link)' }}>cancel</button></span>
                <span>Enter to <button onClick={handleEdit} style={{ color: 'var(--text-link)' }}>save</button></span>
              </div>
            </div>
          ) : (
            <div className="text-sm leading-relaxed break-words" style={{ color: 'var(--text-normal)', wordBreak: 'break-word' }}>
              {formatContent(message.content)}
              {message.edited && <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>(edited)</span>}
            </div>
          )}

          {/* Attachments */}
          {message.attachments?.map(att => (
            <div key={att.id} className="mt-2">
              {att.contentType?.startsWith('image/') ? (
                <img src={att.url} alt={att.name} className="attachment-image" onClick={() => window.open(att.url, '_blank')} />
              ) : (
                <a href={att.url} download={att.name} className="inline-flex items-center gap-3 p-3 rounded-xl mt-1 transition-colors"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-normal)', maxWidth: 320 }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--brand-color)' }}>
                    <Pin size={16} color="white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-link)' }}>{att.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{(att.size / 1024).toFixed(1)} KB</p>
                  </div>
                </a>
              )}
            </div>
          ))}

          {/* Reactions */}
          {message.reactions?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {message.reactions.map(r => (
                <button key={r.emoji} onClick={() => handleReaction(r.emoji)}
                  className={`reaction ${r.users?.includes(user.id) ? 'active' : ''}`}>
                  <span>{r.emoji}</span>
                  <span className="text-xs font-semibold" style={{ color: r.users?.includes(user.id) ? '#a5b4fc' : 'var(--text-muted)' }}>{r.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action toolbar */}
      {hovered && !editing && (
        <div className="message-actions absolute right-4 -top-5 flex items-center gap-0.5 rounded-xl shadow-xl"
          style={{ background: 'var(--bg-floating)', border: '1px solid var(--border-subtle)', padding: '3px' }}>
          {QUICK_EMOJIS.slice(0, 3).map(emoji => (
            <button key={emoji} onClick={() => handleReaction(emoji)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base transition-colors hover:bg-white hover:bg-opacity-10">
              {emoji}
            </button>
          ))}
          <div className="w-px h-5 mx-1" style={{ background: 'var(--border-subtle)' }} />
          <button onClick={() => setShowEmojiPicker(v => !v)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white hover:bg-opacity-10"
            style={{ color: 'var(--interactive-normal)' }}>
            <Smile size={15} />
          </button>
          {!isOwn && (
            <button onClick={() => setShowReport(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500 hover:bg-opacity-20"
              style={{ color: 'var(--text-danger)' }} title="Report Message">
              <Flag size={15} />
            </button>
          )}
          <button onClick={toggleBookmark}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white hover:bg-opacity-10"
            style={{ color: isBookmarked ? '#fbbf24' : 'var(--interactive-normal)' }}>
            {isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
          </button>
          <button onClick={handlePin}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white hover:bg-opacity-10"
            style={{ color: 'var(--interactive-normal)' }}>
            <Pin size={15} />
          </button>
          {isOwn && (
            <button onClick={() => { setEditing(true); setEditContent(message.content) }}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white hover:bg-opacity-10"
              style={{ color: 'var(--interactive-normal)' }}>
              <Edit2 size={15} />
            </button>
          )}
          <button onClick={handleDelete}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500 hover:bg-opacity-20"
            style={{ color: 'var(--text-danger)' }}>
            <Trash2 size={15} />
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute right-4 z-50" style={{ top: -360 }}>
          <EmojiPicker onEmojiClick={(e) => handleReaction(e.emoji)} theme="dark" height={350} width={320} previewConfig={{ showPreview: false }} />
        </div>
      )}

      {/* Context menu */}
      {showContextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowContextMenu(null)} />
          <div className="context-menu" style={{ top: showContextMenu.y, left: showContextMenu.x }}>
            <div className="context-menu-item" onClick={() => { handleReaction('👍'); setShowContextMenu(null) }}>
              <Smile size={14} /> Add Reaction
            </div>
            {isOwn && <div className="context-menu-item" onClick={() => { setEditing(true); setShowContextMenu(null) }}>
              <Edit2 size={14} /> Edit Message
            </div>}
            <div className="context-menu-item" onClick={() => { handlePin(); setShowContextMenu(null) }}>
              <Pin size={14} /> Pin Message
            </div>
            <div className="h-px my-1.5" style={{ background: 'var(--border-subtle)' }} />
            {!isOwn && (
              <div className="context-menu-item danger" onClick={() => { setShowReport(true); setShowContextMenu(null) }}>
                <Flag size={14} /> Report Message
              </div>
            )}
            <div className="context-menu-item danger" onClick={() => { handleDelete(); setShowContextMenu(null) }}>
              <Trash2 size={14} /> Delete Message
            </div>
          </div>
        </>
      )}

      {/* Report modal */}
      {showReport && (
        <ReportModal
          target={{ ...message, author: message.author }}
          type="message"
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}
