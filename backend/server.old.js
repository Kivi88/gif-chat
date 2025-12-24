import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

app.use(cors())

let waitingUser = null
const userPairs = new Map()

io.on('connection', (socket) => {
  console.log('Kullanıcı bağlandı:', socket.id)

  if (waitingUser === null) {
    waitingUser = socket.id
    console.log('Kullanıcı beklemeye alındı:', socket.id)
  } else {
    const partner = waitingUser
    waitingUser = null

    userPairs.set(socket.id, partner)
    userPairs.set(partner, socket.id)

    io.to(socket.id).emit('matched')
    io.to(partner).emit('matched')

    console.log('Eşleşme yapıldı:', socket.id, '<->', partner)
  }

  socket.on('message', (gif) => {
    const partner = userPairs.get(socket.id)
    if (partner) {
      io.to(partner).emit('message', gif)
      console.log('Mesaj gönderildi:', socket.id, '->', partner)
    }
  })

  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı:', socket.id)

    const partner = userPairs.get(socket.id)
    if (partner) {
      io.to(partner).emit('partner-disconnected')
      userPairs.delete(partner)
      userPairs.delete(socket.id)
    }

    if (waitingUser === socket.id) {
      waitingUser = null
    }
  })
})

const PORT = 3001

httpServer.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`)
})
