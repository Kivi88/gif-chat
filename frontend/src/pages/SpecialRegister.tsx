import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { validateInviteCode, registerSpecial } from '../api'
import { useAuth } from '../AuthContext'

function SpecialRegister() {
  const { inviteCode } = useParams<{ inviteCode: string }>()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [specialGroup, setSpecialGroup] = useState<any>(null)
  const [validating, setValidating] = useState(true)
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    console.log('SpecialRegister loaded with inviteCode:', inviteCode)
    if (!inviteCode) {
      navigate('/register')
      return
    }

    validateCode()
  }, [inviteCode, navigate])

  const validateCode = async () => {
    console.log('Validating code:', inviteCode)
    try {
      const result = await validateInviteCode(inviteCode!)
      console.log('Validation result:', result)
      if (result.success) {
        console.log('Setting specialGroup:', result.specialInvite)
        setSpecialGroup(result.specialInvite)
      } else {
        console.log('Validation failed:', result.error)
        setError('Geçersiz davet kodu')
      }
    } catch (err) {
      console.log('Validation error:', err)
      setError('Davet kodu doğrulanamadı')
    } finally {
      setValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor')
      return
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı')
      return
    }

    setLoading(true)

    try {
      const result = await registerSpecial(username, email, password, inviteCode!)

      if (result.success) {
        const loginResult = await fetch('http://localhost:3001/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        }).then(r => r.json())

        if (loginResult.success) {
          login(loginResult.token, loginResult.user)
          navigate('/')
        }
      } else {
        setError(result.error || 'Kayıt başarısız')
      }
    } catch (err) {
      setError('Sunucu hatası')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Davet kodu doğrulanıyor...</div>
      </div>
    )
  }

  if (!specialGroup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-md text-center">
          <div className="text-red-600 text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Geçersiz Davet Kodu</h1>
          <p className="text-gray-600 mb-6">Bu davet kodu geçerli değil veya süresi dolmuş.</p>
          <Link
            to="/register"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition"
          >
            Normal Kayıt
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hoş Geldiniz! 👋</h1>
          <p className="text-gray-600">
            {specialGroup.name ? (
              <>
                <strong>{specialGroup.name}</strong> grubuna özel davet ile kayıt olduğunuz için teşekkür ederiz.
              </>
            ) : (
              'Özel davet ile kayıt olduğunuz için teşekkür ederiz.'
            )}
          </p>
          <p className="text-gray-600 mt-2">
            Özel kişiler kanalına erişebilir ve dilediğiniz kişilerle konuşabilirsiniz.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="kullaniciadi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="email@ornek.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şifre Tekrar
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SpecialRegister