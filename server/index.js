require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] }
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const JWT_SECRET = process.env.JWT_SECRET || 'nexus_secret_key_change_in_production';
const PORT = process.env.PORT || 3001;

// ── In-memory data store (replace with DB in production) ──────────────────────
const db = {
  users: [],
  servers: [],
  channels: {},      // serverId -> [channels]
  messages: {},      // channelId -> [messages]
  directMessages: {}, // dmId -> [messages]
  roles: {},         // serverId -> [roles]
  members: {},       // serverId -> [{ userId, roles, nickname, joinedAt }]
  invites: {},       // code -> { serverId, createdBy, uses, maxUses, expiresAt }
  friendships: [],   // [{ id, user1, user2, status }]
  voiceStates: {},   // channelId -> [{ userId, muted, deafened }]
};

// ── Multer config ──────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Auth middleware ────────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ── Auth routes ────────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, displayName } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  if (db.users.find(u => u.email === email || u.username === username))
    return res.status(400).json({ error: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(), username, email, password: hashedPassword,
    displayName: displayName || username,
    avatar: null, banner: null, bio: '',
    status: 'online', customStatus: '',
    createdAt: new Date().toISOString(),
    discriminator: Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  };
  db.users.push(user);
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

app.post('/api/auth/login', async (req, res) => {
  const { login, password } = req.body;
  const user = db.users.find(u => u.email === login || u.username === login);
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Invalid credentials' });

  user.status = 'online';
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// ── User routes ────────────────────────────────────────────────────────────────
app.patch('/api/users/@me', authMiddleware, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const { displayName, bio, status, customStatus } = req.body;
  if (displayName) user.displayName = displayName;
  if (bio !== undefined) user.bio = bio;
  if (status) user.status = status;
  if (customStatus !== undefined) user.customStatus = customStatus;
  const { password: _, ...safeUser } = user;
  io.emit('user:update', safeUser);
  res.json(safeUser);
});

app.post('/api/users/@me/avatar', authMiddleware, upload.single('avatar'), (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  user.avatar = `/uploads/${req.file.filename}`;
  const { password: _, ...safeUser } = user;
  io.emit('user:update', safeUser);
  res.json(safeUser);
});

app.get('/api/users/:userId', authMiddleware, (req, res) => {
  const user = db.users.find(u => u.id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// ── Friend routes ──────────────────────────────────────────────────────────────
app.get('/api/friends', authMiddleware, (req, res) => {
  const friendships = db.friendships.filter(
    f => (f.user1 === req.user.id || f.user2 === req.user.id)
  );
  const result = friendships.map(f => {
    const friendId = f.user1 === req.user.id ? f.user2 : f.user1;
    const friend = db.users.find(u => u.id === friendId);
    const { password: _, ...safeFriend } = friend;
    return { ...f, friend: safeFriend };
  });
  res.json(result);
});

app.post('/api/friends/request', authMiddleware, (req, res) => {
  const { username, discriminator } = req.body;
  const target = db.users.find(u => u.username === username && u.discriminator === discriminator);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.id === req.user.id) return res.status(400).json({ error: 'Cannot add yourself' });

  const existing = db.friendships.find(
    f => (f.user1 === req.user.id && f.user2 === target.id) ||
         (f.user1 === target.id && f.user2 === req.user.id)
  );
  if (existing) return res.status(400).json({ error: 'Already exists' });

  const friendship = { id: uuidv4(), user1: req.user.id, user2: target.id, status: 'pending', createdAt: new Date().toISOString() };
  db.friendships.push(friendship);
  io.to(`user:${target.id}`).emit('friend:request', { friendship, from: req.user });
  res.json(friendship);
});

app.patch('/api/friends/:friendshipId', authMiddleware, (req, res) => {
  const friendship = db.friendships.find(f => f.id === req.params.friendshipId);
  if (!friendship) return res.status(404).json({ error: 'Not found' });
  const { status } = req.body;
  friendship.status = status;
  io.to(`user:${friendship.user1}`).emit('friend:update', friendship);
  io.to(`user:${friendship.user2}`).emit('friend:update', friendship);
  res.json(friendship);
});

app.delete('/api/friends/:friendshipId', authMiddleware, (req, res) => {
  const idx = db.friendships.findIndex(f => f.id === req.params.friendshipId);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.friendships.splice(idx, 1);
  res.json({ success: true });
});

// ── Server (Guild) routes ──────────────────────────────────────────────────────
app.get('/api/servers', authMiddleware, (req, res) => {
  const userServers = db.servers.filter(s =>
    s.ownerId === req.user.id ||
    (db.members[s.id] || []).some(m => m.userId === req.user.id)
  );
  res.json(userServers);
});

app.post('/api/servers', authMiddleware, (req, res) => {
  const { name, icon } = req.body;
  const serverId = uuidv4();
  const server = { id: serverId, name, icon: icon || null, ownerId: req.user.id, createdAt: new Date().toISOString(), description: '' };
  db.servers.push(server);

  // Default channels
  db.channels[serverId] = [
    { id: uuidv4(), serverId, name: 'general', type: 'text', categoryId: 'cat1', position: 0, topic: '', slowMode: 0, nsfw: false, createdAt: new Date().toISOString() },
    { id: uuidv4(), serverId, name: 'announcements', type: 'text', categoryId: 'cat1', position: 1, topic: '', slowMode: 0, nsfw: false, createdAt: new Date().toISOString() },
    { id: uuidv4(), serverId, name: 'General Voice', type: 'voice', categoryId: 'cat2', position: 2, bitrate: 64000, userLimit: 0, createdAt: new Date().toISOString() },
  ];

  // Default roles
  db.roles[serverId] = [
    { id: uuidv4(), serverId, name: '@everyone', color: '#99AAB5', permissions: 104324161, position: 0, mentionable: false, hoist: false },
    { id: uuidv4(), serverId, name: 'Admin', color: '#E74C3C', permissions: 8, position: 1, mentionable: true, hoist: true },
    { id: uuidv4(), serverId, name: 'Moderator', color: '#3498DB', permissions: 268435456, position: 2, mentionable: true, hoist: true },
  ];

  // Add owner as member
  db.members[serverId] = [{ userId: req.user.id, roles: [db.roles[serverId][0].id], nickname: null, joinedAt: new Date().toISOString() }];

  res.json({ server, channels: db.channels[serverId] });
});

app.get('/api/servers/:serverId', authMiddleware, (req, res) => {
  const server = db.servers.find(s => s.id === req.params.serverId);
  if (!server) return res.status(404).json({ error: 'Not found' });
  res.json(server);
});

app.patch('/api/servers/:serverId', authMiddleware, (req, res) => {
  const server = db.servers.find(s => s.id === req.params.serverId);
  if (!server || server.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { name, description } = req.body;
  if (name) server.name = name;
  if (description !== undefined) server.description = description;
  io.to(`server:${server.id}`).emit('server:update', server);
  res.json(server);
});

app.delete('/api/servers/:serverId', authMiddleware, (req, res) => {
  const idx = db.servers.findIndex(s => s.id === req.params.serverId);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  if (db.servers[idx].ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  io.to(`server:${req.params.serverId}`).emit('server:delete', { serverId: req.params.serverId });
  db.servers.splice(idx, 1);
  res.json({ success: true });
});

// ── Channel routes ─────────────────────────────────────────────────────────────
app.get('/api/servers/:serverId/channels', authMiddleware, (req, res) => {
  res.json(db.channels[req.params.serverId] || []);
});

app.post('/api/servers/:serverId/channels', authMiddleware, (req, res) => {
  const { name, type = 'text', categoryId } = req.body;
  const channel = {
    id: uuidv4(), serverId: req.params.serverId, name, type, categoryId,
    position: (db.channels[req.params.serverId] || []).length,
    topic: '', slowMode: 0, nsfw: false, createdAt: new Date().toISOString()
  };
  if (!db.channels[req.params.serverId]) db.channels[req.params.serverId] = [];
  db.channels[req.params.serverId].push(channel);
  io.to(`server:${req.params.serverId}`).emit('channel:create', channel);
  res.json(channel);
});

app.delete('/api/servers/:serverId/channels/:channelId', authMiddleware, (req, res) => {
  const channels = db.channels[req.params.serverId] || [];
  const idx = channels.findIndex(c => c.id === req.params.channelId);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  channels.splice(idx, 1);
  io.to(`server:${req.params.serverId}`).emit('channel:delete', { channelId: req.params.channelId });
  res.json({ success: true });
});

// ── Message routes ─────────────────────────────────────────────────────────────
app.get('/api/channels/:channelId/messages', authMiddleware, (req, res) => {
  const messages = db.messages[req.params.channelId] || [];
  const limit = parseInt(req.query.limit) || 50;
  const before = req.query.before;
  let result = before
    ? messages.filter(m => m.createdAt < before)
    : messages;
  res.json(result.slice(-limit).reverse());
});

app.post('/api/channels/:channelId/messages', authMiddleware, upload.single('file'), (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  const { content, replyToId, mentions } = req.body;
  const message = {
    id: uuidv4(),
    channelId: req.params.channelId,
    content: content || '',
    author: (() => { const { password: _, ...u } = user; return u; })(),
    replyTo: replyToId ? (db.messages[req.params.channelId] || []).find(m => m.id === replyToId) : null,
    attachments: req.file ? [{ id: uuidv4(), url: `/uploads/${req.file.filename}`, name: req.file.originalname, size: req.file.size, contentType: req.file.mimetype }] : [],
    embeds: [],
    reactions: [],
    mentions: mentions ? JSON.parse(mentions) : [],
    pinned: false,
    edited: false,
    editedAt: null,
    createdAt: new Date().toISOString()
  };
  if (!db.messages[req.params.channelId]) db.messages[req.params.channelId] = [];
  db.messages[req.params.channelId].push(message);
  io.to(`channel:${req.params.channelId}`).emit('message:create', message);
  res.json(message);
});

app.patch('/api/channels/:channelId/messages/:messageId', authMiddleware, (req, res) => {
  const messages = db.messages[req.params.channelId] || [];
  const message = messages.find(m => m.id === req.params.messageId);
  if (!message) return res.status(404).json({ error: 'Not found' });
  if (message.author.id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  message.content = req.body.content;
  message.edited = true;
  message.editedAt = new Date().toISOString();
  io.to(`channel:${req.params.channelId}`).emit('message:update', message);
  res.json(message);
});

app.delete('/api/channels/:channelId/messages/:messageId', authMiddleware, (req, res) => {
  const messages = db.messages[req.params.channelId] || [];
  const idx = messages.findIndex(m => m.id === req.params.messageId);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const msg = messages[idx];
  const server = db.servers.find(s => (db.channels[s.id] || []).some(c => c.id === req.params.channelId));
  const canDelete = msg.author.id === req.user.id || (server && server.ownerId === req.user.id);
  if (!canDelete) return res.status(403).json({ error: 'Forbidden' });
  messages.splice(idx, 1);
  io.to(`channel:${req.params.channelId}`).emit('message:delete', { messageId: req.params.messageId, channelId: req.params.channelId });
  res.json({ success: true });
});

// ── Reactions ──────────────────────────────────────────────────────────────────
app.post('/api/channels/:channelId/messages/:messageId/reactions/:emoji', authMiddleware, (req, res) => {
  const messages = db.messages[req.params.channelId] || [];
  const message = messages.find(m => m.id === req.params.messageId);
  if (!message) return res.status(404).json({ error: 'Not found' });
  const emoji = decodeURIComponent(req.params.emoji);
  let reaction = message.reactions.find(r => r.emoji === emoji);
  if (reaction) {
    if (!reaction.users.includes(req.user.id)) { reaction.users.push(req.user.id); reaction.count++; }
  } else {
    message.reactions.push({ emoji, count: 1, users: [req.user.id] });
  }
  io.to(`channel:${req.params.channelId}`).emit('message:update', message);
  res.json(message);
});

app.delete('/api/channels/:channelId/messages/:messageId/reactions/:emoji', authMiddleware, (req, res) => {
  const messages = db.messages[req.params.channelId] || [];
  const message = messages.find(m => m.id === req.params.messageId);
  if (!message) return res.status(404).json({ error: 'Not found' });
  const emoji = decodeURIComponent(req.params.emoji);
  const reaction = message.reactions.find(r => r.emoji === emoji);
  if (reaction) {
    reaction.users = reaction.users.filter(u => u !== req.user.id);
    reaction.count--;
    if (reaction.count === 0) message.reactions = message.reactions.filter(r => r.emoji !== emoji);
  }
  io.to(`channel:${req.params.channelId}`).emit('message:update', message);
  res.json(message);
});

// ── Pin messages ───────────────────────────────────────────────────────────────
app.put('/api/channels/:channelId/pins/:messageId', authMiddleware, (req, res) => {
  const messages = db.messages[req.params.channelId] || [];
  const message = messages.find(m => m.id === req.params.messageId);
  if (!message) return res.status(404).json({ error: 'Not found' });
  message.pinned = true;
  io.to(`channel:${req.params.channelId}`).emit('message:update', message);
  res.json(message);
});

app.get('/api/channels/:channelId/pins', authMiddleware, (req, res) => {
  const messages = db.messages[req.params.channelId] || [];
  res.json(messages.filter(m => m.pinned));
});

// ── Invite routes ──────────────────────────────────────────────────────────────
app.post('/api/servers/:serverId/invites', authMiddleware, (req, res) => {
  const { maxUses = 0, maxAge = 0 } = req.body;
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  db.invites[code] = {
    code, serverId: req.params.serverId, createdBy: req.user.id,
    uses: 0, maxUses, createdAt: new Date().toISOString(),
    expiresAt: maxAge ? new Date(Date.now() + maxAge * 1000).toISOString() : null
  };
  res.json(db.invites[code]);
});

app.post('/api/invites/:code', authMiddleware, (req, res) => {
  const invite = db.invites[req.params.code];
  if (!invite) return res.status(404).json({ error: 'Invalid invite' });
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return res.status(400).json({ error: 'Invite expired' });
  if (invite.maxUses && invite.uses >= invite.maxUses) return res.status(400).json({ error: 'Invite maxed out' });

  const members = db.members[invite.serverId] || [];
  if (!members.find(m => m.userId === req.user.id)) {
    members.push({ userId: req.user.id, roles: [], nickname: null, joinedAt: new Date().toISOString() });
    db.members[invite.serverId] = members;
  }
  invite.uses++;
  const server = db.servers.find(s => s.id === invite.serverId);
  res.json({ server, channels: db.channels[invite.serverId] || [] });
});

// ── Members routes ─────────────────────────────────────────────────────────────
app.get('/api/servers/:serverId/members', authMiddleware, (req, res) => {
  const members = (db.members[req.params.serverId] || []).map(m => {
    const user = db.users.find(u => u.id === m.userId);
    const { password: _, ...safeUser } = user;
    return { ...m, user: safeUser };
  });
  res.json(members);
});

// ── Roles routes ───────────────────────────────────────────────────────────────
app.get('/api/servers/:serverId/roles', authMiddleware, (req, res) => {
  res.json(db.roles[req.params.serverId] || []);
});

app.post('/api/servers/:serverId/roles', authMiddleware, (req, res) => {
  const { name, color, permissions } = req.body;
  const role = { id: uuidv4(), serverId: req.params.serverId, name, color: color || '#99AAB5', permissions: permissions || 0, position: (db.roles[req.params.serverId] || []).length, mentionable: false, hoist: false };
  if (!db.roles[req.params.serverId]) db.roles[req.params.serverId] = [];
  db.roles[req.params.serverId].push(role);
  res.json(role);
});

// ── DM routes ──────────────────────────────────────────────────────────────────
app.get('/api/dm/:userId/messages', authMiddleware, (req, res) => {
  const dmId = [req.user.id, req.params.userId].sort().join(':');
  res.json((db.directMessages[dmId] || []).slice(-50).reverse());
});

app.post('/api/dm/:userId/messages', authMiddleware, (req, res) => {
  const sender = db.users.find(u => u.id === req.user.id);
  const dmId = [req.user.id, req.params.userId].sort().join(':');
  const message = {
    id: uuidv4(), dmId, content: req.body.content,
    author: (() => { const { password: _, ...u } = sender; return u; })(),
    attachments: [], reactions: [], edited: false, editedAt: null,
    createdAt: new Date().toISOString()
  };
  if (!db.directMessages[dmId]) db.directMessages[dmId] = [];
  db.directMessages[dmId].push(message);
  io.to(`user:${req.params.userId}`).emit('dm:message', message);
  io.to(`user:${req.user.id}`).emit('dm:message', message);
  res.json(message);
});

// ── Socket.IO ──────────────────────────────────────────────────────────────────
const connectedUsers = new Map(); // userId -> socketId

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Unauthorized'));
  try {
    socket.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user.id;
  connectedUsers.set(userId, socket.id);
  socket.join(`user:${userId}`);

  // Update user status
  const user = db.users.find(u => u.id === userId);
  if (user) { user.status = 'online'; io.emit('user:status', { userId, status: 'online' }); }

  // Join all server rooms
  const userServers = db.servers.filter(s =>
    s.ownerId === userId || (db.members[s.id] || []).some(m => m.userId === userId)
  );
  userServers.forEach(s => socket.join(`server:${s.id}`));

  socket.on('channel:join', (channelId) => {
    socket.join(`channel:${channelId}`);
  });

  socket.on('channel:leave', (channelId) => {
    socket.leave(`channel:${channelId}`);
  });

  socket.on('typing:start', ({ channelId }) => {
    const u = db.users.find(u => u.id === userId);
    socket.to(`channel:${channelId}`).emit('typing:start', { userId, username: u?.username, channelId });
  });

  socket.on('typing:stop', ({ channelId }) => {
    socket.to(`channel:${channelId}`).emit('typing:stop', { userId, channelId });
  });

  socket.on('voice:join', ({ channelId }) => {
    if (!db.voiceStates[channelId]) db.voiceStates[channelId] = [];
    db.voiceStates[channelId] = db.voiceStates[channelId].filter(v => v.userId !== userId);
    db.voiceStates[channelId].push({ userId, muted: false, deafened: false, video: false });
    io.to(`server:${Object.keys(db.channels).find(sid => (db.channels[sid] || []).some(c => c.id === channelId))}`).emit('voice:update', { channelId, states: db.voiceStates[channelId] });
  });

  socket.on('voice:leave', ({ channelId }) => {
    if (db.voiceStates[channelId]) {
      db.voiceStates[channelId] = db.voiceStates[channelId].filter(v => v.userId !== userId);
      io.emit('voice:update', { channelId, states: db.voiceStates[channelId] });
    }
  });

  socket.on('voice:state', ({ channelId, muted, deafened, video }) => {
    if (db.voiceStates[channelId]) {
      const state = db.voiceStates[channelId].find(v => v.userId === userId);
      if (state) { if (muted !== undefined) state.muted = muted; if (deafened !== undefined) state.deafened = deafened; if (video !== undefined) state.video = video; }
      io.emit('voice:update', { channelId, states: db.voiceStates[channelId] });
    }
  });

  socket.on('server:join', (serverId) => socket.join(`server:${serverId}`));

  socket.on('disconnect', () => {
    connectedUsers.delete(userId);
    const u = db.users.find(u => u.id === userId);
    if (u) { u.status = 'offline'; io.emit('user:status', { userId, status: 'offline' }); }
    // Clean up voice states
    Object.keys(db.voiceStates).forEach(channelId => {
      if (db.voiceStates[channelId].some(v => v.userId === userId)) {
        db.voiceStates[channelId] = db.voiceStates[channelId].filter(v => v.userId !== userId);
        io.emit('voice:update', { channelId, states: db.voiceStates[channelId] });
      }
    });
  });
});

server.listen(PORT, () => console.log(`🚀 Nexus Chat server running on port ${PORT}`));
