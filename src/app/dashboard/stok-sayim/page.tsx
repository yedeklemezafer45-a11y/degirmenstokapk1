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
  Scale
} from "lucide-react";
import { mockStockItems, StockItem } from "@/lib/stockStore";

export default function StokSayimPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [userRole, setUserRole] = useState<string>("waiter");
  const [isDirty, setIsDirty] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");

  // Sayılan Adet Girişleri (Draft State)
  const [sayilanValues, setSayilanValues] = useState<Record<string, string>>({});
  // Açıkta olan Gramaj Girişleri (Draft State - Gram cinsinden örn: 250, 500)
  const [aciktaValues, setAciktaValues] = useState<Record<string, string>>({});
  
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

    // Giriş yapan aktif kullanıcı ve rolü
    const activeUser = localStorage.getItem("activeUser");
    if (activeUser) {
      const parsed = JSON.parse(activeUser);
      setUserRole(parsed.role || "waiter");
    }

    // Stok verilerini yükle
    const savedStock = localStorage.getItem("degirmen_stock");
    const stockResetFlag = localStorage.getItem("degirmen_stock_reset_02");

    let finalStock = mockStockItems;
    if (savedStock && stockResetFlag === "true") {
      const parsedStock: StockItem[] = JSON.parse(savedStock);
      // Kaydedilmiş miktarları korurken weightInfo bilgisini ekle
      finalStock = mockStockItems.map(item => {
        const matched = parsedStock.find(p => p.id === item.id);
        if (matched) {
          return {
            ...item,
            depodaBulunan: matched.depodaBulunan,
            depodanAlinan: matched.depodanAlinan,
            quantity: matched.quantity
          };
        }
        return item;
      });
    }
    setStockList(finalStock);

    // Kayıtlı olan sayılan adetleri yükle
    const savedSayilan = localStorage.getItem("degirmen_stock_sayilan");
    if (savedSayilan) {
      setSayilanValues(JSON.parse(savedSayilan));
    } else {
      const initialSayilan: Record<string, string> = {};
      finalStock.forEach(item => {
        initialSayilan[item.id] = String(item.quantity);
      });
      setSayilanValues(initialSayilan);
    }

    // Açıkta kalan gramajları yükle
    const savedAcikta = localStorage.getItem("degirmen_stock_acikta");
    if (savedAcikta) {
      setAciktaValues(JSON.parse(savedAcikta));
    } else {
      const initialAcikta: Record<string, string> = {};
      finalStock.forEach(item => {
        initialAcikta[item.id] = "0";
      });
      setAciktaValues(initialAcikta);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  // Üründen gramaj değerini ve birimini çeken yardımcı fonksiyon
  const extractWeightAndUnit = (item: StockItem) => {
    let parsedWeight = 1.0; // Varsayılan çarpan 1 kg veya 1 lt
    let unitLabel = "kg";

    if (item.weightInfo) {
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

  const categories = [
    "Tümü",
    "Şuruplar",
    "Kahveler",
    "Soslar",
    "Toz Grubu",
    "Çay Ve Bitki Çayları",
    "Püreler",
    "Litrelik Ürünler",
    "Yan Ürünler",
    "Ek Ürünler"
  ];

  // Sayılan Adet Giriş Değişikliği
  const handleSayilanChange = (id: string, value: string) => {
    setSayilanValues(prev => ({
      ...prev,
      [id]: value
    }));
    setIsDirty(true);
  };

  // Açıkta Olan Gram Değişikliği
  const handleAciktaChange = (id: string, value: string) => {
    setAciktaValues(prev => ({
      ...prev,
      [id]: value
    }));
    setIsDirty(true);
  };

  // Toplu Değişiklikleri Kaydet
  const handleSaveChanges = () => {
    localStorage.setItem("degirmen_stock_sayilan", JSON.stringify(sayilanValues));
    localStorage.setItem("degirmen_stock_acikta", JSON.stringify(aciktaValues));
    
    // Stok listesini güncelle (Depoda Sayılan Adet + Açıkta Olan Gramaj = Toplam Miktar)
    const updatedStock = stockList.map(item => {
      const { parsedWeight } = extractWeightAndUnit(item);
      const countedQty = parseFloat(sayilanValues[item.id]) || 0;
      const openGrams = parseFloat(aciktaValues[item.id]) || 0;

      // Açıkta olan gram cinsini kg/lt cinsine çevirerek toplarız (örn: 250g / 1000 = 0.25kg)
      const openQty = openGrams / 1000;
      const totalQty = Number((countedQty + openQty).toFixed(3));

      return {
        ...item,
        quantity: totalQty
      };
    });

    setStockList(updatedStock);
    localStorage.setItem("degirmen_stock", JSON.stringify(updatedStock));
    localStorage.setItem("degirmen_stock_reset_02", "true");
    
    setIsDirty(false);
    triggerToast("Sayım sonuçları (Adet + Açıkta Gramaj) başarıyla kaydedildi!");
  };

  // Ay Sonu Sayımını Kapat, Raporu Arşivle ve Stokları Sıfırla (Depoda Bulunan ve Alınanları 0 yap)
  const handleFinalizeMonthAndReset = () => {
    if (!window.confirm("DİKKAT: Aylık dönemi kapatmak üzeresiniz. Bu işlem mevcut girdi-çıktı farklarını kalıcı olarak arşive kaydedecek ve yeni ay için Depoda Bulunan ile Düşülen miktarları SIFIRLAYACAKTIR. Emin misiniz?")) {
      return;
    }

    // 1. Karşılaştırma verilerini 'degirmen_archived_reports' altında arşive ekle
    const savedArchived = localStorage.getItem("degirmen_archived_reports");
    const archivedReports = savedArchived ? JSON.parse(savedArchived) : [];

    const currentMonth = new Date().toISOString().substring(0, 7);
    const reportData = stockList.map(item => {
      const { parsedWeight } = extractWeightAndUnit(item);
      const countedQty = parseFloat(sayilanValues[item.id]) || 0;
      const openGrams = parseFloat(aciktaValues[item.id]) || 0;
      const totalCountedGram = Number(((countedQty * parsedWeight) + (openGrams / 1000)).toFixed(3));
      
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

    archivedReports.push({
      id: "archive_" + Date.now(),
      month: currentMonth,
      date: new Date().toISOString().split("T")[0],
      reports: reportData
    });

    localStorage.setItem("degirmen_archived_reports", JSON.stringify(archivedReports));

    // 2. Depo Girdi (depodaBulunan) ve Çıktı (depodanAlinan) değerlerini sıfırla, kalan (quantity) miktarını ise sayılan son duruma eşitle.
    const resetStock = stockList.map(item => {
      const countedQty = parseFloat(sayilanValues[item.id]) || 0;
      const openGrams = parseFloat(aciktaValues[item.id]) || 0;
      const { parsedWeight } = extractWeightAndUnit(item);
      const totalQty = Number(((countedQty) + (openGrams / 1000)).toFixed(3));

      return {
        ...item,
        depodaBulunan: totalQty, // Yeni aya başlarken depoda bulunan miktar = fiili sayılan miktar
        depodanAlinan: 0,        // Yeni ayın depo çıkışı sıfırdan başlar
        quantity: totalQty       // Kalan miktar
      };
    });

    setStockList(resetStock);
    localStorage.setItem("degirmen_stock", JSON.stringify(resetStock));

    // Sayım giriş alanlarını da temizle/resetle
    const initialSayilan: Record<string, string> = {};
    const initialAcikta: Record<string, string> = {};
    resetStock.forEach(item => {
      initialSayilan[item.id] = String(item.quantity);
      initialAcikta[item.id] = "0";
    });
    setSayilanValues(initialSayilan);
    setAciktaValues(initialAcikta);
    localStorage.setItem("degirmen_stock_sayilan", JSON.stringify(initialSayilan));
    localStorage.setItem("degirmen_stock_acikta", JSON.stringify(initialAcikta));

    setIsDirty(false);
    triggerToast("Dönem başarıyla kapatıldı! Rapor arşivlendi ve stok girdileri sıfırlandı.");
  };

  // Değişiklikleri Geri Al
  const handleCancelChanges = () => {
    const savedSayilan = localStorage.getItem("degirmen_stock_sayilan");
    if (savedSayilan) {
      setSayilanValues(JSON.parse(savedSayilan));
    } else {
      const initialSayilan: Record<string, string> = {};
      stockList.forEach(item => {
        initialSayilan[item.id] = String(item.quantity);
      });
      setSayilanValues(initialSayilan);
    }

    const savedAcikta = localStorage.getItem("degirmen_stock_acikta");
    if (savedAcikta) {
      setAciktaValues(JSON.parse(savedAcikta));
    } else {
      const initialAcikta: Record<string, string> = {};
      stockList.forEach(item => {
        initialAcikta[item.id] = "0";
      });
      setAciktaValues(initialAcikta);
    }

    setIsDirty(false);
    triggerToast("Değişiklikler geri alındı.");
  };

  // Filtreler
  const filteredStock = stockList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Tümü" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isAdminOrYonetici = userRole === "admin" || userRole === "yonetici";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
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
            <h1 className="font-bold text-lg tracking-tight">Stok Sayım Girişi</h1>
            <p className="text-xs text-zinc-500">Mevcut Depo Kalan Envanter Sayımı</p>
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

        {/* Kontrol / Filtre Barı */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-bold">Aylık Depo Kalan Envanter Girişi</h2>
            <p className="text-xs text-zinc-500 max-w-xl">
              Fiziki tam paket adetlerini ve açılmış kutu/şişelerdeki açık gramaj değerlerini girerek sistem kalanını güncelleyebilirsiniz.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Sadece Admin veya Yetkili Görebilir */}
            {isAdminOrYonetici && (
              <button
                onClick={() => setShowReport(!showReport)}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-lg shadow-orange-600/15"
              >
                <FileSpreadsheet className="w-4 h-4" /> {showReport ? "Sayım Girişine Dön" : "Karşılaştırma Raporunu Gör"}
              </button>
            )}

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

        {/* EKRAN A: FİZİKİ SAYIM ADET GİRİŞ EKRANI */}
        {!showReport && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Kategori / Hammadde Adı</th>
                    <th className="py-3 px-4">Birim</th>
                    <th className="py-3 px-4">Sistemdeki Kalan Miktar</th>
                    <th className="py-3 px-4 text-center">Depoda Sayılan Adet</th>
                    <th className="py-3 px-4 text-center">Açıkta Olan (g / ml)</th>
                    <th className="py-3 px-4 text-right">Toplam (Miktar Karşılığı)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/40">
                  {filteredStock.map((item) => {
                    const { parsedWeight, unitLabel } = extractWeightAndUnit(item);
                    
                    const countedQty = parseFloat(sayilanValues[item.id]) || 0;
                    const openGrams = parseFloat(aciktaValues[item.id]) || 0;

                    // Toplam hesap formülü: (Depoda Sayılan Adet * Paket Gramajı) + (Açıkta olan gramaj / 1000)
                    const totalGramaj = Number(((countedQty * parsedWeight) + (openGrams / 1000)).toFixed(3));

                    const isLitreProduct = item.category === "Litrelik Ürünler" || unitLabel === "lt";

                    return (
                      <tr key={item.id} className="hover:bg-[var(--background)]/35 text-xs">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{item.name}</span>
                            {item.weightInfo && (
                              <span className="text-[8px] bg-zinc-500/10 text-zinc-400 px-1.5 py-0.5 rounded font-black border border-zinc-500/10 shrink-0">
                                {item.weightInfo}
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-zinc-500 font-semibold uppercase">{item.category}</div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-zinc-500">{item.unit}</td>
                        <td className="py-4 px-4">
                          <span className="font-black text-orange-500">{item.quantity}</span>
                        </td>
                        
                        {/* Depoda Sayılan Tam Paket Adedi */}
                        <td className="py-4 px-4 text-center">
                          <input 
                            type="number"
                            placeholder="0"
                            value={sayilanValues[item.id] || ""}
                            onChange={(e) => handleSayilanChange(item.id, e.target.value)}
                            className="w-24 bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-center text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold mx-auto block"
                          />
                        </td>

                        {/* Açıkta Olan Gramaj / Mililitre Girişi */}
                        <td className="py-4 px-4 text-center">
                          <input 
                            type="number"
                            placeholder="0"
                            value={aciktaValues[item.id] || ""}
                            onChange={(e) => handleAciktaChange(item.id, e.target.value)}
                            className="w-24 bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-center text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold mx-auto block"
                          />
                        </td>

                        {/* Toplam (Gramaj/Litre Karşılığı) */}
                        <td className="py-4 px-4 text-right">
                          <span className="font-black text-zinc-900 dark:text-zinc-100 bg-orange-500/10 border border-orange-500/10 px-2.5 py-1 rounded-lg">
                            {totalGramaj.toFixed(3)} {unitLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStock.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-zinc-500 text-xs">
                        Aradığınız kriterlere uygun ürün bulunmamaktadır.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EKRAN B: YETKİLİ KARŞILAŞTIRMA RAPORU */}
        {showReport && isAdminOrYonetici && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-500" /> Girilen Toplam Miktar ve Sayım Karşılaştırma Analizi
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Ay boyu depoya girilen toplam miktar katsayısı ile fiili sayılan (Adet + Açıkta Gramaj) toplamı arasındaki gramaj sapma analizi.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Ürün Adı</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-center">Ay Boyu Girilen (A)</th>
                    <th className="py-3 px-4 text-center">Fiziki Sayılan (B)</th>
                    <th className="py-3 px-4 text-center">Fark (A - B)</th>
                    <th className="py-3 px-4 text-right">Durum / Analiz</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/40 text-xs font-medium">
                  {filteredStock.map((item) => {
                    const { parsedWeight, unitLabel } = extractWeightAndUnit(item);
                    
                    const totalEntered = item.depodaBulunan; // Ay boyu girilen toplam miktar
                    const enteredGram = Number((totalEntered * parsedWeight).toFixed(3));

                    const countedQty = parseFloat(sayilanValues[item.id]) || 0;
                    const openGrams = parseFloat(aciktaValues[item.id]) || 0;
                    const totalCountedGram = Number(((countedQty * parsedWeight) + (openGrams / 1000)).toFixed(3));

                    const diffGram = Number((enteredGram - totalCountedGram).toFixed(3));
                    
                    return (
                      <tr key={item.id} className="hover:bg-[var(--background)]/35">
                        <td className="py-4 px-4 font-bold text-zinc-800 dark:text-zinc-100">{item.name}</td>
                        <td className="py-4 px-4 text-zinc-500">{item.category}</td>
                        <td className="py-4 px-4 text-center font-bold text-zinc-700 dark:text-zinc-300">
                          {enteredGram} {unitLabel}
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-orange-500">
                          {totalCountedGram} {unitLabel}
                        </td>
                        <td className="py-4 px-4 text-center font-black">
                          {diffGram > 0 ? (
                            <span className="text-red-500">-{diffGram} {unitLabel}</span>
                          ) : diffGram < 0 ? (
                            <span className="text-emerald-500">+{Math.abs(diffGram)} {unitLabel}</span>
                          ) : (
                            <span className="text-zinc-400">0 {unitLabel}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {diffGram > 0 ? (
                            <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded font-extrabold">EKSİK / FİRE</span>
                          ) : diffGram < 0 ? (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-extrabold">FAZLA</span>
                          ) : (
                            <span className="text-[10px] bg-zinc-500/10 text-zinc-400 px-2 py-0.5 rounded font-extrabold">TAM EŞLEŞME</span>
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

      </main>

      {/* HAFIZADA TUTULAN DÜZENLEME DURUMU BAR */}
      {isDirty && !showReport && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1e293b] border border-orange-500/30 text-white rounded-2xl px-6 py-4 flex items-center gap-6 shadow-2xl animate-slideUp">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold">Kaydedilmemiş Sayım Sonuçları Var!</span>
              <span className="text-[10px] text-zinc-400">Değişikliklerin kalıcı olması ve kalan stokları güncellemesi için kaydedin.</span>
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
              <Save className="w-3.5 h-3.5" /> Değişiklikleri Kaydet
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
