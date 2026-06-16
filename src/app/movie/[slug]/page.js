'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, push, set } from 'firebase/database';

// Konfigurasi Firebase resmi milikmu
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

export default function MovieDetail({ params }) {
  const resolvedParams = use(params);
  const { slug: tmdbId } = resolvedParams;

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  // State khusus fitur komentar
  const [comments, setComments] = useState([]);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (!tmdbId) return;

    // 1. Ambil data detail film dari Firebase Cloud berdasarkan ID TMDB
    const movieRef = ref(db, `movies/${tmdbId}`);
    const unsubscribeMovie = onValue(movieRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMovie(data);
      }
      setLoading(false);
    });

    // 2. Ambil data komentar khusus film ini secara real-time dari Firebase Cloud
    const commentsRef = ref(db, `comments/${tmdbId}`);
    const unsubscribeComments = onValue(commentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const commentList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Mengurutkan komentar agar yang terbaru berada di susunan paling atas
        setComments(commentList.reverse());
      } else {
        setComments([]);
      }
    });

    return () => {
      unsubscribeMovie();
      unsubscribeComments();
    };
  }, [tmdbId]);

  // Fungsi mengirim komentar baru ke Firebase Cloud publik
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) return alert('Nama dan isi komentar wajib diisi!');

    // Buat objek komentar baru mengikuti struktur LK21 milikmu
    const newComment = {
      tmdbId: tmdbId,
      name: commentName,
      text: commentText,
      date: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    try {
      const movieCommentsRef = ref(db, `comments/${tmdbId}`);
      const newCommentRef = push(movieCommentsRef);
      await set(newCommentRef, newComment);

      // Reset isi form komentar
      setCommentText('');
      alert('Komentar kamu berhasil diterbitkan di server cloud!');
    } catch (err) {
      alert('Gagal mengirim opini ke server database.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center">
        <p className="text-sm animate-pulse">Memuat halaman film...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#141414] text-white flex flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-bold text-red-600">Film Tidak Ditemukan atau Belum Di-publish! 😢</h1>
        <a href="/" className="text-xs bg-[#e91e63] px-4 py-2 rounded-sm font-bold">Kembali ke Beranda</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-slate-200 antialiased font-sans">
      
      {/* HEADER TOPBAR */}
      <header className="bg-black border-b border-zinc-800 shadow-md">
        <div className="max-w-[1000px] mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <h1 className="text-xl font-black text-white tracking-tighter uppercase cursor-pointer">
              🎬 KAWAN<span className="text-[#e91e63]">MOVIES21</span>
            </h1>
          </Link>
          <Link href="/" className="text-[11px] bg-[#e91e63] hover:bg-[#c2185b] text-white font-bold px-4 py-2 rounded-sm transition-colors uppercase">
            Exit ⬅️ Kembali
          </Link>
        </div>
      </header>

      {/* SUB-NAVIGASI KUNING */}
      <div className="bg-[#b3a125] text-black text-[10px] font-bold tracking-wide uppercase shadow-inner">
        <div className="max-w-[1000px] mx-auto px-4 py-1.5">
          Nonton Film Online {movie.title} ({movie.year}) Subtitle Indonesia
        </div>
      </div>

      {/* KONTEN UTAMA */}
      <main className="max-w-[1000px] mx-auto px-4 py-6">
        
        {/* CONTAINER PLAYER VIDEO AREA */}
        <div className="w-full aspect-video bg-black rounded shadow-2xl border border-zinc-800 overflow-hidden relative">
          {movie.embedUrl ? (
            <iframe 
              src={movie.embedUrl} 
              className="w-full h-full border-0" 
              allowFullScreen
              scrolling="no"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-zinc-950">
              <span className="text-4xl mb-2">🚫</span>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Streaming Tidak Tersedia</p>
              <p className="text-[11px] text-zinc-600 mt-1 max-w-xs">Kamu belum memasukkan link embed streaming untuk film ini di panel admin.</p>
            </div>
          )}
        </div>

        {/* INFO DETIL FILM BOX */}
        <div className="mt-4 bg-[#1a1a1a] border border-zinc-800 p-5 rounded shadow-md">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <h2 className="text-lg font-black text-white uppercase tracking-tight">{movie.title}</h2>
            <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-sm">⭐ {movie.ratingScore || movie.rating}</span>
            <Link href={`/?filter=${movie.year}`} className="bg-[#e91e63] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm hover:opacity-80 transition-opacity">
              {movie.year}
            </Link>
            <Link href={`/?filter=${movie.quality || ''}`} className="bg-blue-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase hover:bg-blue-700 transition-colors">
              {movie.quality || 'HD'}
            </Link>
          </div>
          
          <div className="border-t border-zinc-800/60 pt-4 flex flex-col gap-2 text-xs text-zinc-300 font-medium">
            <p><span className="text-zinc-500 font-bold uppercase inline-block w-24">Tagline:</span> <span className="italic text-zinc-400">"{movie.tagline || '-'}"</span></p>
            <p><span className="text-zinc-500 font-bold uppercase inline-block w-24">Rating:</span> <span className="text-yellow-500 font-bold">{movie.ratingAge || 'G'}</span></p>
            <p>
              <span className="text-zinc-500 font-bold uppercase inline-block w-24">Genre:</span> 
              <span className="inline-flex flex-wrap gap-1">
                {movie.genre ? movie.genre.split(', ').map((g, idx) => (
                  <Link key={idx} href={`/?filter=${g}`} className="text-blue-400 hover:text-[#e91e63] hover:underline">
                    {g}{idx < movie.genre.split(', ').length - 1 ? ',' : ''}
                  </Link>
                ))}
              </span>
            </p>
            <p><span className="text-zinc-500 font-bold uppercase inline-block w-24">Kualitas:</span> <Link href={`/?filter=${movie.quality || 'HD'}`} className="text-blue-400 hover:text-[#e91e63] hover:underline">{movie.quality || 'HD'}</Link></p>
            <p><span className="text-zinc-500 font-bold uppercase inline-block w-24">Tahun:</span> <Link href={`/?filter=${movie.year}`} className="text-blue-400 hover:text-[#e91e63] hover:underline">{movie.year}</Link></p>
            <p><span className="text-zinc-500 font-bold uppercase inline-block w-24">Durasi:</span> {movie.runtime || 'N/A'}</p>
            <p><span className="text-zinc-500 font-bold uppercase inline-block w-24">Negara:</span> <Link href={`/?filter=${movie.country || 'USA'}`} className="text-blue-400 hover:text-[#e91e63] hover:underline">{movie.country || 'USA'}</Link></p>
            <p><span className="text-zinc-500 font-bold uppercase inline-block w-24">Rilis:</span> {movie.releaseDateFull || movie.year}</p>
            <p><span className="text-zinc-500 font-bold uppercase inline-block w-24">Bahasa:</span> {movie.language || 'English'}</p>
            <p><span className="text-zinc-500 font-bold uppercase inline-block w-24">Anggaran:</span> {movie.budget || '-'}</p>
            <p><span className="text-zinc-500 font-bold uppercase inline-block w-24">Pendapatan:</span> {movie.revenue || '-'}</p>
            <p><span className="text-zinc-500 font-bold uppercase inline-block w-24">Direksi:</span> <Link href={`/?filter=${movie.director || 'Unknown'}`} className="text-blue-400 hover:text-[#e91e63] hover:underline">{movie.director || 'Unknown'}</Link></p>
            <p>
              <span className="text-zinc-500 font-bold uppercase inline-block w-24">Pemain:</span> 
              <span className="inline-flex flex-wrap gap-1">
                {movie.cast ? movie.cast.split(', ').map((c, idx) => (
                  <Link key={idx} href={`/?filter=${c}`} className="text-blue-400 hover:text-[#e91e63] hover:underline">
                    {c}{idx < movie.cast.split(', ').length - 1 ? ',' : ''}
                  </Link>
                )) : '-'}
              </span>
            </p>
            
            <div className="mt-4 border-t border-zinc-800/40 pt-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase mb-1">Sinopsis / Ringkasan:</h3>
              <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/40 p-3 rounded border border-zinc-900 italic">
                {movie.synopsis}
              </p>
            </div>
          </div>
        </div>

        {/* CONTAINER DOWNLOAD BOX */}
        <div className="mt-4 bg-[#1a1a1a] border border-zinc-800 p-5 rounded shadow-md">
          <h3 className="text-xs font-bold text-white uppercase mb-4 border-l-4 border-[#e91e63] pl-2 tracking-wider">
            Link Download Pilihan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {movie.downloadServer1 ? (
              <a href={movie.downloadServer1} target="_blank" rel="noopener noreferrer" className="text-[11px] py-2.5 rounded-sm font-extrabold bg-blue-600 hover:bg-blue-700 text-white transition-colors text-center block uppercase tracking-wide shadow-md">
                📥 Download Server 1 (Klik Sini)
              </a>
            ) : (
              <div className="text-center sm:col-span-2 py-4 bg-zinc-950/50 rounded border border-zinc-900">
                <p className="text-[11px] text-zinc-500 italic">Admin belum menyediakan tautan unduhan untuk film ini.</p>
              </div>
            )}
          </div>
        </div>

        {/* ==================== 💬 FITUR BARU: KOTAK KOMENTAR LK21 ==================== */}
        <div className="mt-4 bg-[#1a1a1a] border border-zinc-800 p-5 rounded shadow-md">
          <h3 className="text-xs font-bold text-white uppercase mb-4 border-l-4 border-emerald-600 pl-2 tracking-wider flex justify-between items-center">
            <span>💬 Kolom Komentar / Laporan Kendala</span>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-sm normal-case font-medium">{comments.length} Komentar</span>
          </h3>

          {/* Form Kirim Komentar */}
          <form onSubmit={handleCommentSubmit} className="flex flex-col gap-3 bg-zinc-950/50 p-4 rounded border border-zinc-900 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input 
                type="text" 
                placeholder="Nama kamu..." 
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                className="bg-[#141414] text-xs p-2 rounded-sm border border-zinc-800 focus:outline-none focus:border-emerald-600 text-zinc-200 sm:col-span-1"
                required
              />
              <span className="hidden sm:inline text-[10px] text-zinc-500 self-center">⚠️ Gunakan nama samaran, jangan masukkan data sensitif!</span>
            </div>
            <textarea 
              rows="3" 
              placeholder="Tulis tanggapan atau laporkan link error / rusak di sini..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="bg-[#141414] text-xs p-2 rounded-sm border border-zinc-800 focus:outline-none focus:border-emerald-600 text-zinc-200 resize-none"
              required
            ></textarea>
            <button type="submit" className="self-end bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-4 py-2 rounded-sm uppercase tracking-wider transition-colors shadow-md">
              Kirim Komentar
            </button>
          </form>

          {/* List Daftar Komentar yang Masuk */}
          <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
            {comments.map((c) => (
              <div key={c.id} className="bg-zinc-950/20 border border-zinc-900/60 p-3 rounded-sm flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-emerald-400 tracking-tight">{c.name}</span>
                  <span className="text-[9px] text-zinc-600 font-medium">{c.date}</span>
                </div>
                <p className="text-xs text-zinc-400 leading-normal bg-[#141414]/30 p-2 rounded-sm border border-zinc-900/30 whitespace-pre-wrap">
                  {c.text}
                </p>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-center text-[11px] text-zinc-600 italic py-6">Belum ada komentar di film ini. Jadilah yang pertama memberikan tanggapan! 🎬</p>
            )}
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="mt-16 bg-black border-t border-zinc-900 py-4 text-center text-[10px] text-zinc-600 font-medium">
        &copy; 2026 KAWANMOVIES21.
      </footer>

    </div>
  );
}