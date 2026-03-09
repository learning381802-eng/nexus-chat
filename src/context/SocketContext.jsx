import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '../store'
import { useAppStore } from '../store'
import toast from 'react-hot-toast'

const SocketContext = createContext(null)

export const useSocket = () => useContext(SocketContext)

export function SocketProvider({ children }) {
  const { token, user } = useAuthStore()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  const {
    addMessage, updateMessage, removeMessage,
    addDmMessage, addUnread, addMention,
    setTyping, clearTyping, setVoiceStates,
    updateCachedUser, updateFriend, addFriend,
    activeChannelId, activeDmUserId
  } = useAppStore()

  useEffect(() => {
    if (!token || !user) return

    const socket = io('/', { auth: { token }, transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', () => { setConnected(true); console.log('Socket connected') })
    socket.on('disconnect', () => { setConnected(false) })

    socket.on('message:create', (message) => {
      addMessage(message.channelId, message)
      if (message.channelId !== activeChannelId) {
        addUnread(message.channelId)
        if (message.mentions?.some(m => m.id === user.id)) addMention(message.channelId)
      }
    })

    socket.on('message:update', (message) => {
      updateMessage(message.channelId, message.id, message)
    })

    socket.on('message:delete', ({ messageId, channelId }) => {
      removeMessage(channelId, messageId)
    })

    socket.on('dm:message', (message) => {
      const otherId = message.author.id === user.id ? activeDmUserId : message.author.id
      addDmMessage(message.author.id === user.id ? message.dmId.replace(user.id, '').replace(':', '') : message.author.id, message)
    })

    socket.on('typing:start', ({ userId, username, channelId }) => {
      if (userId !== user.id) {
        setTyping(channelId, userId, username)
        setTimeout(() => clearTyping(channelId, userId), 5000)
      }
    })

    socket.on('typing:stop', ({ userId, channelId }) => {
      clearTyping(channelId, userId)
    })

    socket.on('voice:update', ({ channelId, states }) => {
      setVoiceStates(channelId, states)
    })

    socket.on('user:update', (updatedUser) => {
      updateCachedUser(updatedUser.id, updatedUser)
    })

    socket.on('user:status', ({ userId, status }) => {
      updateCachedUser(userId, { status })
    })

    socket.on('friend:request', ({ from }) => {
      toast(`${from.username} sent you a friend request!`, { icon: '👤' })
    })

    socket.on('friend:update', (friendship) => {
      updateFriend(friendship.id, friendship)
    })

    return () => { socket.disconnect(); socketRef.current = null }
  }, [token, user?.id])

  const joinChannel = (channelId) => socketRef.current?.emit('channel:join', channelId)
  const leaveChannel = (channelId) => socketRef.current?.emit('channel:leave', channelId)
  const startTyping = (channelId) => socketRef.current?.emit('typing:start', { channelId })
  const stopTyping = (channelId) => socketRef.current?.emit('typing:stop', { channelId })
  const joinVoice = (channelId) => socketRef.current?.emit('voice:join', { channelId })
  const leaveVoice = (channelId) => socketRef.current?.emit('voice:leave', { channelId })
  const updateVoiceState = (channelId, state) => socketRef.current?.emit('voice:state', { channelId, ...state })
  const joinServer = (serverId) => socketRef.current?.emit('server:join', serverId)

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, joinChannel, leaveChannel, startTyping, stopTyping, joinVoice, leaveVoice, updateVoiceState, joinServer }}>
      {children}
    </SocketContext.Provider>
  )
}
