import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuthStore, useAppStore } from '../store'
import { api } from '../utils/api'
import ServerList from './Sidebar/ServerList'
import ChannelSidebar from './Sidebar/ChannelSidebar'
import ChatArea from './Chat/ChatArea'
import DMArea from './Chat/DMArea'
import FriendsPage from './Friends/FriendsPage'
import UserPanel from './Sidebar/UserPanel'
import MemberList from './Sidebar/MemberList'
import SettingsModal from './Settings/SettingsModal'

export default function AppLayout() {
  const { user } = useAuthStore()
  const { setServers, setFriends, settingsOpen, activeServerId, activeChannelId, rightSidebarOpen } = useAppStore()

  useEffect(() => {
    Promise.all([api.getServers(), api.getFriends()])
      .then(([servers, friends]) => { setServers(servers); setFriends(friends) })
      .catch(console.error)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Server list */}
      <ServerList />

      {/* Channel sidebar */}
      <ChannelSidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        <Routes>
          <Route path="@me" element={<FriendsPage />} />
          <Route path="@me/:userId" element={<DMArea />} />
          <Route path=":serverId/:channelId" element={<ChatArea />} />
          <Route path=":serverId" element={
            <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="text-center">
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--header-primary)' }}>Welcome!</h2>
                <p style={{ color: 'var(--text-muted)' }}>Select a channel to start chatting</p>
              </div>
            </div>
          } />
          <Route path="" element={
            <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="text-center">
                <div className="text-6xl mb-4">👋</div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--header-primary)' }}>Welcome to Nexus Chat!</h2>
                <p style={{ color: 'var(--text-muted)' }}>Select a server or open a DM to get started</p>
              </div>
            </div>
          } />
        </Routes>
      </div>

      {/* Member list (right sidebar) */}
      {rightSidebarOpen && activeServerId && activeChannelId && <MemberList />}

      {/* Settings modal */}
      {settingsOpen && <SettingsModal />}
    </div>
  )
}
