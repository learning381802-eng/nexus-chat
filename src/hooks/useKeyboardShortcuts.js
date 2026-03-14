import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const { setSettingsOpen, setServerSearchOpen, channels, activeServerId, setActiveChannel } = useAppStore()

  useEffect(() => {
    const handler = (e) => {
      // Ctrl/Cmd + K — server search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setServerSearchOpen(true)
        return
      }

      // Ctrl/Cmd + , — settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        setSettingsOpen(true)
        return
      }

      // Escape — close modals
      if (e.key === 'Escape') {
        setServerSearchOpen(false)
        setSettingsOpen(false)
        return
      }

      // Alt + Up/Down — navigate channels
      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault()
        const serverChannels = (channels[activeServerId] || []).filter(c => c.type === 'text')
        const activeChannelId = useAppStore.getState().activeChannelId
        const currentIndex = serverChannels.findIndex(c => c.id === activeChannelId)
        const nextIndex = e.key === 'ArrowDown'
          ? Math.min(currentIndex + 1, serverChannels.length - 1)
          : Math.max(currentIndex - 1, 0)
        const nextChannel = serverChannels[nextIndex]
        if (nextChannel && nextChannel.id !== activeChannelId) {
          setActiveChannel(nextChannel.id)
          navigate(`/channels/${activeServerId}/${nextChannel.id}`)
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeServerId, channels])
}
