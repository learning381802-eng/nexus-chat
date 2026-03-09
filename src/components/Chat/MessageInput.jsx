import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuthStore } from '../../store'
import { useSocket } from '../../context/SocketContext'
import { api } from '../../utils/api'
import { Plus, Smile, Gift, Sticker, GripHorizontal, PaperclipIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import EmojiPicker from 'emoji-picker-react'

export default function MessageInput({ channelId, channelName, onReply, replyTo, onCancelReply }) {
  const { user } = useAuthStore()
  const { startTyping, stopTyping } = useSocket()
  const [content, setContent] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [files, setFiles] = useState([])
  const [sending, setSending] = useState(false)
  const textareaRef = useRef(null)
  const typingTimerRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [channelId])

  const handleTyping = useCallback(() => {
    startTyping(channelId)
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => stopTyping(channelId), 3000)
  }, [channelId])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
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

  const handleEmojiSelect = (emojiData) => {
    setContent(c => c + emojiData.emoji)
    setShowEmoji(false)
    textareaRef.current?.focus()
  }

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files)
    setFiles(selected)
  }

  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        setFiles([file])
        break
      }
    }
  }

  const adjustHeight = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  return (
    <div className="px-4 pb-6 flex-shrink-0">
      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 mb-0 rounded-t text-sm" style={{ background: 'var(--bg-accent)', color: 'var(--text-muted)' }}>
          <span>Replying to <strong style={{ color: 'var(--text-normal)' }}>{replyTo.author?.username}</strong></span>
          <button onClick={onCancelReply} className="ml-auto hover:text-white">✕</button>
        </div>
      )}

      {/* File preview */}
      {files.length > 0 && (
        <div className="flex gap-2 px-4 py-2 rounded-t flex-wrap" style={{ background: 'var(--bg-accent)' }}>
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded px-2 py-1 text-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-normal)' }}>
              {f.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(f)} alt="" className="w-10 h-10 object-cover rounded" />
              ) : (
                <span>📎</span>
              )}
              <span className="max-w-40 truncate">{f.name}</span>
              <button onClick={() => setFiles([])} className="ml-1 hover:text-white" style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end rounded-lg" style={{ background: 'var(--bg-accent)', borderRadius: replyTo || files.length ? '0 0 8px 8px' : 8 }}>
        {/* File attach */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 rounded-l transition-colors flex-shrink-0 hover:text-white"
          style={{ color: 'var(--interactive-normal)' }}
        >
          <Plus size={22} />
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*,.pdf,.txt,.zip" />

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); handleTyping(); adjustHeight() }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={`Message #${channelName}`}
          rows={1}
          className="flex-1 py-3 text-sm resize-none outline-none bg-transparent leading-relaxed"
          style={{ color: 'var(--text-normal)', maxHeight: 200 }}
        />

        {/* Right buttons */}
        <div className="flex items-center pb-2 pr-2 gap-1 flex-shrink-0">
          <button className="p-1.5 transition-colors hover:text-white" style={{ color: 'var(--interactive-normal)' }}>
            <Gift size={20} />
          </button>
          <button className="p-1.5 transition-colors hover:text-white" style={{ color: 'var(--interactive-normal)' }}>
            <Sticker size={20} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowEmoji(v => !v)}
              className="p-1.5 transition-colors hover:text-white"
              style={{ color: 'var(--interactive-normal)' }}
            >
              <Smile size={20} />
            </button>
            {showEmoji && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  theme="dark"
                  height={400}
                  width={350}
                  previewConfig={{ showPreview: false }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
