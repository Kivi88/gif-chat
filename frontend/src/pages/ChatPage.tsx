import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { getChatMessages, blockUser, reportUser, deleteChat } from '../api'
import GifSearch from '../components/GifSearch'
import io, { Socket } from 'socket.io-client'

interface Message {
  id: number
  gif_url: string
  sender_id: number
  sender_username: string
  created_at: string
}

function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [partnerName, setPartnerName] = useState('')
  const [partnerId, setPartnerId] = useState<number | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [socket, setSocket] = useState<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!token || !chatId) {
      navigate('/login')
      return
    }

    loadMessages()

    const newSocket = io('http://localhost:3001')
    newSocket.emit('auth', token)
    newSocket.emit('join-chat', parseInt(chatId))

    newSocket.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message])
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [chatId, token, navigate])

  const loadMessages = async () => {
    try {
      const result = await getChatMessages(parseInt(chatId!), token!)
      if (result.success) {
        setMessages(result.messages)
        if (result.messages.length > 0) {
          const firstMessage = result.messages[0]
          const partner = firstMessage.sender_id === user?.id
            ? result.messages.find((m: Message) => m.sender_id !== user?.id)
            : firstMessage
          if (partner) {
            setPartnerName(partner.sender_username)
            setPartnerId(partner.sender_id)
          }
        }
      }
    } catch (error) {
      console.error('Mesaj yükleme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGifSelect = (gifUrl: string) => {
    if (!socket || !chatId) return

    socket.emit('send-message', {
      chatId: parseInt(chatId),
      gifUrl
    })
  }

  const handleBlock = async () => {
    if (!partnerId || !token) return

    const confirmed = window.confirm(`${partnerName} kullanıcısını engellemek istediğinize emin misiniz?`)
    if (confirmed) {
      try {
        await blockUser(parseInt(chatId!), partnerId, token)
        alert('Kullanıcı engellendi')
        navigate('/')
      } catch (error) {
        console.error('Engelleme hatası:', error)
      }
    }
  }

  const handleReport = async () => {
    if (!partnerId || !token || !reportReason.trim()) return

    try {
      await reportUser(parseInt(chatId!), partnerId, reportReason, token)
      alert('Kullanıcı bildirildi. Admin ekibimiz inceleyecek.')
      setShowReportModal(false)
      setReportReason('')
    } catch (error) {
      console.error('Bildirme hatası:', error)
    }
  }

  const handleDeleteChat = async () => {
    if (!token) return

    const confirmed = window.confirm('Bu sohbeti silmek istediğinize emin misiniz?')
    if (confirmed) {
      try {
        await deleteChat(parseInt(chatId!), token)
        navigate('/')
      } catch (error) {
        console.error('Silme hatası:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chat Messages Panel */}
          <div className="card flex flex-col h-[700px]">
            {/* Modern Header */}
            <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  title="Ana Sayfa"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {partnerName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{partnerName}</h2>
                    <p className="text-sm text-slate-500">GIF Sohbeti</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-56 card shadow-lg z-10 py-2">
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        setShowReportModal(true)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-3"
                    >
                      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Kullanıcıyı Bildir
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        handleBlock()
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-3"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
                      </svg>
                      Kullanıcıyı Engelle
                    </button>
                    <hr className="my-1 border-slate-200" />
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        handleDeleteChat()
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Sohbeti Sil
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Sohbet Başlat</h3>
                  <p className="text-slate-600 max-w-sm">
                    Sağ panelden GIF ara ve seçerek eğlenceli sohbete başla! 🎭
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'} mb-4`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${msg.sender_id === user?.id ? 'message-bubble-sent' : 'message-bubble-received'}`}>
                      <img
                        src={msg.gif_url}
                        alt="GIF"
                        className="rounded-lg w-full h-auto shadow-sm"
                        loading="lazy"
                      />
                      <div className={`text-xs mt-1 px-2 ${msg.sender_id === user?.id ? 'text-right text-blue-100' : 'text-left text-slate-500'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* GIF Search Panel */}
          <div className="h-[700px]">
            <GifSearch onGifSelect={handleGifSelect} />
          </div>
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Kullanıcıyı Bildir</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Sorununu detaylı bir şekilde açıkla..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleReport}
                disabled={!reportReason.trim()}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-md font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bildir
              </button>
              <button
                onClick={() => {
                  setShowReportModal(false)
                  setReportReason('')
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2.5 rounded-md font-medium hover:bg-gray-400 transition"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatPage
