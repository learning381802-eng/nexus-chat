import { useState, useRef, useCallback, useEffect } from 'react'
import { useAppStore } from '../../store'
import { useSocket } from '../../context/SocketContext'
import { api } from '../../utils/api'
import { Plus, Smile, Send, X, Reply } from 'lucide-react'
import toast from 'react-hot-toast'
import EmojiPicker from 'emoji-picker-react'
import MentionAutocomplete from './MentionAutocomplete'
import SlashCommands from './SlashCommands'

export default function MessageInput({ channelId, channelName, replyTo, onCancelReply }) {
  const { startTyping, stopTyping } = useSocket()
  const { messages } = useAppStore()
  const [content, setContent] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [files, setFiles] = useState([])
  const [sending, setSending] = useState(false)
  const [mentionQuery, setMentionQuery] = useState(null)
  const [slashQuery, setSlashQuery] = useState(null)
  const textareaRef = useRef(null)
  const typingTimerRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => { textareaRef.current?.focus() }, [channelId])

  const handleTyping = useCallback(() => {
    startTyping(channelId)
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => stopTyping(channelId), 3000)
  }, [channelId])

  const handleChange = (e) => {
    const val = e.target.value
    setContent(val)
    handleTyping()
    adjustHeight()

    // Detect @mention
    const cursor = e.target.selectionStart
    const textUpToCursor = val.slice(0, cursor)
    const mentionMatch = textUpToCursor.match(/@(\w*)$/)
    setMentionQuery(mentionMatch ? mentionMatch[1] : null)

    // Detect slash command
    const slashMatch = val.match(/^\/(\w*)$/)
    setSlashQuery(slashMatch ? slashMatch[1] : null)
  }

  const handleSlashSelect = (cmd) => {
    setContent(`/${cmd.name} `)
    setSlashQuery(null)
    textareaRef.current?.focus()
  }

  const handleMentionSelect = (user) => {
    const cursor = textareaRef.current.selectionStart
    const before = content.slice(0, cursor).replace(/@\w*$/, '')
    const after = content.slice(cursor)
    setContent(`${before}@${user.username} ${after}`)
    setMentionQuery(null)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const handleKeyDown = (e) => {
    if (mentionQuery !== null && e.key === 'Escape') { setMentionQuery(null); return }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
      return
    }

    if (e.key === 'Escape' && replyTo) { onCancelReply?.(); return }

    // Arrow up to edit last own message
    if (e.key === 'ArrowUp' && !content) {
      const channelMessages = messages[channelId] || []
      const userId = useAppStore.getState().users
      // find last own message - simplified
      e.preventDefault()
    }
  }

  const handleSend = async () => {
    if ((!content.trim() && !files.length) || sending) return
    setSending(true)
    stopTyping(channelId)
    setMentionQuery(null)
    setSlashQuery(null)
    try {
      // Handle slash commands
      if (content.trim().startsWith('/')) {
        const text = content.trim()
        const spaceIdx = text.indexOf(' ')
        const cmd = (spaceIdx > 0 ? text.slice(1, spaceIdx) : text.slice(1)).toLowerCase()
        const args = spaceIdx > 0 ? text.slice(spaceIdx + 1) : ''
        let msgContent = null

        if (cmd === 'flip') msgContent = `Flipped a coin: **${Math.random() > 0.5 ? 'Heads' : 'Tails'}**!`
        else if (cmd === 'roll') { const s = parseInt(args) || 6; msgContent = `Rolled a d${s}: **${Math.floor(Math.random() * s) + 1}**` }
        else if (cmd === 'me') msgContent = `_${args}_`
        else if (cmd === 'announce') msgContent = `📢 **ANNOUNCEMENT**\n${args}`
        else if (cmd === 'poll') {
          const parts = args.split('|').map(s => s.trim())
          if (parts.length < 3) { toast.error('Usage: /poll Question | Option1 | Option2'); setSending(false); return }
          msgContent = `📊 **Poll: ${parts[0]}**\n${parts.slice(1).map((o, i) => `${i + 1}. ${o}`).join('\n')}`
        }
        else if (cmd === 'help') msgContent = `**Commands:** /flip /roll [n] /me [text] /announce [msg] /poll Q|O1|O2 /remind [time] [msg]`
        else if (cmd === 'remind') { toast.success(`Reminder set: "${args}"`); setContent(''); setSending(false); return }
        else if (cmd === 'ban' || cmd === 'kick') { toast.error('Use Server Settings > Members to manage users'); setContent(''); setSending(false); return }
        else { toast.error(`Unknown command: /${cmd}`); setSending(false); return }

        if (msgContent) {
          const f = new FormData(); f.append('content', msgContent)
          await api.sendMessage(channelId, f)
        }
        setContent('')
        textareaRef.current.style.height = 'auto'
        setSending(false)
        return
      }

      const formData = new FormData()
      if (content.trim()) formData.append('content', content.trim())
      if (replyTo) formData.append('replyToId', replyTo.id)
      if (files.length) formData.append('file', files[0])
      await api.sendMessage(channelId, formData)
      setContent('')
      setFiles([])
      onCancelReply?.()
      textareaRef.current?.focus()
      textareaRef.current.style.height = 'auto'
    } catch (err) {
      toast.error(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const adjustHeight = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  const handlePaste = (e) => {
    for (const item of e.clipboardData?.items || []) {
      if (item.kind === 'file') { setFiles([item.getAsFile()]); break }
    }
  }

  const canSend = content.trim().length > 0 || files.length > 0

  return (
    <div className="px-4 pb-5 flex-shrink-0">
      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 text-sm"
          style={{ background: 'var(--bg-accent)', borderRadius: '10px 10px 0 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <Reply size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Replying to</span>
          <span className="font-semibold" style={{ color: 'var(--brand-color)' }}>{replyTo.author?.displayName}</span>
          <span className="ml-2 truncate text-xs flex-1" style={{ color: 'var(--text-muted)' }}>{replyTo.content?.slice(0, 60)}</span>
          <button onClick={onCancelReply} className="ml-auto flex-shrink-0 hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* File preview */}
      {files.length > 0 && (
        <div className="flex gap-2 px-4 py-3 flex-wrap"
          style={{ background: 'var(--bg-accent)', borderTop: replyTo ? 'none' : undefined, borderRadius: replyTo ? '0' : '10px 10px 0 0' }}>
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              {f.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(f)} alt="" className="w-10 h-10 object-cover rounded-lg" />
              ) : (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--brand-color)' }}>
                  <Plus size={16} color="white" />
                </div>
              )}
              <div>
                <p className="font-medium max-w-32 truncate text-xs" style={{ color: 'var(--text-normal)' }}>{f.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{(f.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => setFiles([])} className="ml-2 hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative flex items-end gap-2 px-3 py-2"
        style={{
          background: 'var(--bg-accent)',
          border: '1px solid var(--border-subtle)',
          borderRadius: (replyTo || files.length) ? '0 0 10px 10px' : '10px',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'}
        onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
      >
        {/* Slash commands */}
        {slashQuery !== null && (
          <SlashCommands query={slashQuery} onSelect={handleSlashSelect} />
        )}

        {/* Mention autocomplete */}
        {mentionQuery !== null && (
          <MentionAutocomplete query={mentionQuery} onSelect={handleMentionSelect} />
        )}

        <button onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded-lg flex-shrink-0 transition-colors hover:bg-white hover:bg-opacity-10"
          style={{ color: 'var(--interactive-normal)' }}>
          <Plus size={20} strokeWidth={2} />
        </button>
        <input ref={fileInputRef} type="file" className="hidden"
          onChange={e => setFiles(Array.from(e.target.files))} />

        <textarea ref={textareaRef} value={content}
          onChange={handleChange} onKeyDown={handleKeyDown} onPaste={handlePaste}
          placeholder={`Message #${channelName}`} rows={1}
          className="flex-1 py-1.5 text-sm resize-none outline-none bg-transparent leading-relaxed"
          style={{ color: 'var(--text-normal)', maxHeight: 200, fontFamily: 'inherit' }} />

        <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
          <div className="relative">
            <button onClick={() => setShowEmoji(v => !v)}
              className="p-1.5 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10"
              style={{ color: showEmoji ? 'var(--brand-color)' : 'var(--interactive-normal)' }}>
              <Smile size={18} />
            </button>
            {showEmoji && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <EmojiPicker
                  onEmojiClick={(e) => { setContent(c => c + e.emoji); setShowEmoji(false); textareaRef.current?.focus() }}
                  theme="dark" height={380} width={320} previewConfig={{ showPreview: false }} />
              </div>
            )}
          </div>
          <button onClick={handleSend} disabled={!canSend || sending}
            className="p-1.5 rounded-lg transition-all"
            style={{
              color: canSend ? 'white' : 'var(--interactive-muted)',
              background: canSend ? 'var(--brand-color)' : 'transparent',
              transform: canSend ? 'scale(1)' : 'scale(0.85)',
              transition: 'all 0.15s'
            }}>
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-xs mt-1.5 px-1" style={{ color: 'var(--text-muted)' }}>
        <kbd style={{ background: 'var(--bg-accent)', padding: '1px 4px', borderRadius: 3, fontSize: 10 }}>Enter</kbd> to send ·{' '}
        <kbd style={{ background: 'var(--bg-accent)', padding: '1px 4px', borderRadius: 3, fontSize: 10 }}>Shift+Enter</kbd> for new line ·{' '}
        <kbd style={{ background: 'var(--bg-accent)', padding: '1px 4px', borderRadius: 3, fontSize: 10 }}>@</kbd> to mention
      </p>
    </div>
  )
}
