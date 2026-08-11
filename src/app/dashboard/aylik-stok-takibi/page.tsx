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
  CheckCircle2,
  Loader2,
  Trash2,
  Share2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { StockItem } from "@/lib/stockStore";
import { subscribeToStocks, saveAllStocks } from "@/lib/stockService";
import { getAllReports, saveReport, removeReport, MonthlyReportArchive } from "@/lib/reportService";

export default function AylikStokTakibiPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeTab, setActiveTab] = useState<"sayim_raporu" | "arsiv">("sayim_raporu");
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [userRole, setUserRole] = useState<string>("waiter");
  const [archivedReports, setArchivedReports] = useState<MonthlyReportArchive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Toast Bildirim
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

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
        triggerToast("Sayfa linki kopyalandı! Paylaşmak istediğiniz yere yapıştırabilirsiniz. 📋");
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        triggerToast("Sayfa linki kopyalandı! Paylaşmak istediğiniz yere yapıştırabilirsiniz. 📋");
      } catch (copyErr) {
        console.error("Paylaşım hatası:", copyErr);
      }
    }
  };
  
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }

    // Rol Kontrolü
    const activeUser = sessionStorage.getItem("activeUser");
    if (activeUser) {
      const parsed = JSON.parse(activeUser);
      setUserRole(parsed.role || "waiter");
      if (parsed.role !== "admin" && parsed.role !== "yonetici") {
        window.location.href = "/dashboard";
        return;
      }
    } else {
      window.location.href = "/";
      return;
    }

    loadReports();

    // Gerçek zamanlı Firestore stok dinleyicisi — anlık güncelleme
    setIsLoading(true);
    const unsubscribe = subscribeToStocks(
      (fetchedStocks) => {
        setStockList(fetchedStocks);
        setIsLoading(false);
      },
      () => {
        triggerToast("Stoklar yüklenirken hata oluştu!");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const loadReports = async () => {
    try {
      const fetchedReports = await getAllReports();
      setArchivedReports(fetchedReports);
    } catch (err) {
      console.error("Rapor okuma hatası:", err);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  const isLiquidItem = (item: any) => {
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

  const handleDeleteArchive = async (id: string) => {
    if (!window.confirm("Bu arşivlenmiş raporu silmek istediğinize emin misiniz?")) return;
    setIsSaving(true);
    try {
      await removeReport(id);
      setArchivedReports(prev => prev.filter(r => r.id !== id));
      triggerToast("Arşiv raporu silindi.");
    } catch (err) {
      triggerToast("Rapor silinirken hata oluştu!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* Toast */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {toastMessage}
        </div>
      )}

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
            <h1 className="font-bold text-lg tracking-tight">Aylık Stok Takip & Karşılaştırma Raporları</h1>
            <p className="text-xs text-zinc-500">Firestore Bulut Veritabanı · Anlık Canlı Takip</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSharePage}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-orange-500 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            title="Sayfayı Paylaş"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer">
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => router.push("/")} className="p-2 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer" title="Çıkış Yap">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 pb-24">

        {/* TAB BUTONLARI */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
          <button
            onClick={() => setActiveTab("sayim_raporu")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "sayim_raporu"
                ? "bg-orange-600 text-white shadow-lg"
                : "bg-[var(--card)] border border-[var(--border)] text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Canlı Ay Sonu Karşılaştırması
          </button>

          <button
            onClick={() => setActiveTab("arsiv")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "arsiv"
                ? "bg-orange-600 text-white shadow-lg"
                : "bg-[var(--card)] border border-[var(--border)] text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Archive className="w-4 h-4" />
            Geçmiş Dönem Arşiv Raporları ({archivedReports.length})
          </button>
        </div>

        {/* CANLI KARŞILAŞTIRMA SEKMESİ */}
        {activeTab === "sayim_raporu" && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-orange-500 flex items-center gap-2">
                  <Scale className="w-5 h-5" />
                  Güncel Stok Durumu & Gramaj Kıyaslama
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Bulut veritabanındaki canlı girdi, çıktı ve mevcut stok bakiyeleri.
                </p>
              </div>

              <button
                onClick={loadReports}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 font-semibold cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> : <RefreshCw className="w-4 h-4" />}
                Verileri Yenile
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <span className="ml-3 text-sm text-zinc-400">Bulut veritabanı yükleniyor...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Ürün Adı</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4 text-center">Paket Gramajı</th>
                      <th className="py-3 px-4 text-center">Depoda Bulunan (Girdi)</th>
                      <th className="py-3 px-4 text-center">Depodan Alınan (Çıktı)</th>
                      <th className="py-3 px-4 text-right">Depoda Kalan Miktar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]/40 text-xs">
                    {stockList.map(item => {
                      const { displayWeight } = extractWeightAndUnit(item);

                      return (
                        <tr key={item.id} className="hover:bg-[var(--background)]/35 transition-colors">
                          <td className="py-4 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                            {item.name}
                          </td>
                          <td className="py-4 px-4">
                            <span className="bg-[var(--background)] border border-[var(--border)] px-2.5 py-1 rounded-xl text-[10px] text-zinc-400 font-bold">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center font-mono text-zinc-400">
                            {displayWeight}
                          </td>
                          <td className="py-4 px-4 text-center font-mono font-bold text-emerald-500">
                            {item.depodaBulunan} {item.unit}
                          </td>
                          <td className="py-4 px-4 text-center font-mono font-bold text-red-400">
                            {item.depodanAlinan} {item.unit}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-extrabold text-orange-500 text-sm">
                            {item.quantity} {item.unit}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ARŞİV SEKMESİ */}
        {activeTab === "arsiv" && (
          <div className="space-y-6">
            {archivedReports.length === 0 ? (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-12 text-center space-y-3">
                <Archive className="w-10 h-10 text-zinc-500 mx-auto opacity-50" />
                <h3 className="text-sm font-bold text-zinc-400">Henüz Kayıtlı Arşiv Raporu Yok</h3>
                <p className="text-xs text-zinc-500">
                  Stok Sayımı sayfasından "Dönemi Kapat & Raporu Arşivle" butonunu kullandığınızda raporlar burada listelenir.
                </p>
              </div>
            ) : (
              archivedReports.map(report => (
                <div key={report.id} className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-orange-500">{report.monthName} Arşiv Raporu</h4>
                      <p className="text-[11px] text-zinc-500">
                        Kayıt Tarihi: {report.createdAt} · Kaydeden: <span className="font-bold text-zinc-300">{report.archivedBy}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteArchive(report.id)}
                      className="p-2 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
                      title="Arşivi Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          <th className="py-2 px-3">Ürün Adı</th>
                          <th className="py-2 px-3 text-center">Girdi</th>
                          <th className="py-2 px-3 text-center">Çıktı</th>
                          <th className="py-2 px-3 text-center">Teorik Kalan</th>
                          <th className="py-2 px-3 text-center text-orange-400">Sayılan Adet</th>
                          <th className="py-2 px-3 text-center text-amber-500">Fiili Gramaj</th>
                          <th className="py-2 px-3 text-right">Fark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]/40 text-xs">
                          {report.stockSnapshot?.map((item: any) => {
                            const isLiquid = isLiquidItem(item);
                            const unitSfx = isLiquid ? "lt" : "kg";
                            return (
                              <tr key={item.productId} className="hover:bg-[var(--background)]/30">
                                <td className="py-2 px-3 font-semibold text-zinc-300">{item.productName}</td>
                                <td className="py-2 px-3 text-center font-mono text-emerald-400">{item.depodaBulunan}</td>
                                <td className="py-2 px-3 text-center font-mono text-red-400">{item.depodanAlinan}</td>
                                <td className="py-2 px-3 text-center font-mono text-zinc-400">{item.sysKalan}</td>
                                <td className="py-2 px-3 text-center font-mono font-bold text-orange-400">{item.sayilanAdet}</td>
                                <td className="py-2 px-3 text-center font-mono font-bold text-amber-500">{item.sayilanToplamGramaj} {unitSfx}</td>
                                <td className={`py-2 px-3 text-right font-mono font-bold ${
                                  item.farkGramaj > 0 ? "text-red-400" : item.farkGramaj < 0 ? "text-emerald-400" : "text-zinc-500"
                                }`}>
                                  {item.farkGramaj > 0 ? `-${item.farkGramaj} {unitSfx}` : item.farkGramaj < 0 ? `+${Math.abs(item.farkGramaj)} {unitSfx}` : "Tam"}
                                </td>
                              </tr>
                            );
                          })}
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
      <footer className="w-full border-t border-[var(--border)] bg-[var(--card)] py-4 px-6 flex items-center justify-between text-xs text-zinc-500">
        <span>© 2026 Değirmen Cafe. Tüm hakları saklıdır.</span>
        <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Bulut Veritabanı Senkronize
        </span>
      </footer>

    </div>
  );
}
