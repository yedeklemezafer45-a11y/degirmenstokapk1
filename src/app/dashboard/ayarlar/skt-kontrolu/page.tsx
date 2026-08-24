"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Moon, 
  Sun, 
  LogOut, 
  Search, 
  Save, 
  Undo2,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Clock
} from "lucide-react";
import { StockItem, isProductAllowedForRegion } from "@/lib/stockStore";
import { subscribeToStocks, saveAllStocks } from "@/lib/stockService";
import { logUserAction } from "@/lib/auditLogService";

export default function SktKontroluPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [userRole, setUserRole] = useState<string>("waiter");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [isDirty, setIsDirty] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("degirmen-kafe");
  const [selectedRegionName, setSelectedRegionName] = useState("Değirmen Kafe");

  // SKT Tarihleri Draft State (ID -> YYYY-MM-DD)
  const [sktValues, setSktValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Toast Bildirim State
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

    // Rol Kontrolü (Sadece yetkili personel girebilir)
    const activeUser = sessionStorage.getItem("activeUser");
    let activeRegion = "degirmen-kafe";
    if (activeUser) {
      const parsed = JSON.parse(activeUser);
      setUserRole(parsed.role || "waiter");
      if (parsed.role !== "admin" && parsed.role !== "yonetici") {
        window.location.href = "/dashboard";
      }
      const reg = parsed.selectedRegion || "degirmen-kafe";
      activeRegion = reg;
      setSelectedRegion(reg);
      setSelectedRegionName(parsed.selectedRegionName || "Değirmen Kafe");
    } else {
      window.location.href = "/";
    }

    // Gerçek zamanlı Firestore dinleyicisi
    setIsLoading(true);
    const unsubscribe = subscribeToStocks(
      activeRegion,
      (items) => {
        setStockList(items);
        const initialSkt: Record<string, string> = {};
        items.forEach(item => {
          initialSkt[item.id] = item.expDate || "";
        });
        setSktValues(initialSkt);
        setIsLoading(false);
      },
      () => {
        triggerToast("Stok verileri yüklenemedi!");
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

  const handleSktChange = (id: string, dateStr: string) => {
    setSktValues(prev => ({
      ...prev,
      [id]: dateStr
    }));
    setIsDirty(true);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const updatedStock = stockList.map(item => ({
        ...item,
        expDate: sktValues[item.id] || undefined
      }));

      await saveAllStocks(selectedRegion, updatedStock);
      setIsDirty(false);
      triggerToast("SKT Son Tüketim Tarihleri başarıyla güncellendi!");
      await logUserAction("SKT Tarihleri Güncellendi", "STOK", "Ürünlerin Son Tüketim Tarihleri toplu olarak güncellendi.");
    } catch {
      triggerToast("Kaydedilirken hata oluştu!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelChanges = () => {
    const initialSkt: Record<string, string> = {};
    stockList.forEach(item => {
      initialSkt[item.id] = item.expDate || "";
    });
    setSktValues(initialSkt);
    setIsDirty(false);
    triggerToast("Değişiklikler geri alındı.");
  };

  const displayedStockList = stockList.filter(item => {
    if (selectedRegion === "degirmen-kafe" && (item.category === "Soft İçecek Ürünleri" || item.category === "Pastalar")) {
      return false;
    }
    return isProductAllowedForRegion(selectedRegion, item);
  });

  const categories = ["Tümü", ...Array.from(new Set(displayedStockList.map(i => i.category)))];

  // Filtreler
  const filteredStock = displayedStockList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Tümü" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Tarih Kalan Gün Hesaplama ve Durum Etiketi
  const getSktStatus = (dateStr: string) => {
    if (!dateStr) return { label: "Tarih Girilmemiş", color: "text-zinc-400 bg-zinc-500/10", icon: null };

    const today = new Date();
    today.setHours(0,0,0,0);
    const exp = new Date(dateStr);
    exp.setHours(0,0,0,0);

    const timeDiff = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return { 
        label: `Tarihi Geçti (${Math.abs(diffDays)} Gün Önce)`, 
        color: "text-red-500 bg-red-500/10 border-red-500/20 font-black animate-pulse", 
        icon: AlertTriangle 
      };
    } else if (diffDays <= 30) {
      return { 
        label: `Kritik: ${diffDays} Gün Kaldı`, 
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20 font-extrabold", 
        icon: Clock 
      };
    } else {
      return { 
        label: `${diffDays} Gün Kaldı (Güvenli)`, 
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/10", 
        icon: null 
      };
    }
  };

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
            <h1 className="font-bold text-lg tracking-tight">SKT Takip Kontrol Paneli</h1>
            <p className="text-xs text-zinc-500">{selectedRegionName} · Son Tüketim Tarihi Girişleri</p>
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
            onClick={() => window.location.href = "/"}
            className="p-2 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
            title="Çıkış Yap"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Gövde */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 pb-32">
        
        {/* Toast Bildirimi */}
        {showToast && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-orange-600 text-white px-5 py-3 rounded-2xl shadow-xl animate-bounce">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Bilgilendirme ve Filtre Barı */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-bold">Hammadde SKT Yönetimi</h2>
            <p className="text-xs text-zinc-500 max-w-xl">
              Depodaki ürünlerin son tüketim tarihlerini girin. Son 30 günün altına inen ürünler sistem genelinde tüm barda uyarı olarak verilecektir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text"
                placeholder="Ürün ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 w-full"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tablo listesi */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Kategori / Ürün Adı</th>
                  <th className="py-3 px-4">Paket Bilgisi</th>
                  <th className="py-3 px-4 text-center">Son Tüketim Tarihi (SKT)</th>
                  <th className="py-3 px-4 text-right">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/40 text-xs">
                {filteredStock.map((item) => {
                  const currentVal = sktValues[item.id] || "";
                  const status = getSktStatus(currentVal);
                  const StatusIcon = status.icon;

                  return (
                    <tr key={item.id} className="hover:bg-[var(--background)]/35">
                      <td className="py-4 px-4">
                        <div className="font-bold text-zinc-800 dark:text-zinc-200">{item.name}</div>
                        <div className="text-[9px] text-zinc-500 font-semibold uppercase">{item.category}</div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-zinc-500">
                        {item.weightInfo || "1.000 kg"}
                      </td>
                      
                      {/* Tarih Seçici Girişi */}
                      <td className="py-4 px-4 text-center">
                        <input 
                          type="date"
                          value={currentVal}
                          onChange={(e) => handleSktChange(item.id, e.target.value)}
                          className="bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2 text-center text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold dark:text-zinc-100"
                        />
                      </td>

                      {/* Durum Rozeti */}
                      <td className="py-4 px-4 text-right">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[10px] font-black ${status.color}`}>
                          {StatusIcon && <StatusIcon className="w-3.5 h-3.5 shrink-0" />}
                          {status.label}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredStock.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-zinc-500">
                      Uyarılara uygun ürün bulunmamaktadır.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* HAFIZADA TUTULAN DÜZENLEME DURUMU BAR */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1e293b] border border-orange-500/30 text-white rounded-2xl px-6 py-4 flex items-center gap-6 shadow-2xl animate-slideUp">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold">Kaydedilmemiş SKT Değişiklikleri Var!</span>
              <span className="text-[10px] text-zinc-400">Verilerin kaydedilmesi için değişiklikleri onaylayın.</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCancelChanges}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" /> Geri Al
            </button>
            <button 
              onClick={handleSaveChanges}
              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors shadow-lg shadow-orange-600/20"
            >
              <Save className="w-3.5 h-3.5" /> Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-[var(--border)] bg-[var(--card)] py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
        <div>
          <span>© 2026 Değirmen Cafe. Tüm hakları saklıdır.</span>
        </div>
      </footer>

    </div>
  );
}
