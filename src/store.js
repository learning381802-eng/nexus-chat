import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Auth Store ─────────────────────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      updateUser: (updates) => set(state => ({ user: { ...state.user, ...updates } })),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'nexus-auth' }
  )
)

// ── App Store ──────────────────────────────────────────────────────────────────
export const useAppStore = create((set, get) => ({
  // Servers
  servers: [],
  activeServerId: null,
  setServers: (servers) => set({ servers }),
  addServer: (server) => set(state => ({ servers: [...state.servers, server] })),
  removeServer: (serverId) => set(state => ({ servers: state.servers.filter(s => s.id !== serverId) })),
  updateServer: (serverId, updates) => set(state => ({ servers: state.servers.map(s => s.id === serverId ? { ...s, ...updates } : s) })),
  setActiveServer: (serverId) => set({ activeServerId: serverId, activeChannelId: null }),

  // Channels
  channels: {},
  activeChannelId: null,
  setChannels: (serverId, channels) => set(state => ({ channels: { ...state.channels, [serverId]: channels } })),
  addChannel: (serverId, channel) => set(state => ({ channels: { ...state.channels, [serverId]: [...(state.channels[serverId] || []), channel] } })),
  removeChannel: (serverId, channelId) => set(state => ({ channels: { ...state.channels, [serverId]: (state.channels[serverId] || []).filter(c => c.id !== channelId) } })),
  setActiveChannel: (channelId) => set({ activeChannelId: channelId }),

  // Messages
  messages: {},
  setMessages: (channelId, messages) => set(state => ({ messages: { ...state.messages, [channelId]: messages } })),
  prependMessages: (channelId, messages) => set(state => ({ messages: { ...state.messages, [channelId]: [...messages, ...(state.messages[channelId] || [])] } })),
  addMessage: (channelId, message) => set(state => ({ messages: { ...state.messages, [channelId]: [...(state.messages[channelId] || []), message] } })),
  updateMessage: (channelId, messageId, updates) => set(state => ({
    messages: { ...state.messages, [channelId]: (state.messages[channelId] || []).map(m => m.id === messageId ? { ...m, ...updates } : m) }
  })),
  removeMessage: (channelId, messageId) => set(state => ({ messages: { ...state.messages, [channelId]: (state.messages[channelId] || []).filter(m => m.id !== messageId) } })),

  // Members
  members: {},
  setMembers: (serverId, members) => set(state => ({ members: { ...state.members, [serverId]: members } })),

  // Users (cache)
  users: {},
  cacheUser: (user) => set(state => ({ users: { ...state.users, [user.id]: user } })),
  updateCachedUser: (userId, updates) => set(state => ({ users: { ...state.users, [userId]: { ...state.users[userId], ...updates } } })),

  // DMs
  dmMessages: {},
  activeDmUserId: null,
  setDmMessages: (userId, messages) => set(state => ({ dmMessages: { ...state.dmMessages, [userId]: messages } })),
  addDmMessage: (userId, message) => set(state => ({ dmMessages: { ...state.dmMessages, [userId]: [...(state.dmMessages[userId] || []), message] } })),
  setActiveDm: (userId) => set({ activeDmUserId: userId, activeServerId: null, activeChannelId: null }),

  // Friends
  friends: [],
  setFriends: (friends) => set({ friends }),
  addFriend: (friendship) => set(state => ({ friends: [...state.friends, friendship] })),
  updateFriend: (friendshipId, updates) => set(state => ({ friends: state.friends.map(f => f.id === friendshipId ? { ...f, ...updates } : f) })),
  removeFriend: (friendshipId) => set(state => ({ friends: state.friends.filter(f => f.id !== friendshipId) })),

  // Typing
  typing: {},
  setTyping: (channelId, userId, username) => set(state => ({ typing: { ...state.typing, [channelId]: { ...state.typing[channelId], [userId]: { username, at: Date.now() } } } })),
  clearTyping: (channelId, userId) => set(state => {
    const channelTyping = { ...(state.typing[channelId] || {}) };
    delete channelTyping[userId];
    return { typing: { ...state.typing, [channelId]: channelTyping } };
  }),

  // Voice
  voiceChannelId: null,
  voiceStates: {},
  voiceMuted: false,
  voiceDeafened: false,
  voiceVideo: false,
  setVoiceChannel: (channelId) => set({ voiceChannelId: channelId }),
  setVoiceStates: (channelId, states) => set(state => ({ voiceStates: { ...state.voiceStates, [channelId]: states } })),
  setVoiceMuted: (muted) => set({ voiceMuted: muted }),
  setVoiceDeafened: (deafened) => set({ voiceDeafened: deafened }),
  setVoiceVideo: (video) => set({ voiceVideo: video }),

  // Unread
  unread: {},
  mentions: {},
  markRead: (channelId) => set(state => { const u = { ...state.unread }; delete u[channelId]; return { unread: u }; }),
  addUnread: (channelId) => set(state => ({ unread: { ...state.unread, [channelId]: (state.unread[channelId] || 0) + 1 } })),
  addMention: (channelId) => set(state => ({ mentions: { ...state.mentions, [channelId]: (state.mentions[channelId] || 0) + 1 } })),

  // UI state
  rightSidebarOpen: false,
  toggleRightSidebar: () => set(state => ({ rightSidebarOpen: !state.rightSidebarOpen })),
  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  activeSettingsTab: 'my-account',
  setActiveSettingsTab: (tab) => set({ activeSettingsTab: tab }),

  // Theme
  theme: 'dark',
  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    set({ theme })
  },

  // Profile popup
  profilePopup: null,
  setProfilePopup: (user) => set({ profilePopup: user }),

  // Server-wide search
  serverSearchOpen: false,
  setServerSearchOpen: (open) => set({ serverSearchOpen: open }),

  // Reports
  reports: [],
  addReport: (report) => set(state => ({ reports: [report, ...state.reports] })),
  updateReport: (reportId, updates) => set(state => ({
    reports: state.reports.map(r => r.id === reportId ? { ...r, ...updates } : r)
  })),
  removeReport: (reportId) => set(state => ({ reports: state.reports.filter(r => r.id !== reportId) })),

  // Server emoji
  serverEmoji: {},
  addServerEmoji: (serverId, emoji) => set(state => ({
    serverEmoji: { ...state.serverEmoji, [serverId]: [...(state.serverEmoji[serverId] || []), emoji] }
  })),
  removeServerEmoji: (serverId, emojiId) => set(state => ({
    serverEmoji: { ...state.serverEmoji, [serverId]: (state.serverEmoji[serverId] || []).filter(e => e.id !== emojiId) }
  })),

  // Bookmarks
  bookmarks: [],
  addBookmark: (message) => set(state => ({ bookmarks: [...state.bookmarks.filter(b => b.id !== message.id), message] })),
  removeBookmark: (messageId) => set(state => ({ bookmarks: state.bookmarks.filter(b => b.id !== messageId) })),

  // Threads
  threads: {},
  activeThreadId: null,
  setThreads: (channelId, threads) => set(state => ({ threads: { ...state.threads, [channelId]: threads } })),
  setActiveThread: (threadId) => set({ activeThreadId: threadId }),

  // Roles
  roles: {},
  setRoles: (serverId, roles) => set(state => ({ roles: { ...state.roles, [serverId]: roles } })),
}))
