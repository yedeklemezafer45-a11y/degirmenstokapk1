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
import { BRANCH_REGIONS } from "@/lib/userService";
import { Folder, FolderOpen, ArrowRightLeft, ArrowUp, ArrowDown } from "lucide-react";

export default function AylikStokTakibiPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeTab, setActiveTab] = useState<"sayim_raporu" | "arsiv" | "kiyaslama">("sayim_raporu");
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [userRole, setUserRole] = useState<string>("waiter");
  
  // Klasörlü ve Tüm Raporları Tutan Map
  const [allRegionsReports, setAllRegionsReports] = useState<Record<string, MonthlyReportArchive[]>>({});
  const [selectedFolderRegion, setSelectedFolderRegion] = useState<string | null>(null);

  // Kıyaslama Seçimleri
  const [compRegion, setCompRegion] = useState<string>("degirmen-kafe");
  const [compReportAId, setCompReportAId] = useState<string>("");
  const [compReportBId, setCompReportBId] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

    loadAllRegionsReports();

    // Gerçek zamanlı Firestore stok dinleyicisi — anlık güncelleme
    setIsLoading(true);
    const unsubscribe = subscribeToStocks(
      activeRegion,
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

  const loadAllRegionsReports = async () => {
    setIsLoading(true);
    try {
      const results = await Promise.all(
        BRANCH_REGIONS.map(async (region) => {
          const fetched = await getAllReports(region.id);
          fetched.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          return { regionId: region.id, reports: fetched };
        })
      );
      const reportsMap: Record<string, MonthlyReportArchive[]> = {};
      results.forEach(res => {
        reportsMap[res.regionId] = res.reports;
      });
      setAllRegionsReports(reportsMap);
    } catch (err) {
      console.error("loadAllRegionsReports error:", err);
      triggerToast("Arşivler yüklenirken hata oluştu!");
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

  const handleDeleteArchive = async (regionId: string, id: string) => {
    if (!window.confirm("Bu arşivlenmiş raporu silmek istediğinize emin misiniz?")) return;
    setIsSaving(true);
    try {
      await removeReport(regionId, id);
      setAllRegionsReports(prev => {
        const updated = { ...prev };
        if (updated[regionId]) {
          updated[regionId] = updated[regionId].filter(r => r.id !== id);
        }
        return updated;
      });
      triggerToast("Arşiv raporu silindi.");
    } catch (err) {
      triggerToast("Rapor silinirken hata oluştu!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadComparisonCSV = (reportA: any, reportB: any) => {
    const mapA = new Map((reportA.stockSnapshot || []).map((i: any) => [i.productId, i]));
    const mapB = new Map((reportB.stockSnapshot || []).map((i: any) => [i.productId, i]));
    const productIds = Array.from(new Set([...mapA.keys(), ...mapB.keys()]));

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Urun Adi;Kategori;Donem A Sayilan (Adet);Donem A Toplam;Donem B Sayilan (Adet);Donem B Toplam;Degisim\n";

    productIds.forEach(id => {
      const itemA: any = mapA.get(id);
      const itemB: any = mapB.get(id);
      
      const name = (itemA?.productName || itemB?.productName || "").replace(/;/g, " ");
      const category = (itemA?.category || itemB?.category || "").replace(/;/g, " ");
      const qtyA = itemA ? itemA.sayilanAdet : 0;
      const weightA = itemA ? itemA.sayilanToplamGramaj : 0;
      const qtyB = itemB ? itemB.sayilanAdet : 0;
      const weightB = itemB ? itemB.sayilanToplamGramaj : 0;
      const diff = (weightB - weightA).toFixed(3);

      csvContent += `"${name}";"${category}";${qtyA};${weightA};${qtyB};${weightB};${diff}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportA.monthName}_vs_${reportB.monthName}_Kiyaslama.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <p className="text-xs text-zinc-500">{selectedRegionName} · Firestore Bulut Veritabanı</p>
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
            onClick={() => {
              setActiveTab("arsiv");
              setSelectedFolderRegion(null); // Klasörlere geri dönsün
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "arsiv"
                ? "bg-orange-600 text-white shadow-lg"
                : "bg-[var(--card)] border border-[var(--border)] text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Archive className="w-4 h-4" />
            Geçmiş Dönem Arşiv Raporları ({Object.values(allRegionsReports).flat().length})
          </button>

          <button
            onClick={() => setActiveTab("kiyaslama")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "kiyaslama"
                ? "bg-orange-600 text-white shadow-lg"
                : "bg-[var(--card)] border border-[var(--border)] text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Dönem Kıyaslama Paneli
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
                  Bulut veritabanındaki canlı girdi, çıktı ve mevcut stok bakiyeleri ({selectedRegionName}).
                </p>
              </div>

              <button
                onClick={() => loadAllRegionsReports()}
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

        {/* ARŞİV SEKMESİ (KLASÖRLÜ GÖRÜNÜM) */}
        {activeTab === "arsiv" && (
          <div className="space-y-6 animate-fadeIn">
            {selectedFolderRegion === null ? (
              // Klasör Listesi
              <div className="space-y-4">
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-orange-500 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    Şube Arşiv Klasörleri
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Geçmiş dönem aylık stok sayım arşivlerini şube bazında düzenlenmiş klasörler içerisinden inceleyin.
                  </p>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {BRANCH_REGIONS.map((region) => {
                      const reports = allRegionsReports[region.id] || [];
                      return (
                        <div
                          key={region.id}
                          onClick={() => setSelectedFolderRegion(region.id)}
                          className="bg-[var(--card)] border border-[var(--border)] hover:border-orange-500/30 rounded-3xl p-6 shadow-sm flex items-center gap-4 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group"
                        >
                          <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all shrink-0">
                            <Folder className="w-6 h-6 fill-orange-500/20" />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <h4 className="font-extrabold text-sm text-zinc-200 group-hover:text-orange-500 transition-colors truncate">
                              {region.name}
                            </h4>
                            <p className="text-[10px] text-zinc-500 font-extrabold uppercase">
                              {reports.length} Kayıtlı Rapor
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              // Seçilen Şubenin Arşiv Listesi
              (() => {
                const rName = BRANCH_REGIONS.find(r => r.id === selectedFolderRegion)?.name || "";
                const reports = allRegionsReports[selectedFolderRegion] || [];

                return (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setSelectedFolderRegion(null)}
                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 font-bold border border-[var(--border)] px-4 py-2 rounded-2xl cursor-pointer bg-[var(--card)] hover:bg-[var(--foreground)]/5 transition-all"
                      >
                        ← Klasörlere Geri Dön
                      </button>
                      <div>
                        <h3 className="font-black text-sm uppercase tracking-wider text-orange-500 text-right">
                          {rName}
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-extrabold text-right uppercase">Arşiv Raporları</p>
                      </div>
                    </div>

                    {reports.length === 0 ? (
                      <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-12 text-center space-y-3">
                        <Archive className="w-10 h-10 text-zinc-500 mx-auto opacity-50" />
                        <h3 className="text-sm font-bold text-zinc-400">Bu Şubeye Ait Kayıtlı Arşiv Raporu Yok</h3>
                        <p className="text-xs text-zinc-500">
                          Bu şubenin envanter sayımı kapatıldığında otomatik arşiv raporları burada listelenecektir.
                        </p>
                      </div>
                    ) : (
                      reports.map(report => (
                        <div key={report.id} className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm space-y-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                            <div>
                              <h4 className="font-extrabold text-sm text-orange-500">{report.monthName} Arşiv Raporu</h4>
                              <p className="text-[11px] text-zinc-500">
                                Kayıt Zamanı: {report.createdAt} · Kaydeden: <span className="font-bold text-zinc-300">{report.archivedBy}</span> · Arşiv No: <span className="font-mono text-orange-500 font-extrabold">{report.id}</span>
                              </p>
                            </div>

                            <button
                              onClick={() => handleDeleteArchive(selectedFolderRegion, report.id)}
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
                                          {item.farkGramaj > 0 ? `-${item.farkGramaj} ${unitSfx}` : item.farkGramaj < 0 ? `+${Math.abs(item.farkGramaj)} ${unitSfx}` : "Tam"}
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
                );
              })()
            )}
          </div>
        )}

        {/* YAN YANA KIYASLAMA PANELİ */}
        {activeTab === "kiyaslama" && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm space-y-6 animate-fadeIn">
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-orange-500 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" />
                Geçmiş Dönemleri Karşılaştır (Yan Yana)
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                İki farklı arşiv dönemini seçerek girdi-çıktı, fiziki sayım ve stok değişimlerini yan yana inceleyin.
              </p>
            </div>

            {/* Seçim Formu */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-[var(--background)]/60 border border-[var(--border)] rounded-2xl">
              {/* Şube Seçimi */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500">Şube Seçin</label>
                <select
                  value={compRegion}
                  onChange={(e) => {
                    setCompRegion(e.target.value);
                    setCompReportAId("");
                    setCompReportBId("");
                  }}
                  className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs text-zinc-205 focus:outline-none focus:ring-1 focus:ring-[#e76f51]"
                >
                  {BRANCH_REGIONS.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Rapor A */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500">1. Dönem (Rapor A)</label>
                <select
                  value={compReportAId}
                  onChange={(e) => setCompReportAId(e.target.value)}
                  className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs text-zinc-205 focus:outline-none focus:ring-1 focus:ring-[#e76f51]"
                >
                  <option value="">Seçiniz...</option>
                  {(allRegionsReports[compRegion] || []).map(r => (
                    <option key={r.id} value={r.id}>{r.monthName} ({r.createdAt})</option>
                  ))}
                </select>
              </div>

              {/* Rapor B */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500">2. Dönem (Rapor B)</label>
                <select
                  value={compReportBId}
                  onChange={(e) => setCompReportBId(e.target.value)}
                  className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs text-zinc-205 focus:outline-none focus:ring-1 focus:ring-[#e76f51]"
                >
                  <option value="">Seçiniz...</option>
                  {(allRegionsReports[compRegion] || []).map(r => (
                    <option key={r.id} value={r.id}>{r.monthName} ({r.createdAt})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sonuç Listeleme */}
            {(() => {
              const regionReports = allRegionsReports[compRegion] || [];
              const rA = regionReports.find(r => r.id === compReportAId);
              const rB = regionReports.find(r => r.id === compReportBId);

              if (!rA || !rB) {
                return (
                  <div className="py-12 text-center text-xs text-zinc-500 italic">
                    Karşılaştırmak istediğiniz dönemleri yukarıdan seçiniz.
                  </div>
                );
              }

              // Map snap A & B
              const mapA = new Map((rA.stockSnapshot || []).map((i: any) => [i.productId, i]));
              const mapB = new Map((rB.stockSnapshot || []).map((i: any) => [i.productId, i]));
              const productIds = Array.from(new Set([...mapA.keys(), ...mapB.keys()]));

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                      Karşılaştırma Sonuçları: <span className="text-orange-500">{rA.monthName}</span> vs <span className="text-orange-500">{rB.monthName}</span>
                    </h4>

                    <button
                      onClick={() => handleDownloadComparisonCSV(rA, rB)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-750 border border-zinc-705 text-zinc-200 text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-500" />
                      Excel / CSV Olarak İndir
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-[9px] font-bold text-zinc-500 uppercase tracking-wider bg-[var(--background)]/30">
                          <th className="py-3 px-3">Ürün Adı</th>
                          <th className="py-3 px-3 text-center bg-blue-500/5">A. Sayılan (Adet)</th>
                          <th className="py-3 px-3 text-center bg-blue-500/5">A. Toplam</th>
                          <th className="py-3 px-3 text-center bg-emerald-500/5">B. Sayılan (Adet)</th>
                          <th className="py-3 px-3 text-center bg-emerald-500/5">B. Toplam</th>
                          <th className="py-3 px-3 text-right">Miktar Değişimi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]/40 text-xs">
                        {productIds.map(id => {
                          const itemA: any = mapA.get(id);
                          const itemB: any = mapB.get(id);

                          const name = itemA?.productName || itemB?.productName || "";
                          const formatA = itemA ? `${itemA.sayilanToplamGramaj}` : "-";
                          const formatB = itemB ? `${itemB.sayilanToplamGramaj}` : "-";
                          
                          const weightA = itemA ? itemA.sayilanToplamGramaj : 0;
                          const weightB = itemB ? itemB.sayilanToplamGramaj : 0;
                          const diff = weightB - weightA;

                          const isLiquid = itemA ? isLiquidItem(itemA) : (itemB ? isLiquidItem(itemB) : false);
                          const unitSfx = isLiquid ? "lt" : "kg";

                          return (
                            <tr key={id} className="hover:bg-[var(--background)]/30 transition-colors">
                              <td className="py-3 px-3 font-semibold text-zinc-300">{name}</td>
                              
                              {/* Rapor A */}
                              <td className="py-3 px-3 text-center font-mono text-zinc-400 bg-blue-500/5">
                                {itemA ? itemA.sayilanAdet : "-"}
                              </td>
                              <td className="py-3 px-3 text-center font-mono text-zinc-400 bg-blue-500/5">
                                {itemA ? `${weightA.toFixed(3)} ${unitSfx}` : "-"}
                              </td>

                              {/* Rapor B */}
                              <td className="py-3 px-3 text-center font-mono text-zinc-350 bg-emerald-500/5">
                                {itemB ? itemB.sayilanAdet : "-"}
                              </td>
                              <td className="py-3 px-3 text-center font-mono text-zinc-350 bg-emerald-500/5">
                                {itemB ? `${weightB.toFixed(3)} ${unitSfx}` : "-"}
                              </td>

                              {/* Değişim */}
                              <td className="py-3 px-3 text-right font-mono font-bold">
                                {diff > 0 ? (
                                  <span className="text-emerald-500 flex items-center justify-end gap-1">
                                    <ArrowUp className="w-3.5 h-3.5" /> +{diff.toFixed(3)} {unitSfx}
                                  </span>
                                ) : diff < 0 ? (
                                  <span className="text-red-500 flex items-center justify-end gap-1">
                                    <ArrowDown className="w-3.5 h-3.5" /> {diff.toFixed(3)} {unitSfx}
                                  </span>
                                ) : (
                                  <span className="text-zinc-500">— Değişim Yok</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

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
