import { useState } from 'react'

interface Gif {
  id: string
  url: string
}

interface GifSearchProps {
  onGifSelect: (url: string) => void
}

const GIPHY_API_KEY = 'XPMLttAwMT7J2YikDsnppIczL2fLRwkJ'
const TENOR_API_KEY = 'AIzaSyBl02J9kro4i2p0PaLeDSgMtVvekx5GdXg'

function GifSearch({ onGifSelect }: GifSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [gifs, setGifs] = useState<Gif[]>([])
  const [loading, setLoading] = useState(false)
  const [apiSource, setApiSource] = useState<'giphy' | 'tenor'>('giphy')

  const searchGifs = async () => {
    if (!searchTerm.trim()) return
    
    setLoading(true)
    try {
      let gifResults = []
      
      if (apiSource === 'giphy') {
        const response = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchTerm)}&limit=20`
        )
        const data = await response.json()
        gifResults = data.data.map((item: any) => ({
          id: item.id,
          url: item.images.original.url
        }))
      } else {
        const response = await fetch(
          `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchTerm)}&key=${TENOR_API_KEY}&limit=20`
        )
        const data = await response.json()
        gifResults = data.results.map((item: any) => ({
          id: item.id,
          url: item.media_formats.gif.url
        }))
      }
      
      setGifs(gifResults)
    } catch (error) {
      console.error('GIF arama hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchGifs()
    }
  }

  return (
    <div className="card flex flex-col h-full">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900">GIF Ara</h2>
        </div>

        {/* API Source Toggle */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setApiSource('giphy')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
              apiSource === 'giphy'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Giphy
          </button>
          <button
            onClick={() => setApiSource('tenor')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
              apiSource === 'tenor'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tenor
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-6 pt-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="GIF ara... (örn: selam, mutlu, üzgün)"
            className="input-field pl-10 pr-4 py-3 text-sm"
          />
          <button
            onClick={searchGifs}
            disabled={loading || !searchTerm.trim()}
            className="absolute right-2 top-2 btn-primary px-4 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              'Ara'
            )}
          </button>
        </div>
      </div>

      {/* GIF Results */}
      <div className="flex-1 overflow-y-auto p-6 pt-0">
        {gifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-slate-600 text-sm">
              {searchTerm.trim() ? 'GIF bulunamadı' : 'Arama yapmak için bir kelime girin'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {gifs.map((gif) => (
              <div
                key={gif.id}
                onClick={() => onGifSelect(gif.url)}
                className="group cursor-pointer rounded-xl overflow-hidden bg-slate-100 hover:bg-slate-200 transition-all duration-200 hover:scale-[1.02] hover:shadow-md aspect-square"
              >
                <img
                  src={gif.url}
                  alt="GIF"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-xl" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default GifSearch
