import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuthStore } from '../../store'
import { useSocket } from '../../context/SocketContext'
import { api } from '../../utils/api'
import { Plus, Smile, Paperclip, Send, X, Reply } from 'lucide-react'
import toast from 'react-hot-toast'
import EmojiPicker from 'emoji-picker-react'

export default function MessageInput({ channelId, channelName, replyTo, onCancelReply }) {
  const { user } = useAuthStore()
  const { startTyping, stopTyping } = useSocket()
  const [content, setContent] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [files, setFiles] = useState([])
  const [sending, setSending] = useState(false)
  const textareaRef = useRef(null)
  const typingTimerRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => { textareaRef.current?.focus() }, [channelId])

  const handleTyping = useCallback(() => {
    startTyping(channelId)
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => stopTyping(channelId), 3000)
  }, [channelId])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    if (e.key === 'Escape' && replyTo) onCancelReply?.()
  }

  const handleSend = async () => {
    if ((!content.trim() && !files.length) || sending) return
    setSending(true)
    stopTyping(channelId)
    try {
      const formData = new FormData()
      if (content.trim()) formData.append('content', content.trim())
      if (replyTo) formData.append('replyToId', replyTo.id)
      if (files.length) formData.append('file', files[0])
      await api.sendMessage(channelId, formData)
      setContent('')
      setFiles([])
      onCancelReply?.()
      textareaRef.current?.focus()
    } catch (err) {
      toast.error(err.message)
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
        <div className="flex items-center gap-2 px-4 py-2 rounded-t-xl text-sm"
          style={{ background: 'var(--bg-accent)', borderBottom: '1px solid var(--border-subtle)' }}>
          <Reply size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Replying to</span>
          <span className="font-semibold" style={{ color: 'var(--brand-color)' }}>{replyTo.author?.displayName}</span>
          <button onClick={onCancelReply} className="ml-auto hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* File preview */}
      {files.length > 0 && (
        <div className="flex gap-2 px-4 py-3 rounded-t-xl flex-wrap" style={{ background: 'var(--bg-accent)' }}>
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              {f.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(f)} alt="" className="w-10 h-10 object-cover rounded-lg" />
              ) : (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--brand-color)' }}>
                  <Paperclip size={16} color="white" />
                </div>
              )}
              <div>
                <p className="font-medium max-w-32 truncate" style={{ color: 'var(--text-normal)' }}>{f.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{(f.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => setFiles([])} className="ml-2 hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input box */}
      <div className="flex items-end gap-2 rounded-xl px-3 py-2"
        style={{
          background: 'var(--bg-accent)',
          border: '1px solid var(--border-subtle)',
          borderTopLeftRadius: (replyTo || files.length) ? 0 : undefined,
          borderTopRightRadius: (replyTo || files.length) ? 0 : undefined,
        }}>
        {/* Attach */}
        <button onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded-lg flex-shrink-0 transition-colors hover:bg-white hover:bg-opacity-10"
          style={{ color: 'var(--interactive-normal)' }}>
          <Plus size={20} strokeWidth={2} />
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={e => setFiles(Array.from(e.target.files))} />

        <textarea ref={textareaRef} value={content}
          onChange={(e) => { setContent(e.target.value); handleTyping(); adjustHeight() }}
          onKeyDown={handleKeyDown} onPaste={handlePaste}
          placeholder={`Message #${channelName}`} rows={1}
          className="flex-1 py-1.5 text-sm resize-none outline-none bg-transparent leading-relaxed"
          style={{ color: 'var(--text-normal)', maxHeight: 200, fontFamily: 'inherit' }} />

        {/* Right actions */}
        <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
          <div className="relative">
            <button onClick={() => setShowEmoji(v => !v)}
              className="p-1.5 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10"
              style={{ color: showEmoji ? 'var(--brand-color)' : 'var(--interactive-normal)' }}>
              <Smile size={18} />
            </button>
            {showEmoji && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <EmojiPicker onEmojiClick={(e) => { setContent(c => c + e.emoji); setShowEmoji(false); textareaRef.current?.focus() }}
                  theme="dark" height={380} width={320} previewConfig={{ showPreview: false }} />
              </div>
            )}
          </div>
          <button onClick={handleSend} disabled={!canSend || sending}
            className="p-1.5 rounded-lg transition-all"
            style={{
              color: canSend ? 'white' : 'var(--interactive-muted)',
              background: canSend ? 'var(--brand-color)' : 'transparent',
              transform: canSend ? 'scale(1)' : 'scale(0.9)'
            }}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
