import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { getChats, getFriendRequests, acceptFriendRequest, rejectFriendRequest, getInviteUsers } from '../api'
import io, { Socket } from 'socket.io-client'

interface Chat {
  id: number
  partner_username: string
  partner_id: number
}

interface FriendRequest {
  id: number
  sender_username: string
  sender_id: number
}

function Home() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [chats, setChats] = useState<Chat[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [specialUsers, setSpecialUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    loadData()

    const newSocket = io()
    newSocket.emit('auth', token)

    newSocket.on('chat-created', () => {
      loadData()
    })

    return () => {
      newSocket.disconnect()
    }
  }, [token, navigate])

  const loadData = async () => {
    try {
      const promises = [
        getChats(token!),
        getFriendRequests(token!)
      ]

      // If user has an invite code, load invite users
      if (user?.inviteCode) {
        promises.push(getInviteUsers(user.inviteCode, token!))
      }

      const [chatsResult, requestsResult, specialResult] = await Promise.all(promises)

      if (chatsResult.success) {
        setChats(chatsResult.chats)
      }

      if (requestsResult.success) {
        setFriendRequests(requestsResult.requests)
      }

      if (specialResult && specialResult.success) {
        setSpecialUsers(specialResult.users)
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (requestId: number) => {
    try {
      const result = await acceptFriendRequest(requestId, token!)
      if (result.success) {
        loadData()
      }
    } catch (error) {
      console.error('Kabul hatası:', error)
    }
  }

  const handleReject = async (requestId: number) => {
    try {
      const result = await rejectFriendRequest(requestId, token!)
      if (result.success) {
        setFriendRequests(prev => prev.filter(req => req.id !== requestId))
      }
    } catch (error) {
      console.error('Reddetme hatası:', error)
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
      {/* Modern Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 py-5 flex justify-between items-center max-w-6xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">🎭</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">GIF Chat</h1>
              <p className="text-sm text-slate-500">@{user?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/search"
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Sohbet
            </Link>
            {user?.isAdmin && (
              <Link
                to="/admin"
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin
              </Link>
            )}
            <button
              onClick={logout}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors font-medium rounded-lg hover:bg-slate-100"
            >
              Çıkış
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Friend Requests - Modern Card Design */}
        {friendRequests.length > 0 && (
          <div className="mb-8 card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Arkadaşlık İstekleri</h3>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {friendRequests.length}
              </span>
            </div>
            <div className="space-y-3">
              {friendRequests.map(request => (
                <div key={request.id} className="card p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <span className="text-slate-600 font-semibold text-sm">
                          {request.sender_username[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{request.sender_username}</p>
                        <p className="text-sm text-slate-500">Arkadaşlık isteği gönderdi</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(request.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
                      >
                        Kabul Et
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-medium text-sm"
                      >
                        Reddet
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Users - Modern Design */}
        {specialUsers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">👥</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Özel Kişiler</h2>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                {specialUsers.length}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {specialUsers.map((specialUser: any) => (
                <div
                  key={specialUser.id}
                  className="card p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {specialUser.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{specialUser.username}</h3>
                      <p className="text-sm text-slate-600">Özel davet ile katıldı</p>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs font-medium">Çevrimiçi</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat List - Modern Card Design */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Sohbetler</h2>
        </div>

        {chats.length === 0 ? (
          <div className="text-center py-20 card">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Henüz sohbetin yok</h3>
            <p className="text-slate-600 mb-6 max-w-sm mx-auto">
              GIF'lerle dolu eğlenceli sohbetlere başlamak için yeni arkadaşlar bul!
            </p>
            <Link
              to="/search"
              className="btn-primary inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Kişi Ara
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {chats.map(chat => (
              <Link
                key={chat.id}
                to={`/chat/${chat.id}`}
                className="card p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform duration-200">
                    {chat.partner_username[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {chat.partner_username}
                    </h3>
                    <p className="text-sm text-slate-500">GIF sohbeti • Tıkla devam et</p>
                  </div>
                  <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
