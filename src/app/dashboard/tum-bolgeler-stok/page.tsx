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
import { getDynamicRegions, BranchRegion } from "@/lib/userService";
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

  const [regionsList, setRegionsList] = useState<BranchRegion[]>([
    { id: "degirmen-kafe", name: "Değirmen Kafe" },
    { id: "13-eylul-vargel-kafe", name: "13 Eylül Vargel" },
    { id: "millet-bahcesi-vargel-kafe", name: "Millet Bahçesi Vargel" },
    { id: "vargel-karavan", name: "Vargel Karavan" },
    { id: "vargel-kitap-kafe", name: "Vargel Kitap" }
  ]);
  const [selectedProductForAnalysis, setSelectedProductForAnalysis] = useState<string | null>(null);

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
      const dynamicRegions = await getDynamicRegions();
      setRegionsList(dynamicRegions);
      const promises = dynamicRegions.map(async (r) => {
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
    return regionsList.map(reg => {
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

  // Ürün Tüketim (Depodan Alınan) Hesaplayıcıları
  const getProductsConsumption = () => {
    const products: { name: string; category: string; unit: string; totalConsumed: number; regionalBreakdown: Record<string, number> }[] = [];
    
    uniqueItems.forEach(item => {
      let totalConsumed = 0;
      const regionalBreakdown: Record<string, number> = {};
      
      regionsList.forEach(reg => {
        const found = regionStocks.find(rs => rs.regionId === reg.id)?.items.find(i => i.name === item.name);
        const consumed = found ? (found.depodanAlinan || 0) : 0;
        totalConsumed += consumed;
        regionalBreakdown[reg.id] = consumed;
      });
      
      products.push({
        name: item.name,
        category: item.category,
        unit: item.unit,
        totalConsumed,
        regionalBreakdown
      });
    });
    
    return products.sort((a, b) => b.totalConsumed - a.totalConsumed);
  };

  const productsConsumption = getProductsConsumption();
  const topMovingProducts = productsConsumption.slice(0, 5);
  const activeProduct = selectedProductForAnalysis || (topMovingProducts.length > 0 ? topMovingProducts[0].name : null);
  const activeProductData = productsConsumption.find(p => p.name === activeProduct) || null;
  const otherProducts = productsConsumption.filter(p => p.name !== (activeProductData?.name || ""));

  const maxTopMovingConsumed = Math.max(...topMovingProducts.map(p => p.totalConsumed), 1);
  const regionColors = ["#2a9d8f", "#e76f51", "#e9c46a", "#f4a261", "#3b82f6"];
  const activeProductConsumedByRegion = regionsList.map((reg, idx) => {
    const value = activeProductData ? (activeProductData.regionalBreakdown[reg.id] || 0) : 0;
    return {
      id: reg.id,
      name: reg.name,
      value,
      color: regionColors[idx % regionColors.length]
    };
  });
  const totalActiveProductConsumed = activeProductData ? activeProductData.totalConsumed : 0;
  const radius = 35;
  const circumference = 2 * Math.PI * radius;

  // Excel/CSV Dışa Aktarım
  const exportToCSV = () => {
    if (regionStocks.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Urun Adi,Kategori,Birim,Degirmen Kafe,13 Eylul Vargel,Millet Bahcesi Vargel,Vargel Karavan,Vargel Kitap,Toplam\n";

    uniqueItems.forEach(item => {
      const counts = regionsList.map(reg => {
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
              <span className="text-xl font-black mt-0.5 block">{regionsList.length} Bölge</span>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2">
            
            {/* CARD 1: En Hızlı Giden Ürünler (Top Moving) */}
            <div className="col-span-12 lg:col-span-4 bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between h-[450px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">TÜKETİM ANALİZİ</span>
                  <span className="text-[9px] bg-orange-500/10 text-orange-500 font-extrabold uppercase px-2.5 py-1 rounded-full border border-orange-500/20">En Hızlı Gidenler</span>
                </div>
                
                {/* Highlight/Summary */}
                <div className="space-y-1 mb-6">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Lider Tüketim</span>
                  <h4 className="text-xl font-extrabold tracking-tight truncate text-[var(--foreground)]">{activeProductData?.name || "Yükleniyor..."}</h4>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black font-mono text-orange-500">{activeProductData?.totalConsumed || 0}</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">{activeProductData?.unit || "Birim"}</span>
                  </div>
                </div>
              </div>

              {/* Vertical Column Chart (Top 5) */}
              <div className="flex items-end justify-between h-48 border-t border-[var(--border)]/30 pt-6">
                {topMovingProducts.map((p, idx) => {
                  const barHeight = (p.totalConsumed / maxTopMovingConsumed) * 80;
                  const isSelected = p.name === activeProduct;
                  return (
                    <div 
                      key={p.name} 
                      onClick={() => setSelectedProductForAnalysis(p.name)}
                      className="flex flex-col items-center flex-1 cursor-pointer group"
                    >
                      <div className="h-32 w-full flex items-end justify-center relative">
                        <div 
                          style={{ height: `${Math.max(barHeight, 6)}%` }}
                          className={`w-5 rounded-t-lg transition-all duration-300 relative ${
                            isSelected 
                              ? "bg-gradient-to-t from-[#e76f51] to-[#f4a261] shadow-md shadow-orange-500/10 scale-105" 
                              : "bg-zinc-700/40 hover:bg-zinc-600/60 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/90"
                          }`}
                        >
                          {/* Tooltip */}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-950 border border-white/10 text-white text-[9px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none shadow-xl">
                            {p.totalConsumed} {p.unit}
                          </div>
                        </div>
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-wider text-center mt-2.5 truncate w-full px-0.5 ${isSelected ? "text-orange-500" : "text-zinc-500"}`}>
                        {p.name.slice(0, 10)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CARD 2: Bölgesel Tüketim Dağılımı (Doughnut Chart) */}
            <div className="col-span-12 lg:col-span-5 bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between h-[450px]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase text-zinc-800 dark:text-zinc-200 tracking-tight flex items-center gap-1.5">
                    ŞUBE DAĞILIMI
                  </h3>
                  <p className="text-[9px] text-zinc-500 uppercase font-bold mt-0.5">Seçili ürünün tüketim bölgeleri</p>
                </div>
                <span className="text-[9px] font-extrabold text-zinc-400 border border-[var(--border)] px-2.5 py-1 rounded-full uppercase bg-[var(--background)]/40 truncate max-w-[120px]">
                  {activeProduct || "Seçim Yok"}
                </span>
              </div>

              {/* Doughnut SVG Container */}
              <div className="relative flex items-center justify-center my-4 h-40">
                <svg width="150" height="150" viewBox="0 0 100 100" className="select-none transform -rotate-90">
                  {/* Underlay base circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke={theme === 'dark' ? '#27272a' : '#e4e4e7'}
                    strokeWidth="9"
                  />
                  {/* Segment circles */}
                  {(() => {
                    let currentOffset = 0;
                    return activeProductConsumedByRegion.map((regData) => {
                      if (totalActiveProductConsumed === 0) return null;
                      const percent = regData.value / totalActiveProductConsumed;
                      if (percent === 0) return null;

                      const strokeLength = percent * circumference;
                      const strokeOffset = currentOffset;
                      currentOffset -= strokeLength;

                      return (
                        <circle
                          key={regData.id}
                          cx="50"
                          cy="50"
                          r={radius}
                          fill="transparent"
                          stroke={regData.color}
                          strokeWidth="9"
                          strokeDasharray={`${strokeLength} ${circumference}`}
                          strokeDashoffset={strokeOffset}
                          strokeLinecap="round"
                          className="transition-all duration-500 cursor-help"
                        >
                          <title>{`${regData.name}: ${regData.value}`}</title>
                        </circle>
                      );
                    });
                  })()}
                </svg>

                {/* Central Labels inside Doughnut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-0.5 pointer-events-none">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">TOPLAM</span>
                  <span className="text-xl font-black font-mono text-[var(--foreground)]">{totalActiveProductConsumed}</span>
                  <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{activeProductData?.unit || "Birim"}</span>
                </div>
              </div>

              {/* Legend grid */}
              <div className="grid grid-cols-2 gap-2.5 border-t border-[var(--border)]/30 pt-4 max-h-[140px] overflow-y-auto pr-1 no-scrollbar">
                {activeProductConsumedByRegion.map((regData) => {
                  const percent = totalActiveProductConsumed > 0 ? ((regData.value / totalActiveProductConsumed) * 100) : 0;
                  return (
                    <div key={regData.id} className="flex items-start gap-1.5 text-[9px]">
                      <span style={{ backgroundColor: regData.color }} className="w-2 h-2 rounded-full mt-1 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-zinc-500 font-bold block truncate uppercase">{regData.name.replace("Kafe", "")}</span>
                        <span className="font-extrabold text-zinc-850 dark:text-zinc-300 font-mono">
                          {regData.value} {activeProductData?.unit} (%{percent.toFixed(0)})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CARD 3: Diğer Ürünlerin Tüketim Listesi (Last Transactions equivalent) */}
            <div className="col-span-12 lg:col-span-3 bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-6 shadow-sm flex flex-col h-[450px]">
              <div className="mb-4">
                <h3 className="text-xs font-black uppercase text-zinc-800 dark:text-zinc-200 tracking-tight">
                  TÜKETİM LİSTESİ
                </h3>
                <p className="text-[9px] text-zinc-500 uppercase font-bold mt-0.5">Tüm ürün tüketim miktarları</p>
              </div>

              {/* List container */}
              <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-3">
                {productsConsumption.map((p) => {
                  const isSelected = p.name === activeProduct;
                  return (
                    <div 
                      key={p.name}
                      onClick={() => setSelectedProductForAnalysis(p.name)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all duration-150 cursor-pointer ${
                        isSelected 
                          ? "bg-orange-500/10 border-orange-500/35 text-orange-400 animate-pulse" 
                          : "bg-[var(--background)]/30 border-[var(--border)]/40 hover:bg-[var(--foreground)]/5 hover:border-orange-500/20 text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-orange-500/15 text-orange-400" : "bg-zinc-800/40 text-zinc-500"
                        }`}>
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-[10px] block truncate text-zinc-200 group-hover:text-orange-500">
                            {p.name}
                          </span>
                          <span className="text-[8px] text-zinc-500 uppercase font-bold block truncate">
                            {p.category.slice(0, 15)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-lg ${
                          p.totalConsumed > 0 
                            ? "bg-red-500/10 text-red-400" 
                            : "bg-zinc-800/40 text-zinc-500"
                        }`}>
                          {p.totalConsumed > 0 ? `-${p.totalConsumed}` : "0"} {p.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
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
                      {regionsList.map((r: BranchRegion) => (
                        <th key={r.id} className="py-4 px-4 text-center">{r.name}</th>
                      ))}
                      <th className="py-4 pl-4 text-right">Toplam Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]/40 text-xs">
                    {uniqueItems.map((item) => {
                      const counts = regionsList.map((reg: BranchRegion) => {
                        const found = regionStocks.find(rs => rs.regionId === reg.id)?.items.find(i => i.name === item.name);
                        return {
                          regionId: reg.id,
                          qty: found ? found.quantity : 0,
                          minLimit: found ? found.minLimit : item.minLimit
                        };
                      });

                      const totalQty = counts.reduce((acc: number, curr: { qty: number }) => acc + curr.qty, 0);

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
                          {counts.map((c: { regionId: string; qty: number; minLimit: number }) => {
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
