"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Moon, 
  Sun, 
  LogOut, 
  History, 
  RefreshCw,
  Search,
  Shield,
  Loader2,
  FileText,
  User,
  Scale,
  BookOpen
} from "lucide-react";
import { getRecentAuditLogs, AuditLog } from "@/lib/auditLogService";

export default function IslemGecmisiPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TÜMÜ");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }

    // Yetki kontrolü (Sadece Admin / Yönetici)
    const activeUserStr = sessionStorage.getItem("activeUser");
    if (activeUserStr) {
      const parsed = JSON.parse(activeUserStr);
      if (parsed.role !== "admin" && parsed.role !== "yonetici") {
        window.location.href = "/dashboard";
        return;
      }
    } else {
      window.location.href = "/";
      return;
    }

    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const recentLogs = await getRecentAuditLogs(150);
      setLogs(recentLogs);
    } catch (err) {
      console.error("Log okuma hatası:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  const categories = ["TÜMÜ", "STOK", "RECETE", "PERSONEL", "RAPOR", "GIRIS"];

  const filteredLogs = logs.filter(log => {
    const matchesCategory = selectedCategory === "TÜMÜ" || log.category === selectedCategory;
    const matchesSearch = 
      log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = "/dashboard/ayarlar"}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer mr-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 flex items-center justify-center">
            <img src="/logo.png" alt="Değirmen Cafe Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Kullanıcı İşlem Geçmişi & Audit Logları</h1>
            <p className="text-xs text-zinc-500">Firestore Anlık İşlem Kayıtları</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer">
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => window.location.href = "/"} className="p-2 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer" title="Çıkış Yap">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 pb-20">

        {/* Arama ve Filtre */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Personel adı, işlem türü veya detay ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-orange-600 text-white shadow-md"
                    : "bg-[var(--background)] border border-[var(--border)] text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {cat}
              </button>
            ))}

            <button
              onClick={loadLogs}
              disabled={isLoading}
              className="p-2.5 bg-[var(--background)] border border-[var(--border)] rounded-2xl text-zinc-400 hover:text-zinc-200 cursor-pointer ml-2"
              title="Yenile"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* LOG TABLOSU */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <span className="ml-3 text-sm text-zinc-400">İşlem kayıtları yükleniyor...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Tarih & Saat</th>
                    <th className="py-3 px-4">İşlemi Yapan Personel</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Yapılan İşlem</th>
                    <th className="py-3 px-4">İşlem Detayları</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/40 text-xs">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[var(--background)]/35 transition-colors">
                      <td className="py-4 px-4 font-mono text-zinc-400 whitespace-nowrap text-[11px]">
                        {log.displayTime}
                      </td>
                      <td className="py-4 px-4 font-bold text-zinc-800 dark:text-zinc-200">
                        {log.username}
                        <span className="ml-2 text-[10px] font-normal text-zinc-500">({log.userRole})</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                          log.category === "STOK" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                          log.category === "RECETE" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          log.category === "PERSONEL" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>
                          {log.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-zinc-300">
                        {log.action}
                      </td>
                      <td className="py-4 px-4 text-zinc-400 text-[11px] leading-relaxed">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-zinc-500 text-xs">
                        Henüz kayıtlı işlem geçmişi bulunmuyor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[var(--border)] bg-[var(--card)] py-4 px-6 flex items-center justify-between text-xs text-zinc-500">
        <span>© 2026 Değirmen Cafe. Tüm hakları saklıdır.</span>
        <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Audit Log Kayıtları Aktif
        </span>
      </footer>

    </div>
  );
}
