"use client";

import React, { useState, useEffect, useRef } from "react";
import { Music2, X, ChevronDown, ChevronUp } from "lucide-react";
import { getMusicSettings, toEmbedUrl } from "@/lib/musicService";

export default function MusicPlayer() {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
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

  const MusicBars = () => (
    <span className="flex items-end gap-[2px] h-4 shrink-0">
      <span className="w-[3px] rounded-full bg-orange-500" style={{ height: "8px",  animation: "musicBar1 0.8s ease-in-out infinite alternate" }} />
      <span className="w-[3px] rounded-full bg-orange-400" style={{ height: "14px", animation: "musicBar2 0.9s ease-in-out infinite alternate" }} />
      <span className="w-[3px] rounded-full bg-amber-500"  style={{ height: "10px", animation: "musicBar1 0.7s ease-in-out infinite alternate" }} />
      <span className="w-[3px] rounded-full bg-orange-400" style={{ height: "16px", animation: "musicBar2 1.0s ease-in-out infinite alternate" }} />
    </span>
  );

  return (
    <>
      <style>{`
        @keyframes musicBar1 { from { height: 4px; } to { height: 14px; } }
        @keyframes musicBar2 { from { height: 10px; } to { height: 18px; } }
      `}</style>

      {/* ── Center-Bottom Fixed Container ── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center" style={{ minWidth: "320px" }}>

        {/* ── PLAYER KUTUSU: iframe HER ZAMAN DOM'da, sadece görünürlük CSS ile kontrol ── */}
        <div
          style={{
            width: "340px",
            marginBottom: "8px",
            /* Kapalıyken veya minimize iken tamamen gizle ama DOM'dan kaldırma */
            display: open ? "flex" : "none",
            flexDirection: "column",
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            background: "rgba(18,18,20,0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* Player Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <MusicBars />
              <span className="text-xs font-bold text-zinc-200 tracking-wide">Değirmen Müzik</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(!minimized)}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title={minimized ? "Aç" : "Küçült"}
              >
                {minimized ? <ChevronDown className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                onClick={() => { setOpen(false); setMinimized(false); }}
                className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 
            ── KRITIK FIX: iframe her zaman DOM'da kalır. 
            Minimize edilince sadece yükseklik 0 yapılır ama iframe kaldırılmaz.
            Bu sayede YouTube arka planda çalmaya devam eder.
          ── */}
          <div style={{
            height: minimized ? "0px" : "200px",
            overflow: "hidden",
            transition: "height 0.3s ease",
          }}>
            <iframe
              src={embedUrl}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ width: "100%", height: "200px", border: "none", display: "block" }}
              title="Değirmen Müzik"
            />
          </div>

          {/* Minimize bar içeriği */}
          {minimized && (
            <div className="flex items-center justify-between px-5 py-2">
              <div className="flex items-center gap-3">
                <MusicBars />
                <span className="text-xs text-zinc-400 font-medium">Çalıyor...</span>
              </div>
              <button
                onClick={() => setMinimized(false)}
                className="text-xs text-orange-400 hover:text-orange-300 font-bold cursor-pointer"
              >
                Aç ↑
              </button>
            </div>
          )}
        </div>

        {/* ── Floating "Müzik Çal" butonu — sadece kapalıyken ── */}
        {!open && (
          <button
            onClick={() => { setOpen(true); setMinimized(false); }}
            className="mb-4 flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, rgba(234,88,12,0.95) 0%, rgba(251,146,60,0.9) 100%)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px rgba(234,88,12,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
              border: "1px solid rgba(234,88,12,0.4)",
            }}
          >
            <Music2 className="w-4 h-4" />
            <span>Müzik Çal</span>
            <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
          </button>
        )}
      </div>
    </>
  );
}
