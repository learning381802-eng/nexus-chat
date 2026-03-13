import { useAuthStore } from '../store'

const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

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
}
