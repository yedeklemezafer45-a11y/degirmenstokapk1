"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Moon, 
  Sun, 
  LogOut, 
  Package, 
  ShieldAlert,
  BookOpen,
  Calendar,
  History,
  Megaphone,
  Music,
  ArrowUpRight
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AyarlarPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [userRole, setUserRole] = useState<string>("waiter");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }

    // Rol Kontrolü (Sadece Admin girebilir)
    const activeUser = sessionStorage.getItem("activeUser");
    if (activeUser) {
      const parsed = JSON.parse(activeUser);
      setUserRole(parsed.role || "waiter");
      if (parsed.role !== "admin") {
        window.location.href = "/dashboard";
      }
    } else {
      window.location.href = "/";
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  if (userRole !== "admin") {
    return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Yetkilendiriliyor...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer mr-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 flex items-center justify-center">
            <img src="/logo.png" alt="Değirmen Cafe Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Sistem Ayarları</h1>
            <p className="text-xs text-zinc-500">Yönetim Paneli Yapılandırması</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => router.push("/")}
            className="p-2 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
            title="Çıkış Yap"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Gövde - Ayarlar Kart Menüsü */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col justify-center items-center space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Ayarlar Modülleri</h2>
          <p className="text-sm text-zinc-500">Yapılandırmak istediğiniz ayar grubunu seçin.</p>
        </div>

        {/* Ayarlar İçindeki Özel Modül Kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full justify-items-center py-6 max-w-4xl">
          
          {/* Kart 1: Stok Listesi Kontrolü */}
          <div 
            onClick={() => router.push("/dashboard/ayarlar/stok-kontrolu")}
            className="custom-border-card"
            style={{
              boxShadow: "0 10px 30px -10px rgba(234, 88, 12, 0.3), inset 0 0 0 1px rgba(234, 88, 12, 0.2)"
            }}
          >
            <svg className="custom-card-border-svg">
              <rect style={{ stroke: "#ea580c", strokeDashoffset: "0" }} />
            </svg>

            <div className="card-logo flex flex-col items-center justify-center text-center px-6">
              <span className="text-base font-extrabold tracking-wide text-zinc-300">
                Stok Listesi Kontrolü
              </span>
            </div>

            <div className="card-text flex flex-col items-center gap-3">
              <span className="text-white text-sm font-black truncate max-w-[180px]">Stok Listesi Kontrolü</span>
              <div className="flex items-center gap-2 bg-white text-zinc-950 pl-1.5 pr-4 py-1.5 rounded-2xl shadow-xl">
                <div className="w-7 h-7 rounded-lg bg-zinc-950 flex items-center justify-center text-white shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-800">
                  Ayara Git
                </span>
              </div>
            </div>
          </div>

          {/* Kart 2: Reçeteler Listesi Kontrolü */}
          <div 
            onClick={() => router.push("/dashboard/ayarlar/recete-kontrolu")}
            className="custom-border-card"
            style={{
              boxShadow: "0 10px 30px -10px rgba(234, 88, 12, 0.3), inset 0 0 0 1px rgba(234, 88, 12, 0.2)"
            }}
          >
            <svg className="custom-card-border-svg">
              <rect style={{ stroke: "#ea580c", strokeDashoffset: "0" }} />
            </svg>

            <div className="card-logo flex flex-col items-center justify-center text-center px-6 gap-2">
              <BookOpen className="w-5 h-5 text-orange-500" />
              <span className="text-base font-extrabold tracking-wide text-zinc-300">
                Reçeteler Listesi Kontrolü
              </span>
            </div>

            <div className="card-text flex flex-col items-center gap-3">
              <span className="text-white text-sm font-black truncate max-w-[180px]">Reçeteler Listesi Kontrolü</span>
              <div className="flex items-center gap-2 bg-white text-zinc-950 pl-1.5 pr-4 py-1.5 rounded-2xl shadow-xl">
                <div className="w-7 h-7 rounded-lg bg-zinc-950 flex items-center justify-center text-white shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-800">
                  Ayara Git
                </span>
              </div>
            </div>
          </div>

          {/* Kart 3: SKT (Son Tüketim Tarihi) Kontrolü */}
          <div 
            onClick={() => router.push("/dashboard/ayarlar/skt-kontrolu")}
            className="custom-border-card"
            style={{
              boxShadow: "0 10px 30px -10px rgba(234, 88, 12, 0.3), inset 0 0 0 1px rgba(234, 88, 12, 0.2)"
            }}
          >
            <svg className="custom-card-border-svg">
              <rect style={{ stroke: "#ea580c", strokeDashoffset: "0" }} />
            </svg>

            <div className="card-logo flex flex-col items-center justify-center text-center px-6 gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <span className="text-base font-extrabold tracking-wide text-zinc-300">
                SKT Takip Kontrolü
              </span>
            </div>

            <div className="card-text flex flex-col items-center gap-3">
              <span className="text-white text-sm font-black truncate max-w-[180px]">SKT Takip Kontrolü</span>
              <div className="flex items-center gap-2 bg-white text-zinc-950 pl-1.5 pr-4 py-1.5 rounded-2xl shadow-xl">
                <div className="w-7 h-7 rounded-lg bg-zinc-950 flex items-center justify-center text-white shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-800">
                  Ayara Git
                </span>
              </div>
            </div>
          </div>

          {/* Kart 4: Yetki & Personel Ayarları */}
          <div 
            onClick={() => router.push("/dashboard/ayarlar/personel-yetkileri")}
            className="custom-border-card"
            style={{
              boxShadow: "0 10px 30px -10px rgba(234, 88, 12, 0.3), inset 0 0 0 1px rgba(234, 88, 12, 0.2)"
            }}
          >
            <svg className="custom-card-border-svg">
              <rect style={{ stroke: "#ea580c", strokeDashoffset: "0" }} />
            </svg>

            <div className="card-logo flex flex-col items-center justify-center text-center px-6 gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-500" />
              <span className="text-base font-extrabold tracking-wide text-zinc-300">
                Yetki & Personel Ayarları
              </span>
            </div>

            <div className="card-text flex flex-col items-center gap-3">
              <span className="text-white text-sm font-black truncate max-w-[180px]">Yetki & Personel Ayarları</span>
              <div className="flex items-center gap-2 bg-white text-zinc-950 pl-1.5 pr-4 py-1.5 rounded-2xl shadow-xl">
                <div className="w-7 h-7 rounded-lg bg-zinc-950 flex items-center justify-center text-white shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-800">
                  Ayara Git
                </span>
              </div>
            </div>
          </div>

          {/* Kart 5: İşlem Geçmişi & Loglar */}
          <div 
            onClick={() => router.push("/dashboard/ayarlar/islem-gecmisi")}
            className="custom-border-card"
            style={{
              boxShadow: "0 10px 30px -10px rgba(234, 88, 12, 0.3), inset 0 0 0 1px rgba(234, 88, 12, 0.2)"
            }}
          >
            <svg className="custom-card-border-svg">
              <rect style={{ stroke: "#ea580c", strokeDashoffset: "0" }} />
            </svg>

            <div className="card-logo flex flex-col items-center justify-center text-center px-6 gap-2">
              <History className="w-5 h-5 text-orange-500" />
              <span className="text-base font-extrabold tracking-wide text-zinc-300">
                Kullanıcı İşlem Geçmişi
              </span>
            </div>

            <div className="card-text flex flex-col items-center gap-3">
              <span className="text-white text-sm font-black truncate max-w-[180px]">Kullanıcı İşlem Geçmişi</span>
              <div className="flex items-center gap-2 bg-white text-zinc-950 pl-1.5 pr-4 py-1.5 rounded-2xl shadow-xl">
                <div className="w-7 h-7 rounded-lg bg-zinc-950 flex items-center justify-center text-white shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-800">
                  Ayara Git
                </span>
              </div>
            </div>
          </div>

          {/* Kart 6: Duyuru Yönetimi */}
          <div 
            onClick={() => router.push("/dashboard/ayarlar/duyuru-yonetimi")}
            className="custom-border-card"
            style={{
              boxShadow: "0 10px 30px -10px rgba(234, 88, 12, 0.3), inset 0 0 0 1px rgba(234, 88, 12, 0.2)"
            }}
          >
            <svg className="custom-card-border-svg">
              <rect style={{ stroke: "#ea580c", strokeDashoffset: "0" }} />
            </svg>

            <div className="card-logo flex flex-col items-center justify-center text-center px-6 gap-2">
              <Megaphone className="w-5 h-5 text-orange-500" />
              <span className="text-base font-extrabold tracking-wide text-zinc-300">
                Duyuru Yönetimi
              </span>
            </div>

            <div className="card-text flex flex-col items-center gap-3">
              <span className="text-white text-sm font-black truncate max-w-[180px]">Duyuru Yönetimi</span>
              <div className="flex items-center gap-2 bg-white text-zinc-950 pl-1.5 pr-4 py-1.5 rounded-2xl shadow-xl">
                <div className="w-7 h-7 rounded-lg bg-zinc-950 flex items-center justify-center text-white shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-800">
                  Ayara Git
                </span>
              </div>
            </div>
          </div>

          {/* Kart 7: Müzik Ayarları */}
          <div 
            onClick={() => router.push("/dashboard/ayarlar/muzik-ayarlari")}
            className="custom-border-card"
            style={{
              boxShadow: "0 10px 30px -10px rgba(234, 88, 12, 0.3), inset 0 0 0 1px rgba(234, 88, 12, 0.2)"
            }}
          >
            <svg className="custom-card-border-svg">
              <rect style={{ stroke: "#ea580c", strokeDashoffset: "0" }} />
            </svg>

            <div className="card-logo flex flex-col items-center justify-center text-center px-6 gap-2">
              <Music className="w-5 h-5 text-orange-500" />
              <span className="text-base font-extrabold tracking-wide text-zinc-300">
                Müzik Ayarları
              </span>
            </div>

            <div className="card-text flex flex-col items-center gap-3">
              <span className="text-white text-sm font-black truncate max-w-[180px]">Müzik Ayarları</span>
              <div className="flex items-center gap-2 bg-white text-zinc-950 pl-1.5 pr-4 py-1.5 rounded-2xl shadow-xl">
                <div className="w-7 h-7 rounded-lg bg-zinc-950 flex items-center justify-center text-white shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-800">
                  Ayara Git
                </span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[var(--border)] bg-[var(--card)] py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
        <div>
          <span>© 2026 Değirmen Cafe. Tüm hakları saklıdır.</span>
        </div>
      </footer>

    </div>
  );
}
