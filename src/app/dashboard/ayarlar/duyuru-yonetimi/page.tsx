"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, Moon, Sun, LogOut, Megaphone, Save, Trash2, CheckCircle2, AlertCircle, Flame } from "lucide-react";
import { getAnnouncement, setAnnouncement, clearAnnouncement, Announcement } from "@/lib/announcementService";

export default function DuyuruYonetimiPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [userRole, setUserRole] = useState<string>("waiter");
  const [userFullName, setUserFullName] = useState<string>("Admin");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "warning" | "critical">("info");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [current, setCurrent] = useState<Announcement | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }
    const activeUser = sessionStorage.getItem("activeUser");
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

    // Mevcut duyuruyu çek
    setLoading(true);
    getAnnouncement().then((ann) => {
      setCurrent(ann);
      if (ann) {
        setTitle(ann.title);
        setMessage(ann.message);
        setType(ann.type);
      }
      setLoading(false);
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
    if (!title.trim() || !message.trim()) {
      showToast("Başlık ve mesaj boş olamaz!", false);
      return;
    }
    setSaving(true);
    try {
      await setAnnouncement({ active: true, title, message, type, updatedBy: userFullName });
      showToast("Duyuru yayınlandı!", true);
      setCurrent({ active: true, title, message, type, updatedAt: new Date().toISOString(), updatedBy: userFullName });
    } catch {
      showToast("Bir hata oluştu!", false);
    }
    setSaving(false);
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await clearAnnouncement();
      showToast("Duyuru kaldırıldı.", true);
      setCurrent(null);
      setTitle("");
      setMessage("");
      setType("info");
    } catch {
      showToast("Hata oluştu!", false);
    }
    setSaving(false);
  };

  const typeConfig = {
    info: { label: "Bilgilendirme", color: "text-blue-400", border: "border-blue-500/40", bg: "bg-blue-500/10", icon: <CheckCircle2 className="w-4 h-4 text-blue-400" /> },
    warning: { label: "Uyarı", color: "text-amber-400", border: "border-amber-500/40", bg: "bg-amber-500/10", icon: <AlertCircle className="w-4 h-4 text-amber-400" /> },
    critical: { label: "Kritik", color: "text-red-400", border: "border-red-500/40", bg: "bg-red-500/10", icon: <Flame className="w-4 h-4 text-red-400" /> },
  };

  if (userRole !== "admin" && userRole !== "yonetici") {
    return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Yetkilendiriliyor...</div>;
  }

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
            <h1 className="font-bold text-lg tracking-tight">Duyuru Yönetimi</h1>
            <p className="text-xs text-zinc-500">Tüm personele anlık duyuru yayınla</p>
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

        {/* Mevcut Aktif Duyuru Önizleme */}
        {current && (
          <div className={`rounded-2xl border p-4 space-y-1 ${typeConfig[current.type].bg} ${typeConfig[current.type].border}`}>
            <div className={`flex items-center gap-2 font-bold text-sm ${typeConfig[current.type].color}`}>
              {typeConfig[current.type].icon}
              <span>AKTİF DUYURU: {current.title}</span>
            </div>
            <p className="text-sm text-zinc-300 ml-6">{current.message}</p>
            <p className="text-[10px] text-zinc-500 ml-6">Son güncelleme: {new Date(current.updatedAt).toLocaleString("tr-TR")} · {current.updatedBy}</p>
          </div>
        )}

        {!current && !loading && (
          <div className="rounded-2xl border border-dashed border-zinc-700 p-6 text-center text-zinc-500 text-sm">
            Şu anda aktif bir duyuru yok.
          </div>
        )}

        {/* Form */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-base">Yeni Duyuru Yayınla</h2>
          </div>

          {/* Tip Seçimi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Duyuru Tipi</label>
            <div className="flex gap-3">
              {(["info", "warning", "critical"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    type === t
                      ? `${typeConfig[t].bg} ${typeConfig[t].border} ${typeConfig[t].color}`
                      : "border-[var(--border)] text-zinc-500 hover:border-zinc-600"
                  }`}
                >
                  {typeConfig[t].label}
                </button>
              ))}
            </div>
          </div>

          {/* Başlık */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Başlık</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="örn: Bugün Erken Kapanış"
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-zinc-600 focus:outline-none focus:border-orange-500/60 transition-colors"
            />
          </div>

          {/* Mesaj */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Mesaj</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Personele iletmek istediğiniz duyuru metnini yazın..."
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-zinc-600 focus:outline-none focus:border-orange-500/60 transition-colors resize-none"
            />
          </div>

          {/* Önizleme */}
          {(title || message) && (
            <div className={`rounded-xl border p-3 space-y-0.5 ${typeConfig[type].bg} ${typeConfig[type].border}`}>
              <p className={`text-xs font-bold ${typeConfig[type].color}`}>Önizleme:</p>
              <p className="text-sm font-bold text-zinc-200">{title || "—"}</p>
              <p className="text-xs text-zinc-400">{message || "—"}</p>
            </div>
          )}

          {/* Butonlar */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? "Kaydediliyor..." : "Duyuruyu Yayınla"}
            </button>
            {current && (
              <button
                onClick={handleClear}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Kaldır
              </button>
            )}
          </div>
        </div>

      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2 transition-all z-50 ${
          toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
