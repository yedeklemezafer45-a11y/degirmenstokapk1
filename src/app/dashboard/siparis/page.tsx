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
  Layers
} from "lucide-react";
import { subscribeToStocks } from "@/lib/stockService";
import { StockItem, isProductAllowedForRegion } from "@/lib/stockStore";
import { useRouter } from "next/navigation";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: "Adet" | "Kg" | "Koli" | "Kutu";
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

  // Sepetteki Sipariş Listesi
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderNote, setOrderNote] = useState("");

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

  // Sepete ürün ekle
  const handleAddToOrder = (item: StockItem) => {
    const qty = quantities[item.id] || 1;
    const unit = units[item.id] || (item.unit === "kg" ? "Kg" : "Adet");

    if (qty <= 0) {
      triggerToast("Lütfen geçerli bir miktar girin!");
      return;
    }

    setOrderItems(prev => {
      // Zaten var mı kontrol et
      const existingIdx = prev.findIndex(o => o.id === item.id && o.unit === unit);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += qty;
        return updated;
      }
      return [...prev, { id: item.id, name: item.name, quantity: qty, unit }];
    });

    // Miktarı sıfırla
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
    triggerToast(`✅ "${item.name}" sipariş sepetine eklendi!`);
  };

  // Sepetten ürün sil
  const handleRemoveFromOrder = (itemId: string, unit: string) => {
    setOrderItems(prev => prev.filter(o => !(o.id === itemId && o.unit === unit)));
    triggerToast("Ürün sepetten çıkarıldı.");
  };

  // WhatsApp'a Gönder
  const handleCompleteOrder = () => {
    if (orderItems.length === 0) {
      triggerToast("Sipariş sepetiniz boş!");
      return;
    }

    const todayStr = new Date().toLocaleDateString("tr-TR");
    
    // Mesaj metni oluşturma
    let text = `*☕ DEĞİRMEN KAFE SİPARİŞ TALEBİ ☕*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*📅 Tarih:* ${todayStr}\n`;
    text += `*📍 Şube:* ${selectedRegionName}\n`;
    text += `*👤 Siparişi Geçen:* ${userFullName}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `*📋 SİPARİŞ EDİLEN ÜRÜNLER:*\n`;

    orderItems.forEach((o, index) => {
      text += `${index + 1}. • ${o.quantity} ${o.unit} - *${o.name}*\n`;
    });

    if (orderNote.trim()) {
      text += `\n*💬 Sipariş Notu / Açıklama:*\n_${orderNote.trim()}_\n`;
    }
    
    text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_Bu sipariş envanter yönetim paneli üzerinden otomatik oluşturulmuştur._`;

    // WhatsApp url
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, "_blank");
    triggerToast("WhatsApp'a yönlendiriliyorsunuz... 💬");
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
              Aşağıdaki ürünlerin miktarı asgari seviyenin altına düşmüştür. Hızlıca sipariş sepetine eklemek için yanlarındaki butonları kullanabilirsiniz.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              {criticalItems.map(item => (
                <div 
                  key={item.id}
                  onClick={() => {
                    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
                    setUnits(prev => ({ ...prev, [item.id]: item.unit === "kg" ? "Kg" : "Adet" }));
                    handleAddToOrder(item);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold rounded-xl cursor-pointer hover:bg-red-500/30 hover:scale-105 active:scale-95 transition-all select-none"
                >
                  <span>{item.name} ({item.quantity} Kalan)</span>
                  <span className="w-4 h-4 rounded-lg bg-red-500 text-zinc-950 flex items-center justify-center font-black">+</span>
                </div>
              ))}
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
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    selectedCategory === cat 
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" 
                      : "bg-[var(--card)] border border-[var(--border)] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {cat.replace("Ve Bitki Çayları", "").replace("Çeşitleri", "")}
                </button>
              ))}
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
                    const activeUnit = units[item.id] || (item.unit === "kg" ? "Kg" : "Adet");
                    const isCritical = item.quantity <= item.minLimit;

                    return (
                      <div 
                        key={item.id}
                        className="bg-[var(--background)]/40 border border-[var(--border)] hover:border-orange-500/30 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 group-hover:text-orange-400 transition-colors">
                              {item.name}
                            </span>
                            {isCritical && (
                              <span className="px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 font-black text-[9px] uppercase tracking-wider shrink-0">
                                Kritik Stok
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                            {item.category} · Kalan: {item.quantity} {item.unit}
                          </span>
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
                                    ? "bg-orange-500 border-orange-500 text-white"
                                    : "bg-[var(--card)] border-[var(--border)] text-zinc-500 hover:text-zinc-300"
                                }`}
                              >
                                {u}
                              </button>
                            ))}
                          </div>

                          {/* Miktar Arttır / Azalt */}
                          <div className="flex items-center justify-between gap-4">
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
                              className="flex-1 flex items-center justify-center gap-1.5 bg-[#e76f51] hover:bg-[#eb8870] dark:bg-[#a6442d] dark:hover:bg-[#c25137] text-[#264653] dark:text-zinc-950 text-[10px] font-black rounded-xl py-2.5 transition-colors cursor-pointer uppercase tracking-wider"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Sepete Ekle
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

          {/* Sağ Kısım: Sipariş Sepeti (Özet & Kapanış) */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-6 shadow-sm space-y-6 sticky top-24">
            
            <div className="flex items-center gap-2 border-b border-[var(--border)]/60 pb-3">
              <ShoppingCart className="w-5 h-5 text-orange-500" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Sipariş Sepetiniz</h3>
              <span className="ml-auto px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded-xl text-[10px] font-black">
                {orderItems.length} Ürün
              </span>
            </div>

            {orderItems.length === 0 ? (
              <div className="py-12 text-center space-y-2 text-zinc-500">
                <Package className="w-10 h-10 mx-auto text-zinc-600" />
                <p className="text-xs font-bold">Sepetinizde ürün bulunmuyor.</p>
                <p className="text-[10px] text-zinc-600">Ürün eklemek için sol taraftaki ürün listesinden miktar girerek sepet ekleyin.</p>
              </div>
            ) : (
              <>
                {/* Sepet Listesi */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                  {orderItems.map((o) => (
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
                        onClick={() => handleRemoveFromOrder(o.id, o.unit)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Sepetten Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Sipariş Notu / Açıklama */}
                <div className="space-y-2 border-t border-[var(--border)]/60 pt-4">
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">Sipariş Notu / Açıklama</label>
                  <textarea
                    placeholder="Sipariş için özel bir istek veya not giriniz (İsteğe bağlı)..."
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    rows={3}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-[var(--foreground)] placeholder-zinc-500 resize-none"
                  />
                </div>

                {/* Siparişi Tamamla */}
                <button
                  onClick={handleCompleteOrder}
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-zinc-950 font-black py-3.5 px-6 rounded-2xl text-xs transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer uppercase tracking-wider"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  Siparişi WhatsApp'a Gönder
                </button>
              </>
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
