import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { useAuthStore, useAppStore } from '../../store'
import { api } from '../../utils/api'
import { Edit2, Trash2, Pin, Smile, Reply, MoreHorizontal, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import EmojiPicker from 'emoji-picker-react'

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '✅']

function Avatar({ user, size = 40 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0 text-white"
      style={{ width: size, height: size, minWidth: size, background: '#5865F2', fontSize: size * 0.4 }}
    >
      {user?.displayName?.charAt(0).toUpperCase() || '?'}
    </div>
  )
}

function formatContent(content) {
  if (!content) return null
  // Bold **text**
  let parts = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  // Italic *text*
  parts = parts.replace(/\*(.*?)\*/g, '<em>$1</em>')
  // Inline code `text`
  parts = parts.replace(/`([^`]+)`/g, '<code>$1</code>')
  // Strikethrough ~~text~~
  parts = parts.replace(/~~(.*?)~~/g, '<del>$1</del>')
  // Underline __text__
  parts = parts.replace(/__(.*?)__/g, '<u>$1</u>')
  // Links
  parts = parts.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: var(--text-link)">$1</a>')
  return <span dangerouslySetInnerHTML={{ __html: parts }} />
}

export default function Message({ message, isGroupStart, isOwn, channelId }) {
  const { user } = useAuthStore()
  const { updateMessage, removeMessage } = useAppStore()
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(null)
  const msgRef = useRef(null)

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
      toast.success('Message pinned!')
    } catch (err) { toast.error(err.message) }
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    setShowContextMenu({ x: e.clientX, y: e.clientY })
  }

  return (
    <div
      ref={msgRef}
      className="relative group px-4 py-0.5"
      style={{ background: hovered ? 'var(--bg-message-hover)' : 'transparent' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowEmojiPicker(false) }}
      onContextMenu={handleContextMenu}
    >
      {/* Reply preview */}
      {message.replyTo && (
        <div className="flex items-center gap-2 ml-10 mb-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Reply size={14} style={{ transform: 'scaleX(-1)' }} />
          <span className="font-medium" style={{ color: 'var(--header-secondary)' }}>@{message.replyTo.author?.username}</span>
          <span className="truncate">{message.replyTo.content?.slice(0, 80)}</span>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Avatar or timestamp */}
        {isGroupStart ? (
          <Avatar user={message.author} />
        ) : (
          <div className="w-10 flex-shrink-0 flex items-center justify-center" style={{ paddingTop: 2 }}>
            {hovered && (
              <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                {format(new Date(message.createdAt), 'h:mm a')}
              </span>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Author header */}
          {isGroupStart && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="font-medium text-sm hover:underline cursor-pointer" style={{ color: 'var(--header-primary)' }}>
                {message.author?.displayName || message.author?.username}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {format(new Date(message.createdAt), 'MM/dd/yyyy h:mm a')}
              </span>
              {message.pinned && (
                <span className="text-xs px-1 rounded" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>📌 Pinned</span>
              )}
            </div>
          )}

          {/* Content */}
          {editing ? (
            <div className="mt-1">
              <textarea
                autoFocus
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit() }
                  if (e.key === 'Escape') setEditing(false)
                }}
                className="chat-input text-sm"
                rows={2}
              />
              <div className="flex gap-2 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>escape to <button onClick={() => setEditing(false)} style={{ color: 'var(--text-link)' }}>cancel</button></span>
                <span> · enter to <button onClick={handleEdit} style={{ color: 'var(--text-link)' }}>save</button></span>
              </div>
            </div>
          ) : (
            <div className="text-sm leading-relaxed" style={{ color: 'var(--text-normal)', wordBreak: 'break-word' }}>
              {formatContent(message.content)}
              {message.edited && <span className="ml-1 text-xs" style={{ color: 'var(--text-muted)' }}>(edited)</span>}
            </div>
          )}

          {/* Attachments */}
          {message.attachments?.map(att => (
            <div key={att.id} className="mt-2">
              {att.contentType?.startsWith('image/') ? (
                <img
                  src={att.url}
                  alt={att.name}
                  className="attachment-image"
                  onClick={() => window.open(att.url, '_blank')}
                />
              ) : (
                <a
                  href={att.url}
                  download={att.name}
                  className="flex items-center gap-2 p-3 rounded mt-1"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-link)', maxWidth: 300 }}
                >
                  <span>📎</span>
                  <span className="text-sm truncate">{att.name}</span>
                  <span className="text-xs ml-auto flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {(att.size / 1024).toFixed(1)}KB
                  </span>
                </a>
              )}
            </div>
          ))}

          {/* Reactions */}
          {message.reactions?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {message.reactions.map(r => (
                <button
                  key={r.emoji}
                  onClick={() => handleReaction(r.emoji)}
                  className={`reaction ${r.users?.includes(user.id) ? 'active' : ''}`}
                >
                  <span>{r.emoji}</span>
                  <span className="text-xs font-medium" style={{ color: r.users?.includes(user.id) ? '#c9cdfb' : 'var(--text-muted)' }}>{r.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {hovered && !editing && (
        <div
          className="message-actions absolute right-4 -top-4 flex items-center gap-0.5 rounded shadow-lg border"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--bg-accent)', padding: '2px' }}
        >
          {/* Quick reactions */}
          {COMMON_EMOJIS.slice(0, 3).map(emoji => (
            <button key={emoji} onClick={() => handleReaction(emoji)} className="p-1.5 rounded hover:bg-opacity-20 text-base transition-colors">
              {emoji}
            </button>
          ))}
          <button onClick={() => setShowEmojiPicker(v => !v)} className="p-1.5 rounded hover:text-white transition-colors" style={{ color: 'var(--interactive-normal)' }}>
            <Smile size={16} />
          </button>
          <button onClick={handlePin} className="p-1.5 rounded hover:text-white transition-colors" style={{ color: 'var(--interactive-normal)' }}>
            <Pin size={16} />
          </button>
          {isOwn && (
            <button onClick={() => { setEditing(true); setEditContent(message.content) }} className="p-1.5 rounded hover:text-white transition-colors" style={{ color: 'var(--interactive-normal)' }}>
              <Edit2 size={16} />
            </button>
          )}
          {(isOwn) && (
            <button onClick={handleDelete} className="p-1.5 rounded hover:text-white transition-colors" style={{ color: 'var(--text-danger)' }}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute right-4 z-50" style={{ top: -360 }}>
          <EmojiPicker
            onEmojiClick={(e) => handleReaction(e.emoji)}
            theme="dark"
            height={350}
            width={350}
            searchDisabled={false}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}

      {/* Context menu */}
      {showContextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowContextMenu(null)} />
          <div className="context-menu z-50" style={{ top: showContextMenu.y, left: showContextMenu.x }}>
            <div className="context-menu-item" onClick={() => { handleReaction('👍'); setShowContextMenu(null) }}>
              👍 React
            </div>
            <div className="context-menu-item" onClick={() => { setEditing(true); setShowContextMenu(null) }}>
              <Edit2 size={14} /> Edit Message
            </div>
            <div className="context-menu-item" onClick={() => { handlePin(); setShowContextMenu(null) }}>
              <Pin size={14} /> Pin Message
            </div>
            <div className="h-px my-1" style={{ background: 'var(--bg-accent)' }} />
            <div className="context-menu-item danger" onClick={() => { handleDelete(); setShowContextMenu(null) }}>
              <Trash2 size={14} /> Delete Message
            </div>
          </div>
        </>
      )}
    </div>
  )
}
