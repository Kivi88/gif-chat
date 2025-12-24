import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { getAdminReports, reviewReport, sendWarning, getChatMessages, createSpecialInvite, getSpecialInvites, testAPI } from '../api'

interface Report {
  id: number
  reporter_id: number
  reporter_username: string
  reported_username: string
  reported_id: number
  reason: string
  status: string
  admin_reviewed: boolean
  chat_id: number
  created_at: string
}

function AdminPanel() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [warningReason, setWarningReason] = useState('')
  const [warningDetails, setWarningDetails] = useState('')
  const [aiPreview, setAiPreview] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [specialGroups, setSpecialGroups] = useState<any[]>([])
  const [newGroupName, setNewGroupName] = useState('')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [inviteName, setInviteName] = useState('')

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/')
      return
    }

    loadReports()
    loadSpecialInvites()
  }, [user, navigate])

  const loadReports = async () => {
    if (!token) return

    try {
      const result = await getAdminReports(token)
      if (result.success) {
        setReports(result.reports)
      }
    } catch (error) {
      console.error('Bildirim yükleme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSpecialInvites = async () => {
    if (!token) return

    try {
      const result = await getSpecialInvites(token)
      if (result.success) {
        setSpecialGroups(result.specialInvites)
      }
    } catch (error) {
      console.error('Özel davet yükleme hatası:', error)
    }
  }

  const handleCreateSpecialInvite = async () => {
    if (!token) return

    try {
      const result = await createSpecialInvite(token, inviteName.trim() || undefined)
      if (result.success) {
        setShowCreateGroup(false)
        setInviteName('')
        loadSpecialInvites()
      } else {
        alert('Özel davet oluşturma hatası: ' + (result.error || 'Bilinmeyen hata'))
      }
    } catch (error) {
      console.error('Özel davet oluşturma hatası:', error)
      alert('Özel davet oluşturma hatası: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'))
    }
  }

  const handleReview = async (reportId: number, status: string) => {
    if (!token) return

    try {
      await reviewReport(reportId, status, token)
      // Remove the report from local state immediately
      setReports(prev => prev.filter(r => r.id !== reportId))
      if (selectedReport?.id === reportId) {
        setSelectedReport(null)
      }
    } catch (error) {
      console.error('İnceleme hatası:', error)
    }
  }

  const handleViewChat = async (report: Report) => {
    if (!token) return

    try {
      const result = await getChatMessages(report.chat_id, token)
      if (result.success) {
        setChatMessages(result.messages)
        setSelectedReport(report)
      }
    } catch (error) {
      console.error('Sohbet yükleme hatası:', error)
    }
  }

  const generatePreview = async () => {
    if (!warningReason.trim()) return

    try {
      const response = await fetch('/api/admin/warnings/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: warningReason, customDetails: warningDetails })
      })

      const result = await response.json()
      if (result.success) {
        setAiPreview(result.preview)
        setShowPreview(true)
      }
    } catch (error) {
      console.error('Preview generation error:', error)
    }
  }

  const handleSendWarning = async () => {
    if (!token || !selectedReport || !warningReason.trim()) return

    try {
      await sendWarning(
        selectedReport.reported_id,
        warningReason,
        warningDetails,
        selectedReport.id,
        selectedReport.reporter_id,
        token
      )
      alert('✅ İhtar gönderildi ve e-postalar iletildi!')
      setWarningReason('')
      setWarningDetails('')
      setAiPreview('')
      setShowPreview(false)
      setSelectedReport(null)
      loadReports()
    } catch (error) {
      console.error('İhtar gönderme hatası:', error)
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
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center max-w-7xl">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🛡️ Admin Paneli</h1>
            <p className="text-sm text-gray-500">Bildirim Yönetimi</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            ← Ana Sayfa
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Special Groups Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Özel Davetler</h2>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const result = await testAPI()
                    alert('API test successful: ' + JSON.stringify(result))
                  } catch (error) {
                    alert('API test failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
                  }
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition font-medium"
              >
                Test API
              </button>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium"
              >
                + Özel URL Oluştur
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {specialGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Henüz özel davet oluşturmadınız
              </div>
            ) : (
              specialGroups.map((invite: any) => (
                <div key={invite.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-600">
                        Özel URL: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{`${window.location.origin}/ozeldavet/${invite.invite_code}`}</code>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Oluşturulma: {new Date(invite.created_at).toLocaleDateString('tr-TR')}
                        {invite.used && ` • Kullanıldı: ${new Date(invite.created_at).toLocaleDateString('tr-TR')}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invite.used ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {invite.used ? 'Kullanıldı' : 'Kullanılabilir'}
                      </span>
                      {!invite.used && (
                        <button
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/ozeldavet/${invite.invite_code}`)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          📋 Kopyala
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Bildirimler</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {reports.filter(r => !r.admin_reviewed).length} Beklemede
              </span>
            </div>
            
            <div className="space-y-3 max-h-[700px] overflow-y-auto">
              {reports.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                  <div className="text-gray-400 text-4xl mb-2">📭</div>
                  <p className="text-gray-500">Henüz bildirim yok</p>
                </div>
              ) : (
                reports.map(report => (
                  <div
                    key={report.id}
                    className={`border-2 rounded-xl p-4 ${
                      report.admin_reviewed
                        ? report.status === 'approved'
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                        : 'border-orange-300 bg-orange-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded font-medium">
                            Bildiren
                          </span>
                          <span className="font-semibold text-gray-900">{report.reporter_username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded font-medium">
                            Bildirilen
                          </span>
                          <span className="font-semibold text-gray-900">{report.reported_username}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        report.admin_reviewed
                          ? report.status === 'approved'
                            ? 'bg-green-200 text-green-800'
                            : 'bg-gray-200 text-gray-700'
                          : 'bg-orange-200 text-orange-800'
                      }`}>
                        {report.admin_reviewed 
                          ? (report.status === 'approved' ? '✓ İşlendi' : '✗ Reddedildi')
                          : '⏳ Beklemede'}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-2 bg-white rounded p-2">{report.reason}</p>
                    <p className="text-xs text-gray-500">{new Date(report.created_at).toLocaleString('tr-TR')}</p>
                    
                    {!report.admin_reviewed && (
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <button
                          onClick={() => handleViewChat(report)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition text-sm"
                        >
                          👁️ Sohbeti Görüntüle
                        </button>
                        <button
                          onClick={() => handleReview(report.id, 'rejected')}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition text-sm"
                        >
                          ✗ Reddet
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            {selectedReport ? (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  📝 Sohbet & İhtar Sistemi
                </h2>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto border">
                  <h3 className="font-semibold mb-3 text-gray-900">Sohbet Geçmişi:</h3>
                  {chatMessages.map((msg, idx) => (
                    <div key={msg.id} className={`mb-3 ${idx > 0 ? 'pt-3 border-t' : ''}`}>
                      <div className={`flex items-center gap-2 mb-1 ${
                        msg.sender_id === selectedReport.reported_id ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                          msg.sender_id === selectedReport.reported_id 
                            ? 'bg-red-500 text-white' 
                            : 'bg-blue-500 text-white'
                        }`}>
                          {msg.sender_id === selectedReport.reported_id ? 'Bildirilen' : 'Bildiren'}
                        </span>
                        <span className="font-medium text-sm">{msg.sender_username}</span>
                      </div>
                      <img src={msg.gif_url} alt="gif" className="w-40 rounded-lg border-2" />
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                  <h3 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    AI Destekli İhtar Mesajı
                  </h3>

                  <input
                    type="text"
                    value={warningReason}
                    onChange={(e) => setWarningReason(e.target.value)}
                    placeholder="Sorun türü (örn: spam, hakaret, taciz)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />

                  <textarea
                    value={warningDetails}
                    onChange={(e) => setWarningDetails(e.target.value)}
                    placeholder="Ek detaylar (opsiyonel)"
                    className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />

                  <button
                    onClick={generatePreview}
                    disabled={!warningReason.trim()}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                  >
                    🔍 AI Mesajını Önizle
                  </button>

                  {showPreview && aiPreview && (
                    <div className="bg-white border border-gray-200 rounded-md p-4 mb-3">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <span>📄</span> AI Tarafından Oluşturulan Mesaj:
                      </h4>
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{aiPreview}</pre>
                    </div>
                  )}

                  <button
                    onClick={handleSendWarning}
                    disabled={!warningReason.trim() || !showPreview}
                    className="w-full bg-red-600 text-white py-3 rounded-md font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    📧 İhtar Gönder (E-posta + Bildirim)
                  </button>
                  
                  <p className="text-xs text-gray-600 mt-3 text-center">
                    İhtar gönderildiğinde hem bildirilen kullanıcıya hem de bildiren kullanıcıya e-posta gönderilecek
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border p-12 text-center">
                <div className="text-gray-300 text-6xl mb-4">📋</div>
                <p className="text-gray-500">Sohbet görüntülemek için bir bildirim seçin</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Special Invite Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Özel URL Oluştur</h3>
            <p className="text-gray-600 text-sm mb-4">
              Kişiye özel tek kullanımlık davet linki oluşturacaksınız. Bu link ile kayıt olan kişi özel kanala erişebilecek.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grup Adı (Opsiyonel)
              </label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="örn: VIP Üyeler, Özel Grup"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Bu isim kayıt olan kişiye gösterilecek
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateSpecialInvite}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-md font-medium hover:bg-blue-700 transition"
              >
                Oluştur
              </button>
              <button
                onClick={() => setShowCreateGroup(false)}
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

export default AdminPanel
