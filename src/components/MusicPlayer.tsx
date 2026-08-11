"use client";

import React, { useState, useEffect } from "react";
import { Music2, X, ChevronDown, ChevronUp, Play, Pause, ListMusic } from "lucide-react";
import { getMusicSettings, toEmbedUrl } from "@/lib/musicService";

export default function MusicPlayer() {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMusicSettings().then((settings) => {
      if (settings?.playlistUrl) {
        setEmbedUrl(toEmbedUrl(settings.playlistUrl));
      }
      setLoading(false);
    });
  }, []);

  if (loading || !embedUrl) return null;

  return (
    <>
      {/* ── Fixed Bottom-Center Wrapper ── */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center select-none">
        
        {/* ── 1. IFRAME CONTROLLER PANEL (Slides up/down above the cards) ── */}
        <div
          style={{
            width: "300px",
            height: showIframe && open ? "220px" : "0px",
            opacity: showIframe && open ? 1 : 0,
            overflow: "hidden",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            marginBottom: "12px",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
            background: "rgba(18, 18, 20, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
              Değirmen Playlist
            </span>
            <button
              onClick={() => setShowIframe(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* YouTube IFrame */}
          <iframe
            src={embedUrl}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ width: "100%", height: "180px", border: "none" }}
            title="Değirmen Müzik"
          />
        </div>

        {/* ── 2. EXPANDED STACKED ALBUM WIDGET (Image 1 Model) ── */}
        {open && (
          <div className="relative w-[300px] h-[220px] flex flex-col items-center animate-fadeIn animate-duration-300">
            
            {/* Close / Minimize Badge */}
            <button
              onClick={() => { setOpen(false); setShowIframe(false); }}
              className="absolute -top-2 -right-2 z-40 w-6 h-6 rounded-full bg-zinc-900/90 border border-white/15 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md"
              title="Kapat"
            >
              <X className="w-3 h-3" />
            </button>

            {/* Stacked Album 1 (Left) */}
            <div className="absolute left-[20px] top-[18px] w-[100px] h-[135px] rounded-[18px] overflow-hidden shadow-lg -rotate-12 border border-white/10 z-10 transition-all hover:-translate-y-2 hover:-rotate-6 duration-300">
              <img src="/album_rusuk.jpg" alt="Rusuk Cover" className="w-full h-full object-cover" />
            </div>

            {/* Stacked Album 3 (Right) */}
            <div className="absolute right-[20px] top-[22px] w-[100px] h-[135px] rounded-[18px] overflow-hidden shadow-lg rotate-12 border border-white/10 z-10 transition-all hover:-translate-y-2 hover:rotate-6 duration-300">
              <img src="/album_singer.jpg" alt="Singer Cover" className="w-full h-full object-cover" />
            </div>

            {/* Stacked Album 2 (Center) */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1 w-[110px] h-[145px] rounded-[20px] overflow-hidden shadow-2xl z-20 border border-white/20 transition-all hover:-translate-y-2 duration-300">
              <img src="/album_tulus.jpg" alt="Tulus Cover" className="w-full h-full object-cover" />
            </div>

            {/* Glassmorphic Playlist Panel Overlay */}
            <div className="absolute bottom-1 w-[280px] h-[105px] rounded-[28px] bg-black/40 border border-white/10 backdrop-blur-xl z-30 p-4 flex justify-between items-center shadow-2xl">
              <div className="flex flex-col text-left space-y-[2px] w-[70%]">
                <p className="text-[10px] font-bold text-white tracking-wide truncate">Tulus - Monokrom</p>
                <p className="text-[9px] font-semibold text-white/70 truncate">Gery & Gany - Rusuk</p>
                <p className="text-[9px] font-semibold text-white/50 truncate">Nadhif Basalamah - Bergema</p>
                
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-[8px] text-white/35 font-extrabold uppercase tracking-widest leading-none">*Creativestyle.</span>
                </div>
              </div>

              {/* Action Button: Version 1 styled circle/pill trigger */}
              <button
                onClick={() => setShowIframe(!showIframe)}
                className={`w-[44px] h-[44px] rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer ${
                  showIframe ? "bg-orange-500 hover:bg-orange-600" : "bg-zinc-900 border border-white/10 hover:bg-zinc-800"
                }`}
                title="Şarkı Listesi & Kontroller"
              >
                <Music2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── 3. FLOATING MINIMIZED BUTTON (Version 1 Pill Model) ── */}
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-3 bg-zinc-950/90 text-white rounded-full p-1.5 pr-6 border border-white/10 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer hover:border-orange-500/30"
          >
            {/* Version 1 Signature Style: Rounded solid white box on the left containing the dark icon */}
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-zinc-950 shrink-0 shadow-md">
              <Music2 className="w-4 h-4 text-zinc-950" />
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
