import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { searchUsers, sendFriendRequest } from '../api'

interface User {
  id: number
  username: string
}

function UserSearch() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [sentRequests, setSentRequests] = useState<Set<number>>(new Set())

  const handleSearch = async () => {
    if (!searchTerm.trim() || !token) return

    setLoading(true)
    try {
      const result = await searchUsers(searchTerm, token)
      if (result.success) {
        setUsers(result.users)
      }
    } catch (error) {
      console.error('Arama hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async (userId: number) => {
    if (!token) return

    try {
      const result = await sendFriendRequest(userId, token)
      if (result.success) {
        setSentRequests(prev => new Set(prev).add(userId))
      }
    } catch (error) {
      console.error('İstek gönderme hatası:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Kullanıcı Ara</h1>
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md font-medium transition"
            >
              ← Geri
            </button>
          </div>

          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Kullanıcı adı ara..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Aranıyor...' : 'Ara'}
            </button>
          </div>

          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchTerm ? 'Kullanıcı bulunamadı' : 'Aramak için bir kullanıcı adı gir'}
              </div>
            ) : (
              users.map(user => (
                <div
                  key={user.id}
                  className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                      {user.username[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{user.username}</span>
                  </div>
                  <button
                    onClick={() => handleSendRequest(user.id)}
                    disabled={sentRequests.has(user.id)}
                    className={`px-4 py-2 rounded-md font-medium transition ${
                      sentRequests.has(user.id)
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {sentRequests.has(user.id) ? 'İstek Gönderildi' : 'İstek Gönder'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserSearch
