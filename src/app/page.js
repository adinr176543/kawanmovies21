'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// 1. KOMPONEN UTAMA KONTEN BERANDA
function MovieListContent() {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('kawanmovies_db');
    if (saved) setMovies(JSON.parse(saved));

    const filterParam = searchParams.get('filter');
    if (filterParam) {
      setActiveFilter(filterParam);
    } else {
      setActiveFilter('');
    }
  }, [searchParams]);

  // Menutup dropdown live search jika user mengklik di luar area kotak pencarian
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter film untuk pengisian daftar saran (suggestions) di bawah kolom input
  const liveSuggestions = movies.filter((movie) => {
    if (!searchQuery) return false;
    return movie.title.toLowerCase().includes(searchQuery.toLowerCase());
  }).slice(0, 5); // Batasi maksimal 5 rekomendasi melayang agar rapi

  // Filter film utama untuk list poster di bawah
  const filteredMovies = movies.filter((movie) => {
    const query = searchQuery.toLowerCase();
    const filter = activeFilter.toLowerCase();

    if (searchQuery) {
      return movie.title.toLowerCase().includes(query);
    }

    if (activeFilter) {
      return (
        (movie.quality && movie.quality.toLowerCase() === filter) ||
        (movie.genre && movie.genre.toLowerCase().includes(filter)) ||
        (movie.year && movie.year.toString() === filter) ||
        (movie.country && movie.country.toLowerCase() === filter) ||
        (movie.director && movie.director.toLowerCase() === filter) ||
        (movie.cast && movie.cast.toLowerCase().includes(filter))
      );
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#141414] text-zinc-300 antialiased font-sans">
      
      {/* HEADER UTAMA */}
      <header className="bg-black border-b border-zinc-900 sticky top-0 z-50 shadow-md">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          
          <Link href="/" onClick={() => { setSearchQuery(''); setActiveFilter(''); }} className="hover:opacity-90 transition-opacity">
            <h1 className="text-xl font-black text-white tracking-tighter uppercase cursor-pointer">
              🎬 KAWAN<span className="text-[#e91e63]">MOVIES21</span>
            </h1>
          </Link>

          {/* KOTAK PENCARIAN FILM DENGAN LIVE SEARCH */}
          <div ref={searchContainerRef} className="w-full sm:w-[350px] relative">
            <input
              type="text"
              placeholder="Cari film kesukaan kamu di sini..."
              value={searchQuery}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
                if (activeFilter) setActiveFilter('');
              }}
              className="w-full bg-[#1a1a1a] text-zinc-200 placeholder-zinc-600 text-xs px-3 py-2 rounded-sm border border-zinc-800 focus:outline-none focus:border-[#e91e63] focus:ring-1 focus:ring-[#e91e63] transition-all"
            />
            
            {(searchQuery || activeFilter) && (
              <button 
                onClick={() => { setSearchQuery(''); setActiveFilter(''); router.push('/'); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs bg-zinc-800 px-1.5 py-0.5 rounded-sm"
              >
                Reset ✕
              </button>
            )}

            {/* DROPDOWN LIVE SEARCH REKOMENDASI MELAYANG */}
            {showSuggestions && liveSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-[#1a1a1a] border border-zinc-800 rounded shadow-2xl overflow-hidden z-50">
                {liveSuggestions.map((movie) => (
                  <Link 
                    key={movie.tmdbId} 
                    href={`/movie/${movie.tmdbId}`}
                    onClick={() => setShowSuggestions(false)}
                    className="flex items-center gap-3 p-2 hover:bg-zinc-900 border-b border-zinc-8/40 last:border-0 transition-colors group"
                  >
                    <img 
                      src={movie.poster} 
                      alt="" 
                      className="w-7 h-10 object-cover rounded-sm border border-zinc-800"
                    />
                    <div className="overflow-hidden">
                      <h4 className="text-[11px] font-bold text-zinc-200 group-hover:text-[#e91e63] truncate transition-colors">
                        {movie.title}
                      </h4>
                      <p className="text-[9px] text-zinc-500 font-medium truncate mt-0.5">
                        ⭐ {movie.ratingScore || movie.rating} • {movie.year} • {movie.quality || 'HD'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </header>

      {/* SUB-NAVIGASI KUNING */}
      <div className="bg-[#b3a125] text-black text-[10px] font-bold tracking-wide uppercase shadow-inner text-center sm:text-left">
        <div className="max-w-[1200px] mx-auto px-4 py-1.5">
          KawanMovies21 - Nonton Film Online Streaming Subtitle Indonesia Gratis
        </div>
      </div>

      {/* KONTEN UTAMA */}
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        
        <div className="flex items-center gap-2 mb-4 border-b border-zinc-900 pb-2">
          <span className="w-2 h-4 bg-[#e91e63] rounded-sm"></span>
          <h2 className="text-xs font-black text-white uppercase tracking-wider">
            {searchQuery && `Hasil Pencarian Judul: "${searchQuery}"`}
            {activeFilter && `Menampilkan Arsip Koleksi: "${activeFilter}"`}
            {!searchQuery && !activeFilter && 'Update Film Terbaru'}
          </h2>
        </div>

        {/* GRID POSTER FILM */}
        {filteredMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredMovies.map((movie) => (
              <div key={movie.tmdbId} className="bg-[#1a1a1a] border border-zinc-800 hover:border-zinc-700 rounded shadow-md overflow-hidden relative group flex flex-col justify-between">
                
                <div className="relative aspect-[2/3] w-full bg-zinc-900 overflow-hidden">
                  <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  
                  <span className={`absolute top-1 right-1 text-[9px] font-extrabold px-1 py-0.5 rounded-sm shadow-sm tracking-tighter text-white ${
                    movie.quality === 'Bluray' ? 'bg-blue-600' : 
                    movie.quality === 'CAM' || movie.quality === 'HDCAM' ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}>
                    {movie.quality || 'HD'}
                  </span>

                  <span className="absolute top-1 left-1 bg-black/80 text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 border border-zinc-800">
                    ⭐ <span className="text-white font-bold text-[9px]">{movie.ratingScore || movie.rating}</span>
                  </span>

                  <span className="absolute bottom-1 left-1 bg-black/70 text-zinc-400 text-[9px] font-medium px-1 rounded-sm">
                    {movie.year}
                  </span>

                  {movie.runtime && movie.runtime !== 'N/A' && (
                    <span className="absolute bottom-1 right-1 bg-black/70 text-zinc-300 text-[9px] font-bold px-1 rounded-sm flex items-center gap-1">
                      🕒 {movie.runtime}
                    </span>
                  )}
                </div>

                <div className="p-2 flex flex-col flex-grow justify-between bg-gradient-to-t from-black to-[#1a1a1a]">
                  <div>
                    <h3 className="font-bold text-[11px] text-zinc-300 line-clamp-1 leading-tight group-hover:text-[#e91e63] transition-colors mb-0.5" title={movie.title}>
                      {movie.title}
                    </h3>
                    <p className="text-[9px] text-zinc-500 font-medium truncate mb-2">
                      {movie.genre || 'Movie'}
                    </p>
                  </div>
                  
                  <Link href={`/movie/${movie.tmdbId}`}>
                    <button className="w-full bg-[#2a2a2a] hover:bg-[#e91e63] text-white font-extrabold text-[9px] py-1.5 rounded-sm uppercase tracking-wide transition-all shadow-md">
                      Nonton Film
                    </button>
                  </Link>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#1a1a1a] rounded border border-zinc-900">
            <p className="text-sm text-zinc-500 italic">Tidak ada koleksi film yang cocok dengan filter pencarian.</p>
          </div>
        )}

      </main>

      <footer className="mt-20 bg-black border-t border-zinc-950 py-4 text-center text-[10px] text-zinc-600 font-medium">
        &copy; 2026 KAWANMOVIES21.
      </footer>

    </div>
  );
}

// 2. EXPORT DEFAULT UTAMA YANG DIBUNGKUS SUSPENSE (SYARAT MUTLAK VERCEL)
export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center text-xs animate-pulse">
        Menghubungkan Jaringan KawanMovies21...
      </div>
    }>
      <MovieListContent />
    </Suspense>
  );
}