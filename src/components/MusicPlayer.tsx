"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Heart, 
  Plus, 
  Share2, 
  X, 
  Music,
  ChevronDown
} from "lucide-react";
import { getMusicSettings } from "@/lib/musicService";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export default function MusicPlayer() {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // YouTube API States
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [songTitle, setSongTitle] = useState("Değirmen Müzik");
  const [songArtist, setSongArtist] = useState("DEĞİRMEN");
  const [videoId, setVideoId] = useState("");
  const [coverUrl, setCoverUrl] = useState<string>("/album_tulus.jpg");

  // Interaction States
  const [isLiked, setIsLiked] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    // 1. settings'ten playlist url'sini çek
    getMusicSettings().then((settings) => {
      const activeUrl = settings?.playlistUrl || "https://youtube.com/playlist?list=PLF4FX8f5fKzyLo9WVMxYUNNBFqnfyPs7S&si=CbpFb5Nz-u77kX80";
      setEmbedUrl(activeUrl);
      // Load YouTube API
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }
      setLoading(false);
      
      // Ensure the container is rendered in the DOM before initializing the YT Player
      setTimeout(() => {
        initializePlayer(activeUrl);
      }, 50);
    });
  }, []);

  // Video ID veya Playlist ID'yi çeken yardımcı fonksiyon
  const parseYoutubeUrl = (url: string) => {
    let videoId = "";
    let playlistId = "";
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes("youtube.com")) {
        playlistId = urlObj.searchParams.get("list") || "";
        videoId = urlObj.searchParams.get("v") || "";
      } else if (urlObj.hostname.includes("youtu.be")) {
        videoId = urlObj.pathname.substring(1);
      }
    } catch (e) {
      if (url.includes("list=")) {
        playlistId = url.split("list=")[1]?.split("&")[0] || "";
      } else if (url.includes("v=")) {
        videoId = url.split("v=")[1]?.split("&")[0] || "";
      }
    }
    return { videoId, playlistId };
  };

  const initializePlayer = (playlistUrl: string) => {
    const { videoId: vId, playlistId: pId } = parseYoutubeUrl(playlistUrl);

    const onPlayerReady = (event: any) => {
      const p = event.target;
      setPlayer(p);
      setDuration(p.getDuration() || 0);
      updateSongInfo(p);
    };

    const onPlayerStateChange = (event: any) => {
      // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
      if (event.data === 1) {
        setIsPlaying(true);
        updateSongInfo(event.target);
      } else {
        setIsPlaying(false);
      }
      setDuration(event.target.getDuration() || 0);
    };

    const updateSongInfo = (p: any) => {
      try {
        const data = p.getVideoData();
        if (data) {
          setVideoId(data.video_id || "");
          const title = data.title || "Değirmen Müzik";
          if (title.includes("-")) {
            const parts = title.split("-");
            setSongArtist(parts[0]?.trim() || "DEĞİRMEN");
            setSongTitle(parts[1]?.trim() || title);
          } else {
            setSongArtist(data.author || "DEĞİRMEN");
            setSongTitle(title);
          }
        }
      } catch (err) {
        console.error("Error getting video data:", err);
      }
    };

    const setup = () => {
      const container = document.getElementById("yt-player-container");
      if (!container) {
        console.warn("yt-player-container element not found in DOM yet!");
        return;
      }

      const playerVars: any = {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3
      };

      if (pId) {
        playerVars.listType = "playlist";
        playerVars.list = pId;
      } else if (vId) {
        playerVars.videoId = vId;
      }

      new window.YT.Player("yt-player-container", {
        height: "1",
        width: "1",
        videoId: vId || undefined,
        playerVars: playerVars,
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange
        }
      });
    };

    if (window.YT && window.YT.Player) {
      setup();
    } else {
      // Çift atamayı engellemek ve call stack taşmasını (recursion loop) önlemek için event modeline geçelim
      if (typeof window !== "undefined") {
        if (!window.onYouTubeIframeAPIReady) {
          window.onYouTubeIframeAPIReady = () => {
            const event = new CustomEvent("youtube-api-ready");
            window.dispatchEvent(event);
          };
        }

        const handleReady = () => {
          setup();
          window.removeEventListener("youtube-api-ready", handleReady);
        };

        window.addEventListener("youtube-api-ready", handleReady);
      }
    }
  };

  // Zamanlayıcı yardımıyla çalan süreyi takip etme
  useEffect(() => {
    let timer: any;
    if (isPlaying && player) {
      timer = setInterval(() => {
        if (player.getCurrentTime) {
          setCurrentTime(player.getCurrentTime());
          const d = player.getDuration();
          if (d) setDuration(d);
        }
      }, 500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, player]);

  // Video ID değiştikçe kapağı güncelle
  useEffect(() => {
    if (videoId) {
      setCoverUrl(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
    } else {
      setCoverUrl("/album_tulus.jpg");
    }
  }, [videoId]);

  if (loading || !embedUrl) {
    return (
      <div id="yt-player-container" className="absolute top-0 left-0 w-1 h-1 opacity-0 pointer-events-none overflow-hidden" />
    );
  }

  // Çal/Duraklat
  const togglePlay = () => {
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  // Sonraki Şarkı
  const handleNext = () => {
    if (!player || !player.nextVideo) return;
    player.nextVideo();
  };

  // Önceki Şarkı
  const handlePrevious = () => {
    if (!player || !player.previousVideo) return;
    player.previousVideo();
  };

  // Şarkı Zaman Çubuğuna Tıklama (Seek)
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!player || !player.seekTo || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * duration;
    player.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  // Zaman Formatlayıcı (3:48 gibi)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Paylaşma Fonksiyonu
  const handleShare = () => {
    if (!videoId) return;
    const shareUrl = `https://www.youtube.com/watch?v=${videoId}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Şarkı linki kopyalandı! 🎵");
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Arka Planda Tamamen Gizli YouTube Oynatıcı Container */}
      <div id="yt-player-container" className="absolute top-0 left-0 w-1 h-1 opacity-0 pointer-events-none overflow-hidden" />

      {/* Ana Sabit Wrapper */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center select-none">
        
        {/* ── YENİ YATAY MÜZİK ÇALAR (GÖRSELDEKİ TASARIM BİREBİR) ── */}
        {open && (
          <div className="relative flex items-center justify-center animate-fadeIn duration-300 w-[92vw] sm:w-[440px] h-[130px]">
            
            {/* 1. Sol Panel: Dikey İkon Şeridi (Heart, Plus, Share) */}
            <div className="absolute left-0 h-[100px] w-[50px] rounded-l-[24px] bg-white dark:bg-zinc-900 flex flex-col items-center justify-center gap-3.5 shadow-xl border-r border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 z-10 transition-colors">
              <button 
                onClick={() => setIsLiked(!isLiked)} 
                className={`p-1 hover:scale-110 active:scale-95 transition-all cursor-pointer ${isLiked ? "text-red-500" : "hover:text-red-400"}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              </button>
              <button 
                onClick={() => setIsAdded(!isAdded)}
                className={`p-1 hover:scale-110 active:scale-95 transition-all cursor-pointer ${isAdded ? "text-emerald-500" : "hover:text-orange-400"}`}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button 
                onClick={handleShare}
                className="p-1 hover:text-blue-400 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Şarkıyı Paylaş"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Ana Panel Gövdesi: Sağ Taraf (Şarkı Bilgisi, İlerleme Barı, Playback) */}
            <div className="w-full pl-[150px] pr-5 h-[100px] rounded-r-[24px] rounded-l-[24px] sm:rounded-l-none bg-white dark:bg-zinc-900 flex flex-col justify-center shadow-2xl z-0 transition-colors relative">
              
              {/* Mini Kapat/Simge Durumuna Getir Butonu */}
              <button 
                onClick={() => setOpen(false)}
                className="absolute top-2.5 right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                title="Kapat"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Sanatçı & Şarkı Adı */}
              <div className="text-left mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block truncate max-w-[200px]">
                  {songArtist}
                </span>
                <span className="text-[12px] sm:text-[13px] font-black text-zinc-800 dark:text-zinc-100 block truncate max-w-[200px] leading-tight mt-0.5">
                  {songTitle}
                </span>
              </div>

              {/* İlerleme Çubuğu */}
              <div className="space-y-1">
                <div 
                  onClick={handleSeek}
                  className="relative w-full h-[3px] bg-zinc-100 dark:bg-zinc-800 rounded-full cursor-pointer group"
                >
                  <div 
                    style={{ width: `${progressPercent}%` }}
                    className="h-full bg-zinc-950 dark:bg-white rounded-full transition-all duration-300 relative"
                  >
                    {/* Glow Dot */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-zinc-950 dark:bg-white scale-0 group-hover:scale-100 transition-transform" />
                  </div>
                </div>
                
                {/* Süre Bilgileri */}
                <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400 dark:text-zinc-500 leading-none">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Kontrolleri */}
              <div className="flex items-center justify-center gap-4 mt-1.5">
                <button 
                  onClick={handlePrevious}
                  className="text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Önceki Şarkı"
                >
                  <SkipBack className="w-4 h-4 fill-current" />
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-[30px] h-[30px] rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title={isPlaying ? "Durdur" : "Oynat"}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>
                <button 
                  onClick={handleNext}
                  className="text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Sonraki Şarkı"
                >
                  <SkipForward className="w-4 h-4 fill-current" />
                </button>
              </div>

            </div>

            {/* 3. Dışa Taşan Albüm Kapağı Görseli */}
            <div className="absolute left-[38px] top-0 w-[100px] h-[100px] rounded-[18px] overflow-hidden shadow-2xl border border-white/10 dark:border-white/5 z-20 pointer-events-none">
              <img 
                src={coverUrl} 
                alt="Album Cover" 
                className="w-full h-full object-cover" 
              />
            </div>

          </div>
        )}

        {/* ── 4. KÜÇÜLTÜLMÜŞ FLOATING DÜĞME (Version 1 Pill Model) ── */}
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-3 bg-zinc-950/90 text-white rounded-full p-1.5 pr-6 border border-white/10 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer hover:border-orange-500/30"
          >
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-zinc-950 shrink-0 shadow-md">
              <Music className="w-4 h-4 text-zinc-950" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider leading-none text-zinc-200">
              Müzik Çal
            </span>
          </button>
        )}

      </div>
    </>
  );
}
