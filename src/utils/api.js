import { useAuthStore } from '../store'

const BASE = '/api'

async function request(method, path, body, isFormData = false) {
  const token = useAuthStore.getState().token
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!isFormData) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : (body ? JSON.stringify(body) : undefined)
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  // Auth
  register: (body) => request('POST', '/auth/register', body),
  login: (body) => request('POST', '/auth/login', body),
  me: () => request('GET', '/auth/me'),
  googleAuth: (credential) => request('POST', '/auth/google', { credential }),

  // Users
  updateMe: (body) => request('PATCH', '/users/@me', body),
  updateAvatar: (formData) => request('POST', '/users/@me/avatar', formData, true),
  getUser: (userId) => request('GET', `/users/${userId}`),

  // Servers
  getServers: () => request('GET', '/servers'),
  createServer: (body) => request('POST', '/servers', body),
  getServer: (id) => request('GET', `/servers/${id}`),
  updateServer: (id, body) => request('PATCH', `/servers/${id}`, body),
  deleteServer: (id) => request('DELETE', `/servers/${id}`),

  // Channels
  getChannels: (serverId) => request('GET', `/servers/${serverId}/channels`),
  createChannel: (serverId, body) => request('POST', `/servers/${serverId}/channels`, body),
  deleteChannel: (serverId, channelId) => request('DELETE', `/servers/${serverId}/channels/${channelId}`),

  // Messages
  getMessages: (channelId, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request('GET', `/channels/${channelId}/messages${query ? '?' + query : ''}`)
  },
  sendMessage: (channelId, formData) => request('POST', `/channels/${channelId}/messages`, formData, formData instanceof FormData),
  editMessage: (channelId, messageId, body) => request('PATCH', `/channels/${channelId}/messages/${messageId}`, body),
  deleteMessage: (channelId, messageId) => request('DELETE', `/channels/${channelId}/messages/${messageId}`),

  // Reactions
  addReaction: (channelId, messageId, emoji) => request('POST', `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`),
  removeReaction: (channelId, messageId, emoji) => request('DELETE', `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`),

  // Pins
  pinMessage: (channelId, messageId) => request('PUT', `/channels/${channelId}/pins/${messageId}`),
  getPins: (channelId) => request('GET', `/channels/${channelId}/pins`),

  // Invites
  createInvite: (serverId, body) => request('POST', `/servers/${serverId}/invites`, body),
  joinInvite: (code) => request('POST', `/invites/${code}`),

  // Members
  getMembers: (serverId) => request('GET', `/servers/${serverId}/members`),

  // Roles
  getRoles: (serverId) => request('GET', `/servers/${serverId}/roles`),
  createRole: (serverId, body) => request('POST', `/servers/${serverId}/roles`, body),

  // DMs
  getDmMessages: (userId) => request('GET', `/dm/${userId}/messages`),
  sendDm: (userId, body) => request('POST', `/dm/${userId}/messages`, body),

  // Friends
  getFriends: () => request('GET', '/friends'),
  sendFriendRequest: (body) => request('POST', '/friends/request', body),
  respondFriendRequest: (id, body) => request('PATCH', `/friends/${id}`, body),
  removeFriend: (id) => request('DELETE', `/friends/${id}`),

  // Server Emoji
  getServerEmojis: (serverId) => request('GET', `/servers/${serverId}/emojis`),
  createServerEmoji: (serverId, formData) => request('POST', `/servers/${serverId}/emojis`, formData, true),
  deleteServerEmoji: (serverId, emojiId) => request('DELETE', `/servers/${serverId}/emojis/${emojiId}`),

  // Polls
  getPolls: (channelId) => request('GET', `/channels/${channelId}/polls`),
  createPoll: (channelId, body) => request('POST', `/channels/${channelId}/polls`, body),
  votePoll: (pollId, body) => request('POST', `/polls/${pollId}/vote`, body),

  // Rules
  getRules: (serverId) => request('GET', `/servers/${serverId}/rules`),
  updateRules: (serverId, body) => request('PUT', `/servers/${serverId}/rules`, body),

  // Channel permissions
  updateChannelPermissions: (serverId, channelId, body) => request('PATCH', `/servers/${serverId}/channels/${channelId}/permissions`, body),

  // Role self-assignment
  assignRole: (serverId, roleId) => request('POST', `/servers/${serverId}/roles/${roleId}/assign`),
  unassignRole: (serverId, roleId) => request('DELETE', `/servers/${serverId}/roles/${roleId}/assign`),

  // Slash commands
  runCommand: (channelId, body) => request('POST', `/channels/${channelId}/commands`, body),
}
