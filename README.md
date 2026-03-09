# 🚀 Nexus Chat — Discord-like Chat Application

A full-featured, real-time chat application inspired by Discord, built with React, Node.js, Socket.IO, and Tailwind CSS.

## ✨ Features

### Core Chat
- 📨 **Real-time messaging** with WebSockets (Socket.IO)
- 💬 **Message formatting** (bold, italic, code, strikethrough, underline, links)
- ✏️ **Edit & delete messages** (with "edited" indicator)
- 🔁 **Reply to messages** with reference preview
- 📎 **File & image attachments** (up to 10MB)
- 📌 **Pin messages** in channels
- 🔍 **Search messages** within channels
- 😄 **Emoji reactions** (add/remove with full emoji picker)
- 🖱️ **Context menus** (right-click on messages)
- ⌨️ **Typing indicators** ("User is typing...")

### Servers & Channels
- 🏠 **Create servers** with custom names
- 📺 **Text channels** (with topics, NSFW flags)
- 🔊 **Voice channels** (join/leave, mute state)
- ➕ **Create/delete channels** (text & voice)
- 🗂️ **Channel categories** (collapsible)
- ⚙️ **Server settings** (name, description, delete)
- 🔗 **Invite system** (generate invite codes, join via code)
- 👥 **Member list sidebar** (online/offline, roles)

### Friends & DMs
- 👤 **Friend system** (send requests, accept/decline)
- 💌 **Direct messages** (1-on-1 DMs)
- 🟢 **Online status** tracking (online, offline, idle, DND)
- 📊 **Friend tabs** (Online, All, Pending, Add Friend)

### Voice
- 🎤 **Join/leave voice channels**
- 🔇 **Mute/deafen controls**
- 👥 **See who's in a voice channel**

### User Features
- 🔐 **Authentication** (register/login with JWT)
- 👤 **User profiles** (display name, bio, custom status, avatar)
- ⚙️ **Settings modal** (account, appearance, notifications, privacy)
- 🎨 **Discord-accurate dark theme**
- 📱 **Responsive layout**

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| State | Zustand (with persistence) |
| Routing | React Router v6 |
| Real-time | Socket.IO client |
| UI Components | Radix UI, Lucide Icons |
| Backend | Node.js, Express |
| WebSockets | Socket.IO |
| Auth | JWT, bcryptjs |
| File Upload | Multer |
| Storage | In-memory (replace with DB) |

## 📁 Project Structure

```
nexus-chat/
├── server/
│   ├── index.js          # Express + Socket.IO server
│   └── package.json
├── src/
│   ├── components/
│   │   ├── Auth/         # Login & Register pages
│   │   ├── Chat/         # ChatArea, MessageList, Message, MessageInput, DMArea
│   │   ├── Friends/      # FriendsPage
│   │   ├── Modals/       # All modals (Create, Invite, Settings, Pins, etc.)
│   │   ├── Settings/     # User settings modal
│   │   ├── Sidebar/      # ServerList, ChannelSidebar, MemberList, UserPanel
│   │   ├── UI/           # Tooltip and shared components
│   │   └── Voice/        # VoicePanel
│   ├── context/
│   │   └── SocketContext.jsx   # Socket.IO provider with all events
│   ├── utils/
│   │   └── api.js        # All API calls
│   ├── store.js          # Zustand stores (auth + app)
│   ├── App.jsx           # Routes
│   ├── main.jsx          # Entry point
│   └── styles/
│       └── globals.css   # Discord-inspired CSS variables & styles
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nexus-chat.git
   cd nexus-chat
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install server dependencies**
   ```bash
   cd server && npm install && cd ..
   ```

4. **Create environment file** (optional)
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. **Run both frontend and backend**
   ```bash
   npm start
   ```
   Or separately:
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   npm run dev
   ```

6. **Open** `http://localhost:5173`

## ⚙️ Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=3001
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173
```

## 🗄️ Adding a Database

The server currently uses in-memory storage. To persist data, replace the `db` object in `server/index.js` with:

- **MongoDB** + Mongoose (recommended)
- **PostgreSQL** + Prisma
- **SQLite** + better-sqlite3 (for lightweight use)

## 🔮 Roadmap

- [ ] WebRTC voice/video chat (actual audio)
- [ ] Threads / forum channels
- [ ] Server boosts & premium
- [ ] Slash commands / bots
- [ ] Message search (server-wide)
- [ ] Audit logs
- [ ] Role permissions system
- [ ] Server discovery
- [ ] Screen sharing
- [ ] Mobile app (React Native)
- [ ] Database integration (MongoDB/PostgreSQL)

## 📄 License

MIT License — feel free to use this as a starting point for your own projects!

---

Built with ❤️ — A Discord-inspired open source chat platform
