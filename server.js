import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()
const port = process.env.PORT || 4000
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(cors())
app.use(express.json())
app.use(express.static(__dirname))

const frontendPages = {
  '/': 'index.html',
  '/index': 'index.html',
  '/login': 'login.html',
  '/register': 'register.html',
  '/forgot-password': 'forgot-password.html',
  '/dashboard': 'dashboard.html',
  '/stranger-chat': 'stranger-chat.html',
  '/friends': 'friends.html',
  '/friend-requests': 'friend-requests.html',
  '/communities': 'communities.html',
  '/notifications': 'notifications.html',
  '/settings': 'settings.html',
  '/support': 'support.html',
  '/profile': 'profile.html',
  '/admin': 'admin.html',
  '/admin/dashboard': 'admin-dashboard.html',
  '/admin-dashboard': 'admin-dashboard.html',
  '/login.html': 'login.html',
  '/register.html': 'register.html',
  '/forgot-password.html': 'forgot-password.html',
  '/dashboard.html': 'dashboard.html',
  '/stranger-chat.html': 'stranger-chat.html',
  '/friends.html': 'friends.html',
  '/friend-requests.html': 'friend-requests.html',
  '/communities.html': 'communities.html',
  '/notifications.html': 'notifications.html',
  '/settings.html': 'settings.html',
  '/support.html': 'support.html',
  '/profile.html': 'profile.html',
  '/index.html': 'index.html',
  '/admin.html': 'admin.html',
  '/admin-dashboard.html': 'admin-dashboard.html',
}

for (const [route, page] of Object.entries(frontendPages)) {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, page))
  })
}

const users = [
  { id: 'u1', username: 'prashant', name: 'Prashant Singh' },
  { id: 'u2', username: 'yuki', name: 'Yuki T.' },
  { id: 'u3', username: 'marcus', name: 'Marcus L.' },
  { id: 'u4', username: 'sana', name: 'Sana P.' },
]

const waitingUsers = []
const activeMatches = []
const chats = [
  {
    id: 'chat_1',
    type: 'stranger',
    participants: ['u1', 'u2'],
    messages: [
      { id: 'm1', from: 'u2', to: 'u1', text: 'Hey! Want to trade favorite constellation stories?', createdAt: new Date().toISOString() },
    ],
  },
]

const friendRequests = [
  { id: 'fr_1', from: 'u4', to: 'u1', status: 'pending', createdAt: new Date().toISOString() },
]
const friendships = [{ userId: 'u1', friendId: 'u2', createdAt: new Date().toISOString() }]

const communities = [
  {
    id: 'c1',
    name: 'PixelForge Community',
    description: 'Creative builders and late-night makers',
    members: ['u1', 'u2', 'u3'],
    posts: [
      {
        id: 'p1',
        authorId: 'u2',
        authorName: 'Yuki T.',
        text: 'Our monthly game jam theme just dropped: Signals from Elsewhere.',
        createdAt: new Date().toISOString(),
        likes: 214,
        comments: [
          { id: 'cp1', authorId: 'u1', authorName: 'Prashant Singh', text: 'This sounds amazing.', createdAt: new Date().toISOString() },
        ],
      },
    ],
  },
]

const reports = [
  { id: 'r1', reporterId: 'u1', reportedUserId: 'u3', reason: 'Spam behavior', status: 'open', createdAt: new Date().toISOString() },
]

const notifications = [
  { id: 'n1', userId: 'u1', type: 'friend_request', title: 'Friend request', message: 'Sana P. sent you a friend request.', read: false, createdAt: new Date().toISOString() },
  { id: 'n2', userId: 'u1', type: 'chat', title: 'Unread messages', message: 'You have 3 unread messages.', read: false, createdAt: new Date().toISOString() },
]

const voiceCalls = [
  { id: 'vc1', callerId: 'u2', receiverId: 'u1', status: 'ringing', startedAt: new Date().toISOString() },
]

const findUser = (userId) => users.find((user) => user.id === userId)

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'NovaTalk API', timestamp: new Date().toISOString() })
})

app.post('/api/matchmaking/queue', (req, res) => {
  const { userId } = req.body

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' })
  }

  const existing = waitingUsers.find((entry) => entry.userId === userId)
  if (existing) {
    return res.status(409).json({ message: 'User is already in the match queue.' })
  }

  const candidate = waitingUsers.find((entry) => entry.userId !== userId)

  if (candidate) {
    const partner = findUser(candidate.userId)
    const currentUser = findUser(userId)

    waitingUsers.splice(waitingUsers.indexOf(candidate), 1)

    const chatId = `chat_${Date.now()}`
    const match = {
      id: chatId,
      type: 'stranger',
      participants: [userId, candidate.userId],
      createdAt: new Date().toISOString(),
    }

    activeMatches.push(match)
    chats.push({
      ...match,
      messages: [
        {
          id: `m_${Date.now()}`,
          from: candidate.userId,
          to: userId,
          text: 'You matched with a new stranger. Start the conversation!',
          createdAt: new Date().toISOString(),
        },
      ],
    })

    return res.status(200).json({
      matched: true,
      chatId,
      partner,
      user: currentUser,
      message: 'Matched with a stranger.',
    })
  }

  waitingUsers.push({ userId, joinedAt: new Date().toISOString() })

  return res.status(202).json({
    matched: false,
    message: 'Added to stranger queue. Waiting for a match...',
    queuePosition: waitingUsers.length,
    userId,
  })
})

app.get('/api/matchmaking/queue', (req, res) => {
  res.json({ waitingUsers, activeMatches })
})

app.get('/api/chats/:userId', (req, res) => {
  const { userId } = req.params
  const userChats = chats.filter((chat) => chat.participants.includes(userId))
  res.json({ userId, chats: userChats })
})

app.post('/api/chats/:chatId/messages', (req, res) => {
  const { chatId } = req.params
  const { from, to, text } = req.body

  if (!from || !to || !text) {
    return res.status(400).json({ message: 'from, to and text are required' })
  }

  const chat = chats.find((entry) => entry.id === chatId)
  if (!chat) {
    return res.status(404).json({ message: 'Chat not found' })
  }

  const message = {
    id: `m_${Date.now()}`,
    from,
    to,
    text,
    createdAt: new Date().toISOString(),
  }

  chat.messages.push(message)

  notifications.push({
    id: `n_${Date.now()}`,
    userId: to,
    type: 'message',
    title: 'New message',
    message: `${findUser(from)?.name || 'Someone'} sent you a message`,
    read: false,
    createdAt: new Date().toISOString(),
  })

  res.status(201).json({ message, chat })
})

app.post('/api/friends/request', (req, res) => {
  const { from, to } = req.body

  if (!from || !to) {
    return res.status(400).json({ message: 'from and to user ids are required' })
  }

  const existing = friendRequests.find(
    (request) => request.from === from && request.to === to && request.status === 'pending',
  )

  if (existing) {
    return res.status(409).json({ message: 'Friend request already pending.' })
  }

  const request = {
    id: `fr_${Date.now()}`,
    from,
    to,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  friendRequests.push(request)
  notifications.push({
    id: `n_${Date.now()}`,
    userId: to,
    type: 'friend_request',
    title: 'Friend request',
    message: `${findUser(from)?.name || 'Someone'} sent you a friend request.`,
    read: false,
    createdAt: new Date().toISOString(),
  })

  res.status(201).json({ request })
})

app.get('/api/friends/requests/:userId', (req, res) => {
  const { userId } = req.params
  const incoming = friendRequests.filter((request) => request.to === userId && request.status === 'pending')
  const outgoing = friendRequests.filter((request) => request.from === userId && request.status === 'pending')

  res.json({ incoming, outgoing })
})

app.post('/api/friends/respond', (req, res) => {
  const { requestId, action, userId } = req.body

  if (!requestId || !action) {
    return res.status(400).json({ message: 'requestId and action are required' })
  }

  const request = friendRequests.find((entry) => entry.id === requestId)
  if (!request) {
    return res.status(404).json({ message: 'Friend request not found' })
  }

  if (action === 'accept') {
    const alreadyFriends = friendships.some(
      (friendship) =>
        (friendship.userId === request.from && friendship.friendId === request.to) ||
        (friendship.userId === request.to && friendship.friendId === request.from),
    )

    if (!alreadyFriends) {
      friendships.push({ userId: request.from, friendId: request.to, createdAt: new Date().toISOString() })
      friendships.push({ userId: request.to, friendId: request.from, createdAt: new Date().toISOString() })
    }

    notifications.push({
      id: `n_${Date.now()}`,
      userId: request.from,
      type: 'friend_accept',
      title: 'Friend request accepted',
      message: `${findUser(userId)?.name || 'Someone'} accepted your friend request.`,
      read: false,
      createdAt: new Date().toISOString(),
    })
  }

  request.status = action === 'accept' ? 'accepted' : 'rejected'

  res.json({ request, action })
})

app.get('/api/friends/:userId', (req, res) => {
  const { userId } = req.params
  const friends = friendships
    .filter((friendship) => friendship.userId === userId)
    .map((friendship) => findUser(friendship.friendId))
    .filter(Boolean)

  res.json({ userId, friends })
})

app.get('/api/communities', (req, res) => {
  res.json({ communities })
})

app.post('/api/communities', (req, res) => {
  const { name, description, creatorId } = req.body

  if (!name || !creatorId) {
    return res.status(400).json({ message: 'name and creatorId are required' })
  }

  const community = {
    id: `c_${Date.now()}`,
    name,
    description: description || 'Community created by NovaTalk',
    members: [creatorId],
    posts: [],
  }

  communities.push(community)
  res.status(201).json({ community })
})

app.get('/api/communities/:communityId/posts', (req, res) => {
  const { communityId } = req.params
  const community = communities.find((entry) => entry.id === communityId)

  if (!community) {
    return res.status(404).json({ message: 'Community not found' })
  }

  res.json({ communityId, posts: community.posts })
})

app.post('/api/communities/:communityId/posts', (req, res) => {
  const { communityId } = req.params
  const { authorId, authorName, text } = req.body

  if (!authorId || !text) {
    return res.status(400).json({ message: 'authorId and text are required' })
  }

  const community = communities.find((entry) => entry.id === communityId)
  if (!community) {
    return res.status(404).json({ message: 'Community not found' })
  }

  const post = {
    id: `p_${Date.now()}`,
    authorId,
    authorName: authorName || findUser(authorId)?.name || 'Unknown user',
    text,
    createdAt: new Date().toISOString(),
    likes: 0,
    comments: [],
  }

  community.posts.unshift(post)
  res.status(201).json({ post })
})

app.post('/api/posts/:postId/comments', (req, res) => {
  const { postId } = req.params
  const { authorId, authorName, text } = req.body

  if (!authorId || !text) {
    return res.status(400).json({ message: 'authorId and text are required' })
  }

  let commentPost = null

  for (const community of communities) {
    const target = community.posts.find((post) => post.id === postId)
    if (target) {
      commentPost = target
      target.comments.push({
        id: `cp_${Date.now()}`,
        authorId,
        authorName: authorName || findUser(authorId)?.name || 'Unknown user',
        text,
        createdAt: new Date().toISOString(),
      })
      break
    }
  }

  if (!commentPost) {
    return res.status(404).json({ message: 'Post not found' })
  }

  res.status(201).json({ comment: commentPost.comments.at(-1) })
})

app.post('/api/reports', (req, res) => {
  const { reporterId, reportedUserId, reason, category } = req.body

  if (!reporterId || !reportedUserId || !reason) {
    return res.status(400).json({ message: 'reporterId, reportedUserId and reason are required' })
  }

  const report = {
    id: `r_${Date.now()}`,
    reporterId,
    reportedUserId,
    reason,
    category: category || 'general',
    status: 'open',
    createdAt: new Date().toISOString(),
  }

  reports.push(report)
  res.status(201).json({ report })
})

app.get('/api/reports', (req, res) => {
  res.json({ reports })
})

app.get('/api/notifications/:userId', (req, res) => {
  const { userId } = req.params
  res.json({ userId, notifications: notifications.filter((entry) => entry.userId === userId) })
})

app.post('/api/notifications/:userId/read', (req, res) => {
  const { userId } = req.params
  notifications
    .filter((entry) => entry.userId === userId)
    .forEach((entry) => {
      entry.read = true
    })

  res.json({ userId, updated: true })
})

app.post('/api/voice-calls/start', (req, res) => {
  const { callerId, receiverId } = req.body

  if (!callerId || !receiverId) {
    return res.status(400).json({ message: 'callerId and receiverId are required' })
  }

  const call = {
    id: `vc_${Date.now()}`,
    callerId,
    receiverId,
    status: 'ringing',
    startedAt: new Date().toISOString(),
  }

  voiceCalls.push(call)
  notifications.push({
    id: `n_${Date.now()}`,
    userId: receiverId,
    type: 'voice_call',
    title: 'Incoming call',
    message: `${findUser(callerId)?.name || 'Someone'} is calling you.`,
    read: false,
    createdAt: new Date().toISOString(),
  })

  res.status(201).json({ call })
})

app.get('/api/voice-calls/:userId', (req, res) => {
  const { userId } = req.params
  const calls = voiceCalls.filter((call) => call.receiverId === userId || call.callerId === userId)
  res.json({ userId, calls })
})

app.post('/api/voice-calls/:callId/answer', (req, res) => {
  const { callId } = req.params
  const { status } = req.body
  const call = voiceCalls.find((entry) => entry.id === callId)

  if (!call) {
    return res.status(404).json({ message: 'Call not found' })
  }

  call.status = status || 'connected'
  res.json({ call })
})

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.listen(port, () => {
  console.log(`NovaTalk API running on http://localhost:${port}`)
})
