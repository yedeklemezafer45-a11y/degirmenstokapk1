"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Moon, 
  Sun, 
  LogOut, 
  Search, 
  Plus, 
  Minus, 
  AlertTriangle, 
  ShoppingCart, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  MessageSquare,
  Package,
  Layers,
  CupSoda
} from "lucide-react";
import { subscribeToStocks } from "@/lib/stockService";
import { StockItem, isProductAllowedForRegion } from "@/lib/stockStore";
import { useRouter } from "next/navigation";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: "Adet" | "Kg" | "Koli" | "Kutu";
  category?: string;
}

export default function SiparisPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [userRole, setUserRole] = useState<string>("waiter");
  const [userFullName, setUserFullName] = useState<string>("Personel");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [isLoading, setIsLoading] = useState(true);

  // Bölge State'leri
  const [selectedRegion, setSelectedRegion] = useState("degirmen-kafe");
  const [selectedRegionName, setSelectedRegionName] = useState("Değirmen Kafe");

  // Sipariş Draft State (ID -> { quantity, unit })
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [units, setUnits] = useState<Record<string, "Adet" | "Kg" | "Koli" | "Kutu">>({});

  // Sepet Tab Seçimi ("general" = Genel Malzemeler, "soft" = Soft İçecekler)
  const [activeCartTab, setActiveCartTab] = useState<"general" | "soft">("general");

  // 1. Genel Malzemeler Sepeti
  const [generalOrderItems, setGeneralOrderItems] = useState<OrderItem[]>([]);
  const [generalOrderNote, setGeneralOrderNote] = useState("");

  // 2. Soft İçecekler Sepeti (Ayrı Sepet)
  const [softDrinkOrderItems, setSoftDrinkOrderItems] = useState<OrderItem[]>([]);
  const [softDrinkOrderNote, setSoftDrinkOrderNote] = useState("");

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
      setUserFullName(parsed.fullName || parsed.name || parsed.username || "Personel");
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

  // Sepete ürün ekle (Soft İçecekler otomatik olarak Soft Sepetine, diğerleri Genel Sepete gider)
  const handleAddToOrder = (item: StockItem) => {
    const qty = quantities[item.id] || 1;
    const defaultUnit: "Adet" | "Kg" | "Koli" | "Kutu" = item.unit === "kg" ? "Kg" : (item.unit === "Koli" ? "Koli" : (item.unit === "Kutu" ? "Kutu" : "Adet"));
    const unit = units[item.id] || defaultUnit;

    if (qty <= 0) {
      triggerToast("Lütfen geçerli bir miktar girin!");
      return;
    }

    const isSoftDrink = item.category === "Soft İçecek Ürünleri";

    if (isSoftDrink) {
      setSoftDrinkOrderItems(prev => {
        const existingIdx = prev.findIndex(o => o.id === item.id && o.unit === unit);
        if (existingIdx > -1) {
          const updated = [...prev];
          updated[existingIdx].quantity += qty;
          return updated;
        }
        return [...prev, { id: item.id, name: item.name, quantity: qty, unit, category: item.category }];
      });
      setActiveCartTab("soft");
      triggerToast(`🥤 "${item.name}" Soft İçecek Sepetine eklendi!`);
    } else {
      setGeneralOrderItems(prev => {
        const existingIdx = prev.findIndex(o => o.id === item.id && o.unit === unit);
        if (existingIdx > -1) {
          const updated = [...prev];
          updated[existingIdx].quantity += qty;
          return updated;
        }
        return [...prev, { id: item.id, name: item.name, quantity: qty, unit, category: item.category }];
      });
      triggerToast(`📦 "${item.name}" Genel Sipariş Sepetine eklendi!`);
    }

    // Miktarı sıfırla
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
  };

  // Genel Sepetten ürün sil
  const handleRemoveFromGeneralOrder = (itemId: string, unit: string) => {
    setGeneralOrderItems(prev => prev.filter(o => !(o.id === itemId && o.unit === unit)));
    triggerToast("Ürün genel sepetten çıkarıldı.");
  };

  // Soft İçecek Sepetinden ürün sil
  const handleRemoveFromSoftOrder = (itemId: string, unit: string) => {
    setSoftDrinkOrderItems(prev => prev.filter(o => !(o.id === itemId && o.unit === unit)));
    triggerToast("Ürün soft içecek sepetinden çıkarıldı.");
  };

  // Genel Siparişi WhatsApp'a Gönder
  const handleCompleteGeneralOrder = () => {
    if (generalOrderItems.length === 0) {
      triggerToast("Genel sipariş sepetiniz boş!");
      return;
    }

    const todayStr = new Date().toLocaleDateString("tr-TR");
    const timeStr = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    
    let text = `*☕ ${selectedRegionName.toUpperCase()} GENEL MALZEME SİPARİŞİ ☕*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*📅 Tarih:* ${todayStr} ${timeStr}\n`;
    text += `*📍 Şube:* ${selectedRegionName}\n`;
    text += `*👤 Siparişi Geçen:* ${userFullName}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `*📋 SİPARİŞ EDİLEN MALZEMELER:*\n`;

    generalOrderItems.forEach((o, index) => {
      text += `${index + 1}. • ${o.quantity} ${o.unit} - *${o.name}*\n`;
    });

    if (generalOrderNote.trim()) {
      text += `\n*💬 Sipariş Notu / Açıklama:*\n_${generalOrderNote.trim()}_\n`;
    }
    
    text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_Bu sipariş envanter yönetim paneli üzerinden otomatik oluşturulmuştur._`;

    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, "_blank");
    triggerToast("Genel sipariş için WhatsApp'a yönlendiriliyorsunuz... 💬");
  };

  // Soft İçecek Siparişini WhatsApp'a Gönder (Ayrı WhatsApp Butonu)
  const handleCompleteSoftDrinkOrder = () => {
    if (softDrinkOrderItems.length === 0) {
      triggerToast("Soft İçecek sepetiniz boş!");
      return;
    }

    const todayStr = new Date().toLocaleDateString("tr-TR");
    const timeStr = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    
    let text = `*🥤 ${selectedRegionName.toUpperCase()} SOFT İÇECEK SİPARİŞİ 🥤*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*📅 Tarih:* ${todayStr} ${timeStr}\n`;
    text += `*📍 Şube:* ${selectedRegionName}\n`;
    text += `*👤 Siparişi Geçen:* ${userFullName}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `*🧊 SİPARİŞ EDİLEN SOFT İÇECEKLER:*\n`;

    softDrinkOrderItems.forEach((o, index) => {
      text += `${index + 1}. • ${o.quantity} ${o.unit} - *${o.name}*\n`;
    });

    if (softDrinkOrderNote.trim()) {
      text += `\n*💬 Sipariş Notu / Açıklama:*\n_${softDrinkOrderNote.trim()}_\n`;
    }
    
    text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_Bu soft içecek siparişi envanter yönetim paneli üzerinden otomatik oluşturulmuştur._`;

    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, "_blank");
    triggerToast("Soft İçecek siparişi için WhatsApp'a yönlendiriliyorsunuz... 💬");
  };

  const displayedStockList = stockList.filter(item => {
    if (selectedRegion === "degirmen-kafe" && (item.category === "Soft İçecek Ürünleri" || item.category === "Pastalar")) {
      return false;
    }
    return isProductAllowedForRegion(selectedRegion, item);
  });

  const orderableStock = displayedStockList.filter(item => item.orderable !== false);

  const categories = ["Tümü", ...Array.from(new Set(orderableStock.map(i => i.category))).sort((a, b) => a.localeCompare(b, "tr"))];

  const filteredStock = orderableStock.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Tümü" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Kritik Stoktaki Ürünler (Sipariş edilebilir olanlar arasından)
  const criticalItems = orderableStock.filter(item => item.quantity <= item.minLimit);

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
            <h1 className="font-bold text-lg tracking-tight">Sipariş Paneli</h1>
            <p className="text-xs text-zinc-500">{selectedRegionName} · Yeni Malzeme Sipariş Talebi</p>
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 pb-24">
        
        {/* KRİTİK LİMİTTEKİ ÜRÜNLER BANNERI (Uyarılı Görünüm) */}
        {criticalItems.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden animate-pulse">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider">DİKKAT: STOKTA KRİTİK LİMİTTEKİ ÜRÜNLER!</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Aşağıdaki ürünlerin miktarı asgari seviyenin altına düşmüştür. Hızlıca ilgili sipariş sepetine eklemek için üzerlerine tıklayabilirsiniz.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              {criticalItems.map(item => {
                const isSoft = item.category === "Soft İçecek Ürünleri";
                return (
                  <div 
                    key={item.id}
                    onClick={() => {
                      setQuantities(prev => ({ ...prev, [item.id]: 1 }));
                      const defaultUnit: "Adet" | "Kg" | "Koli" | "Kutu" = item.unit === "kg" ? "Kg" : (item.unit === "Koli" ? "Koli" : (item.unit === "Kutu" ? "Kutu" : "Adet"));
                      setUnits(prev => ({ ...prev, [item.id]: defaultUnit }));
                      handleAddToOrder(item);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 border text-[10px] font-bold rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all select-none ${
                      isSoft 
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30" 
                        : "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                    }`}
                  >
                    <span>{isSoft ? "🥤 " : ""}{item.name} ({item.quantity} Kalan)</span>
                    <span className={`w-4 h-4 rounded-lg flex items-center justify-center font-black ${
                      isSoft ? "bg-cyan-500 text-zinc-950" : "bg-red-500 text-zinc-950"
                    }`}>+</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Sol Kısım: Ürünler Grid (2 Sütun genişliğinde) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Arama & Filtreleme */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-4 shadow-sm">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text"
                  placeholder="Sipariş edilecek ürünü ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-[var(--foreground)] placeholder-zinc-500"
                />
              </div>
            </div>

            {/* Kategori Seçiciler */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSoft = cat === "Soft İçecek Ürünleri";
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedCategory === cat 
                        ? (isSoft ? "bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/20" : "bg-orange-500 text-white shadow-md shadow-orange-500/20")
                        : (isSoft ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:text-cyan-200" : "bg-[var(--card)] border border-[var(--border)] text-zinc-400 hover:text-zinc-200")
                    }`}
                  >
                    {isSoft && <CupSoda className="w-3.5 h-3.5" />}
                    {cat.replace("Ve Bitki Çayları", "").replace("Çeşitleri", "")}
                  </button>
                );
              })}
            </div>

            {/* Ürün Listesi */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-6 shadow-sm">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                  <span className="text-xs text-zinc-500 font-bold">Sipariş verilebilir ürünler yükleniyor...</span>
                </div>
              ) : filteredStock.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                  <Layers className="w-12 h-12 text-zinc-600" />
                  <span className="text-sm font-bold text-zinc-400">Aranılan kriterde ürün bulunmuyor.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredStock.map((item) => {
                    const activeQty = quantities[item.id] || 1;
                    const defaultUnit: "Adet" | "Kg" | "Koli" | "Kutu" = item.unit === "kg" ? "Kg" : (item.unit === "Koli" ? "Koli" : (item.unit === "Kutu" ? "Kutu" : "Adet"));
                    const activeUnit = units[item.id] || defaultUnit;
                    const isCritical = item.quantity <= item.minLimit;
                    const isSoft = item.category === "Soft İçecek Ürünleri";

                    return (
                      <div 
                        key={item.id}
                        className={`bg-[var(--background)]/40 border rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 group ${
                          isSoft ? "border-cyan-500/25 hover:border-cyan-500/60" : "border-[var(--border)] hover:border-orange-500/30"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className={`text-xs font-black transition-colors ${
                              isSoft ? "text-cyan-400 group-hover:text-cyan-300" : "text-zinc-800 dark:text-zinc-200 group-hover:text-orange-400"
                            }`}>
                              {item.name}
                            </span>
                            {isCritical && (
                              <span className="px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 font-black text-[9px] uppercase tracking-wider shrink-0">
                                Kritik Stok
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                              {item.category} · Kalan: {item.quantity} {item.unit}
                            </span>
                            {isSoft && (
                              <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-[8px] font-extrabold uppercase tracking-wider">
                                Soft İçecek
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Miktar ve Birim Belirleme Arayüzü */}
                        <div className="space-y-3 pt-2">
                          
                          {/* Paket Türü Seçiciler (Adet / Kg / Koli / Kutu) */}
                          <div className="grid grid-cols-4 gap-1.5">
                            {(["Adet", "Kg", "Koli", "Kutu"] as const).map((u) => (
                              <button
                                key={u}
                                onClick={() => setUnits(prev => ({ ...prev, [item.id]: u }))}
                                className={`py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                                  activeUnit === u
                                    ? (isSoft ? "bg-cyan-500 border-cyan-500 text-zinc-950 font-black" : "bg-orange-500 border-orange-500 text-white")
                                    : "bg-[var(--card)] border-[var(--border)] text-zinc-500 hover:text-zinc-300"
                                }`}
                              >
                                {u}
                              </button>
                            ))}
                          </div>

                          {/* Miktar Arttır / Azalt & Ekle Butonu */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1 bg-[var(--card)] border border-[var(--border)] rounded-xl p-1 shrink-0 select-none">
                              <button 
                                onClick={() => setQuantities(prev => ({ ...prev, [item.id]: Math.max(1, activeQty - 1) }))}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--foreground)]/5 text-zinc-400 hover:text-[var(--foreground)] cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input 
                                type="number" 
                                min="1"
                                value={activeQty}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  setQuantities(prev => ({ ...prev, [item.id]: Math.max(1, val) }));
                                }}
                                className="w-10 text-center font-bold text-xs bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-[var(--foreground)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button 
                                onClick={() => setQuantities(prev => ({ ...prev, [item.id]: activeQty + 1 }))}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--foreground)]/5 text-zinc-400 hover:text-[var(--foreground)] cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              onClick={() => handleAddToOrder(item)}
                              className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] font-black rounded-xl py-2.5 transition-all cursor-pointer uppercase tracking-wider shadow-sm active:scale-95 ${
                                isSoft
                                  ? "bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
                                  : "bg-[#e76f51] hover:bg-[#eb8870] dark:bg-[#a6442d] dark:hover:bg-[#c25137] text-white"
                              }`}
                            >
                              {isSoft ? <CupSoda className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              {isSoft ? "Soft Sepete Ekle" : "Sepete Ekle"}
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Sağ Kısım: İKİ AYRI SİPARİŞ SEPETİ (Genel Malzemeler & Soft İçecekler) */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-6 shadow-sm space-y-6 sticky top-24">
            
            {/* Sepet Sekme Başlıkları */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-[var(--background)]/70 border border-[var(--border)] rounded-2xl">
              <button
                onClick={() => setActiveCartTab("general")}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeCartTab === "general"
                    ? "bg-orange-500 text-white shadow-md"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Package className="w-4 h-4 shrink-0" />
                <span>Genel Sepet</span>
                {generalOrderItems.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-white text-orange-600">
                    {generalOrderItems.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveCartTab("soft")}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeCartTab === "soft"
                    ? "bg-cyan-500 text-zinc-950 shadow-md font-black"
                    : "text-zinc-400 hover:text-cyan-400"
                }`}
              >
                <CupSoda className="w-4 h-4 shrink-0" />
                <span>Soft İçecekler</span>
                {softDrinkOrderItems.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-zinc-950 text-cyan-400">
                    {softDrinkOrderItems.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: GENEL MALZEME SEPETİ */}
            {activeCartTab === "general" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]/60">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
                    <Package className="w-4 h-4" />
                    Genel Malzeme Sepeti
                  </h3>
                  <span className="text-[10px] font-bold text-zinc-400">
                    {generalOrderItems.length} Kalem
                  </span>
                </div>

                {generalOrderItems.length === 0 ? (
                  <div className="py-12 text-center space-y-2 text-zinc-500">
                    <Package className="w-10 h-10 mx-auto text-zinc-600" />
                    <p className="text-xs font-bold">Genel malzeme sepetiniz boş.</p>
                    <p className="text-[10px] text-zinc-600">Kahve, şurup, sos, süt ve diğer ürünleri ekleyin.</p>
                  </div>
                ) : (
                  <>
                    {/* Sepet Listesi */}
                    <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 no-scrollbar">
                      {generalOrderItems.map((o) => (
                        <div 
                          key={`${o.id}-${o.unit}`}
                          className="p-3 bg-[var(--background)]/50 border border-[var(--border)]/65 rounded-2xl flex items-center justify-between text-xs animate-fadeIn"
                        >
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block">{o.name}</span>
                            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                              {o.quantity} {o.unit}
                            </span>
                          </div>

                          <button
                            onClick={() => handleRemoveFromGeneralOrder(o.id, o.unit)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Sepetten Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Sipariş Notu / Açıklama */}
                    <div className="space-y-1.5 border-t border-[var(--border)]/60 pt-3">
                      <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">Genel Sipariş Notu</label>
                      <textarea
                        placeholder="Genel sipariş için not veya açıklama giriniz..."
                        value={generalOrderNote}
                        onChange={(e) => setGeneralOrderNote(e.target.value)}
                        rows={2}
                        className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-[var(--foreground)] placeholder-zinc-500 resize-none"
                      />
                    </div>

                    {/* Genel Siparişi Tamamla WhatsApp */}
                    <button
                      onClick={handleCompleteGeneralOrder}
                      className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-zinc-950 font-black py-3.5 px-6 rounded-2xl text-xs transition-all shadow-lg shadow-emerald-500/10 cursor-pointer uppercase tracking-wider active:scale-95"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0" />
                      Genel Siparişi WhatsApp'a Gönder
                    </button>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: SOFT İÇECEK SEPETİ (Ayrı Sepet & Ayrı WhatsApp Butonu) */}
            {activeCartTab === "soft" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]/60">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <CupSoda className="w-4 h-4" />
                    Soft İçecek Sepeti
                  </h3>
                  <span className="text-[10px] font-bold text-cyan-400">
                    {softDrinkOrderItems.length} Kalem
                  </span>
                </div>

                {softDrinkOrderItems.length === 0 ? (
                  <div className="py-12 text-center space-y-2 text-zinc-500">
                    <CupSoda className="w-10 h-10 mx-auto text-cyan-500/40" />
                    <p className="text-xs font-bold text-zinc-300">Soft içecek sepetiniz boş.</p>
                    <p className="text-[10px] text-zinc-500">Sol menüden Kola, Fanta, Ice Tea, Su ve diğer soft içecekleri ekleyebilirsiniz.</p>
                  </div>
                ) : (
                  <>
                    {/* Sepet Listesi */}
                    <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 no-scrollbar">
                      {softDrinkOrderItems.map((o) => (
                        <div 
                          key={`${o.id}-${o.unit}`}
                          className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-2xl flex items-center justify-between text-xs animate-fadeIn"
                        >
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-zinc-200 block">{o.name}</span>
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                              {o.quantity} {o.unit}
                            </span>
                          </div>

                          <button
                            onClick={() => handleRemoveFromSoftOrder(o.id, o.unit)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Sepetten Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Soft İçecek Sipariş Notu */}
                    <div className="space-y-1.5 border-t border-[var(--border)]/60 pt-3">
                      <label className="text-[10px] text-cyan-400 uppercase font-black tracking-widest block">Soft İçecek Sipariş Notu</label>
                      <textarea
                        placeholder="Soft içecek tedarikçisine iletilecek not giriniz..."
                        value={softDrinkOrderNote}
                        onChange={(e) => setSoftDrinkOrderNote(e.target.value)}
                        rows={2}
                        className="w-full bg-[var(--background)] border border-cyan-500/30 rounded-2xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 text-[var(--foreground)] placeholder-zinc-500 resize-none"
                      />
                    </div>

                    {/* Soft İçecek Siparişini WhatsApp'a Gönder (Ayrı Buton) */}
                    <button
                      onClick={handleCompleteSoftDrinkOrder}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-zinc-950 font-black py-3.5 px-6 rounded-2xl text-xs transition-all shadow-lg shadow-teal-500/10 cursor-pointer uppercase tracking-wider active:scale-95"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0" />
                      Soft İçecek Siparişini WhatsApp'a Gönder
                    </button>
                  </>
                )}
              </div>
            )}

            {/* İki sepetin durum özeti */}
            {(generalOrderItems.length > 0 || softDrinkOrderItems.length > 0) && (
              <div className="pt-2 border-t border-[var(--border)]/60 flex items-center justify-between text-[10px] text-zinc-500">
                <span>Genel: <b className="text-orange-500">{generalOrderItems.length}</b></span>
                <span>Soft İçecek: <b className="text-cyan-400">{softDrinkOrderItems.length}</b></span>
                <span>Toplam: <b className="text-zinc-300">{generalOrderItems.length + softDrinkOrderItems.length}</b></span>
              </div>
            )}

          </div>

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
