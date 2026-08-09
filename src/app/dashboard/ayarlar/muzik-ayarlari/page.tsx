"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, Moon, Sun, LogOut, Music, Save, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { getMusicSettings, setMusicSettings, toEmbedUrl } from "@/lib/musicService";

export default function MuzikAyarlariPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [userRole, setUserRole] = useState<string>("waiter");
  const [userFullName, setUserFullName] = useState<string>("Admin");

  const [playlistUrl, setPlaylistUrl] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }
    const activeUser = localStorage.getItem("activeUser");
    if (activeUser) {
      const parsed = JSON.parse(activeUser);
      setUserRole(parsed.role || "waiter");
      setUserFullName(parsed.fullName || parsed.username || "Admin");
      if (parsed.role !== "admin" && parsed.role !== "yonetici") {
        window.location.href = "/dashboard";
      }
    } else {
      window.location.href = "/";
    }

    getMusicSettings().then((s) => {
      if (s?.playlistUrl) {
        setPlaylistUrl(s.playlistUrl);
        setCurrentUrl(s.playlistUrl);
      }
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!playlistUrl.trim()) {
      showToast("Playlist URL boş olamaz!", false);
      return;
    }
    setSaving(true);
    try {
      await setMusicSettings(playlistUrl.trim(), userFullName);
      setCurrentUrl(playlistUrl.trim());
      showToast("Müzik ayarları kaydedildi!", true);
    } catch {
      showToast("Bir hata oluştu!", false);
    }
    setSaving(false);
  };

  if (userRole !== "admin" && userRole !== "yonetici") {
    return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Yetkilendiriliyor...</div>;
  }

  const embedPreview = playlistUrl ? toEmbedUrl(playlistUrl) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = "/dashboard/ayarlar"}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 flex items-center justify-center">
            <img src="/logo.png" alt="Değirmen Cafe Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Müzik Ayarları</h1>
            <p className="text-xs text-zinc-500">YouTube playlist linki yönetimi</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer">
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => window.location.href = "/"} className="p-2 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer" title="Çıkış Yap">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-6 space-y-8">

        {/* Mevcut Ayar */}
        {currentUrl && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Aktif Playlist Bağlı</span>
            </div>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-400 hover:text-orange-400 transition-colors flex items-center gap-1 truncate"
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              {currentUrl}
            </a>
          </div>
        )}

        {/* Form */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Music className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-base">YouTube Playlist Linki</h2>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Playlist URL</label>
            <input
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="https://www.youtube.com/playlist?list=PLxxxxx"
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder-zinc-600 focus:outline-none focus:border-orange-500/60 transition-colors font-mono"
            />
            <p className="text-[11px] text-zinc-500">
              YouTube Playlist sayfasından URL&#39;yi kopyalayıp yapıştırın.
              Örnek: https://www.youtube.com/playlist?list=PLxxxxx
            </p>
          </div>

          {/* Önizle Butonu */}
          {playlistUrl && (
            <button
              onClick={() => setPreview(!preview)}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors underline underline-offset-2 cursor-pointer"
            >
              {preview ? "Önizlemeyi Kapat" : "Önizle"}
            </button>
          )}

          {/* Önizleme iframe */}
          {preview && embedPreview && (
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg">
              <iframe
                src={embedPreview}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="w-full"
                style={{ height: "220px", border: "none" }}
                title="Önizleme"
              />
            </div>
          )}

          {/* Kaydet */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>

        {/* Bilgi Kutusu */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 space-y-2">
          <h3 className="font-bold text-sm text-zinc-300">Nasıl Çalışır?</h3>
          <ul className="text-xs text-zinc-500 space-y-1.5 list-disc list-inside">
            <li>Dashboard açılırken Firestore&#39;dan playlist URL&#39;si okunur.</li>
            <li>URL ayarlanmışsa sayfanın alt orta kısmında <strong className="text-zinc-300">Müzik Çal</strong> butonu görünür.</li>
            <li>Butona tıklanınca YouTube playlist player açılır ve çalmaya başlar.</li>
            <li>Sadece admin ve yönetici bu sayfadan URL&#39;yi değiştirebilir.</li>
          </ul>
        </div>

      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2 z-50 ${
          toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
