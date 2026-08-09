"use client";

import React, { useState, useEffect } from "react";
import { 
  Coffee, 
  Moon, 
  Sun, 
  LogOut, 
  Package, 
  Bell,
  BookOpen,
  BarChart3,
  Settings,
  AlertTriangle
} from "lucide-react";
import { mockStockItems } from "@/lib/stockStore";

import UserProfileWidget from "@/components/UserProfileWidget";

export default function DashboardPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [userRole, setUserRole] = useState<string>("waiter"); // Varsayılan personel rolü

  const [criticalCount, setCriticalCount] = useState(0);
  const [sktWarnings, setSktWarnings] = useState<{ id: string; name: string; category: string; daysLeft: number }[]>([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }

    // Giriş yapan kullanıcının rolünü al
    const activeUser = localStorage.getItem("activeUser");
    if (activeUser) {
      const parsed = JSON.parse(activeUser);
      setUserRole(parsed.role || "waiter");
    }

    // Stok verilerini localStorage'dan çekip Kritik Limit ve SKT Analizlerini yapalım
    const savedStock = localStorage.getItem("degirmen_stock");
    let currentStock = mockStockItems;
    if (savedStock) {
      currentStock = JSON.parse(savedStock);
    }

    // Kritik limit hesabı
    const critCount = currentStock.filter(item => item.quantity <= item.minLimit).length;
    setCriticalCount(critCount);

    // SKT Analizi (Tarihi yaklaşanlar - 30 günden az kalanlar veya geçenler)
    const warnings: typeof sktWarnings = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    currentStock.forEach(item => {
      if (item.expDate) {
        const exp = new Date(item.expDate);
        exp.setHours(0,0,0,0);
        const timeDiff = exp.getTime() - today.getTime();
        const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (diffDays <= 30) {
          warnings.push({
            id: item.id,
            name: item.name,
            category: item.category,
            daysLeft: diffDays
          });
        }
      }
    });

    // En kritik olanlar (süre olarak en az kalanlar/geçenler) en üstte görünsün
    warnings.sort((a, b) => a.daysLeft - b.daysLeft);
    setSktWarnings(warnings);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  // Modülleri dinamik olarak yetkiye göre oluşturalım
  const modules = [
    { label: "Stok Kontrolü", active: true, path: "/dashboard/stok" },
    { label: "Stok Sayım", active: true, path: "/dashboard/stok-sayim" },
    { label: "Reçeteler", active: true, path: "/dashboard/receteler" },
  ];

  // Aylık Stok Takibi yetkisini admin veya yoneticiye verelim
  if (userRole === "admin" || userRole === "yonetici") {
    modules.push({ label: "Aylık Stok Takibi", active: true, path: "/dashboard/aylik-stok-takibi" });
  }

  // Eğer giriş yapan kullanıcı admin ise "Ayarlar" modülünü de listeye enjekte et
  if (userRole === "admin") {
    modules.push({ label: "Ayarlar", active: true, path: "/dashboard/ayarlar" });
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* 1. ÜST BÖLGE (HEADER) */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-bold text-lg tracking-tight">Değirmen Cafe</h1>
            <p className="text-xs text-zinc-500">Kontrol Paneli | Rol: <span className="font-bold text-orange-500 uppercase">{userRole}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <UserProfileWidget />
          
          <button className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors relative cursor-pointer">
            <Bell className="w-5 h-5" />
            {criticalCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-[var(--card)] rounded-full"></span>
            )}
          </button>
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="h-6 w-[1px] bg-[var(--border)]"></div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-600/10 border border-orange-500/20 flex items-center justify-center font-bold text-orange-500 text-sm">
              {userRole === "admin" ? "AD" : "PR"}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold leading-none">{userRole === "admin" ? "Yönetici" : "Personel"}</p>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{userRole}</span>
            </div>
          </div>

          <button 
            onClick={() => window.location.href = "/"}
            className="p-2 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
            title="Çıkış Yap"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. ORTA BÖLGE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col justify-center items-center space-y-12">
        
        {/* SKT UYARI ALANI (Tüm Kullanıcılar Görür) */}
        {sktWarnings.length > 0 && (
          <div className="w-full max-w-4xl bg-amber-500/5 border border-amber-500/20 rounded-3xl p-5 space-y-3 animate-pulse">
            <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>DİKKAT: Son Tüketim Tarihi (SKT) Yaklaşan Hammaddeler!</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {sktWarnings.map(w => (
                <div 
                  key={w.id} 
                  className={`p-3 rounded-2xl border text-xs flex flex-col justify-between gap-1.5 ${
                    w.daysLeft < 0 
                      ? "bg-red-500/10 border-red-500/30 text-red-400 font-black animate-pulse" 
                      : "bg-[var(--card)] border-[var(--border)] text-zinc-300 font-semibold"
                  }`}
                >
                  <div>
                    <div className="truncate font-bold">{w.name}</div>
                    <div className="text-[9px] text-zinc-500 uppercase">{w.category}</div>
                  </div>
                  <div className="text-[10px] font-bold">
                    {w.daysLeft < 0 ? (
                      <span className="text-red-500">Tarihi Geçti ({Math.abs(w.daysLeft)} Gün Önce!)</span>
                    ) : (
                      <span className="text-amber-500">Son {w.daysLeft} Gün Kaldı!</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Karşılama Alanı */}
        <div className="text-center flex flex-col items-center gap-1 animate-fadeIn -mt-10">
          <div className="w-96 h-96 flex items-center justify-center">
            <img src="/logo.png" alt="Değirmen Cafe Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[#ea580c] text-center max-w-xl">
            Barista Ürün Yönetim, Reçete, Stok Kontrol Paneli
          </h2>
          <p className="text-zinc-500 max-w-md mx-auto text-sm">
            Erişmek istediğiniz cafe modülünü seçin. Kartların üzerine gelerek detayları görebilirsiniz.
          </p>
        </div>

        {/* Dinamik Kartlar Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 w-full justify-items-center py-6 max-w-5xl">
          {modules.map((item, idx) => (
            <div 
              key={idx}
              onClick={() => {
                if (item.path !== "#") window.location.href = item.path;
              }}
              className="custom-border-card"
              style={{
                boxShadow: item.active 
                  ? "0 10px 30px -10px rgba(234, 88, 12, 0.3), inset 0 0 0 1px rgba(234, 88, 12, 0.2)" 
                  : "0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)"
              }}
            >
              {/* SVG Yuvarlatılmış Köşeli Çerçeve Çizgisi */}
              <svg className="custom-card-border-svg">
                <rect 
                  style={{ 
                    stroke: item.active ? "#ea580c" : "rgba(255, 255, 255, 0.15)",
                    strokeDashoffset: item.active ? "0" : "1000"
                  }} 
                />
              </svg>

              {/* Varsayılan Başlık Görünümü */}
              <div className="card-logo flex flex-col items-center justify-center text-center px-6">
                <span className="text-base font-extrabold tracking-wide text-zinc-300">
                  {item.label}
                </span>
              </div>

              {/* Hover Durumunda Beliren Detay / Giriş Metni */}
              <div className="card-text flex flex-col items-center gap-1.5">
                <span className="text-orange-500 text-xs font-bold uppercase tracking-wider">Modüle Git</span>
                <span className="text-white text-sm font-medium">{item.label}</span>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* 3. ALT BÖLGE (FOOTER) */}
      <footer className="w-full border-t border-[var(--border)] bg-[var(--card)] py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
        <div>
          <span>© 2026 Değirmen Cafe. Tüm hakları saklıdır.</span>
        </div>
      </footer>

    </div>
  );
}
