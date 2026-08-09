"use client";

import React, { useState, useEffect } from "react";
import { 
  Coffee, 
  Moon, 
  Sun, 
  LogOut, 
  ChevronLeft,
  Plus,
  Minus,
  AlertTriangle,
  Search,
  Bell,
  Package,
  Check
} from "lucide-react";
import { mockStockItems, StockItem } from "@/lib/stockStore";
import { mockStockMovements, StockMovement } from "@/lib/reportStore";

export default function StokPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("waiter"); // Varsayılan personel
  const [userName, setUserName] = useState<string>("mehmet_barista");
  const [tempInputs, setTempInputs] = useState<Record<string, string>>({}); // Yoneticinin toplu girecegi adetler

  useEffect(() => {
    // LocalStorage veya store verilerini yükle
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }

    // Giriş yapan aktif kullanıcıyı bul
    const activeUser = localStorage.getItem("activeUser");
    if (activeUser) {
      const parsed = JSON.parse(activeUser);
      setUserRole(parsed.role || "waiter");
      setUserName(parsed.username || "mehmet_barista");
    }

    // State'e mock veriyi veya local kopyayı ata
    const savedStock = localStorage.getItem("degirmen_stock");
    const stockResetFlag = localStorage.getItem("degirmen_stock_reset_02");

    if (savedStock && stockResetFlag === "true") {
      setStockList(JSON.parse(savedStock));
    } else {
      setStockList(mockStockItems);
      localStorage.setItem("degirmen_stock", JSON.stringify(mockStockItems));
      localStorage.setItem("degirmen_stock_reset_02", "true");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  // Personelin depo çıkışı yapması (Stok Eksiltme)
  const handleDecreaseQuantity = (id: string) => {
    const updated = stockList.map(item => {
      if (item.id === id) {
        if (item.quantity <= 0) return item;
        const newQty = Number((item.quantity - 1).toFixed(1));
        const newAlinan = Number((item.depodanAlinan + 1).toFixed(1));
        
        // Log tablosuna depo çıkış hareketi ekle
        const newMove: StockMovement = {
          id: "m_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
          productId: item.id,
          productName: item.name,
          category: item.category,
          quantity: 1,
          unit: item.unit,
          user: userName,
          date: new Date().toISOString().split("T")[0],
          month: new Date().toISOString().split("T")[0].substring(0, 7)
        };

        const currentMovements = localStorage.getItem("degirmen_movements");
        const list: StockMovement[] = currentMovements ? JSON.parse(currentMovements) : mockStockMovements;
        list.push(newMove);
        localStorage.setItem("degirmen_movements", JSON.stringify(list));

        return { ...item, quantity: newQty, depodanAlinan: newAlinan };
      }
      return item;
    });

    setStockList(updated);
    localStorage.setItem("degirmen_stock", JSON.stringify(updated));
  };

  // Yöneticinin Depoda Bulunan Toplam Adeti/Miktarı Güncellemesi (Stok Girişi)
  const handleSaveBulkQuantity = (id: string) => {
    const bulkValue = tempInputs[id];
    if (bulkValue === undefined || bulkValue === "") return;

    const newDepodaBulunan = Number(parseFloat(bulkValue).toFixed(1));
    if (isNaN(newDepodaBulunan) || newDepodaBulunan < 0) return;

    const updated = stockList.map(item => {
      if (item.id === id) {
        // Yeni Kalan = Yeni Depoda Bulunan - Mevcut Depodan Alınan
        const newQty = Math.max(0, Number((newDepodaBulunan - item.depodanAlinan).toFixed(1)));
        return { 
          ...item, 
          depodaBulunan: newDepodaBulunan,
          quantity: newQty 
        };
      }
      return item;
    });

    setStockList(updated);
    localStorage.setItem("degirmen_stock", JSON.stringify(updated));
    
    // İnputu temizle
    setTempInputs(prev => ({ ...prev, [id]: "" }));
  };

  const filteredStock = stockList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === "Tümü" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const criticalCount = stockList.filter(item => item.quantity <= item.minLimit).length;

  const categories = [
    "Tümü",
    "Çay Ve Bitki Çayları",
    "Kahveler",
    "Şuruplar",
    "Soslar",
    "Püreler",
    "Toz Grubu",
    "Ek Ürünler",
    "Litrelik Ürünler",
    "Yan Ürünler"
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* Üst Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (selectedCategory) {
                setSelectedCategory(null);
              } else {
                window.location.href = "/dashboard";
              }
            }}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer mr-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 flex items-center justify-center">
            <img src="/logo.png" alt="Değirmen Cafe Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">
              {selectedCategory ? `${selectedCategory} Envanteri` : "Stok Kategorileri"}
            </h1>
            <p className="text-xs text-zinc-500">Değirmen Cafe | Rol: <span className="font-bold text-orange-500 uppercase">{userRole}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-4">
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

          <button 
            onClick={() => window.location.href = "/"}
            className="p-2 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
            title="Çıkış Yap"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Ana Gövde */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-8 flex flex-col justify-center">
        
        {/* Karşılama ve Arama */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card)]/50 border border-[var(--border)] rounded-3xl p-6 backdrop-blur-sm">
          <div>
            <h2 className="text-xl font-bold">
              {selectedCategory ? `${selectedCategory} Listesi` : "Kategori Seçimi"}
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {userRole === "admin" 
                ? "Yönetici Yetkisi: Depodaki toplam miktarı girip kaydedin." 
                : "Barista Yetkisi: Depodan aldığınız ürünleri düşürün."}
            </p>
          </div>
          
          {selectedCategory && (
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Bu kategoride ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          )}
        </div>

        {/* EKRAN 1: KATEGORİ SEÇİM EKRANI */}
        {!selectedCategory ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center py-4">
            {categories.map((category) => (
              <div 
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="custom-border-card"
                style={{
                  boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)"
                }}
              >
                <svg className="custom-card-border-svg">
                  <rect style={{ stroke: "rgba(255, 255, 255, 0.15)", strokeDashoffset: "1000" }} />
                </svg>

                <div className="card-logo flex flex-col items-center justify-center text-center px-6">
                  <span className="text-sm font-extrabold tracking-wide text-zinc-300 leading-tight">
                    {category}
                  </span>
                </div>

                <div className="card-text flex flex-col items-center gap-1.5">
                  <span className="text-orange-500 text-[10px] font-bold uppercase tracking-wider">İçeriği Gör</span>
                  <span className="text-white text-xs font-semibold leading-tight">{category}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* EKRAN 2: SEÇİLİ KATEGORİYE AİT ÜRÜN LİSTESİ */
          <div className="space-y-6 animate-fadeIn">
            <div className="flex">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery("");
                }}
                className="px-4 py-2 text-xs font-bold border border-[var(--border)] rounded-xl bg-[var(--card)] hover:bg-[var(--foreground)]/5 transition-all cursor-pointer flex items-center gap-2"
              >
                ← Kategorilere Geri Dön
              </button>
            </div>

            {filteredStock.length === 0 ? (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-12 text-center text-zinc-500">
                Bu kategoride ürün bulunamadı.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStock.map((item) => {
                  const isCritical = item.quantity <= item.minLimit;
                  return (
                    <div 
                      key={item.id}
                      className={`bg-[var(--card)] border rounded-3xl p-5 shadow-sm transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                        isCritical 
                          ? "border-red-500/30 bg-red-500/[0.02]" 
                          : "border-[var(--border)]"
                      }`}
                    >
                      {isCritical && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 text-[9px] font-bold rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Kritik Limit
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">
                            {item.category}
                          </span>
                          {item.weightInfo && (
                            <span className="text-[9px] bg-zinc-500/10 text-zinc-400 px-2 py-0.5 rounded font-black border border-zinc-500/10">
                              {item.weightInfo}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-base tracking-tight pr-16">{item.name}</h4>
                      </div>

                      {/* Bilgi Grid Alanı */}
                      <div className="grid grid-cols-3 gap-2 mt-4 text-center bg-[var(--background)] p-3 rounded-2xl border border-[var(--border)]">
                        <div>
                          <span className="text-[9px] text-zinc-500 block uppercase">Depoda</span>
                          <span className="text-sm font-bold text-zinc-300">{item.depodaBulunan}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-500 block uppercase">Alınan</span>
                          <span className="text-sm font-bold text-orange-500">{item.depodanAlinan}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-500 block uppercase font-bold text-emerald-500">Kalan</span>
                          <span className={`text-sm font-bold ${isCritical ? "text-red-500 font-extrabold" : "text-emerald-500"}`}>
                            {item.quantity}
                          </span>
                        </div>
                      </div>

                      {/* İşlem Kontrolleri */}
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border)]/60 gap-4">
                        <div>
                          <span className="text-[9px] text-zinc-500 block">Birim</span>
                          <span className="text-xs font-semibold text-zinc-400">{item.unit}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* YÖNETİCİ GİRİŞİ: Depodaki Toplam Adeti Güncelleme */}
                          {userRole === "admin" && (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                placeholder="Adet"
                                value={tempInputs[item.id] || ""}
                                onChange={(e) => setTempInputs({ ...tempInputs, [item.id]: e.target.value })}
                                className="w-16 px-2 py-1 text-xs text-center border border-[var(--border)] bg-[var(--background)] rounded-xl focus:outline-none"
                              />
                              <button
                                onClick={() => handleSaveBulkQuantity(item.id)}
                                className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white transition-colors cursor-pointer border border-emerald-500/20"
                                title="Depo Toplamını Güncelle"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* KULLANICI / BARISTA GİRİŞİ: Stok Düşürme */}
                          <button
                            onClick={() => handleDecreaseQuantity(item.id)}
                            disabled={item.quantity <= 0}
                            className="h-9 px-3.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                            title="1 Adet Düş"
                          >
                            <Minus className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">1 Düş</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
