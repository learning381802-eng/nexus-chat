import { useAppStore } from '../../store'
import { Moon, Sun } from 'lucide-react'
import { useEffect } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme } = useAppStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    applyTheme(theme)
  }, [theme])

  const applyTheme = (t) => {
    const root = document.documentElement
    if (t === 'light') {
      root.style.setProperty('--bg-primary', '#f2f3f5')
      root.style.setProperty('--bg-secondary', '#e3e5e8')
      root.style.setProperty('--bg-tertiary', '#ffffff')
      root.style.setProperty('--bg-accent', '#c4c9d4')
      root.style.setProperty('--bg-floating', '#ffffff')
      root.style.setProperty('--bg-modifier-hover', 'rgba(116,127,141,0.16)')
      root.style.setProperty('--bg-modifier-selected', 'rgba(116,127,141,0.24)')
      root.style.setProperty('--bg-message-hover', 'rgba(6,6,7,0.02)')
      root.style.setProperty('--text-normal', '#2e3338')
      root.style.setProperty('--text-muted', '#747f8d')
      root.style.setProperty('--header-primary', '#060607')
      root.style.setProperty('--header-secondary', '#4f5660')
      root.style.setProperty('--interactive-normal', '#4f5660')
      root.style.setProperty('--interactive-hover', '#2e3338')
      root.style.setProperty('--interactive-active', '#060607')
      root.style.setProperty('--scrollbar-thin-thumb', '#c4c9d4')
    } else {
      root.style.setProperty('--bg-primary', '#1E1F22')
      root.style.setProperty('--bg-secondary', '#2B2D31')
      root.style.setProperty('--bg-tertiary', '#313338')
      root.style.setProperty('--bg-accent', '#404249')
      root.style.setProperty('--bg-floating', '#111214')
      root.style.setProperty('--bg-modifier-hover', 'rgba(79,84,92,0.16)')
      root.style.setProperty('--bg-modifier-selected', 'rgba(79,84,92,0.32)')
      root.style.setProperty('--bg-message-hover', 'rgba(4,4,5,0.07)')
      root.style.setProperty('--text-normal', '#DBDEE1')
      root.style.setProperty('--text-muted', '#80848E')
      root.style.setProperty('--header-primary', '#F2F3F5')
      root.style.setProperty('--header-secondary', '#B5BAC1')
      root.style.setProperty('--interactive-normal', '#B5BAC1')
      root.style.setProperty('--interactive-hover', '#DBDEE1')
      root.style.setProperty('--interactive-active', '#FFFFFF')
      root.style.setProperty('--scrollbar-thin-thumb', '#1A1B1E')
    }
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full transition-colors"
      style={{ background: 'var(--bg-accent)', color: 'var(--interactive-normal)' }}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
