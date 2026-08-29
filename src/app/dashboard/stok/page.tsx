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
import { updateActiveShiftDataEntry } from "@/lib/shiftService";

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
  const [isCorrectionMode, setIsCorrectionMode] = useState(false);
  const [tempDepoInputs, setTempDepoInputs] = useState<Record<string, string>>({});

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
      await updateActiveShiftDataEntry(selectedRegion, true);
      await logUserAction(
        "Depodan Ürün Alındı",
        "STOK",
        `"${item.name}" envanterinden 1 adet düşüldü. Yeni kalan: ${newQty} ${item.unit}`
      );
    } catch (err) {
      console.error("Düşürme hatası:", err);
    }
  };

  // Hatalı girişi düzeltmek için doğrudan alınan miktarı güncelleme
  const handleUpdateTakenQuantity = async (id: string) => {
    const item = stockList.find(i => i.id === id);
    if (!item) return;

    const inputVal = tempInputs[id];
    if (inputVal === undefined || inputVal === "") return;

    const newAlinan = Number(parseFloat(inputVal).toFixed(3));
    if (isNaN(newAlinan) || newAlinan < 0) {
      setToastMessage("⚠️ Geçersiz bir miktar girdiniz!");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const newQty = Math.max(0, Number((item.depodaBulunan - newAlinan).toFixed(3)));

    const updatedItem: StockItem = {
      ...item,
      depodanAlinan: newAlinan,
      quantity: newQty
    };

    try {
      await saveStockItem(selectedRegion, updatedItem);
      await logUserAction(
        "Alınan Miktar Düzeltildi",
        "STOK",
        `"${item.name}" için alınan miktar ${item.depodanAlinan} -> ${newAlinan} olarak düzeltildi. Yeni kalan: ${newQty} ${item.unit}`
      );
      setToastMessage("🔄 Alınan miktar güncellendi ve kalan stok hesaplandı!");
      setTimeout(() => setToastMessage(null), 3000);
      setTempInputs(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      console.error("Miktar güncelleme hatası:", err);
    }
  };

  // Hatalı girişi düzeltmek için depodaki toplam miktarı doğrudan güncelleme
  const handleUpdateDepoQuantity = async (id: string) => {
    const item = stockList.find(i => i.id === id);
    if (!item) return;

    const inputVal = tempDepoInputs[id];
    if (inputVal === undefined || inputVal === "") return;

    const newDepoda = Number(parseFloat(inputVal).toFixed(3));
    if (isNaN(newDepoda) || newDepoda < 0) {
      setToastMessage("⚠️ Geçersiz bir miktar girdiniz!");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const newQty = Math.max(0, Number((newDepoda - item.depodanAlinan).toFixed(3)));

    const updatedItem: StockItem = {
      ...item,
      depodaBulunan: newDepoda,
      quantity: newQty
    };

    try {
      await saveStockItem(selectedRegion, updatedItem);
      await logUserAction(
        "Depodaki Miktar Düzeltildi",
        "STOK",
        `"${item.name}" için depodaki toplam miktar ${item.depodaBulunan} -> ${newDepoda} olarak düzeltildi. Yeni kalan: ${newQty} ${item.unit}`
      );
      setToastMessage("🔄 Depo stok miktarı düzeltildi ve kalan hesaplandı!");
      setTimeout(() => setToastMessage(null), 3000);
      setTempDepoInputs(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      console.error("Depo güncelleme hatası:", err);
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

  const categories = ["Tümü", ...Array.from(new Set(displayedStockList.map(i => i.category))).sort((a, b) => a.localeCompare(b, "tr"))];

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

        {/* EKRAN 1: KATEGORİ SEÇİM EKRANI */}
        {!selectedCategory ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center py-4">
            {categories.map((category, idx) => {
              const isSteel = idx % 2 === 0;
              
              if (isSteel) {
                return (
                  <div 
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className="relative w-full max-w-[240px] h-[170px] bg-[#264653] hover:bg-[#345e70] dark:bg-[#1a3039] dark:hover:bg-[#203c48] rounded-3xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-[0_0_12px_rgba(231,111,81,0.12)] hover:shadow-[0_0_25px_rgba(231,111,81,0.45)] hover:-translate-y-1 select-none overflow-hidden group"
                  >
                    {/* Top-Left Cutout (Concave Corner for Arrow Button) */}
                    <div className="absolute top-0 left-0 w-12 h-12 bg-[var(--background)] rounded-br-[1.5rem] transition-colors duration-300">
                      <div className="absolute top-0 left-0 w-8 h-8 bg-[#264653] group-hover:bg-[#345e70] dark:bg-[#1a3039] dark:group-hover:bg-[#203c48] text-[#e76f51] flex items-center justify-center rounded-lg shadow-sm transition-colors duration-300">
                        <ArrowUpRight className="w-3.5 h-3.5 -rotate-90" />
                      </div>
                    </div>

                    {/* Bottom-Right Cutout (Concave Corner for Text Label) */}
                    <div className="absolute bottom-0 right-0 w-24 h-9 bg-[var(--background)] rounded-tl-[1.2rem] transition-colors duration-300">
                      <div className="absolute bottom-0 right-0 px-2 py-1.5 bg-[#264653] group-hover:bg-[#345e70] dark:bg-[#1a3039] dark:group-hover:bg-[#203c48] text-[8px] font-black uppercase text-[#e76f51] tracking-widest rounded-md transition-colors duration-300">
                        DEĞİRMEN
                      </div>
                    </div>

                    {/* Centered Menu Title */}
                    <div className="text-center z-10 px-3 mt-2">
                      <span className="text-sm sm:text-base font-black uppercase tracking-tighter text-[#e76f51] leading-tight block drop-shadow-sm truncate max-w-[160px]">
                        {category}
                      </span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div 
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className="relative w-full max-w-[240px] h-[170px] bg-[#e76f51] hover:bg-[#eb8870] dark:bg-[#a6442d] dark:hover:bg-[#c25137] rounded-3xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-[0_0_12px_rgba(231,111,81,0.12)] hover:shadow-[0_0_25px_rgba(231,111,81,0.45)] hover:-translate-y-1 select-none overflow-hidden group"
                  >
                    {/* Top-Right Cutout (Concave Corner for Arrow Button) */}
                    <div className="absolute top-0 right-0 w-12 h-12 bg-[var(--background)] rounded-bl-[1.5rem] transition-colors duration-300">
                      <div className="absolute top-0 right-0 w-8 h-8 bg-[#e76f51] group-hover:bg-[#eb8870] dark:bg-[#a6442d] dark:group-hover:bg-[#c25137] text-[#264653] dark:text-zinc-950 flex items-center justify-center rounded-lg shadow-sm transition-colors duration-300">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Bottom-Left Cutout (Concave Corner for Text Label) */}
                    <div className="absolute bottom-0 left-0 w-24 h-9 bg-[var(--background)] rounded-tr-[1.2rem] transition-colors duration-300">
                      <div className="absolute bottom-0 left-0 px-2 py-1 bg-[#e76f51] group-hover:bg-[#eb8870] dark:bg-[#a6442d] dark:group-hover:bg-[#c25137] text-[8px] font-black uppercase text-[#264653] dark:text-zinc-950 tracking-widest rounded-md transition-colors duration-300">
                        CAFE
                      </div>
                    </div>

                    {/* Centered Menu Title */}
                    <div className="text-center z-10 px-3 mt-2">
                      <span className="text-sm sm:text-base font-black uppercase tracking-tighter text-[#264653] dark:text-zinc-950 leading-tight block drop-shadow-sm truncate max-w-[160px]">
                        {category}
                      </span>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        ) : (
          /* EKRAN 2: SEÇİLİ KATEGORİYE AİT ÜRÜN LİSTESİ */
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery("");
                  setIsCorrectionMode(false);
                }}
                className="px-4 py-2 text-xs font-bold border border-[var(--border)] rounded-xl bg-[var(--card)] hover:bg-[var(--foreground)]/5 transition-all cursor-pointer flex items-center gap-2"
              >
                ← Kategorilere Geri Dön
              </button>

              {/* Düzeltme Modu Aktivasyon Butonu */}
              <div className="flex items-center gap-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-2 shadow-sm shrink-0">
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Hatalı Giriş Düzeltme</span>
                <button
                  onClick={() => setIsCorrectionMode(!isCorrectionMode)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                    isCorrectionMode 
                      ? "bg-[#e76f51] text-[#264653] shadow-md animate-pulse" 
                      : "bg-[var(--background)] border border-[var(--border)] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {isCorrectionMode ? "AÇIK (Düzeltme)" : "KAPALI"}
                </button>
              </div>
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
                          {isCorrectionMode ? (
                            <div className="flex items-center justify-center gap-1 mt-0.5">
                              <input
                                type="number"
                                value={tempDepoInputs[item.id] !== undefined ? tempDepoInputs[item.id] : item.depodaBulunan}
                                onChange={(e) => setTempDepoInputs({ ...tempDepoInputs, [item.id]: e.target.value })}
                                className="w-12 px-1 py-0.5 text-[10px] text-center border border-emerald-500/50 bg-[var(--background)] rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                              />
                              <button
                                onClick={() => handleUpdateDepoQuantity(item.id)}
                                className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                                title="Değeri Kaydet"
                              >
                                <Check className="w-3 h-3 text-zinc-950" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-zinc-300">{item.depodaBulunan}</span>
                          )}
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-500 block uppercase">Alınan</span>
                          {isCorrectionMode ? (
                            <div className="flex items-center justify-center gap-1 mt-0.5">
                              <input
                                type="number"
                                value={tempInputs[item.id] !== undefined ? tempInputs[item.id] : item.depodanAlinan}
                                onChange={(e) => setTempInputs({ ...tempInputs, [item.id]: e.target.value })}
                                className="w-12 px-1 py-0.5 text-[10px] text-center border border-orange-500/50 bg-[var(--background)] rounded focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold"
                              />
                              <button
                                onClick={() => handleUpdateTakenQuantity(item.id)}
                                className="p-1 rounded bg-orange-500 text-white hover:bg-orange-600 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                                title="Değeri Kaydet"
                              >
                                <Check className="w-3 h-3 text-zinc-950" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-orange-500">{item.depodanAlinan}</span>
                          )}
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
                          {(userRole === "admin" || userRole === "yonetici") && (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                placeholder="+ Ekle"
                                value={tempInputs[item.id] || ""}
                                onChange={(e) => setTempInputs({ ...tempInputs, [item.id]: e.target.value })}
                                className="w-16 px-2 py-1 text-xs text-center border border-[var(--border)] bg-[var(--background)] rounded-xl focus:outline-none"
                              />
                              <button
                                onClick={() => handleSaveBulkQuantity(item.id)}
                                className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white transition-colors cursor-pointer border border-emerald-500/20"
                                title="Stoka İlave Et"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* KULLANICI / BARISTA GİRİŞİ: Stok Düşürme veya Düzeltme */}
                          {isCorrectionMode ? (
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-3 py-2 rounded-xl border border-orange-500/20">
                              Düzeltme Aktif
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDecreaseQuantity(item.id)}
                              disabled={item.quantity <= 0}
                              className="h-9 px-3.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                              title="1 Adet Düş"
                            >
                              <Minus className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold">1 Düş</span>
                            </button>
                          )}
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
