"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Moon, 
  Sun, 
  LogOut, 
  Calendar, 
  RefreshCw, 
  Download,
  Layers,
  Scale,
  FileSpreadsheet,
  AlertTriangle,
  Archive,
  RotateCcw,
  CheckCircle2
} from "lucide-react";
import { mockStockMovements, StockMovement } from "@/lib/reportStore";
import { mockStockItems, StockItem } from "@/lib/stockStore";

interface ArchivedReport {
  id: string;
  month: string;
  savedAt: string;
  stockSnapshot: StockItem[];
  sayilanSnapshot: Record<string, number>;
  aciktaSnapshot: Record<string, number>;
}

export default function AylikStokTakibiPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeTab, setActiveTab] = useState<"hareketler" | "sayim_raporu" | "arsiv">("hareketler");
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [sayilanValues, setSayilanValues] = useState<Record<string, number>>({});
  const [aciktaValues, setAciktaValues] = useState<Record<string, number>>({});
  const [userRole, setUserRole] = useState<string>("waiter");
  const [archivedReports, setArchivedReports] = useState<ArchivedReport[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Toast Bildirim
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "warning">("success");

  const triggerToast = (msg: string, type: "success" | "warning" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };
  
  // Varsayılan Ay Seçimi
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().substring(0, 7); // Örn: "2026-08"
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }

    // Rol Kontrolü
    const activeUser = localStorage.getItem("activeUser");
    if (activeUser) {
      const parsed = JSON.parse(activeUser);
      setUserRole(parsed.role || "waiter");
      if (parsed.role !== "admin" && parsed.role !== "yonetici") {
        window.location.href = "/dashboard";
      }
    } else {
      window.location.href = "/";
    }

    // Hareketleri yükle
    const savedMovements = localStorage.getItem("degirmen_movements");
    const movementsResetFlag = localStorage.getItem("degirmen_movements_reset_0");
    if (savedMovements && movementsResetFlag === "true") {
      setMovements(JSON.parse(savedMovements));
    } else {
      setMovements(mockStockMovements);
      localStorage.setItem("degirmen_movements", JSON.stringify(mockStockMovements));
      localStorage.setItem("degirmen_movements_reset_0", "true");
    }

    // Stok ve Sayım verilerini yükle
    const savedStock = localStorage.getItem("degirmen_stock");
    if (savedStock) {
      setStockList(JSON.parse(savedStock));
    } else {
      setStockList(mockStockItems);
    }

    const savedSayilan = localStorage.getItem("degirmen_stock_sayilan");
    if (savedSayilan) {
      const parsed = JSON.parse(savedSayilan);
      const numericalMap: Record<string, number> = {};
      Object.keys(parsed).forEach(key => {
        numericalMap[key] = parseFloat(parsed[key]) || 0;
      });
      setSayilanValues(numericalMap);
    }

    const savedAcikta = localStorage.getItem("degirmen_stock_acikta");
    if (savedAcikta) {
      const parsed = JSON.parse(savedAcikta);
      const numericalMap: Record<string, number> = {};
      Object.keys(parsed).forEach(key => {
        numericalMap[key] = parseFloat(parsed[key]) || 0;
      });
      setAciktaValues(numericalMap);
    }

    // Arşivlenmiş raporları yükle
    const savedArchive = localStorage.getItem("degirmen_stok_arsiv");
    if (savedArchive) {
      setArchivedReports(JSON.parse(savedArchive));
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  const handleRefresh = () => {
    const savedMovements = localStorage.getItem("degirmen_movements");
    if (savedMovements) setMovements(JSON.parse(savedMovements));

    const savedStock = localStorage.getItem("degirmen_stock");
    if (savedStock) setStockList(JSON.parse(savedStock));

    const savedSayilan = localStorage.getItem("degirmen_stock_sayilan");
    if (savedSayilan) {
      const parsed = JSON.parse(savedSayilan);
      const numericalMap: Record<string, number> = {};
      Object.keys(parsed).forEach(key => {
        numericalMap[key] = parseFloat(parsed[key]) || 0;
      });
      setSayilanValues(numericalMap);
    }

    const savedAcikta = localStorage.getItem("degirmen_stock_acikta");
    if (savedAcikta) {
      const parsed = JSON.parse(savedAcikta);
      const numericalMap: Record<string, number> = {};
      Object.keys(parsed).forEach(key => {
        numericalMap[key] = parseFloat(parsed[key]) || 0;
      });
      setAciktaValues(numericalMap);
    }

    triggerToast("Veriler güncellendi.");
  };

  // ────── STOK SIFIRLA VE ARŞİVE KAYDET ──────
  const handleMonthEndReset = () => {
    // 1. Mevcut durumu arşive kaydet
    const now = new Date();
    const monthLabel = selectedMonth;
    const newArchive: ArchivedReport = {
      id: "archive_" + Date.now(),
      month: monthLabel,
      savedAt: now.toLocaleString("tr-TR"),
      stockSnapshot: JSON.parse(JSON.stringify(stockList)),
      sayilanSnapshot: JSON.parse(JSON.stringify(sayilanValues)),
      aciktaSnapshot: JSON.parse(JSON.stringify(aciktaValues))
    };

    const existingArchive = localStorage.getItem("degirmen_stok_arsiv");
    const archiveList: ArchivedReport[] = existingArchive ? JSON.parse(existingArchive) : [];
    archiveList.unshift(newArchive);
    localStorage.setItem("degirmen_stok_arsiv", JSON.stringify(archiveList));
    setArchivedReports(archiveList);

    // 2. Stok verilerini sıfırla (depodanAlinan → 0, depodaBulunan → 0, sayım verileri → 0)
    const resetStock = stockList.map(item => ({
      ...item,
      depodanAlinan: 0,
      depodaBulunan: 0,
      quantity: item.quantity // quantity (mevcut kalan) aynı kalır
    }));
    localStorage.setItem("degirmen_stock", JSON.stringify(resetStock));
    setStockList(resetStock);

    // 3. Sayım verilerini sıfırla
    localStorage.removeItem("degirmen_stock_sayilan");
    localStorage.removeItem("degirmen_stock_acikta");
    setSayilanValues({});
    setAciktaValues({});

    // 4. Hareketleri sıfırla
    localStorage.removeItem("degirmen_movements");
    localStorage.setItem("degirmen_movements", JSON.stringify([]));
    setMovements([]);

    setShowResetConfirm(false);
    triggerToast(`${monthLabel} ayı raporu arşive kaydedildi ve stok verileri sıfırlandı!`, "success");
  };

  // 1. Menü 1 İçin: Normal Ürün Hareketleri CSV Çıktısı
  const handleExportMovementsCSV = () => {
    if (filteredMovements.length === 0) {
      alert("Bu ayda indirmek için herhangi bir ürün hareketi bulunmuyor.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    csvContent += "Tarih,Personel,Urun Adi,Kategori,Dusulen Miktar,Birim\n";

    filteredMovements.forEach(m => {
      const row = [
        m.date,
        `@${m.user}`,
        `"${m.productName.replace(/"/g, '""')}"`,
        `"${m.category}"`,
        m.quantity,
        m.unit
      ].join(",");
      csvContent += row + "\n";
    });

    triggerCSVDownload(csvContent, `Urun_Hareketleri_Raporu_${selectedMonth}.csv`);
  };

  // 2. Menü 2 İçin: Ay Sonu Sayım Karşılaştırma Raporu (Gramaj Hesaplı) CSV Çıktısı
  const handleExportSayimCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Urun Adi,Kategori,Ay Boyu Girilen (Adet),Ay Boyu Girilen (Gramaj),Toplam Cikis (Adet),Toplam Cikis (Gramaj),Sistemde Kalan (Gramaj),Sayilan Paket (Adet),Sayilan Acikta (Gram),Sayilan Toplam (Gramaj),Fark (Gramaj),Durum\n";

    stockList.forEach(item => {
      const { parsedWeight, unitLabel } = extractWeightAndUnit(item);

      const enteredQty = item.depodaBulunan;
      const enteredGram = Number((enteredQty * parsedWeight).toFixed(3));

      const outQty = item.depodanAlinan;
      const outGram = Number((outQty * parsedWeight).toFixed(3));

      const sysQty = item.quantity;
      const sysGram = Number((sysQty * parsedWeight).toFixed(3));

      const countedQty = sayilanValues[item.id] !== undefined ? sayilanValues[item.id] : 0;
      const openGrams = aciktaValues[item.id] !== undefined ? aciktaValues[item.id] : 0;

      // Toplam sayılan gramaj = (Adet * Paket Katsayısı) + (Açıkta olan gramaj / 1000)
      const totalCountedGram = Number(((countedQty * parsedWeight) + (openGrams / 1000)).toFixed(3));
      const diffGram = Number((sysGram - totalCountedGram).toFixed(3));

      let status = "TAM EŞLEŞME";
      if (diffGram > 0.001) status = "EKSİK / FİRE";
      else if (diffGram < -0.001) status = "FAZLA";

      const row = [
        `"${item.name}"`,
        `"${item.category}"`,
        enteredQty,
        `${enteredGram} ${unitLabel}`,
        outQty,
        `${outGram} ${unitLabel}`,
        `${sysGram} ${unitLabel}`,
        countedQty,
        `${openGrams} g`,
        `${totalCountedGram} ${unitLabel}`,
        `${diffGram > 0 ? "-" : diffGram < 0 ? "+" : ""}${Math.abs(diffGram)} ${unitLabel}`,
        status
      ].join(",");
      csvContent += row + "\n";
    });

    triggerCSVDownload(csvContent, `Ay_Sonu_Sayim_Karsilastirma_Raporu_${selectedMonth}.csv`);
  };

  const triggerCSVDownload = (content: string, filename: string) => {
    const encodedUri = encodeURI(content);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Üründen gramaj değerini ve birimini çeken yardımcı fonksiyon
  const extractWeightAndUnit = (item: StockItem) => {
    let parsedWeight = 1.0; // Varsayılan çarpan 1
    let unitLabel = "kg";

    if (item.weightInfo) {
      // Örn: "0.970 kg", "2.500 kg", "2.000 Litre", "Kutu: 0.800 kg (120 Adet x 7g)"
      const matches = item.weightInfo.match(/(\d+[.,]\d+)/);
      if (matches) {
        parsedWeight = parseFloat(matches[1].replace(",", "."));
      }
      if (item.weightInfo.toLowerCase().includes("litre")) {
        unitLabel = "lt";
      }
    }
    return { parsedWeight, unitLabel };
  };

  // Seçili aya göre hareketleri filtrele
  const filteredMovements = movements.filter(m => m.month === selectedMonth);

  // Benzersiz aylar listesi
  const availableMonths = Array.from(new Set(movements.map(m => m.month))).sort().reverse();
  if (availableMonths.length === 0) {
    const currentMonth = new Date().toISOString().substring(0, 7);
    if (!availableMonths.includes(currentMonth)) availableMonths.push(currentMonth);
  }

  const isAdminOrYonetici = userRole === "admin" || userRole === "yonetici";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* Toast Bildirimi */}
      {showToast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white ${toastType === "success" ? "bg-emerald-600" : "bg-amber-600"}`}>
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Sıfırlama Onay Modalı */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--card)] border border-orange-500/30 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-base">Ay Sonu Sıfırlaması</h3>
                <p className="text-xs text-zinc-500">{selectedMonth} ayı için işlem yapılacak</p>
              </div>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-2">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Bu işlem ile <span className="text-amber-400 font-bold">{selectedMonth}</span> ayına ait:
              </p>
              <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                <li>Tüm stok hareketleri arşive kaydedilecek</li>
                <li>Stok sayım verileri sıfırlanacak</li>
                <li>Depo giriş/çıkış sayıları sıfırlanacak</li>
                <li>Mevcut stok miktarları korunacak</li>
              </ul>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 bg-[var(--background)] border border-[var(--border)] text-zinc-400 hover:text-zinc-200 font-bold py-3 rounded-xl text-xs transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleMonthEndReset}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-lg shadow-red-600/20"
              >
                Onayla ve Sıfırla
              </button>
            </div>
          </div>
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
            <h1 className="font-bold text-lg tracking-tight">Aylık Stok Takip Raporu</h1>
            <p className="text-xs text-zinc-500">Değirmen Cafe Stok Hareketi Analizleri</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Ay Sonu Sıfırla Butonu - Sadece Admin/Yönetici */}
          {isAdminOrYonetici && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 hover:text-red-300 font-bold px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              title="Ay Sonu Sıfırla ve Arşive Kaydet"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Ay Sonu Sıfırla</span>
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer"
            title="Raporu Yenile"
          >
            <RefreshCw className="w-5 h-5" />
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

      {/* Main Gövde */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8 pb-24">
        
        {/* Karşılama ve Filtre Bölümü */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[var(--card)]/50 border border-[var(--border)] rounded-3xl p-6 backdrop-blur-sm shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-bold">Stok Takip Analizleri</h2>
            <p className="text-xs text-zinc-500 max-w-lg">
              Ay içerisinde yapılan depo düşüşleri ile ay sonu fiziki sayım verilerini karşılaştırıp toplam gramaj sapma raporunu indirin.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] px-4 py-2.5 rounded-xl text-xs font-semibold w-full md:w-auto">
              <Calendar className="w-4 h-4 text-orange-500 shrink-0" />
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent focus:outline-none w-full cursor-pointer"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m} Ayı</option>
                ))}
              </select>
            </div>
            
            {activeTab === "hareketler" ? (
              <button
                onClick={handleExportMovementsCSV}
                className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shrink-0 shadow-lg shadow-orange-600/15"
              >
                <Download className="w-4 h-4" /> Raporu İndir
              </button>
            ) : activeTab === "sayim_raporu" ? (
              isAdminOrYonetici && (
                <button
                  onClick={handleExportSayimCSV}
                  className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shrink-0 shadow-lg shadow-orange-600/15"
                >
                  <Download className="w-4 h-4" /> Sayım CSV İndir
                </button>
              )
            ) : null}
          </div>
        </div>

        {/* Tab / Menü Seçimi */}
        <div className="flex border-b border-[var(--border)] gap-6">
          <button 
            onClick={() => setActiveTab("hareketler")}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === "hareketler" 
                ? "text-orange-500 border-b-2 border-orange-500" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Ürün Hareketleri Logu
            </span>
          </button>
          
          {isAdminOrYonetici && (
            <button 
              onClick={() => setActiveTab("sayim_raporu")}
              className={`pb-3 text-xs font-bold transition-all relative ${
                activeTab === "sayim_raporu" 
                  ? "text-orange-500 border-b-2 border-orange-500" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                Ay Sonu Sayım Karşılaştırma Raporu
              </span>
            </button>
          )}

          {isAdminOrYonetici && (
            <button 
              onClick={() => setActiveTab("arsiv")}
              className={`pb-3 text-xs font-bold transition-all relative ${
                activeTab === "arsiv" 
                  ? "text-orange-500 border-b-2 border-orange-500" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5" />
                Arşiv
                {archivedReports.length > 0 && (
                  <span className="bg-orange-500/20 text-orange-400 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    {archivedReports.length}
                  </span>
                )}
              </span>
            </button>
          )}
        </div>

        {/* MENÜ 1: ÜRÜN HAREKETLERİ LOGU */}
        {activeTab === "hareketler" && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Tarih</th>
                    <th className="py-3 px-4">Personel</th>
                    <th className="py-3 px-4">Hammadde Adı</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-right">Düşülen Miktar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/40 text-xs">
                  {filteredMovements.map((move) => (
                    <tr key={move.id} className="hover:bg-[var(--background)]/35">
                      <td className="py-4 px-4 text-zinc-500 font-semibold">{move.date}</td>
                      <td className="py-4 px-4">
                        <span className="bg-orange-500/10 text-orange-500 font-bold px-2 py-0.5 rounded">
                          @{move.user}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-zinc-800 dark:text-zinc-200">{move.productName}</td>
                      <td className="py-4 px-4 text-zinc-400 font-medium">{move.category}</td>
                      <td className="py-4 px-4 text-right font-black text-red-500">
                        -{move.quantity} {move.unit}
                      </td>
                    </tr>
                  ))}
                  {filteredMovements.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-zinc-500 text-xs">
                        Seçilen aya ait herhangi bir stok hareket kaydı bulunmuyor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MENÜ 2: AY SONU SAYIM KARŞILAŞTIRMA VE GRAMAJ ANALİZ RAPORU */}
        {activeTab === "sayim_raporu" && isAdminOrYonetici && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 bg-orange-600/5 border border-orange-500/20 p-5 rounded-3xl">
              <Scale className="w-5 h-5 text-orange-500 shrink-0" />
              <div className="space-y-0.5">
                <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider block">Gramaj Karşılaştırma Mantığı</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Formül: <strong>(Adet × Paket Gramaj Katsayısı) + (Açıkta Kalan Gramaj ÷ 1000)</strong>. Bu sekme ay boyunca depoya giren toplam gramajı, barista çıkış toplam gramajını, olması gereken sistem kalanını ve ay sonu fiziki sayılan fiili kalan gramajlarını sapmalarıyla karşılaştırır.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Hammadde Adı</th>
                    <th className="py-3 px-4 text-center">Ay Boyu Girilen</th>
                    <th className="py-3 px-4 text-center">Toplam Çıkış</th>
                    <th className="py-3 px-4 text-center">Sistem Kalan</th>
                    <th className="py-3 px-4 text-center">Sayım Kalan (Fiili)</th>
                    <th className="py-3 px-4 text-center">Sapma Farkı</th>
                    <th className="py-3 px-4 text-right">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/40 text-[11px] font-semibold">
                  {stockList.map((item) => {
                    const { parsedWeight, unitLabel } = extractWeightAndUnit(item);

                    // Adetler
                    const enteredQty = item.depodaBulunan;
                    const outQty = item.depodanAlinan;
                    const sysQty = item.quantity;
                    
                    const countedQty = sayilanValues[item.id] !== undefined ? sayilanValues[item.id] : 0;
                    const openGrams = aciktaValues[item.id] !== undefined ? aciktaValues[item.id] : 0;

                    // Gramajlar
                    const enteredGram = Number((enteredQty * parsedWeight).toFixed(3));
                    const outGram = Number((outQty * parsedWeight).toFixed(3));
                    const sysGram = Number((sysQty * parsedWeight).toFixed(3));
                    
                    // Sayılan Toplam Gramaj = (Adet * Paket Katsayısı) + (Açıkta Kalan / 1000)
                    const totalCountedGram = Number(((countedQty * parsedWeight) + (openGrams / 1000)).toFixed(3));
                    const diffGram = Number((sysGram - totalCountedGram).toFixed(3));

                    return (
                      <tr key={item.id} className="hover:bg-[var(--background)]/35">
                        <td className="py-4 px-4">
                          <div className="font-bold text-zinc-800 dark:text-zinc-100">{item.name}</div>
                          <div className="text-[9px] text-zinc-500 font-semibold">{item.category} (Paket: {item.weightInfo || "1.00"})</div>
                        </td>
                        
                        <td className="py-4 px-4 text-center">
                          <div>{enteredQty} {item.unit}</div>
                          <div className="text-[9px] text-zinc-500 font-bold">{enteredGram} {unitLabel}</div>
                        </td>

                        <td className="py-4 px-4 text-center text-orange-500">
                          <div>{outQty} {item.unit}</div>
                          <div className="text-[9px] font-bold">{outGram} {unitLabel}</div>
                        </td>

                        <td className="py-4 px-4 text-center text-zinc-500">
                          <div className="font-black text-orange-500">{sysGram} {unitLabel}</div>
                        </td>

                        <td className="py-4 px-4 text-center text-orange-600">
                          <div>{countedQty} {item.unit} + {openGrams}g</div>
                          <div className="text-[9px] font-bold">{totalCountedGram} {unitLabel}</div>
                        </td>

                        <td className="py-4 px-4 text-center">
                          {diffGram > 0.001 ? (
                            <div className="text-red-500">
                              <div className="text-[11px] font-black">-{diffGram} {unitLabel}</div>
                            </div>
                          ) : diffGram < -0.001 ? (
                            <div className="text-emerald-500">
                              <div className="text-[11px] font-black">+{Math.abs(diffGram)} {unitLabel}</div>
                            </div>
                          ) : (
                            <div className="text-zinc-400">0</div>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right">
                          {diffGram > 0.001 ? (
                            <span className="text-[9px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded font-black">FİRE (EKSİK)</span>
                          ) : diffGram < -0.001 ? (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-black">FAZLA</span>
                          ) : (
                            <span className="text-[9px] bg-zinc-500/10 text-zinc-400 px-2 py-0.5 rounded font-black">EŞİT</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MENÜ 3: ARŞİV */}
        {activeTab === "arsiv" && isAdminOrYonetici && (
          <div className="space-y-4">
            {archivedReports.length === 0 ? (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-12 text-center">
                <Archive className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-500 font-semibold">Henüz arşivlenmiş rapor bulunmuyor.</p>
                <p className="text-xs text-zinc-600 mt-1">Ay sonu sıfırlaması yapıldığında raporlar buraya kaydedilir.</p>
              </div>
            ) : (
              archivedReports.map((archive) => (
                <div key={archive.id} className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-2xl flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{archive.month} Ayı Stok Arşivi</h3>
                        <p className="text-[10px] text-zinc-500">Kaydedilme: {archive.savedAt}</p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-orange-500/10 text-orange-400 font-bold px-3 py-1 rounded-full border border-orange-500/20">
                      ARŞİV
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-[9px] font-bold text-zinc-500 uppercase">
                          <th className="py-2 px-3">Ürün Adı</th>
                          <th className="py-2 px-3 text-center">Kalan Miktar</th>
                          <th className="py-2 px-3 text-center">Sayılan Paket</th>
                          <th className="py-2 px-3 text-center">Açıkta (g)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]/30">
                        {archive.stockSnapshot.map(item => (
                          <tr key={item.id} className="hover:bg-[var(--background)]/20">
                            <td className="py-2 px-3 font-semibold text-zinc-300">{item.name}</td>
                            <td className="py-2 px-3 text-center text-zinc-400">{item.quantity} {item.unit}</td>
                            <td className="py-2 px-3 text-center text-zinc-400">
                              {archive.sayilanSnapshot[item.id] || 0} adet
                            </td>
                            <td className="py-2 px-3 text-center text-zinc-400">
                              {archive.aciktaSnapshot[item.id] || 0} g
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
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
