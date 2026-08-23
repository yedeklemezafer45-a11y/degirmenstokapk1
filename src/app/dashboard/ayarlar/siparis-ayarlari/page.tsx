"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Moon, 
  Sun, 
  LogOut, 
  Search, 
  Save, 
  Loader2, 
  CheckSquare,
  Square,
  AlertTriangle,
  ShoppingCart,
  CheckCircle2,
  Plus,
  X,
  Trash2
} from "lucide-react";
import { subscribeToStocks, saveAllStocks, saveStockItem, deleteStockItem } from "@/lib/stockService";
import { StockItem, StockCategory } from "@/lib/stockStore";
import { useRouter } from "next/navigation";
import { logUserAction } from "@/lib/auditLogService";

export default function SiparisAyarlariPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [userRole, setUserRole] = useState<string>("waiter");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Yeni Ürün Ekleme State'leri
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<StockCategory>("Çay Ve Bitki Çayları");
  const [newItemUnit, setNewItemUnit] = useState("Adet");
  const [newItemLimit, setNewItemLimit] = useState("0");
  const [newItemPrice, setNewItemPrice] = useState("0");
  const [newItemWeight, setNewItemWeight] = useState("1.000 kg");

  // Bölge State'leri
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

  const isDirtyRef = React.useRef(isDirty);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

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

    setIsLoading(true);
    const unsubscribe = subscribeToStocks(
      activeRegion,
      (items) => {
        if (!isDirtyRef.current) {
          setStockList(items);
        }
        setIsLoading(false);
      },
      () => {
        triggerToast("Stoklar yüklenirken hata oluştu!");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Kutu ve Plastik Ürünler seçilirse Paket Hacim / Gramaj değerini otomatik belirle
  useEffect(() => {
    if (newItemCategory === "Kutu Ve Plastik Ürünler") {
      const lowerName = newItemName.toLowerCase();
      if (lowerName.includes("plastik bardak") || lowerName.includes("plastik kapak")) {
        setNewItemWeight("Koli İçerisinde 1000 adet");
      } else {
        setNewItemWeight("Koli / Kutu");
      }
      setNewItemUnit("Koli");
    }
  }, [newItemCategory, newItemName]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  // Sipariş verilebilir durumunu tersine çevir
  const handleToggleOrderable = (itemId: string) => {
    setStockList(prev => prev.map(item => {
      if (item.id === itemId) {
        const currentVal = item.orderable !== false; // Tanımsızsa varsayılan true
        return {
          ...item,
          orderable: !currentVal
        };
      }
      return item;
    }));
    setIsDirty(true);
  };

  // Tümünü Seç / Kaldır
  const handleSelectAll = (select: boolean) => {
    setStockList(prev => prev.map(item => ({
      ...item,
      orderable: select
    })));
    setIsDirty(true);
    triggerToast(select ? "Tüm ürünler siparişe açıldı." : "Tüm ürünlerin sipariş yetkisi kapatıldı.");
  };

  // Yeni Ürün Ekle (Hem envantere eklenir hem de otomatik siparişe açılır)
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      triggerToast("Lütfen ürün adını giriniz!");
      return;
    }

    const newId = "custom_" + Date.now();
    const newItem: StockItem = {
      id: newId,
      name: newItemName.trim(),
      category: newItemCategory,
      unit: newItemUnit,
      depodaBulunan: 0,
      depodanAlinan: 0,
      quantity: 0,
      minLimit: parseFloat(newItemLimit) || 0,
      price: parseFloat(newItemPrice) || 0,
      weightInfo: newItemWeight.trim() || "1.000 kg",
      orderable: true // Otomatik siparişe açık
    };

    setIsSaving(true);
    try {
      await saveStockItem(selectedRegion, newItem);
      
      setStockList(prev => [newItem, ...prev]);

      await logUserAction(
        "Yeni Sipariş Ürünü Eklendi",
        "STOK",
        `"${newItem.name}" (${newItem.category}) ürünü sipariş menüsüne ve stok kontrolüne eklendi.`
      );

      setNewItemName("");
      setIsAddOpen(false);
      triggerToast(`✅ "${newItem.name}" siparişe ve stok kontrolüne eklendi!`);
    } catch (err) {
      console.error(err);
      triggerToast("Ürün eklenirken hata oluştu!");
    } finally {
      setIsSaving(false);
    }
  };

  // Değişiklikleri Veritabanına Kaydet
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await saveAllStocks(selectedRegion, stockList);
      setIsDirty(false);
      triggerToast("✅ Sipariş ayarları bulut veritabanına kaydedildi!");
    } catch (err) {
      console.error("Kaydetme hatası:", err);
      triggerToast("Ayarlar kaydedilirken hata oluştu!");
    } finally {
      setIsSaving(false);
    }
  };

  const displayedStockList = selectedRegion === "degirmen-kafe"
    ? stockList.filter(item => item.category !== "Soft İçecek Ürünleri" && item.category !== "Pastalar")
    : stockList;

  const categories = ["Tümü", ...Array.from(new Set(displayedStockList.map(i => i.category)))];

  const filteredStock = displayedStockList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Tümü" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/dashboard/ayarlar")}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer mr-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 flex items-center justify-center">
            <img src="/logo.png" alt="Değirmen Cafe Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Sipariş Menüsü Ayarları</h1>
            <p className="text-xs text-zinc-500">{selectedRegionName} · Personel Sipariş Menüsü Ürünleri</p>
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

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6 pb-24">
        
        {/* Arama & Filtreleme & Hızlı İşlemler */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-4 shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text"
              placeholder="Ürün adı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-[var(--foreground)] placeholder-zinc-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
            <button
              onClick={() => handleSelectAll(true)}
              className="flex items-center gap-1 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-extrabold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Tümünü Siparişe Aç
            </button>
            <button
              onClick={() => handleSelectAll(false)}
              className="flex items-center gap-1 px-3 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 text-[10px] font-extrabold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
            >
              <Square className="w-3.5 h-3.5" />
              Tümünü Kapat
            </button>
            <button
              type="button"
              onClick={() => setIsAddOpen(!isAddOpen)}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black rounded-xl transition-all cursor-pointer uppercase tracking-wider shadow-md shadow-orange-500/10"
            >
              {isAddOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {isAddOpen ? "Kapat" : "Yeni Ürün Ekle"}
            </button>
          </div>
        </div>

        {/* Yeni Ürün Ekle Formu */}
        {isAddOpen && (
          <form 
            onSubmit={handleAddItem}
            className="bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-6 shadow-md space-y-4 animate-slideDown"
          >
            <div className="flex items-center gap-2 border-b border-[var(--border)]/60 pb-3">
              <ShoppingCart className="w-4 h-4 text-orange-500" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider">Yeni Sipariş Ürünü Ekle</h3>
              <p className="text-[10px] text-zinc-500 ml-2">(Bu ürün envanter listesinde 0 adet bakiyle oluşturulur ve otomatik siparişe açılır)</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              
              {/* Ürün Adı */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Ürün Adı *</label>
                <input 
                  type="text"
                  required
                  placeholder="Örn: HM-ÇİLEK AROMALI ŞURUP"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-[var(--foreground)]"
                />
              </div>

              {/* Kategori */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Kategori</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value as StockCategory)}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-[var(--foreground)]"
                >
                  <option value="Çay Ve Bitki Çayları">Çay Ve Bitki Çayları</option>
                  <option value="Kahveler">Kahveler</option>
                  <option value="Şuruplar">Şuruplar</option>
                  <option value="Soslar">Soslar</option>
                  <option value="Püreler">Püreler</option>
                  <option value="Toz Grubu">Toz Grubu</option>
                  <option value="Ek Ürünler">Ek Ürünler</option>
                  <option value="Litrelik Ürünler">Litrelik Ürünler</option>
                  <option value="Yan Ürünler">Yan Ürünler</option>
                  <option value="Kutu Ve Plastik Ürünler">Kutu Ve Plastik Ürünler</option>
                  {selectedRegion !== "degirmen-kafe" && (
                    <>
                      <option value="Soft İçecek Ürünleri">Soft İçecek Ürünleri</option>
                      <option value="Pastalar">Pastalar</option>
                    </>
                  )}
                </select>
              </div>

              {/* Ölçü Birimi */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Ölçü Birimi</label>
                <select
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-[var(--foreground)]"
                >
                  <option value="Adet">Adet</option>
                  <option value="Koli">Koli</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="Litre">Litre</option>
                  <option value="Şişe">Şişe</option>
                  <option value="Paket">Paket</option>
                  <option value="Kutu">Kutu</option>
                  <option value="Kavanoz">Kavanoz</option>
                </select>
              </div>

              {/* Kritik Limit */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Kritik Stok Limiti</label>
                <input 
                  type="number"
                  min="0"
                  placeholder="Örn: 2"
                  value={newItemLimit}
                  onChange={(e) => setNewItemLimit(e.target.value)}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-[var(--foreground)]"
                />
              </div>

              {/* Paket Ağırlığı */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Paket Ağırlık / Hacim Bilgisi</label>
                <input 
                  type="text"
                  placeholder="Örn: 0.970 kg"
                  value={newItemWeight}
                  onChange={(e) => setNewItemWeight(e.target.value)}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-[var(--foreground)]"
                />
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-orange-500/10"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Ürünü Kaydet ve Siparişe Aç
              </button>
            </div>
          </form>
        )}

        {/* Kategori Filtresi */}
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

        {/* Kaydet Barı */}
        {isDirty && (
          <div className="fixed bottom-6 right-6 z-50 bg-amber-500 border border-amber-600/40 text-zinc-950 px-5 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-slideUp">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-zinc-950" />
              <span className="text-xs font-black uppercase tracking-wider">Kaydedilmemiş Değişiklikler Var!</span>
            </div>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-950 text-white font-extrabold rounded-xl text-xs hover:bg-zinc-900 transition-all cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Buluta Kaydet
            </button>
          </div>
        )}

        {/* Ürünler Listesi */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-6 shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
              <span className="text-xs text-zinc-500 font-bold">Stoklar yükleniyor...</span>
            </div>
          ) : filteredStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
              <AlertTriangle className="w-12 h-12 text-zinc-600" />
              <span className="text-sm font-bold text-zinc-400">Ürün bulunamadı.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStock.map((item) => {
                const isOrderable = item.orderable !== false;
                return (
                  <div 
                    key={item.id}
                    onClick={() => handleToggleOrderable(item.id)}
                    className={`p-4 rounded-3xl border transition-all duration-300 cursor-pointer flex items-center justify-between group ${
                      isOrderable 
                        ? "bg-orange-500/5 border-orange-500/25 text-orange-400" 
                        : "bg-[var(--background)]/40 border-[var(--border)] text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-black block group-hover:text-orange-400 transition-colors">
                        {item.name}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1 block">
                        {item.category} · {item.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">
                        {isOrderable ? "Sipariş Açık" : "Sipariş Kapalı"}
                      </span>
                      <div className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 ${
                        isOrderable ? "bg-orange-500 flex justify-end" : "bg-zinc-800 flex justify-start"
                      }`}>
                        <div className="w-5 h-5 rounded-full bg-white shadow-md"></div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm(`"${item.name}" ürününü tamamen silmek istediğinizden emin misiniz?`)) return;
                          try {
                            setIsSaving(true);
                            await deleteStockItem(selectedRegion, item.id);
                            
                            // Log the delete action
                            await logUserAction(
                              "Ürün Silindi",
                              "STOK",
                              `[${selectedRegionName}] "${item.name}" ürünü sipariş ayarlarından tamamen silindi.`
                            );
                            
                            triggerToast("Ürün başarıyla silindi!");
                          } catch (err) {
                            console.error("Silme hatası:", err);
                            triggerToast("Ürün silinirken hata oluştu!");
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Ürünü Tamamen Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
