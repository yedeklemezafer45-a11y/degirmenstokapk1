"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Moon, 
  Sun, 
  LogOut, 
  Plus, 
  Trash2, 
  Save, 
  Search, 
  AlertCircle,
  Undo2,
  CheckCircle2
} from "lucide-react";
import { mockStockItems, StockItem, StockCategory } from "@/lib/stockStore";

export default function AyarlarPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [dbStockList, setDbStockList] = useState<StockItem[]>([]); // Veritabanındaki/Kaydedilmiş asıl durum
  const [userRole, setUserRole] = useState<string>("waiter");
  const [isDirty, setIsDirty] = useState(false); // Değişiklik yapıldı mı kontrolü
  
  // Yeni Ürün Ekleme Form State'leri
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<StockCategory>("Kahveler");
  const [newItemUnit, setNewItemUnit] = useState("Adet");
  const [newItemDepo, setNewItemDepo] = useState("0");
  const [newItemLimit, setNewItemLimit] = useState("5");
  const [newItemPrice, setNewItemPrice] = useState("100");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");

  // Modern Toast Bildirimi State'leri
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

    // Rol Kontrolü
    const activeUser = localStorage.getItem("activeUser");
    if (activeUser) {
      const parsed = JSON.parse(activeUser);
      setUserRole(parsed.role || "waiter");
      if (parsed.role !== "admin") {
        window.location.href = "/dashboard";
      }
    } else {
      window.location.href = "/";
    }

    // Stok verilerini yükle
    const savedStock = localStorage.getItem("degirmen_stock");
    const stockResetFlag = localStorage.getItem("degirmen_stock_reset_02");

    if (savedStock && stockResetFlag === "true") {
      const parsed = JSON.parse(savedStock);
      setStockList(parsed);
      setDbStockList(JSON.parse(savedStock));
    } else {
      setStockList(mockStockItems);
      setDbStockList(mockStockItems);
      localStorage.setItem("degirmen_stock", JSON.stringify(mockStockItems));
      localStorage.setItem("degirmen_stock_reset_02", "true");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  // 1. Yeni Ürün Ekleme (Hafızada geçici tutma)
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const parsedDepo = parseFloat(newItemDepo) || 0;
    const parsedLimit = parseFloat(newItemLimit) || 0;
    const parsedPrice = parseFloat(newItemPrice) || 0;

    const newItem: StockItem = {
      id: "cust_" + Date.now(),
      name: newItemName.trim(),
      category: newItemCategory,
      depodaBulunan: parsedDepo,
      depodanAlinan: 0,
      quantity: parsedDepo,
      unit: newItemUnit,
      minLimit: parsedLimit,
      price: parsedPrice
    };

    setStockList(prev => [newItem, ...prev]);
    setIsDirty(true);
    triggerToast("Yeni ürün listeye eklendi (Kaydetmeyi unutmayın!)");

    // Formu sıfırla
    setNewItemName("");
    setNewItemDepo("0");
    setNewItemLimit("5");
    setNewItemPrice("100");
  };

  // 2. Ürün Silme (Hafızada geçici tutma)
  const handleDeleteItem = (id: string) => {
    setStockList(prev => prev.filter(item => item.id !== id));
    setIsDirty(true);
    triggerToast("Ürün listeden çıkarıldı (Kaydetmeyi unutmayın!)");
  };

  // 3. Tekil Limit Güncelleme (Hafızada geçici tutma)
  const handleUpdateItemLimit = (id: string, newLimitVal: string) => {
    const parsedLimit = parseFloat(newLimitVal);
    if (isNaN(parsedLimit)) return;

    setStockList(prev => prev.map(item => {
      if (item.id === id) {
        if (item.minLimit === parsedLimit) return item;
        setIsDirty(true);
        return { ...item, minLimit: parsedLimit };
      }
      return item;
    }));
  };

  // 4. Depodaki Miktarı Güncelleme (Hafızada geçici tutma)
  const handleUpdateItemDepo = (id: string, newDepoVal: string) => {
    const parsedDepo = parseFloat(newDepoVal);
    if (isNaN(parsedDepo) || parsedDepo < 0) return;

    setStockList(prev => prev.map(item => {
      if (item.id === id) {
        if (item.depodaBulunan === parsedDepo) return item;
        setIsDirty(true);
        const newQty = Math.max(0, Number((parsedDepo - item.depodanAlinan).toFixed(1)));
        return { 
          ...item, 
          depodaBulunan: parsedDepo,
          quantity: newQty
        };
      }
      return item;
    }));
  };

  // Değişiklikleri Geri Al
  const handleDiscardChanges = () => {
    if (!window.confirm("Kaydedilmemiş tüm değişiklikler silinecektir. Emin misiniz?")) return;
    setStockList(dbStockList);
    setIsDirty(false);
    triggerToast("Değişiklikler geri alındı");
  };

  // Değişiklikleri Sisteme Kaydet (Veritabanına yansıt)
  const handleSaveChanges = () => {
    localStorage.setItem("degirmen_stock", JSON.stringify(stockList));
    setDbStockList(stockList); // Mevcut durumu veritabanı referansı yap
    setIsDirty(false);
    triggerToast("Tüm düzenlemeler başarıyla kaydedildi!");
  };

  const filteredStock = stockList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Tümü" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories: StockCategory[] = [
    "Çay Ve Bitki Çayları",
    "Kahveler",
    "Şuruplar",
    "Soslar",
    "Püreler",
    "Toz Grubu",
    "Ek Ürünler",
    "Litrelik Ürünler",
    "Yan Ürünler"
  ];

  if (userRole !== "admin") {
    return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Yetkilendiriliyor...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* Toast Bildirim Kutusu */}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#ea580c] text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-orange-500/25 flex items-center gap-2 border border-orange-400/20 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      {/* Kaydet / Geri Al Sabit Çubuk (Eğer dirty ise üstte yapışık belirir) */}
      {isDirty && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--card)]/90 backdrop-blur-md border border-orange-500/30 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-fadeIn">
          <div className="flex flex-col">
            <span className="text-[10px] text-orange-500 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Kaydedilmemiş Değişiklikler Var!
            </span>
            <span className="text-[9px] text-zinc-500 mt-0.5">Sisteme yansıtmak için kaydet butonuna basın.</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDiscardChanges}
              className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-bold hover:bg-[var(--foreground)]/5 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Undo2 className="w-3.5 h-3.5" /> Geri Al
            </button>
            <button
              onClick={handleSaveChanges}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold shadow-md shadow-orange-500/10 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (isDirty) {
                if (!window.confirm("Kaydedilmemiş değişiklikleriniz kaybolacaktır. Çıkmak istiyor musunuz?")) return;
              }
              window.location.href = "/dashboard/ayarlar";
            }}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer mr-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 flex items-center justify-center">
            <img src="/logo.png" alt="Değirmen Cafe Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Stok Listesi Kontrolü</h1>
            <p className="text-xs text-zinc-500">Gelişmiş Yönetici Ayarları</p>
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
            onClick={() => {
              if (isDirty) {
                if (!window.confirm("Kaydedilmemiş değişiklikleriniz kaybolacaktır. Çıkış yapmak istiyor musunuz?")) return;
              }
              window.location.href = "/";
            }}
            className="p-2 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
            title="Çıkış Yap"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Gövde */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-8 pb-32">
        
        {/* ÜRÜN EKLEME PANELİ */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Plus className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-lg">Sisteme Yeni Ürün Ekle</h2>
          </div>

          <form onSubmit={handleAddNewItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 block">Ürün Adı</label>
              <input
                type="text"
                placeholder="Örn: HM-ÇİLEK AROMALI ŞURUP"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 block">Kategori</label>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as StockCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs focus:outline-none"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 block">Birim</label>
              <input
                type="text"
                placeholder="Örn: Adet, kg, Şişe, Litre"
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 block">Başlangıç Depo Miktarı</label>
              <input
                type="number"
                value={newItemDepo}
                onChange={(e) => setNewItemDepo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs focus:outline-none"
                min="0"
                step="any"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 block">Kritik Stok Limiti</label>
              <input
                type="number"
                value={newItemLimit}
                onChange={(e) => setNewItemLimit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs focus:outline-none"
                min="0"
                step="any"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 block">Fiyat (₺)</label>
              <input
                type="number"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs focus:outline-none"
                min="0"
              />
            </div>

            <div className="md:col-span-3 flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Ürünü Listeye Ekle
              </button>
            </div>
          </form>
        </div>

        {/* LİSTE GÖRÜNTÜLEME PANELİ */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg">Mevcut Envanter Listesi Kontrolü</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Arama yap..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 text-xs border border-[var(--border)] bg-[var(--background)] rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs border border-[var(--border)] bg-[var(--background)] rounded-xl focus:outline-none"
              >
                <option value="Tümü">Tüm Kategoriler</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-zinc-500">
                  <th className="py-3 px-2">Ürün Adı</th>
                  <th className="py-3 px-2">Kategori</th>
                  <th className="py-3 px-2 text-center">Depoda</th>
                  <th className="py-3 px-2 text-center">Alınan</th>
                  <th className="py-3 px-2 text-center">Kalan</th>
                  <th className="py-3 px-2 text-center">Kritik Limit</th>
                  <th className="py-3 px-2 text-center">Birim</th>
                  <th className="py-3 px-2 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/40">
                {filteredStock.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--foreground)]/[0.01]">
                    <td className="py-3 px-2 font-bold text-zinc-300">{item.name}</td>
                    <td className="py-3 px-2 text-zinc-500">{item.category}</td>
                    <td className="py-3 px-2 text-center">
                      <input
                        type="number"
                        value={item.depodaBulunan}
                        onChange={(e) => handleUpdateItemDepo(item.id, e.target.value)}
                        className="w-16 px-1.5 py-0.5 border border-[var(--border)] bg-[var(--background)] rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                      />
                    </td>
                    <td className="py-3 px-2 text-center text-orange-500 font-mono">{item.depodanAlinan}</td>
                    <td className="py-3 px-2 text-center font-bold text-emerald-500 font-mono">{item.quantity}</td>
                    <td className="py-3 px-2 text-center">
                      <input
                        type="number"
                        value={item.minLimit}
                        onChange={(e) => handleUpdateItemLimit(item.id, e.target.value)}
                        className="w-12 px-1 py-0.5 border border-[var(--border)] bg-[var(--background)] rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </td>
                    <td className="py-3 px-2 text-center text-zinc-500">{item.unit}</td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
                        title="Ürünü Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
      
    </div>
  );
}
