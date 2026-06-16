'use client';
import { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, remove } from 'firebase/database';

// Konfigurasi Firebase asli milikmu
const firebaseConfig = {
  apiKey: "AIzaSyDq136HivVcOX9cqZ7VnPliiZP5xWiD1aM",
  authDomain: "kawanmovies21-c3ec5.firebaseapp.com",
  databaseURL: "https://kawanmovies21-c3ec5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kawanmovies21-c3ec5",
  storageBucket: "kawanmovies21-c3ec5.firebasestorage.app",
  messagingSenderId: "65122230605",
  appId: "1:65122230605:web:6986575e5ace3ade24d704",
  measurementId: "G-DK2WJ016BW"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

const TMDB_API_KEY = '9efcf4701dc93f8f070428b8a1f75a8f';

export default function AdminPanel() {
  // Kredensial Login Admin Rahasia milikmu
  const ADMIN_USERNAME = 'adynr17';
  const ADMIN_PASSWORD = 'adynr17import';

  // State Keamanan Login
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // State Importer Film
  const [tmdbId, setTmdbId] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [customGenre, setCustomGenre] = useState('');
  const [customYear, setCustomYear] = useState('');
  const [quality, setQuality] = useState('HD');
  const [publishedMovies, setPublishedMovies] = useState([]);
  const [message, setMessage] = useState('');

  // Sinkronisasi Sesi Browser & Real-time Database Firebase
  useEffect(() => {
    const sessionToken = sessionStorage.getItem('kawanmovies_admin_session');
    if (sessionToken === 'authenticated_true') {
      setIsLoggedIn(true);
    }

    // Menarik katalog aktif sedunia dari Firebase Cloud secara real-time
    const moviesRef = ref(db, 'movies');
    const unsubscribe = onValue(moviesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Mengubah objek Firebase menjadi array terurut untuk daftar list admin
        const movieList = Object.keys(data).map(key => data[key]);
        // Mengurutkan berdasarkan urutan input terbaru di atas
        setPublishedMovies(movieList.reverse());
      } else {
        setPublishedMovies([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fungsi Menangani Proses Login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (usernameInput === ADMIN_USERNAME && passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem('kawanmovies_admin_session', 'authenticated_true');
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('❌ Username atau Password salah! Akses ditolak.');
    }
  };

  // Fungsi Logout Admin
  const handleLogout = () => {
    sessionStorage.removeItem('kawanmovies_admin_session');
    setIsLoggedIn(false);
    setUsernameInput('');
    setPasswordInput('');
  };

  // MESIN GOOGLE TRANSLATE GRATISAN BAWAAN KODEMU
  const translateToIndonesia = async (text) => {
    if (!text) return '';
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      if (!res.ok) return text;
      const data = await res.json();
      return data[0].map(item => item[0]).join('');
    } catch (error) {
      return text;
    }
  };

  // Fungsi Impor Film dari TMDB ke Firebase Cloud
  const handlePublish = async (e) => {
    e.preventDefault();
    if (!tmdbId) return alert('ID TMDB wajib diisi!');

    setMessage('Sedang menarik seluruh data detail film...');

    const countryNames = {
      US: 'USA', ID: 'Indonesia', KR: 'South Korea', JP: 'Japan',
      CN: 'China', HK: 'Hong Kong', TW: 'Taiwan', TH: 'Thailand',
      GB: 'United Kingdom', FR: 'France', IN: 'India'
    };

    try {
      const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=id-ID&append_to_response=credits,release_dates`);
      if (!res.ok) throw new Error('Film tidak ditemukan di TMDB.');
      const tmdbData = await res.json();

      let finalSynopsis = tmdbData.overview || '';
      let finalTagline = tmdbData.tagline || '';
      
      const isEnglishSynopsis = /\b(the|is|of|and|story|movie)\b/i.test(finalSynopsis);
      if (!finalSynopsis || isEnglishSynopsis) {
        const resEn = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`);
        if (resEn.ok) {
          const tmdbDataEn = await resEn.json();
          if (!finalSynopsis && tmdbDataEn.overview) {
            finalSynopsis = await translateToIndonesia(tmdbDataEn.overview);
          }
          if (!finalTagline && tmdbDataEn.tagline) {
            finalTagline = await translateToIndonesia(tmdbDataEn.tagline);
          }
        }
      }

      let finalRating = 'G';
      const releaseResults = tmdbData.release_dates?.results || [];
      const usRelease = releaseResults.find(r => r.iso_3166_1 === 'US') || releaseResults[0];
      if (usRelease && usRelease.release_dates?.[0]?.certification) {
        finalRating = usRelease.release_dates[0].certification;
      }

      const directorObj = tmdbData.credits?.crew?.find(c => c.job === 'Director');
      const finalDirector = directorObj ? directorObj.name : 'Unknown';
      
      const finalCast = tmdbData.credits?.cast 
        ? tmdbData.credits.cast.slice(0, 3).map(c => c.name).join(', ') 
        : 'Unknown';

      let finalReleaseDate = 'N/A';
      if (tmdbData.release_date) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const [year, month, day] = tmdbData.release_date.split('-');
        finalReleaseDate = `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
      }

      const formatCurrency = (num) => {
        if (!num) return '-';
        return '$ ' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&.').replace(/\.00$/, ',00');
      };

      let finalLanguage = tmdbData.spoken_languages?.[0]?.name || 'English';

      let finalGenre = customGenre;
      if (!finalGenre && tmdbData.genres) {
        finalGenre = tmdbData.genres.map(g => g.name).join(', ');
      }
      const finalYear = customYear || (tmdbData.release_date ? tmdbData.release_date.split('-')[0] : '2026');
      
      let finalCountry = 'USA';
      if (tmdbData.production_countries?.[0]) {
        finalCountry = countryNames[tmdbData.production_countries[0].iso_3166_1] || tmdbData.production_countries[0].name;
      }

      const newMovie = {
        tmdbId,
        title: tmdbData.title,
        poster: `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`,
        ratingScore: tmdbData.vote_average.toFixed(1),
        year: finalYear,
        genre: finalGenre,
        country: finalCountry,
        quality: quality,
        synopsis: finalSynopsis || 'Sinopsis belum tersedia.',
        runtime: tmdbData.runtime ? `${tmdbData.runtime} min` : 'N/A',
        embedUrl,
        downloadServer1: downloadUrl,
        tagline: finalTagline || '-',
        ratingAge: finalRating,
        releaseDateFull: finalReleaseDate,
        language: finalLanguage,
        budget: formatCurrency(tmdbData.budget),
        revenue: formatCurrency(tmdbData.revenue),
        director: finalDirector,
        cast: finalCast
      };

      // AKSI PUBLISH LANGSUNG MASUK KE SERVER CLOUD FIREBASE GOOGLE
      const singleMovieRef = ref(db, `movies/${tmdbId}`);
      await set(singleMovieRef, newMovie);

      setTmdbId(''); setEmbedUrl(''); setDownloadUrl(''); setCustomGenre(''); setCustomYear(''); setQuality('HD');
      setMessage('✅ Berhasil mengimpor data film super lengkap ke Firebase Cloud!');
    } catch (err) {
      alert(err.message);
      setMessage('');
    }
  };

  // FUNGSI HAPUS FILM ONLINE LANGSUNG DARI FIREBASE
  const handleDelete = async (id) => {
    if (confirm('Hapus film ini dari beranda publik sedunia?')) {
      try {
        const singleMovieRef = ref(db, `movies/${id}`);
        await remove(singleMovieRef);
        alert('Film sukses dihapus dari server cloud!');
      } catch (err) {
        alert('Gagal menghapus data dari Firebase.');
      }
    }
  };

  // TAMPILAN GERBANG LOGIN
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-4 antialiased font-sans">
        <div className="w-full max-w-sm bg-[#020617] p-6 rounded-lg border border-slate-800 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-xl font-black text-red-600 uppercase tracking-tighter">🎬 KAWANMOVIES21</h1>
            <p className="text-zinc-500 text-[11px] font-medium uppercase mt-1 tracking-wider">Sistem Verifikasi Proteksi Panel Admin</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Username</label>
              <input 
                type="text" 
                value={usernameInput} 
                onChange={(e) => setUsernameInput(e.target.value)} 
                placeholder="Masukkan username admin" 
                className="bg-slate-900 border border-slate-800 text-xs p-2.5 rounded focus:outline-none focus:border-red-600 transition-colors"
                required 
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Password</label>
              <input 
                type="password" 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)} 
                placeholder="••••••••" 
                className="bg-slate-900 border border-slate-800 text-xs p-2.5 rounded focus:outline-none focus:border-red-600 transition-colors"
                required 
              />
            </div>

            {loginError && <p className="text-[11px] text-red-500 font-bold bg-red-950/30 p-2 border border-red-900/50 rounded text-center">{loginError}</p>}

            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 font-bold text-xs py-2.5 rounded transition-colors shadow-lg uppercase tracking-wider mt-1">
              🔑 Masuk ke Panel Importer
            </button>
          </form>

          <div className="text-center mt-6 pt-4 border-t border-slate-900">
            <a href="/" className="text-[11px] text-zinc-500 hover:text-white transition-colors">← Kembali Ke Beranda Utama</a>
          </div>
        </div>
      </div>
    );
  }

  // TAMPILAN UTAMA PANEL ADMIN IMPORTER DENGAN DATA FIREBASE
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* TOPBAR HEADER ADMIN */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-red-600">KAWANMOVIES21 <span className="text-white text-sm font-normal">| Panel Importer Film</span></h1>
          <div className="flex items-center gap-2">
            <a href="/" className="text-xs bg-slate-800 px-4 py-2 rounded hover:bg-slate-700 font-medium transition-colors">👁️ Lihat Beranda</a>
            <button onClick={handleLogout} className="text-xs bg-red-950 text-red-400 border border-red-900 px-4 py-2 rounded hover:bg-red-900 hover:text-white font-bold transition-colors">
              🚪 Keluar
            </button>
          </div>
        </div>

        {/* CONTAINER UTAMA FORM & LIST */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handlePublish} className="bg-slate-950 p-5 rounded-lg border border-slate-800 h-fit md:col-span-1 flex flex-col gap-3.5">
            <h2 className="font-semibold text-sm border-l-4 border-red-600 pl-2">Publish Film Baru</h2>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">ID TMDB Film</label>
              <input type="text" value={tmdbId} onChange={e => setTmdbId(e.target.value)} placeholder="Contoh: 299534" className="bg-slate-800 text-sm p-2 rounded focus:outline-none border border-slate-700 text-white" required />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Genre Film (Opsi manual)</label>
              <input type="text" value={customGenre} onChange={e => setCustomGenre(e.target.value)} placeholder="Contoh: Action, Horor" className="bg-slate-800 text-sm p-2 rounded focus:outline-none border border-slate-700 text-white" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Tahun Rilis (Opsi)</label>
                <input type="text" value={customYear} onChange={e => setCustomYear(e.target.value)} placeholder="2026" className="bg-slate-800 text-sm p-2 rounded focus:outline-none border border-slate-700 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Kualitas Video</label>
                <select value={quality} onChange={e => setQuality(e.target.value)} className="bg-slate-800 text-sm p-2 rounded focus:outline-none border border-slate-700 text-white cursor-pointer">
                  <option value="HD">HD</option>
                  <option value="Bluray">Bluray</option>
                  <option value="WEBDL">WEB-DL</option>
                  <option value="HDRip">HDRip</option>
                  <option value="CAM">CAM</option>
                  <option value="HDCAM">HDCAM</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Link Embed Streaming</label>
              <input type="text" value={embedUrl} onChange={e => setEmbedUrl(e.target.value)} placeholder="https://abyssplayer.com/6BPk9OXAm" className="bg-slate-800 text-sm p-2 rounded focus:outline-none border border-slate-700 text-white" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Link Download Server 1</label>
              <input type="text" value={downloadUrl} onChange={e => setDownloadUrl(e.target.value)} placeholder="https://fpgo.xyz/file/6978bdefbf879ec71a2e25ad" className="bg-slate-800 text-sm p-2 rounded focus:outline-none border border-slate-700 text-white" />
            </div>

            <button type="submit" className="bg-red-600 hover:bg-red-700 font-medium py-2 rounded text-xs transition-colors mt-2">
              🚀 Ambil & Publish Film
            </button>
            {message && <p className="text-xs text-yellow-500 text-center mt-1">{message}</p>}
          </form>

          <div className="md:col-span-2 bg-slate-950 p-5 rounded-lg border border-slate-800">
            <h2 className="font-semibold text-sm border-l-4 border-blue-600 pl-2 mb-4">Daftar Film Aktif ({publishedMovies.length})</h2>
            <div className="flex flex-col gap-2 max-h-[550px] overflow-y-auto">
              {publishedMovies.map(movie => (
                <div key={movie.tmdbId} className="flex items-center justify-between bg-slate-900 p-3 rounded border border-slate-800 text-sm">
                  <div className="flex items-center gap-3">
                    <img src={movie.poster} className="w-10 h-14 object-cover rounded" alt="" />
                    <div>
                      <h4 className="font-medium">{movie.title} ({movie.year})</h4>
                      <p className="text-xs text-slate-500">Genre: <span className="text-zinc-300">{movie.genre}</span></p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(movie.tmdbId)} className="text-xs bg-red-950 text-red-400 border border-red-900 px-3 py-1 rounded hover:bg-red-900 hover:text-white transition-colors">Hapus</button>
                </div>
              ))}
              {publishedMovies.length === 0 && <p className="text-xs text-slate-600 italic text-center py-6">Belum ada film yang kamu publish.</p>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}