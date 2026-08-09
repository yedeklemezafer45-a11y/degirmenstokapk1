"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Moon, 
  Sun, 
  LogOut, 
  Search, 
  Save, 
  AlertCircle,
  Undo2,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Scale,
  Loader2,
  CheckSquare,
  Square,
  Check
} from "lucide-react";
import { StockItem } from "@/lib/stockStore";
import { getAllStocks, saveAllStocks } from "@/lib/stockService";
import { saveReport, MonthlyReportArchive } from "@/lib/reportService";
import { logUserAction } from "@/lib/auditLogService";
import UserProfileWidget from "@/components/UserProfileWidget";

export default function StokSayimPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [userRole, setUserRole] = useState<string>("waiter");
  const [isDirty, setIsDirty] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Sayılan Adet Girişleri (Draft State)
  const [sayilanValues, setSayilanValues] = useState<Record<string, string>>({});
  // Açıkta olan Gramaj / Miktar Girişleri (Draft State)
  const [aciktaValues, setAciktaValues] = useState<Record<string, string>>({});
  
  // İşlem Yapılan / Onaylanan Ürünlerin ID Listesi
  const [checkedItemIds, setCheckedItemIds] = useState<Record<string, boolean>>({});

  // Yetkili Karşılaştırma Raporu (Sadece admin/yonetici görecek)
  const [showReport, setShowReport] = useState(false);

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

    const activeUser = localStorage.getItem("activeUser");
    if (activeUser) {
      const parsed = JSON.parse(activeUser);
      setUserRole(parsed.role || "waiter");
    }

    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const fetchedStocks = await getAllStocks();
      setStockList(fetchedStocks);

      const initialSayilan: Record<string, string> = {};
      const initialAcikta: Record<string, string> = {};

      fetchedStocks.forEach(item => {
        initialSayilan[item.id] = String(item.quantity || 0);
        initialAcikta[item.id] = "0";
      });

      setSayilanValues(initialSayilan);
      setAciktaValues(initialAcikta);

      // Kayıtlı olan onaylı ürün işaretlerini yükle
      const savedChecked = localStorage.getItem("degirmen_sayim_checked_ids");
      if (savedChecked) {
        setCheckedItemIds(JSON.parse(savedChecked));
      }
    } catch (err) {
      console.error("Stok yükleme hatası:", err);
      triggerToast("Stoklar yüklenirken hata oluştu!");
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

  // Ürünün Litrelik veya Sıvı Olup Olmadığını Kontrol Etme
  const isLiquidItem = (item: StockItem) => {
    return (
      item.category === "Litrelik Ürünler" || 
      item.unit?.toLowerCase() === "litre" || 
      item.unit?.toLowerCase() === "lt" || 
      item.weightInfo?.toLowerCase().includes("lt") ||
      item.weightInfo?.toLowerCase().includes("litre")
    );
  };

  const extractWeightAndUnit = (item: StockItem) => {
    if (item.weightInfo) {
      const match = item.weightInfo.match(/([0-9.,]+)/);
      if (match) {
        const val = parseFloat(match[1].replace(",", "."));
        if (!isNaN(val)) return { parsedWeight: val, displayWeight: item.weightInfo };
      }
    }
    return { parsedWeight: 1.0, displayWeight: isLiquidItem(item) ? "1.000 lt" : "1.000 kg" };
  };

  const categories = ["Tümü", ...Array.from(new Set(stockList.map((i) => i.category)))];

  const filteredStocks = stockList.filter((item) => {
    const matchesCategory = selectedCategory === "Tümü" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Onay Kutusu Manuel Değiştirme
  const toggleItemCheck = (id: string) => {
    setCheckedItemIds(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem("degirmen_sayim_checked_ids", JSON.stringify(updated));
      return updated;
    });
  };

  // Sayılan Adet Değişikliği (Otomatik İşlem Yapıldı İle İşaretler)
  const handleSayilanChange = (id: string, value: string) => {
    setSayilanValues(prev => ({
      ...prev,
      [id]: value
    }));
    // Veri girildiği an ürünü onaylandı olarak işaretle
    setCheckedItemIds(prev => {
      const updated = { ...prev, [id]: true };
      localStorage.setItem("degirmen_sayim_checked_ids", JSON.stringify(updated));
      return updated;
    });
    setIsDirty(true);
  };

  // Açıkta Olan Değişikliği (Otomatik İşlem Yapıldı İle İşaretler)
  const handleAciktaChange = (id: string, value: string) => {
    setAciktaValues(prev => ({
      ...prev,
      [id]: value
    }));
    // Veri girildiği an ürünü onaylandı olarak işaretle
    setCheckedItemIds(prev => {
      const updated = { ...prev, [id]: true };
      localStorage.setItem("degirmen_sayim_checked_ids", JSON.stringify(updated));
      return updated;
    });
    setIsDirty(true);
  };

  // Sayım İşaretlerini Sıfırla
  const handleResetCheckmarks = () => {
    if (window.confirm("Tüm ürünlerdeki 'İşlem Yapıldı' işaretlerini kaldırmak istediğinize emin misiniz?")) {
      setCheckedItemIds({});
      localStorage.removeItem("degirmen_sayim_checked_ids");
      triggerToast("Tüm işlem işaretleri temizlendi.");
    }
  };

  // Toplu Değişiklikleri Firebase Firestore'a Kaydet
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const updatedStock = stockList.map(item => {
        const countedQty = parseFloat(sayilanValues[item.id]) || 0;
        const openUnits = parseFloat(aciktaValues[item.id]) || 0;
        const openQty = openUnits / 1000;
        const totalQty = Number((countedQty + openQty).toFixed(3));

        return {
          ...item,
          quantity: totalQty
        };
      });

      await saveAllStocks(updatedStock);
      setStockList(updatedStock);
      setIsDirty(false);

      await logUserAction(
        "Fiziki Stok Sayımı Yapıldı",
        "STOK",
        `${stockList.length} kalemin fiziki sayım verileri güncellendi ve Firestore veritabanına işlendi.`
      );

      triggerToast("✅ Sayım sonuçları bulut veritabanına kaydedildi!");
    } catch (err) {
      console.error("Stok kaydetme hatası:", err);
      triggerToast("Kaydedilirken hata oluştu!");
    } finally {
      setIsSaving(false);
    }
  };

  // Dönemi Kapat
  const handleFinalizeMonthAndReset = async () => {
    if (!window.confirm("DİKKAT: Aylık dönemi kapatmak üzeresiniz. Bu işlem mevcut girdi-çıktı farklarını kalıcı olarak Firestore arşive kaydedecek ve yeni ay için Depoda Bulunan ile Düşülen miktarları SIFIRLAYACAKTIR. Emin misiniz?")) {
      return;
    }

    setIsSaving(true);
    try {
      const activeUserStr = localStorage.getItem("activeUser");
      const activeUserName = activeUserStr ? JSON.parse(activeUserStr).fullName : "Yönetici";

      const currentMonth = new Date().toISOString().substring(0, 7);
      const now = new Date();
      const monthName = now.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

      let totalGramsAcc = 0;
      const reportSnapshot = stockList.map(item => {
        const { parsedWeight } = extractWeightAndUnit(item);
        const countedQty = parseFloat(sayilanValues[item.id]) || 0;
        const openGrams = parseFloat(aciktaValues[item.id]) || 0;
        const totalCountedGram = Number(((countedQty * parsedWeight) + (openGrams / 1000)).toFixed(3));
        totalGramsAcc += totalCountedGram * 1000;

        return {
          productId: item.id,
          productName: item.name,
          category: item.category,
          depodaBulunan: item.depodaBulunan,
          depodanAlinan: item.depodanAlinan,
          sysKalan: item.quantity,
          sabitGramaj: item.weightInfo || "1.00",
          sayilanAdet: countedQty,
          sayilanAciktaGrams: openGrams,
          sayilanToplamGramaj: totalCountedGram,
          farkGramaj: Number(((item.quantity * parsedWeight) - totalCountedGram).toFixed(3))
        };
      });

      const newArchiveReport: MonthlyReportArchive = {
        id: "archive_" + Date.now(),
        month: currentMonth,
        monthName: monthName,
        createdAt: now.toLocaleString("tr-TR"),
        archivedBy: activeUserName,
        totalItems: stockList.length,
        totalGrams: totalGramsAcc,
        stockSnapshot: reportSnapshot
      };

      await saveReport(newArchiveReport);

      const resetStock = stockList.map(item => {
        const countedQty = parseFloat(sayilanValues[item.id]) || 0;
        const openGrams = parseFloat(aciktaValues[item.id]) || 0;
        const totalQty = Number((countedQty + (openGrams / 1000)).toFixed(3));

        return {
          ...item,
          depodaBulunan: totalQty,
          depodanAlinan: 0,
          quantity: totalQty
        };
      });

      await saveAllStocks(resetStock);
      setStockList(resetStock);
      setCheckedItemIds({});
      localStorage.removeItem("degirmen_sayim_checked_ids");
      setIsDirty(false);

      await logUserAction(
        "Aylık Stok Takip Dönemi Kapatıldı ve Sıfırlandı",
        "RAPOR",
        `${monthName} stok raporu arşive alındı. Depo girdi/çıktı değerleri sıfırlandı.`
      );

      triggerToast("✅ Aylık Stok Takip Raporu arşive kaydedildi ve stoklar sıfırlandı!");
    } catch (err) {
      console.error("Dönem kapatma hatası:", err);
      triggerToast("İşlem sırasında hata oluştu!");
    } finally {
      setIsSaving(false);
    }
  };

  const checkedCount = Object.values(checkedItemIds).filter(Boolean).length;
  const totalItemsCount = stockList.length;
  const progressPercent = totalItemsCount > 0 ? Math.round((checkedCount / totalItemsCount) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* Toast Bildirimi */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = "/dashboard"}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer mr-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 flex items-center justify-center">
            <img src="/logo.png" alt="Değirmen Cafe Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Fiziki Stok Sayımı & Gramaj / Litre Hesabı</h1>
            <p className="text-xs text-zinc-500">İşlem Onay Kutusu Destekli · Canlı Takip</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <UserProfileWidget />
          <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer">
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => window.location.href = "/"} className="p-2 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer" title="Çıkış Yap">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Ana İçerik */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 pb-24">
        
        {/* İLERLEME VE SAYIM SAYACI KARTI */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-sm shrink-0">
              %{progressPercent}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-zinc-200">İşlem Yapılan Ürün İlerlemesi</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {checkedCount} / {totalItemsCount} Ürün Tamamlandı
                </span>
              </div>
              <div className="w-full bg-[var(--background)] h-2 rounded-full mt-2 overflow-hidden border border-[var(--border)] min-w-[220px]">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={handleResetCheckmarks}
              className="text-[11px] text-zinc-400 hover:text-red-400 font-semibold transition-colors px-3 py-1.5 rounded-xl border border-[var(--border)] hover:border-red-500/30 cursor-pointer"
            >
              İşaretleri Sıfırla
            </button>

            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg cursor-pointer ${
                isDirty 
                  ? "bg-orange-600 hover:bg-orange-700 animate-pulse" 
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? "Kaydediliyor..." : isDirty ? "Sayım Sonuçlarını Kaydet" : "Sonuçları Güncelle"}
            </button>
          </div>
        </div>

        {/* ARAMA VE KATEGORİ FİLTRELERİ */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Ürün adı ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                    : "bg-[var(--card)] border border-[var(--border)] text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FİZİKİ SAYIM TABLOSU */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <span className="ml-3 text-sm text-zinc-400">Stoklar bulut veritabanından yükleniyor...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-3 w-12 text-center">Durum</th>
                    <th className="py-3 px-4">Ürün Adı</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-center">Birim / Paket Hacmi</th>
                    <th className="py-3 px-4 text-center w-40">Sayılan Kapalı Adet</th>
                    <th className="py-3 px-4 text-center w-44">Açıkta Olan Miktar</th>
                    <th className="py-3 px-4 text-right">Toplam Miktar Karşılığı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/40 text-xs">
                  {filteredStocks.map((item) => {
                    const { displayWeight } = extractWeightAndUnit(item);
                    const isLiquid = isLiquidItem(item);
                    const unitLabel = isLiquid ? "lt" : (item.unit === "kg" || item.unit === "Adet" ? "kg" : item.unit);
                    const openLabel = isLiquid ? "ml" : "gr";

                    const isChecked = !!checkedItemIds[item.id];
                    const countedQty = parseFloat(sayilanValues[item.id]) || 0;
                    const openUnits = parseFloat(aciktaValues[item.id]) || 0;
                    const totalCalculated = Number((countedQty + (openUnits / 1000)).toFixed(3));

                    return (
                      <tr 
                        key={item.id} 
                        className={`transition-colors ${
                          isChecked 
                            ? "bg-emerald-500/5 hover:bg-emerald-500/10 border-l-4 border-l-emerald-500" 
                            : "hover:bg-[var(--background)]/35"
                        }`}
                      >
                        {/* İşlem Yapıldı Onay Kutusu */}
                        <td className="py-4 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleItemCheck(item.id)}
                            className={`p-1 rounded-lg transition-transform hover:scale-110 cursor-pointer ${
                              isChecked ? "text-emerald-500" : "text-zinc-600 hover:text-zinc-400"
                            }`}
                            title={isChecked ? "İşlem yapıldı olarak işaretli" : "İşlem yapıldı olarak işaretle"}
                          >
                            {isChecked ? (
                              <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-zinc-950" />
                            ) : (
                              <Square className="w-5 h-5 stroke-[1.5]" />
                            )}
                          </button>
                        </td>

                        <td className="py-4 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                          <div className="flex items-center gap-2">
                            <span>{item.name}</span>
                            {isChecked && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                İşlem Yapıldı
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                            isLiquid 
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                              : "bg-[var(--background)] border-[var(--border)] text-zinc-400"
                          }`}>
                            {item.category}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center font-mono text-zinc-400">
                          {displayWeight}
                        </td>
                        
                        {/* Sayılan Adet Input */}
                        <td className="py-4 px-4 text-center">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={sayilanValues[item.id] !== undefined ? sayilanValues[item.id] : item.quantity}
                            onChange={(e) => handleSayilanChange(item.id, e.target.value)}
                            className="w-24 bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-center font-mono font-bold text-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </td>

                        {/* Açıkta Miktar Input */}
                        <td className="py-4 px-4 text-center">
                          <div className="relative inline-block w-28">
                            <input
                              type="number"
                              step="10"
                              min="0"
                              placeholder="0"
                              value={aciktaValues[item.id] || ""}
                              onChange={(e) => handleAciktaChange(item.id, e.target.value)}
                              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-center font-mono text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold pointer-events-none">
                              {openLabel}
                            </span>
                          </div>
                        </td>

                        {/* Toplam Karşılığı */}
                        <td className="py-4 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                          {totalCalculated.toFixed(3)} {unitLabel}
                        </td>
                      </tr>
                    );
                  })}
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
          İşlem Onay Kutusu Destekli
        </span>
      </footer>

    </div>
  );
}
