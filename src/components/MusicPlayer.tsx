"use client";

import React, { useState, useEffect } from "react";
import { Music2, X, ChevronDown, ChevronUp, Music } from "lucide-react";
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

  // Müzik ayarlanmamışsa hiçbir şey gösterme
  if (loading || !embedUrl) return null;

  return (
    <>
      {/* Center-Bottom Floating Music Bar */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center"
        style={{ minWidth: "320px" }}
      >
        {/* Açık Player - iframe */}
        {open && !minimized && (
          <div
            className="mb-2 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            style={{
              background: "rgba(18,18,20,0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              width: "340px",
            }}
          >
            {/* Player Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                {/* Animated music bars */}
                <span className="flex items-end gap-[2px] h-4">
                  <span
                    className="w-[3px] rounded-full bg-orange-500"
                    style={{
                      height: "8px",
                      animation: "musicBar1 0.8s ease-in-out infinite alternate",
                    }}
                  />
                  <span
                    className="w-[3px] rounded-full bg-orange-400"
                    style={{
                      height: "14px",
                      animation: "musicBar2 0.9s ease-in-out infinite alternate",
                    }}
                  />
                  <span
                    className="w-[3px] rounded-full bg-amber-500"
                    style={{
                      height: "10px",
                      animation: "musicBar1 0.7s ease-in-out infinite alternate",
                    }}
                  />
                  <span
                    className="w-[3px] rounded-full bg-orange-400"
                    style={{
                      height: "16px",
                      animation: "musicBar2 1.0s ease-in-out infinite alternate",
                    }}
                  />
                </span>
                <span className="text-xs font-bold text-zinc-200 tracking-wide">
                  Değirmen Müzik
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMinimized(true)}
                  className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Küçült"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="Kapat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* YouTube iframe */}
            <iframe
              src={embedUrl}
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="w-full"
              style={{ height: "200px", border: "none" }}
              title="Değirmen Müzik"
            />
          </div>
        )}

        {/* Minimized bar */}
        {open && minimized && (
          <div
            className="mb-2 rounded-2xl shadow-2xl border border-white/10 px-5 py-2.5 flex items-center gap-4"
            style={{
              background: "rgba(18,18,20,0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <span className="flex items-end gap-[2px] h-4">
              <span
                className="w-[3px] rounded-full bg-orange-500"
                style={{ height: "8px", animation: "musicBar1 0.8s ease-in-out infinite alternate" }}
              />
              <span
                className="w-[3px] rounded-full bg-orange-400"
                style={{ height: "14px", animation: "musicBar2 0.9s ease-in-out infinite alternate" }}
              />
              <span
                className="w-[3px] rounded-full bg-amber-500"
                style={{ height: "10px", animation: "musicBar1 0.7s ease-in-out infinite alternate" }}
              />
            </span>
            <span className="text-xs font-bold text-zinc-200">Değirmen Müzik</span>
            <button
              onClick={() => setMinimized(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Floating music button — always visible when closed */}
        {!open && (
          <button
            onClick={() => { setOpen(true); setMinimized(false); }}
            className="mb-4 flex items-center gap-2.5 px-6 py-3 rounded-2xl shadow-2xl border border-orange-500/30 text-sm font-bold text-white transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, rgba(234,88,12,0.95) 0%, rgba(251,146,60,0.9) 100%)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px rgba(234,88,12,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            <Music2 className="w-4 h-4" />
            <span>Müzik Çal</span>
            {/* Animated dot */}
            <span
              className="w-2 h-2 rounded-full bg-white/80"
              style={{ animation: "pulse 1.5s ease-in-out infinite" }}
            />
          </button>
        )}
      </div>

      {/* Keyframe Animations */}
      <style jsx global>{`
        @keyframes musicBar1 {
          from { height: 4px; }
          to   { height: 14px; }
        }
        @keyframes musicBar2 {
          from { height: 10px; }
          to   { height: 18px; }
        }
      `}</style>
    </>
  );
}
