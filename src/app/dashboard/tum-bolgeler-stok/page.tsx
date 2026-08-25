"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Moon, 
  Sun, 
  LogOut, 
  Search, 
  Layers, 
  Loader2, 
  Share2, 
  AlertTriangle,
  Building2,
  TrendingUp,
  Download
} from "lucide-react";
import { getAllStocks } from "@/lib/stockService";
import { StockItem } from "@/lib/stockStore";
import { useRouter } from "next/navigation";

interface RegionStockMap {
  regionId: string;
  regionName: string;
  items: StockItem[];
}

export default function TumBolgelerStokPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [regionStocks, setRegionStocks] = useState<RegionStockMap[]>([]);
  const [userRole, setUserRole] = useState<string>("waiter");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hoveredBar, setHoveredBar] = useState<{ region: string; type: string; value: number } | null>(null);

  const regions = [
    { id: "degirmen-kafe", name: "Değirmen Kafe" },
    { id: "13-eylul-vargel-kafe", name: "13 Eylül Vargel" },
    { id: "millet-bahcesi-vargel-kafe", name: "Millet Bahçesi Vargel" },
    { id: "vargel-karavan", name: "Vargel Karavan" },
    { id: "vargel-kitap-kafe", name: "Vargel Kitap" }
  ];

  const categories = ["Tümü", ...Array.from(new Set(regionStocks.flatMap(rs => rs.items.map(i => i.category)))).sort((a, b) => a.localeCompare(b, "tr"))];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSharePage = async () => {
    const shareData = {
      title: "Değirmen Tüm Şubeler Stok Raporu",
      text: "Değirmen Kafe Tüm Şubeler Stok Takip ve Analiz Paneli",
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        triggerToast("Sayfa linki kopyalandı! 📋");
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        triggerToast("Sayfa linki kopyalandı! 📋");
      } catch (copyErr) {
        console.error("Paylaşım hatası:", copyErr);
      }
    }
  };

  const loadAllRegionStocks = async () => {
    setIsLoading(true);
    try {
      const promises = regions.map(async (r) => {
        const items = await getAllStocks(r.id);
        return {
          regionId: r.id,
          regionName: r.name,
          items
        };
      });
      const results = await Promise.all(promises);
      setRegionStocks(results);
    } catch (err) {
      console.error("Bölgelerin stokları çekilemedi:", err);
      triggerToast("Şube stok verileri yüklenirken hata oluştu!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }

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

    loadAllRegionStocks();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  // Tüm şubelerdeki benzersiz ürün isimlerini/id'lerini topla
  const getUniqueItemKeys = () => {
    const itemMap: Record<string, { name: string; category: string; unit: string; minLimit: number }> = {};
    regionStocks.forEach(reg => {
      reg.items.forEach(item => {
        if (!itemMap[item.name]) {
          itemMap[item.name] = {
            name: item.name,
            category: item.category,
            unit: item.unit,
            minLimit: item.minLimit
          };
        }
      });
    });

    return Object.values(itemMap)
      .filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "Tümü" || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  };

  const uniqueItems = getUniqueItemKeys();

  // Grafik verisi hesaplayıcıları
  const getChartData = () => {
    return regions.map(reg => {
      const rs = regionStocks.find(x => x.regionId === reg.id);
      let totalGirdi = 0;
      let totalCikti = 0;
      let totalKalan = 0;

      if (rs) {
        rs.items.forEach(item => {
          const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesCategory = selectedCategory === "Tümü" || item.category === selectedCategory;
          if (matchesSearch && matchesCategory) {
            totalGirdi += item.depodaBulunan || 0;
            totalCikti += item.depodanAlinan || 0;
            totalKalan += item.quantity || 0;
          }
        });
      }

      return {
        id: reg.id,
        name: reg.name,
        girdi: totalGirdi,
        cikti: totalCikti,
        kalan: totalKalan
      };
    });
  };

  const chartData = getChartData();
  const maxVal = Math.max(...chartData.flatMap(d => [d.girdi, d.cikti, d.kalan]), 10);

  // Excel/CSV Dışa Aktarım
  const exportToCSV = () => {
    if (regionStocks.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Urun Adi,Kategori,Birim,Degirmen Kafe,13 Eylul Vargel,Millet Bahcesi Vargel,Vargel Karavan,Vargel Kitap,Toplam\n";

    uniqueItems.forEach(item => {
      const counts = regions.map(reg => {
        const found = regionStocks.find(rs => rs.regionId === reg.id)?.items.find(i => i.name === item.name);
        return found ? found.quantity : 0;
      });
      const total = counts.reduce((acc, c) => acc + c, 0);
      csvContent += `"${item.name}","${item.category}","${item.unit}",${counts.join(",")},${total}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tum_subeler_stok_durumu_${new Date().toLocaleDateString("tr-TR")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("CSV dosyası başarıyla indirildi! 📥");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
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
            <h1 className="font-bold text-lg tracking-tight">Konsolide Şube Stok Takip</h1>
            <p className="text-xs text-zinc-500">Tüm Bölgelerin Stok Durumunu Yan Yana Görün & Değerlendirin</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e76f51] hover:bg-[#eb8870] dark:bg-[#a6442d] dark:hover:bg-[#c25137] text-[#264653] dark:text-zinc-950 text-[10px] font-extrabold rounded-lg shadow-md transition-all uppercase tracking-wider cursor-pointer"
            title="Excel/CSV İndir"
          >
            <Download className="w-3.5 h-3.5" />
            CSV İndir
          </button>
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 pb-24">
        
        {/* Özet Bilgi Kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-6 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Toplam Şube Sayısı</span>
              <span className="text-xl font-black mt-0.5 block">{regions.length} Bölge</span>
            </div>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-6 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Envanterdeki Çeşit</span>
              <span className="text-xl font-black mt-0.5 block">{uniqueItems.length} Ürün Kalemi</span>
            </div>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-6 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Konsolide Adet</span>
              <span className="text-xl font-black mt-0.5 block">
                {(() => {
                  let total = 0;
                  regionStocks.forEach(rs => {
                    rs.items.forEach(i => {
                      if (selectedCategory === "Tümü" || i.category === selectedCategory) {
                        total += i.quantity;
                      }
                    });
                  });
                  return total.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
                })()} Birim
              </span>
            </div>
          </div>
        </div>

        {/* Grafik Analiz Paneli */}
        {!isLoading && regionStocks.length > 0 && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border)] pb-3 gap-2">
              <div>
                <h3 
                  style={{ fontFamily: "'Getai Grotesk', sans-serif" }}
                  className="text-base font-black uppercase text-zinc-800 dark:text-zinc-200 tracking-tight flex items-center gap-2"
                >
                  <TrendingUp className="w-5 h-5 text-[#e76f51]" />
                  ŞUBE BAZLI STOK & TÜKETİM GRAFİK ANALİZİ
                </h3>
                <p className="text-[10px] text-zinc-500 uppercase font-black mt-0.5">
                  Filtre ve aramalara göre otomatik güncellenen dinamik envanter göstergeleri
                </p>
              </div>

              {/* Grafik Renk Açıklamaları */}
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#2a9d8f]" />
                  <span className="text-zinc-500">Siparişten Gelen (Girdi)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#e76f51]" />
                  <span className="text-zinc-500">Çıkış Yapan (Çıktı)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#e9c46a]" />
                  <span className="text-zinc-500">Stokta Bulunan (Kalan)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Kümelenmiş Çubuk Grafik (Grouped Bar Chart) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="h-64 relative border border-[var(--border)]/40 rounded-3xl p-4 bg-[var(--background)]/35 overflow-hidden flex flex-col justify-end">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between p-4 py-8 pointer-events-none">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="w-full border-t border-[var(--border)]/30 relative">
                        <span className="absolute -top-2.5 right-0 text-[8px] font-mono font-bold text-zinc-500 bg-[var(--card)] px-1 py-0.5 rounded border border-[var(--border)]/20">
                          {Math.round(maxVal - (maxVal / 3) * i).toLocaleString("tr-TR")}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bars Container */}
                  <div className="w-full h-full flex items-end justify-between px-6 pt-4 pb-2 z-10">
                    {chartData.map((data) => {
                      // Calculate height percentages
                      const girdiHeight = (data.girdi / maxVal) * 80; // max 80% to leave space for labels
                      const ciktiHeight = (data.cikti / maxVal) * 80;
                      const kalanHeight = (data.kalan / maxVal) * 80;

                      return (
                        <div key={data.id} className="flex flex-col items-center w-1/5 space-y-2">
                          <div className="flex items-end justify-center gap-1.5 h-44 w-full">
                            {/* Girdi Bar */}
                            <div
                              onMouseEnter={() => setHoveredBar({ region: data.name, type: "Siparişten Gelen (Girdi)", value: data.girdi })}
                              onMouseLeave={() => setHoveredBar(null)}
                              style={{ height: `${Math.max(girdiHeight, 2)}%` }}
                              className="w-3 bg-[#2a9d8f] hover:bg-[#34b5a6] rounded-t-lg transition-all duration-300 shadow-sm cursor-help relative group"
                            />
                            {/* Çıktı Bar */}
                            <div
                              onMouseEnter={() => setHoveredBar({ region: data.name, type: "Çıkış Yapan (Çıktı)", value: data.cikti })}
                              onMouseLeave={() => setHoveredBar(null)}
                              style={{ height: `${Math.max(ciktiHeight, 2)}%` }}
                              className="w-3 bg-[#e76f51] hover:bg-[#eb8870] rounded-t-lg transition-all duration-300 shadow-sm cursor-help relative group"
                            />
                            {/* Kalan Bar */}
                            <div
                              onMouseEnter={() => setHoveredBar({ region: data.name, type: "Stokta Bulunan (Kalan)", value: data.kalan })}
                              onMouseLeave={() => setHoveredBar(null)}
                              style={{ height: `${Math.max(kalanHeight, 2)}%` }}
                              className="w-3 bg-[#e9c46a] hover:bg-[#f0d48f] rounded-t-lg transition-all duration-300 shadow-sm cursor-help relative group"
                            />
                          </div>
                          <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider truncate max-w-full text-center">
                            {data.name.replace("Kafe", "")}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tooltip Overlay */}
                  {hoveredBar && (
                    <div className="absolute top-4 left-4 z-20 bg-zinc-950/90 border border-white/10 rounded-2xl p-3 shadow-xl backdrop-blur-md animate-fadeIn text-[10px] space-y-0.5 animate-slideUp">
                      <div className="font-extrabold text-orange-500">{hoveredBar.region}</div>
                      <div className="text-zinc-400 font-semibold">{hoveredBar.type}</div>
                      <div className="text-emerald-400 font-black font-mono text-xs">{hoveredBar.value.toLocaleString("tr-TR")} Birim</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Konsolide Oranlar (Pie-Ratio Analizi) */}
              <div className="border border-[var(--border)]/40 rounded-3xl p-5 bg-[var(--background)]/35 flex flex-col justify-between">
                <div>
                  <h4 className="text-[11px] font-black uppercase text-zinc-400 tracking-wider mb-3">
                    GENEL STOK DURUM ORANLARI
                  </h4>
                  {(() => {
                    const totalG = chartData.reduce((acc, curr) => acc + curr.girdi, 0);
                    const totalC = chartData.reduce((acc, curr) => acc + curr.cikti, 0);
                    const totalK = chartData.reduce((acc, curr) => acc + curr.kalan, 0);
                    const totalSum = totalG + totalC + totalK || 1;

                    const pG = (totalG / totalSum) * 100;
                    const pC = (totalC / totalSum) * 100;
                    const pK = (totalK / totalSum) * 100;

                    return (
                      <div className="space-y-4">
                        {/* Bar Oran */}
                        <div className="h-6 w-full rounded-2xl bg-zinc-800 overflow-hidden flex shadow-inner">
                          {totalG > 0 && <div style={{ width: `${pG}%` }} className="h-full bg-[#2a9d8f] transition-all" title="Girdi" />}
                          {totalC > 0 && <div style={{ width: `${pC}%` }} className="h-full bg-[#e76f51] transition-all" title="Çıktı" />}
                          {totalK > 0 && <div style={{ width: `${pK}%` }} className="h-full bg-[#e9c46a] transition-all" title="Kalan" />}
                        </div>

                        {/* Detaylar */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between border-b border-[var(--border)]/20 pb-1.5">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase">Siparişten Gelen (Girdi)</span>
                            <span className="text-[11px] font-bold font-mono text-[#2a9d8f]">%{pG.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-[var(--border)]/20 pb-1.5">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase">Çıkış Yapan (Çıktı)</span>
                            <span className="text-[11px] font-bold font-mono text-[#e76f51]">%{pC.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center justify-between pb-1">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase">Stokta Bulunan (Kalan)</span>
                            <span className="text-[11px] font-bold font-mono text-[#e9c46a]">%{pK.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="text-[9px] text-zinc-500 font-semibold bg-[var(--card)] p-2.5 rounded-2xl border border-[var(--border)]/20 text-center uppercase tracking-wider mt-4">
                  {selectedCategory === "Tümü" ? "Tüm Kategoriler Dahil" : `${selectedCategory} Kategorisi Verileri`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtre ve Arama Çubuğu */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-4 shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text"
              placeholder="Ürün adı veya malzeme ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-[var(--foreground)] placeholder-zinc-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat 
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" 
                    : "bg-[var(--background)] border border-[var(--border)] text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {cat.replace("Ve Bitki Çayları", "").replace("Çeşitleri", "")}
              </button>
            ))}
          </div>
        </div>

        {/* Konsolide Tablo */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-6 shadow-sm overflow-hidden">
          <div className="mb-4">
            <h3 
              style={{ fontFamily: "'Getai Grotesk', sans-serif" }}
              className="text-base font-black uppercase text-zinc-800 dark:text-zinc-200 tracking-tight"
            >
              Şube Bazlı Konsolide Stok Tablosu
            </h3>
            <p className="text-[10px] text-zinc-500 uppercase font-bold mt-1">Kritik stok seviyesine düşen hücreler kırmızı çerçeve ile belirtilir.</p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
              <span className="text-xs text-zinc-500 font-bold">5 Bölgenin stok verileri bulut veritabanından çekiliyor...</span>
            </div>
          ) : uniqueItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
              <AlertTriangle className="w-12 h-12 text-zinc-600" />
              <span className="text-sm font-bold text-zinc-400">Aranan kriterlere uygun ürün bulunamadı.</span>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <div className="inline-block min-w-full align-middle px-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                      <th className="py-4 pr-4">Ürün Adı</th>
                      <th className="py-4 px-4">Kategori</th>
                      <th className="py-4 px-4">Birim</th>
                      {regions.map(r => (
                        <th key={r.id} className="py-4 px-4 text-center">{r.name}</th>
                      ))}
                      <th className="py-4 pl-4 text-right">Toplam Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]/40 text-xs">
                    {uniqueItems.map((item) => {
                      // Her şubenin stok sayılarını çıkaralım
                      const counts = regions.map(reg => {
                        const found = regionStocks.find(rs => rs.regionId === reg.id)?.items.find(i => i.name === item.name);
                        return {
                          regionId: reg.id,
                          qty: found ? found.quantity : 0,
                          minLimit: found ? found.minLimit : item.minLimit
                        };
                      });

                      const totalQty = counts.reduce((acc, curr) => acc + curr.qty, 0);

                      return (
                        <tr key={item.name} className="hover:bg-[var(--background)]/35 transition-colors">
                          <td className="py-3.5 pr-4 font-black text-zinc-800 dark:text-zinc-200">
                            {item.name}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                            {item.category.replace("Ve Bitki Çayları", "").replace("Çeşitleri", "")}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-500 font-semibold font-mono">
                            {item.unit}
                          </td>
                          {counts.map((c) => {
                            const isCritical = c.qty <= c.minLimit;
                            return (
                              <td key={c.regionId} className="py-3.5 px-4 text-center">
                                <span className={`inline-block px-3 py-1.5 rounded-xl font-bold font-mono text-[11px] ${
                                  isCritical 
                                    ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                                    : "bg-zinc-850/60 text-zinc-400 dark:text-zinc-300 border border-transparent"
                                }`}>
                                  {c.qty}
                                </span>
                              </td>
                            );
                          })}
                          <td className="py-3.5 pl-4 text-right font-black font-mono text-orange-500 text-sm">
                            {totalQty.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-5 py-3 rounded-2xl text-xs font-bold shadow-xl backdrop-blur-md animate-slideUp">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
