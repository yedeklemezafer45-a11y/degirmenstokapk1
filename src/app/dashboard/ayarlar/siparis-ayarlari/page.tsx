"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Moon, 
  Sun, 
  LogOut, 
  Search, 
  Save, 
  Loader2, 
  CheckSquare,
  Square,
  AlertTriangle,
  ShoppingCart,
  CheckCircle2
} from "lucide-react";
import { subscribeToStocks, saveAllStocks } from "@/lib/stockService";
import { StockItem } from "@/lib/stockStore";
import { useRouter } from "next/navigation";

export default function SiparisAyarlariPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [userRole, setUserRole] = useState<string>("waiter");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Bölge State'leri
  const [selectedRegion, setSelectedRegion] = useState("degirmen-kafe");
  const [selectedRegionName, setSelectedRegionName] = useState("Değirmen Kafe");

  // Toast Bildirim
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }

    const activeUser = sessionStorage.getItem("activeUser");
    let activeRegion = "degirmen-kafe";
    if (activeUser) {
      const parsed = JSON.parse(activeUser);
      setUserRole(parsed.role || "waiter");
      if (parsed.role !== "admin" && parsed.role !== "yonetici") {
        window.location.href = "/dashboard";
        return;
      }
      const reg = parsed.selectedRegion || "degirmen-kafe";
      activeRegion = reg;
      setSelectedRegion(reg);
      setSelectedRegionName(parsed.selectedRegionName || "Değirmen Kafe");
    } else {
      window.location.href = "/";
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToStocks(
      activeRegion,
      (items) => {
        setStockList(items);
        setIsLoading(false);
      },
      () => {
        triggerToast("Stoklar yüklenirken hata oluştu!");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  // Sipariş verilebilir durumunu tersine çevir
  const handleToggleOrderable = (itemId: string) => {
    setStockList(prev => prev.map(item => {
      if (item.id === itemId) {
        const currentVal = item.orderable !== false; // Tanımsızsa varsayılan true
        return {
          ...item,
          orderable: !currentVal
        };
      }
      return item;
    }));
    setIsDirty(true);
  };

  // Tümünü Seç / Kaldır
  const handleSelectAll = (select: boolean) => {
    setStockList(prev => prev.map(item => ({
      ...item,
      orderable: select
    })));
    setIsDirty(true);
    triggerToast(select ? "Tüm ürünler siparişe açıldı." : "Tüm ürünlerin sipariş yetkisi kapatıldı.");
  };

  // Değişiklikleri Veritabanına Kaydet
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await saveAllStocks(selectedRegion, stockList);
      setIsDirty(false);
      triggerToast("✅ Sipariş ayarları bulut veritabanına kaydedildi!");
    } catch (err) {
      console.error("Kaydetme hatası:", err);
      triggerToast("Ayarlar kaydedilirken hata oluştu!");
    } finally {
      setIsSaving(false);
    }
  };

  const categories = ["Tümü", ...Array.from(new Set(stockList.map(i => i.category)))];

  const filteredStock = stockList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Tümü" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/dashboard/ayarlar")}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer mr-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 flex items-center justify-center">
            <img src="/logo.png" alt="Değirmen Cafe Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Sipariş Menüsü Ayarları</h1>
            <p className="text-xs text-zinc-500">{selectedRegionName} · Personel Sipariş Menüsü Ürünleri</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer">
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => router.push("/")} className="p-2 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer" title="Çıkış Yap">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6 pb-24">
        
        {/* Arama & Filtreleme & Hızlı İşlemler */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-4 shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text"
              placeholder="Ürün adı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-[var(--foreground)] placeholder-zinc-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
            <button
              onClick={() => handleSelectAll(true)}
              className="flex items-center gap-1 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-extrabold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Tümünü Siparişe Aç
            </button>
            <button
              onClick={() => handleSelectAll(false)}
              className="flex items-center gap-1 px-3 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 text-[10px] font-extrabold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
            >
              <Square className="w-3.5 h-3.5" />
              Tümünü Kapat
            </button>
          </div>
        </div>

        {/* Kategori Filtresi */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === cat 
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" 
                  : "bg-[var(--card)] border border-[var(--border)] text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {cat.replace("Ve Bitki Çayları", "").replace("Çeşitleri", "")}
            </button>
          ))}
        </div>

        {/* Kaydet Barı */}
        {isDirty && (
          <div className="fixed bottom-6 right-6 z-50 bg-amber-500 border border-amber-600/40 text-zinc-950 px-5 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-slideUp">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-zinc-950" />
              <span className="text-xs font-black uppercase tracking-wider">Kaydedilmemiş Değişiklikler Var!</span>
            </div>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-950 text-white font-extrabold rounded-xl text-xs hover:bg-zinc-900 transition-all cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Buluta Kaydet
            </button>
          </div>
        )}

        {/* Ürünler Listesi */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-6 shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
              <span className="text-xs text-zinc-500 font-bold">Stoklar yükleniyor...</span>
            </div>
          ) : filteredStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
              <AlertTriangle className="w-12 h-12 text-zinc-600" />
              <span className="text-sm font-bold text-zinc-400">Ürün bulunamadı.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStock.map((item) => {
                const isOrderable = item.orderable !== false;
                return (
                  <div 
                    key={item.id}
                    onClick={() => handleToggleOrderable(item.id)}
                    className={`p-4 rounded-3xl border transition-all duration-300 cursor-pointer flex items-center justify-between group ${
                      isOrderable 
                        ? "bg-orange-500/5 border-orange-500/25 text-orange-400" 
                        : "bg-[var(--background)]/40 border-[var(--border)] text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-black block group-hover:text-orange-400 transition-colors">
                        {item.name}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1 block">
                        {item.category} · {item.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">
                        {isOrderable ? "Sipariş Açık" : "Sipariş Kapalı"}
                      </span>
                      <div className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 ${
                        isOrderable ? "bg-orange-500 flex justify-end" : "bg-zinc-800 flex justify-start"
                      }`}>
                        <div className="w-5 h-5 rounded-full bg-white shadow-md"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-5 py-3 rounded-2xl text-xs font-bold shadow-xl backdrop-blur-md animate-slideUp flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

    </div>
  );
}
