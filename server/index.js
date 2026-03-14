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
const { OAuth2Client } = require('google-auth-library');

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
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

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

// ── Google OAuth ───────────────────────────────────────────────────────────────
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Missing credential' });
  if (!googleClient) return res.status(503).json({ error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID in server .env' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Find existing user by email or googleId
    let user = db.users.find(u => u.email === email || u.googleId === googleId);

    if (!user) {
      // Create new user
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 999);
      user = {
        id: uuidv4(),
        googleId,
        username,
        email,
        password: null,
        displayName: name || username,
        avatar: picture || null,
        banner: null,
        bio: '',
        status: 'online',
        customStatus: '',
        createdAt: new Date().toISOString(),
        discriminator: Math.floor(Math.random() * 9999).toString().padStart(4, '0'),
      };
      db.users.push(user);
    } else {
      user.status = 'online';
      if (picture && !user.avatar) user.avatar = picture;
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Invalid Google credential' });
  }
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

// ── Server Emoji ───────────────────────────────────────────────────────────────
const EmojiSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  serverId: String,
  name: String,
  url: String,
  createdBy: String,
  createdAt: { type: String, default: () => new Date().toISOString() }
})
const ServerEmoji = mongoose.model('ServerEmoji', EmojiSchema)

app.get('/api/servers/:serverId/emojis', authMiddleware, async (req, res) => {
  const emojis = await ServerEmoji.find({ serverId: req.params.serverId })
  res.json(emojis.map(e => { const o = e.toObject(); delete o._id; delete o.__v; return o }))
})

app.post('/api/servers/:serverId/emojis', authMiddleware, upload.single('image'), async (req, res) => {
  const { name } = req.body
  if (!name || !req.file) return res.status(400).json({ error: 'Name and image required' })
  const emoji = new ServerEmoji({ id: uuidv4(), serverId: req.params.serverId, name: name.toLowerCase().replace(/\s+/g, '_'), url: `/uploads/${req.file.filename}`, createdBy: req.user.id })
  await emoji.save()
  const o = emoji.toObject(); delete o._id; delete o.__v
  io.to(`server:${req.params.serverId}`).emit('emoji:create', o)
  res.json(o)
})

app.delete('/api/servers/:serverId/emojis/:emojiId', authMiddleware, async (req, res) => {
  await ServerEmoji.deleteOne({ id: req.params.emojiId, serverId: req.params.serverId })
  io.to(`server:${req.params.serverId}`).emit('emoji:delete', { emojiId: req.params.emojiId })
  res.json({ success: true })
})

// ── Polls ──────────────────────────────────────────────────────────────────────
const PollSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  channelId: String,
  serverId: String,
  question: String,
  options: [{ id: String, text: String, votes: [String] }],
  createdBy: String,
  endsAt: String,
  createdAt: { type: String, default: () => new Date().toISOString() }
})
const Poll = mongoose.model('Poll', PollSchema)

app.get('/api/channels/:channelId/polls', authMiddleware, async (req, res) => {
  const polls = await Poll.find({ channelId: req.params.channelId })
  res.json(polls.map(p => { const o = p.toObject(); delete o._id; delete o.__v; return o }))
})

app.post('/api/channels/:channelId/polls', authMiddleware, async (req, res) => {
  const { question, options, duration } = req.body
  if (!question || !options?.length) return res.status(400).json({ error: 'Question and options required' })
  const poll = new Poll({
    id: uuidv4(), channelId: req.params.channelId,
    question, options: options.map(text => ({ id: uuidv4(), text, votes: [] })),
    createdBy: req.user.id,
    endsAt: duration ? new Date(Date.now() + duration * 60000).toISOString() : null
  })
  await poll.save()
  const o = poll.toObject(); delete o._id; delete o.__v
  // Also create a message for the poll
  const user = await User.findOne({ id: req.user.id })
  const msg = new Message({
    id: uuidv4(), channelId: req.params.channelId,
    content: `📊 **Poll:** ${question}`,
    author: safeUser(user),
    pollId: poll.id
  })
  await msg.save()
  const msgO = msg.toObject(); delete msgO._id; delete msgO.__v
  io.to(`channel:${req.params.channelId}`).emit('message:create', msgO)
  io.to(`channel:${req.params.channelId}`).emit('poll:create', o)
  res.json(o)
})

app.post('/api/polls/:pollId/vote', authMiddleware, async (req, res) => {
  const { optionId } = req.body
  const poll = await Poll.findOne({ id: req.params.pollId })
  if (!poll) return res.status(404).json({ error: 'Poll not found' })
  // Remove existing vote
  poll.options.forEach(opt => { opt.votes = opt.votes.filter(v => v !== req.user.id) })
  // Add new vote
  const option = poll.options.find(o => o.id === optionId)
  if (option) option.votes.push(req.user.id)
  poll.markModified('options')
  await poll.save()
  const o = poll.toObject(); delete o._id; delete o.__v
  io.to(`channel:${poll.channelId}`).emit('poll:update', o)
  res.json(o)
})

// ── Channel permissions (private channels) ────────────────────────────────────
app.patch('/api/servers/:serverId/channels/:channelId/permissions', authMiddleware, async (req, res) => {
  const channel = await Channel.findOne({ id: req.params.channelId })
  if (!channel) return res.status(404).json({ error: 'Not found' })
  const srv = await ServerModel.findOne({ id: req.params.serverId })
  if (!srv || srv.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
  channel.isPrivate = req.body.isPrivate ?? false
  channel.allowedRoles = req.body.allowedRoles || []
  await channel.save()
  const o = channel.toObject(); delete o._id; delete o.__v
  io.to(`server:${req.params.serverId}`).emit('channel:update', o)
  res.json(o)
})

// ── Server Rules ───────────────────────────────────────────────────────────────
const RulesSchema = new mongoose.Schema({
  serverId: { type: String, unique: true },
  rules: [{ id: String, title: String, description: String }],
  updatedAt: String
})
const ServerRules = mongoose.model('ServerRules', RulesSchema)

app.get('/api/servers/:serverId/rules', authMiddleware, async (req, res) => {
  const rules = await ServerRules.findOne({ serverId: req.params.serverId })
  res.json(rules || { serverId: req.params.serverId, rules: [] })
})

app.put('/api/servers/:serverId/rules', authMiddleware, async (req, res) => {
  const srv = await ServerModel.findOne({ id: req.params.serverId })
  if (!srv || srv.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
  const rules = await ServerRules.findOneAndUpdate(
    { serverId: req.params.serverId },
    { rules: req.body.rules, updatedAt: new Date().toISOString() },
    { upsert: true, new: true }
  )
  const o = rules.toObject(); delete o._id; delete o.__v
  res.json(o)
})

// ── Role self-assignment ───────────────────────────────────────────────────────
app.post('/api/servers/:serverId/roles/:roleId/assign', authMiddleware, async (req, res) => {
  const role = await Role.findOne({ id: req.params.roleId, serverId: req.params.serverId })
  if (!role) return res.status(404).json({ error: 'Role not found' })
  if (!role.selfAssignable) return res.status(403).json({ error: 'Role is not self-assignable' })
  const member = await Member.findOne({ serverId: req.params.serverId, userId: req.user.id })
  if (!member) return res.status(404).json({ error: 'Not a member' })
  if (!member.roles.includes(req.params.roleId)) {
    member.roles.push(req.params.roleId)
    await member.save()
  }
  res.json(member)
})

app.delete('/api/servers/:serverId/roles/:roleId/assign', authMiddleware, async (req, res) => {
  const member = await Member.findOne({ serverId: req.params.serverId, userId: req.user.id })
  if (!member) return res.status(404).json({ error: 'Not a member' })
  member.roles = member.roles.filter(r => r !== req.params.roleId)
  await member.save()
  res.json(member)
})

// ── Slash commands (bot) ───────────────────────────────────────────────────────
app.post('/api/channels/:channelId/commands', authMiddleware, async (req, res) => {
  const { command, args } = req.body
  const user = await User.findOne({ id: req.user.id })
  const channel = await Channel.findOne({ id: req.params.channelId })

  const botAuthor = { id: 'nexus-bot', username: 'Nexus', displayName: 'Nexus Bot', discriminator: '0001', isBot: true }

  let responseContent = ''

  switch (command) {
    case 'help':
      responseContent = `**Available Commands:**\n\`/help\` — Show this message\n\`/poll [question] | [option1] | [option2]...\` — Create a poll\n\`/remind [minutes] [message]\` — Set a reminder\n\`/roll [max]\` — Roll a dice\n\`/flip\` — Flip a coin\n\`/serverinfo\` — Show server info\n\`/userinfo\` — Show your info`
      break
    case 'roll':
      const max = parseInt(args[0]) || 6
      const roll = Math.floor(Math.random() * max) + 1
      responseContent = `🎲 ${user.displayName} rolled a **${roll}** (1-${max})`
      break
    case 'flip':
      responseContent = `🪙 ${user.displayName} flipped a coin — **${Math.random() > 0.5 ? 'Heads' : 'Tails'}**!`
      break
    case 'serverinfo':
      const srv = channel ? await ServerModel.findOne({ id: channel.serverId }) : null
      const memberCount = channel ? await Member.countDocuments({ serverId: channel.serverId }) : 0
      responseContent = srv ? `**${srv.name}**\nMembers: ${memberCount}\nCreated: ${new Date(srv.createdAt).toLocaleDateString()}` : 'Server info not found'
      break
    case 'userinfo':
      responseContent = `**${user.displayName}** (@${user.username}#${user.discriminator})\nJoined Nexus: ${new Date(user.createdAt).toLocaleDateString()}`
      break
    case 'remind':
      const minutes = parseInt(args[0]) || 5
      const reminder = args.slice(1).join(' ') || 'Something!'
      setTimeout(async () => {
        const reminderMsg = new Message({
          id: uuidv4(), channelId: req.params.channelId,
          content: `⏰ <@${user.username}> Reminder: **${reminder}**`,
          author: botAuthor
        })
        await reminderMsg.save()
        const o = reminderMsg.toObject(); delete o._id; delete o.__v
        io.to(`channel:${req.params.channelId}`).emit('message:create', o)
      }, minutes * 60 * 1000)
      responseContent = `⏰ I'll remind you about **"${reminder}"** in ${minutes} minute${minutes !== 1 ? 's' : ''}!`
      break
    default:
      responseContent = `Unknown command \`/${command}\`. Type \`/help\` for a list of commands.`
  }

  if (responseContent) {
    const msg = new Message({
      id: uuidv4(), channelId: req.params.channelId,
      content: responseContent, author: botAuthor
    })
    await msg.save()
    const o = msg.toObject(); delete o._id; delete o.__v
    io.to(`channel:${req.params.channelId}`).emit('message:create', o)
    res.json(o)
  } else {
    res.json({ success: true })
  }
})
