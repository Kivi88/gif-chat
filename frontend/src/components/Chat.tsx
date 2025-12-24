import { useState, useEffect, useRef } from 'react'
import io, { Socket } from 'socket.io-client'

interface Message {
  id: string
  gif: string
  sender: 'me' | 'other'
  timestamp: number
}

interface ChatProps {
  isConnected: boolean
  setIsConnected: (connected: boolean) => void
  selectedGif: string | null
  setSelectedGif: (gif: string | null) => void
}

function Chat({ isConnected, setIsConnected, selectedGif, setSelectedGif }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleConnect = () => {
    const newSocket = io('http://localhost:3001')
    
    newSocket.on('connect', () => {
      setIsConnected(true)
    })

    newSocket.on('matched', () => {
      setMessages([])
    })

    newSocket.on('message', (gif: string) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        gif,
        sender: 'other',
        timestamp: Date.now()
      }])
    })

    newSocket.on('partner-disconnected', () => {
      setIsConnected(false)
      setSocket(null)
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
    })

    setSocket(newSocket)
  }

  const handleDisconnect = () => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
      setMessages([])
    }
  }

  const sendGif = () => {
    if (socket && selectedGif && isConnected) {
      socket.emit('message', selectedGif)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        gif: selectedGif,
        sender: 'me',
        timestamp: Date.now()
      }])
      setSelectedGif(null)
    }
  }

  useEffect(() => {
    if (selectedGif && isConnected) {
      sendGif()
    }
  }, [selectedGif])

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col h-[600px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Sohbet</h2>
        {!isConnected ? (
          <button
            onClick={handleConnect}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-semibold transition"
          >
            Bağlan
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-semibold transition"
          >
            Ayrıl
          </button>
        )}
      </div>

      {!isConnected ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p className="text-lg">Rastgele biriyle eşleşmek için bağlan!</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Sağdaki arama kutusundan GIF seç ve sohbete başla!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-md ${msg.sender === 'me' ? 'bg-blue-500' : 'bg-gray-300'} rounded-lg p-2`}>
                  <img src={msg.gif} alt="gif" className="rounded-lg w-full h-auto" />
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  )
}

export default Chat
