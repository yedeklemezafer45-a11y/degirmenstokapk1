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
  Check,
  ArrowUpRight,
  Share2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { StockItem, isProductAllowedForRegion } from "@/lib/stockStore";
import { subscribeToStocks, saveStockItem } from "@/lib/stockService";
import { logUserAction } from "@/lib/auditLogService";

export default function StokPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("waiter"); // Varsayılan personel
  const [userName, setUserName] = useState<string>("mehmet_barista");
  const [tempInputs, setTempInputs] = useState<Record<string, string>>({}); // Yoneticinin toplu girecegi adetler
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState("degirmen-kafe");
  const [selectedRegionName, setSelectedRegionName] = useState("Değirmen Kafe");

  const handleSharePage = async () => {
    const shareData = {
      title: "Değirmen Envanter",
      text: "Değirmen Kafe Stok ve Envanter Yönetim Paneli",
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setToastMessage("Kopyalandı! Sayfa linkini dilediğiniz yerde paylaşabilirsiniz. 📋");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setToastMessage("Kopyalandı! Sayfa linkini dilediğiniz yerde paylaşabilirsiniz. 📋");
        setTimeout(() => setToastMessage(null), 3000);
      } catch (copyErr) {
        console.error("Paylaşım hatası:", copyErr);
      }
    }
  };

  useEffect(() => {
    // LocalStorage veya store verilerini yükle
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }

    // Giriş yapan aktif kullanıcıyı bul
    const activeUser = sessionStorage.getItem("activeUser");
    let activeRegion = "degirmen-kafe";
    if (activeUser) {
      const parsed = JSON.parse(activeUser);
      setUserRole(parsed.role || "waiter");
      setUserName(parsed.username || "mehmet_barista");
      const reg = parsed.selectedRegion || "degirmen-kafe";
      activeRegion = reg;
      setSelectedRegion(reg);
      setSelectedRegionName(parsed.selectedRegionName || "Değirmen Kafe");
    }

    // Gerçek zamanlı Firestore dinleyicisi
    const unsubscribe = subscribeToStocks(activeRegion, (items) => {
      setStockList(items);
    });

    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  // Personelin depo çıkışı yapması (Stok Eksiltme)
  const handleDecreaseQuantity = async (id: string) => {
    const item = stockList.find(i => i.id === id);
    if (!item || item.quantity <= 0) return;

    const newQty = Number((item.quantity - 1).toFixed(3));
    const newAlinan = Number((item.depodanAlinan + 1).toFixed(3));

    const updatedItem: StockItem = {
      ...item,
      quantity: newQty,
      depodanAlinan: newAlinan
    };

    try {
      await saveStockItem(selectedRegion, updatedItem);
      await logUserAction(
        "Depodan Ürün Alındı",
        "STOK",
        `"${item.name}" envanterinden 1 adet düşüldü. Yeni kalan: ${newQty} ${item.unit}`
      );
    } catch (err) {
      console.error("Düşürme hatası:", err);
    }
  };

  // Yöneticinin Depoda Bulunan Toplam Adeti/Miktarı Güncellemesi (Stok İlavesi)
  const handleSaveBulkQuantity = async (id: string) => {
    const bulkValue = tempInputs[id];
    if (bulkValue === undefined || bulkValue === "") return;

    const addedQty = Number(parseFloat(bulkValue).toFixed(3));
    if (isNaN(addedQty) || addedQty <= 0) return;

    const item = stockList.find(i => i.id === id);
    if (!item) return;

    const newDepodaBulunan = Number((item.depodaBulunan + addedQty).toFixed(3));
    const newQty = Math.max(0, Number((newDepodaBulunan - item.depodanAlinan).toFixed(3)));
    
    const updatedItem: StockItem = {
      ...item,
      depodaBulunan: newDepodaBulunan,
      quantity: newQty
    };

    try {
      await saveStockItem(selectedRegion, updatedItem);
      setTempInputs(prev => ({ ...prev, [id]: "" }));
      await logUserAction(
        "Stoka İlave Yapıldı",
        "STOK",
        `"${item.name}" stoğuna ${addedQty} ${item.unit} ilave edildi. Toplam Depoda: ${newDepodaBulunan}, Yeni Kalan: ${newQty} ${item.unit}`
      );
    } catch (err) {
      console.error("Giriş hatası:", err);
    }
  };

  const displayedStockList = stockList.filter(item => {
    if (selectedRegion === "degirmen-kafe" && (item.category === "Soft İçecek Ürünleri" || item.category === "Pastalar")) {
      return false;
    }
    return isProductAllowedForRegion(selectedRegion, item);
  });

  const filteredStock = displayedStockList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === "Tümü" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const criticalCount = displayedStockList.filter(item => item.quantity <= item.minLimit).length;

  const categories = ["Tümü", ...Array.from(new Set(displayedStockList.map(i => i.category)))];

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
                router.push("/dashboard");
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
            <p className="text-xs text-zinc-500">{selectedRegionName} | Rol: <span className="font-bold text-orange-500 uppercase">{userRole}</span></p>
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
            onClick={handleSharePage}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-orange-500 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            title="Sayfayı Paylaş"
          >
            <Share2 className="w-5 h-5" />
          </button>

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

        {!selectedCategory ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center py-4">
            {categories.map((category) => (
              <div 
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="relative w-full max-w-[240px] bg-zinc-950/85 border border-zinc-800 hover:border-zinc-700/80 rounded-[2rem] p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.5)] hover:-translate-y-1 select-none group animate-fadeIn"
              >
                {/* Floating Top-Right Notched Badge */}
                <span className="absolute -top-2.5 right-5 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[7px] font-black uppercase tracking-widest text-zinc-400 shadow-md">
                  KATEGORİ
                </span>

                {/* Header: Icon Box & Brand */}
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-orange-500/10 text-orange-400 shadow-inner">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none">STOK</span>
                  </div>
                </div>

                {/* Body Title */}
                <div className="mt-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight leading-tight group-hover:text-orange-400 transition-colors duration-300">
                    {category}
                  </h3>
                </div>

                {/* Footer Content */}
                <div className="flex items-center justify-between mt-4 gap-2 pt-2 border-t border-zinc-900/60">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">
                    Ürünleri Gör
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
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
                      className={`relative w-full bg-zinc-950/85 border rounded-[2rem] p-6 flex flex-col justify-between transition-all duration-300 shadow-[0_12px_36px_rgba(0,0,0,0.6)] hover:-translate-y-1 select-none group ${
                        isCritical ? "border-red-500/30" : "border-zinc-800 hover:border-zinc-700/80"
                      }`}
                    >
                      {/* Floating Top-Right Notched Badge */}
                      <span className={`absolute -top-3 right-6 px-3 py-1 bg-zinc-900 border rounded-full text-[8px] font-black uppercase tracking-widest shadow-md ${
                        isCritical ? "border-red-500/30 text-red-400" : "border-zinc-800 text-zinc-400"
                      }`}>
                        {isCritical ? "LİMİT ALTI" : "NORMAL"}
                      </span>

                      {/* Header: Icon Box & Brand */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
                            isCritical ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                          }`}>
                            <Package className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">
                                {item.category}
                              </span>
                              <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
                                <Check className="w-1.5 h-1.5 text-white" strokeWidth={3} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {item.weightInfo && (
                          <span className="text-[8px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-black">
                            {item.weightInfo}
                          </span>
                        )}
                      </div>

                      {/* Body Title */}
                      <div className="mt-4">
                        <h4 className="text-sm font-black text-white uppercase tracking-tight leading-tight truncate">
                          {item.name}
                        </h4>
                      </div>

                      {/* Body Metrics Grid */}
                      <div className="grid grid-cols-3 gap-1 py-3 my-2 border-t border-b border-zinc-900/80 text-center bg-zinc-950/40 rounded-xl px-1">
                        <div>
                          <div className="text-[7px] text-zinc-500 uppercase font-black tracking-wider">Depoda</div>
                          <div className="text-xs font-bold text-zinc-300 mt-1">{item.depodaBulunan}</div>
                        </div>
                        <div className="border-l border-zinc-900/80">
                          <div className="text-[7px] text-zinc-500 uppercase font-black tracking-wider">Alınan</div>
                          <div className="text-xs font-bold text-orange-500 mt-1">{item.depodanAlinan}</div>
                        </div>
                        <div className="border-l border-zinc-900/80">
                          <div className="text-[7px] text-zinc-500 uppercase font-black tracking-wider">Kalan</div>
                          <div className={`text-xs font-bold mt-1 ${isCritical ? "text-red-500 font-black animate-pulse" : "text-emerald-500"}`}>{item.quantity}</div>
                        </div>
                      </div>

                      {/* Footer Content: Description & CTA Buttons */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-900/60 gap-4">
                        <div>
                          <span className="text-[8px] text-zinc-500 block">BİRİM</span>
                          <span className="text-[10px] font-black uppercase text-zinc-400">{item.unit}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* YÖNETİCİ GİRİŞİ: Depodaki Toplam Adeti Güncelleme */}
                          {(userRole === "admin" || userRole === "yonetici") && (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                placeholder="+ Ekle"
                                value={tempInputs[item.id] || ""}
                                onChange={(e) => setTempInputs({ ...tempInputs, [item.id]: e.target.value })}
                                className="w-12 px-2 py-1 text-[10px] text-center border border-zinc-800 bg-zinc-900 rounded-lg text-white focus:outline-none"
                              />
                              <button
                                onClick={() => handleSaveBulkQuantity(item.id)}
                                className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-zinc-950 transition-colors cursor-pointer border border-emerald-500/20"
                                title="Stoka İlave Et"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* KULLANICI / BARISTA GİRİŞİ: Stok Düşürme */}
                          <button
                            onClick={() => handleDecreaseQuantity(item.id)}
                            disabled={item.quantity <= 0}
                            className="h-8 px-3 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-zinc-950 transition-all duration-300 hover:scale-[1.03] cursor-pointer flex items-center gap-1 disabled:opacity-40"
                            title="1 Adet Düş"
                          >
                            <Minus className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase">1 Düş</span>
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

      {/* Toast Bildirim */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-5 py-3 rounded-2xl text-xs font-bold shadow-xl backdrop-blur-md animate-slideUp">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
