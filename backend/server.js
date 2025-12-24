import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import * as auth from './authService.js'
import { generateWarningMessage, analyzeReportSeverity } from './simpleAI.js'
import { sendWarningEmail, sendThankYouEmail } from './emailService.js'
import pool from './db.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

app.use(cors())
app.use(express.json())

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called')
  res.json({ success: true, message: 'API is working' })
})

app.get('/', (req, res) => {
  res.json({ message: 'GIF Chat API Server' })
})

const onlineUsers = new Map()

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body
    const user = await auth.register(username, email, password)
    res.json({ success: true, user })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const result = await auth.login(username, password)
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.get('/api/users/search', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = auth.verifyToken(token)
    
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' })
    }
    
    const { q } = req.query
    const users = await auth.searchUsers(q, decoded.userId)
    res.json({ success: true, users })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.post('/api/friend-request', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = auth.verifyToken(token)
    
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' })
    }
    
    const { receiverId } = req.body
    const request = await auth.sendFriendRequest(decoded.userId, receiverId)
    
    const receiverSocketId = onlineUsers.get(receiverId)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('friend-request', {
        id: request.id,
        sender_username: decoded.username
      })
    }
    
    res.json({ success: true, request })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.get('/api/friend-requests', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = auth.verifyToken(token)
    
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' })
    }
    
    const requests = await auth.getFriendRequests(decoded.userId)
    res.json({ success: true, requests })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.post('/api/friend-request/:id/accept', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = auth.verifyToken(token)
    
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' })
    }
    
    const newChat = await auth.acceptFriendRequest(parseInt(req.params.id), decoded.userId)
    
    const reqData = await pool.query(
      'SELECT sender_id, receiver_id FROM friend_requests WHERE id = $1',
      [parseInt(req.params.id)]
    )
    
    if (reqData.rows.length > 0) {
      const { sender_id, receiver_id } = reqData.rows[0]
      const senderSocketId = onlineUsers.get(sender_id)
      const receiverSocketId = onlineUsers.get(receiver_id)
      
      if (senderSocketId) {
        io.to(senderSocketId).emit('chat-created', newChat)
      }
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('chat-created', newChat)
      }
    }
    
    res.json({ success: true, chat: newChat })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.post('/api/friend-request/:id/reject', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = auth.verifyToken(token)
    
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' })
    }
    
    await auth.rejectFriendRequest(parseInt(req.params.id), decoded.userId)
    res.json({ success: true })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.get('/api/chats', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = auth.verifyToken(token)
    
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' })
    }
    
    const chats = await auth.getChats(decoded.userId)
    res.json({ success: true, chats })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.get('/api/chats/:id/messages', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = auth.verifyToken(token)
    
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' })
    }
    
    const messages = await auth.getMessages(parseInt(req.params.id), decoded.userId)
    res.json({ success: true, messages })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.post('/api/chats/:id/block', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = auth.verifyToken(token)
    
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' })
    }
    
    const { partnerId } = req.body
    await auth.blockUser(decoded.userId, partnerId)
    res.json({ success: true })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.post('/api/chats/:id/report', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = auth.verifyToken(token)
    
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' })
    }
    
    const { partnerId, reason } = req.body
    const chatId = parseInt(req.params.id)
    
    const report = await auth.reportUser(decoded.userId, partnerId, chatId, reason)
    
    const analysis = analyzeReportSeverity(reason)
    console.log('Bildirim analizi:', analysis)
    
    res.json({ success: true, report })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.delete('/api/chats/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = auth.verifyToken(token)
    
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' })
    }
    
    const success = await auth.deleteChat(parseInt(req.params.id), decoded.userId)
    res.json({ success })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.get('/api/admin/reports', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = auth.verifyToken(token)
    
    if (!decoded || !decoded.isAdmin) {
      return res.status(403).json({ success: false, error: 'Yönetici erişimi gerekli' })
    }
    
    const result = await pool.query(`
      SELECT r.*, 
        u1.username as reporter_username,
        u2.username as reported_username
      FROM reports r
      JOIN users u1 ON r.reporter_id = u1.id
      JOIN users u2 ON r.reported_id = u2.id
      ORDER BY r.created_at DESC
    `)
    
    res.json({ success: true, reports: result.rows })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.post('/api/admin/reports/:id/review', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = auth.verifyToken(token)
    
    if (!decoded || !decoded.isAdmin) {
      return res.status(403).json({ success: false, error: 'Yönetici erişimi gerekli' })
    }
    
    const { status } = req.body
    await pool.query(
      'UPDATE reports SET status = $1, admin_reviewed = true WHERE id = $2',
      [status, parseInt(req.params.id)]
    )
    
    res.json({ success: true })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.post('/api/admin/warnings/preview', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = auth.verifyToken(token)
    
    if (!decoded || !decoded.isAdmin) {
      return res.status(403).json({ success: false, error: 'Yönetici erişimi gerekli' })
    }
    
    const { reason, customDetails } = req.body
    const aiMessage = generateWarningMessage(reason, customDetails)
    
    res.json({ success: true, preview: aiMessage.message })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.post('/api/admin/warnings/send', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = auth.verifyToken(token)

    if (!decoded || !decoded.isAdmin) {
      return res.status(403).json({ success: false, error: 'Yönetici erişimi gerekli' })
    }

    const { userId, reason, customDetails, reportId, reporterId } = req.body

    const aiMessage = generateWarningMessage(reason, customDetails)

    await pool.query(
      'INSERT INTO warnings (user_id, admin_id, message, severity) VALUES ($1, $2, $3, $4)',
      [userId, decoded.userId, aiMessage.message, aiMessage.severity]
    )

    const userResult = await pool.query(
      'SELECT username, email FROM users WHERE id = $1',
      [userId]
    )

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0]
      await sendWarningEmail(user.email, user.username, aiMessage.message)
    }

    if (reporterId) {
      const reporterResult = await pool.query(
        'SELECT username, email FROM users WHERE id = $1',
        [reporterId]
      )

      if (reporterResult.rows.length > 0) {
        const reporter = reporterResult.rows[0]
        const reportedUser = userResult.rows[0]
        await sendThankYouEmail(reporter.email, reporter.username, reportedUser.username)
      }
    }

    if (reportId) {
      await pool.query(
        'UPDATE reports SET status = $1, admin_reviewed = true WHERE id = $2',
        ['approved', reportId]
      )
    }

    const userSocketId = onlineUsers.get(userId)
    if (userSocketId) {
      io.to(userSocketId).emit('warning', aiMessage)
    }

    if (reporterId) {
      const reporterSocketId = onlineUsers.get(reporterId)
      if (reporterSocketId) {
        io.to(reporterSocketId).emit('notification', {
          type: 'thank-you',
          message: 'Bildiriminiz için teşekkürler! Gerekli işlemler yapıldı.'
        })
      }
    }

    res.json({ success: true, warning: aiMessage })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.post('/api/admin/special-invites', async (req, res) => {
  try {
    console.log('Special invite creation requested')
    const token = req.headers.authorization?.split(' ')[1]
    console.log('Token:', token ? 'present' : 'missing')
    const decoded = auth.verifyToken(token)
    console.log('Decoded:', decoded)

    if (!decoded || !decoded.isAdmin) {
      console.log('Admin check failed')
      return res.status(403).json({ success: false, error: 'Yönetici erişimi gerekli' })
    }

    const { name } = req.body
    console.log('Creating special invite for user:', decoded.userId, 'with name:', name)
    const specialInvite = await auth.createSpecialInvite(decoded.userId, name)
    console.log('Special invite created:', specialInvite)

    res.json({ success: true, specialInvite })
  } catch (error) {
    console.error('Special invite creation error:', error)
    res.status(400).json({ success: false, error: error.message })
  }
})

app.get('/api/admin/special-invites', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = auth.verifyToken(token)

    if (!decoded || !decoded.isAdmin) {
      return res.status(403).json({ success: false, error: 'Yönetici erişimi gerekli' })
    }

    const specialInvites = await auth.getSpecialInvites(decoded.userId)
    res.json({ success: true, specialInvites })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.get('/ozeldavet/:inviteCode', async (req, res) => {
  try {
    const { inviteCode } = req.params
    console.log('Validating invite code:', inviteCode)
    const specialInvite = await auth.validateInviteCode(inviteCode)
    console.log('Validation result:', specialInvite)

    if (!specialInvite) {
      console.log('Invite code not found or used')
      return res.status(404).json({ success: false, error: 'Geçersiz davet kodu' })
    }

    res.json({ success: true, specialInvite })
  } catch (error) {
    console.error('Invite validation error:', error)
    res.status(400).json({ success: false, error: error.message })
  }
})

app.post('/api/register/special', async (req, res) => {
  try {
    const { username, email, password, inviteCode } = req.body

    const specialInvite = await auth.validateInviteCode(inviteCode)
    if (!specialInvite) {
      return res.status(400).json({ success: false, error: 'Geçersiz davet kodu' })
    }

    const user = await auth.register(username, email, password, inviteCode)
    await auth.markInviteUsed(inviteCode, user.id)

    res.json({ success: true, user, specialInvite })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

app.get('/api/special-invites/:inviteCode/users', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = auth.verifyToken(token)

    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim' })
    }

    const { inviteCode } = req.params

    // Check if user has this invite code
    if (decoded.inviteCode !== inviteCode) {
      return res.status(403).json({ success: false, error: 'Bu davete erişim izniniz yok' })
    }

    const users = await auth.getInviteUsers(inviteCode)
    res.json({ success: true, users })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

io.on('connection', (socket) => {
  console.log('Kullanıcı bağlandı:', socket.id)
  
  socket.on('auth', (token) => {
    const decoded = auth.verifyToken(token)
    if (decoded) {
      socket.userId = decoded.userId
      socket.username = decoded.username
      onlineUsers.set(decoded.userId, socket.id)
      console.log(`Kullanıcı ${decoded.username} online`)
    }
  })
  
  socket.on('join-chat', (chatId) => {
    socket.join(`chat-${chatId}`)
    console.log(`${socket.username} joined chat ${chatId}`)
  })
  
  socket.on('send-message', async (data) => {
    try {
      const { chatId, gifUrl } = data
      
      if (!socket.userId) {
        socket.emit('error', { message: 'Oturum açılmamış' })
        return
      }
      
      const message = await auth.saveMessage(chatId, socket.userId, gifUrl)
      
      const fullMessage = {
        id: message.id,
        gif_url: message.gif_url,
        sender_id: socket.userId,
        sender_username: socket.username,
        created_at: message.created_at
      }
      
      io.to(`chat-${chatId}`).emit('new-message', fullMessage)
      console.log(`Message sent in chat ${chatId} by ${socket.username}`)
    } catch (error) {
      console.error('Send message error:', error)
      socket.emit('error', { message: error.message })
    }
  })
  
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId)
      console.log(`Kullanıcı ${socket.userId} offline`)
    }
  })
})

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`)
})
