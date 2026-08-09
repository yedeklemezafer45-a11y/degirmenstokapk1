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
  CheckCircle2,
  Loader2,
  Square,
  Package
} from "lucide-react";
import { StockItem, StockCategory } from "@/lib/stockStore";
import { subscribeToStocks, saveAllStocks, saveStockItem } from "@/lib/stockService";
import { logUserAction } from "@/lib/auditLogService";

export default function StokKontroluPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [userRole, setUserRole] = useState<string>("waiter");
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // İşlem Yapılan Ürünlerin Onay Listesi
  const [checkedItemIds, setCheckedItemIds] = useState<Record<string, boolean>>({});
  
  // Yeni Ürün Ekleme Form State'leri
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<StockCategory>("Kahveler");
  const [newItemUnit, setNewItemUnit] = useState("Adet");
  const [newItemDepo, setNewItemDepo] = useState("0");
  const [newItemLimit, setNewItemLimit] = useState("5");
  const [newItemPrice, setNewItemPrice] = useState("100");
  const [newItemWeight, setNewItemWeight] = useState("1.000 kg");

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

    const activeUser = localStorage.getItem("activeUser");
    if (activeUser) {
      const parsed = JSON.parse(activeUser);
      setUserRole(parsed.role || "waiter");
      if (parsed.role !== "admin") {
        window.location.href = "/dashboard";
        return;
      }
    } else {
      window.location.href = "/";
      return;
    }

    // Onay kutularını localStorage'dan yüklme
    const savedChecked = localStorage.getItem("degirmen_kontrol_checked_ids");
    if (savedChecked) {
      setCheckedItemIds(JSON.parse(savedChecked));
    }

    // Gerçek zamanlı Firestore dinleyicisi — tüm kullanıcılarda anlık güncelleme
    setIsLoading(true);
    const unsubscribe = subscribeToStocks(
      (items) => {
        setStockList(items);
        setIsLoading(false);
      },
      () => {
        triggerToast("Stok verileri okunamadı!");
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

  const toggleItemCheck = (id: string) => {
    setCheckedItemIds(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem("degirmen_kontrol_checked_ids", JSON.stringify(updated));
      return updated;
    });
  };

  // Yeni Ürün Ekle
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      triggerToast("Lütfen ürün adını giriniz!");
      return;
    }

    const newId = "custom_" + Date.now();
    const depoVal = parseFloat(newItemDepo) || 0;

    const newItem: StockItem = {
      id: newId,
      name: newItemName.trim(),
      category: newItemCategory,
      unit: newItemUnit,
      depodaBulunan: depoVal,
      depodanAlinan: 0,
      quantity: depoVal,
      minLimit: parseFloat(newItemLimit) || 0,
      price: parseFloat(newItemPrice) || 0,
      weightInfo: newItemWeight.trim() || "1.000 kg"
    };

    setIsSaving(true);
    try {
      await saveStockItem(newItem);
      setStockList(prev => [newItem, ...prev]);

      // Eklenen ürünü onaylı işaretle
      setCheckedItemIds(prev => {
        const updated = { ...prev, [newId]: true };
        localStorage.setItem("degirmen_kontrol_checked_ids", JSON.stringify(updated));
        return updated;
      });

      await logUserAction(
        "Yeni Stok Ürünü Eklendi",
        "STOK",
        `"${newItem.name}" (${newItem.category}) ürünü stok listesine eklendi.`
      );

      setNewItemName("");
      setNewItemDepo("0");
      triggerToast(`✅ "${newItem.name}" başarıyla bulut veritabanına eklendi!`);
    } catch (err) {
      triggerToast("Ürün eklenirken hata oluştu!");
    } finally {
      setIsSaving(false);
    }
  };

  // Depo Girişi — MEVCUT MIKTAR ÜZERİNE EKLE (değiştirme değil!)
  const [depoInputs, setDepoInputs] = useState<Record<string, string>>({});

  const handleDepoInputChange = (id: string, value: string) => {
    setDepoInputs(prev => ({ ...prev, [id]: value }));
    setIsDirty(true);
  };

  const handleDepoAdd = async (id: string) => {
    const eklenecek = parseFloat(depoInputs[id] || "0");
    if (isNaN(eklenecek) || eklenecek <= 0) {
      triggerToast("Geçerli bir miktar girin!");
      return;
    }

    const item = stockList.find(i => i.id === id);
    if (!item) return;

    const yeniDepodaBulunan = item.depodaBulunan + eklenecek;
    const yeniQuantity = Math.max(0, yeniDepodaBulunan - item.depodanAlinan);

    const updatedItem: StockItem = {
      ...item,
      depodaBulunan: yeniDepodaBulunan,
      quantity: yeniQuantity,
    };

    setIsSaving(true);
    try {
      await saveStockItem(updatedItem);
      // onSnapshot otomatik güncelleyecek, manuel setState gerek yok
      setDepoInputs(prev => ({ ...prev, [id]: "" }));

      // İşlem yapıldı olarak işaretle
      setCheckedItemIds(prev => {
        const updated = { ...prev, [id]: true };
        localStorage.setItem("degirmen_kontrol_checked_ids", JSON.stringify(updated));
        return updated;
      });

      triggerToast(`✅ ${item.name} stoğu +${eklenecek} olarak güncellendi!`);

      await logUserAction(
        "Depo Stok Eklendi",
        "STOK",
        `"${item.name}" ürününe +${eklenecek} eklendi. Yeni toplam: ${yeniDepodaBulunan}`
      );
    } catch {
      triggerToast("Güncellenirken hata oluştu!");
    } finally {
      setIsSaving(false);
    }
  };

  // Ürün Sil (Tüm sistemden ve kategorilerden kaldırılır)
  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" ürününü silmek istediğinize emin misiniz? Bu işlem ürünü stok listesinden ve kategorilerden tamamen kaldıracaktır.`)) return;

    setIsSaving(true);
    try {
      const updatedList = stockList.filter(item => item.id !== id);
      await saveAllStocks(updatedList);
      setStockList(updatedList);

      setCheckedItemIds(prev => {
        const copy = { ...prev };
        delete copy[id];
        localStorage.setItem("degirmen_kontrol_checked_ids", JSON.stringify(copy));
        return copy;
      });

      await logUserAction(
        "Stok Ürünü Silindi",
        "STOK",
        `"${name}" ürünü stok listesinden kaldırıldı.`
      );

      triggerToast(`"${name}" silindi ve tüm kategorilerden kaldırıldı.`);
    } catch (err) {
      triggerToast("Silinirken hata oluştu!");
    } finally {
      setIsSaving(false);
    }
  };

  // Toplu Kaydet
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await saveAllStocks(stockList);
      setIsDirty(false);

      await logUserAction(
        "Stok Kontrol Değişiklikleri Kaydedildi",
        "STOK",
        "Stok kontrol sayfasındaki girdi/limit değişiklikleri kaydedildi."
      );

      triggerToast("✅ Tüm stok değişiklikleri bulut veritabanına kaydedildi!");
    } catch (err) {
      triggerToast("Kaydedilirken hata oluştu!");
    } finally {
      setIsSaving(false);
    }
  };

  const categories = ["Tümü", ...Array.from(new Set(stockList.map((i) => i.category)))];

  const filteredStocks = stockList.filter((item) => {
    const matchesCategory = selectedCategory === "Tümü" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const checkedCount = Object.values(checkedItemIds).filter(Boolean).length;
  const totalCount = stockList.length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* Toast */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = "/dashboard/ayarlar"}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer mr-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 flex items-center justify-center">
            <img src="/logo.png" alt="Değirmen Cafe Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Stok Listesi & Envanter Kontrolü</h1>
            <p className="text-xs text-zinc-500">İşlem Onay Kutusu Destekli · Ürün Ekle/Sil</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer">
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => window.location.href = "/"} className="p-2 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer" title="Çıkış Yap">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 pb-24">

        {/* İLERLEME ÇUBUĞU KARTI */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-sm shrink-0">
              %{progressPercent}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-zinc-200">İşlem Yapılan Ürünler</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {checkedCount} / {totalCount} Ürün İşlem Gördü
                </span>
              </div>
              <div className="w-full bg-[var(--background)] h-2 rounded-full mt-2 overflow-hidden border border-[var(--border)] min-w-[220px]">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg cursor-pointer ${
                isDirty 
                  ? "bg-orange-600 hover:bg-orange-700 animate-pulse" 
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? "Kaydediliyor..." : isDirty ? "Değişiklikleri Kaydet" : "Stokları Güncelle"}
            </button>
          </div>
        </div>

        {/* YENİ ÜRÜN EKLEME FORMU */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-orange-500 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Yeni Stok Ürünü Ekle
          </h3>

          <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Ürün Adı</label>
              <input 
                type="text" 
                placeholder="Örn: VANİLYA ŞURUBU" 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Kategori</label>
              <select 
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as StockCategory)}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="Şuruplar">Şuruplar</option>
                <option value="Kahveler">Kahveler</option>
                <option value="Soslar">Soslar</option>
                <option value="Püreler">Püreler</option>
                <option value="Toz Grubu">Toz Grubu</option>
                <option value="Ek Ürünler">Ek Ürünler</option>
                <option value="Litrelik Ürünler">Litrelik Ürünler</option>
                <option value="Yan Ürünler">Yan Ürünler</option>
                <option value="Çay Ve Bitki Çayları">Çay Ve Bitki Çayları</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Birim Hacim / Gramaj</label>
              <input 
                type="text" 
                placeholder="Örn: 0.970 kg veya 1.000 lt" 
                value={newItemWeight}
                onChange={(e) => setNewItemWeight(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">İlk Depo Girişi</label>
              <input 
                type="number" 
                placeholder="0" 
                value={newItemDepo}
                onChange={(e) => setNewItemDepo(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Ölçü Birimi</label>
              <select 
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="Adet">Adet</option>
                <option value="kg">kg</option>
                <option value="Litre">Litre</option>
                <option value="Kutu">Kutu</option>
                <option value="Paket">Paket</option>
              </select>
            </div>

            <button 
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow-md h-9 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Ürün Ekle
            </button>
          </form>
        </div>

        {/* ARAMA VE KATEGORİ FİLTRELERİ */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Ürün adı ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-orange-600 text-white shadow-md"
                    : "bg-[var(--card)] border border-[var(--border)] text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* STOK LİSTESİ TABLOSU */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <span className="ml-3 text-sm text-zinc-400">Stoklar yükleniyor...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-3 w-12 text-center">Durum</th>
                    <th className="py-3 px-4">Ürün Adı</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-center">Paket Hacim/Gramaj</th>
                    <th className="py-3 px-4 text-center w-36">Depoda Bulunan (Girdi)</th>
                    <th className="py-3 px-4 text-center">Depodan Alınan</th>
                    <th className="py-3 px-4 text-center">Kalan Miktar</th>
                    <th className="py-3 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/40 text-xs">
                  {filteredStocks.map((item) => {
                    const isChecked = !!checkedItemIds[item.id];

                    return (
                      <tr 
                        key={item.id} 
                        className={`transition-colors ${
                          isChecked 
                            ? "bg-emerald-500/5 hover:bg-emerald-500/10 border-l-4 border-l-emerald-500" 
                            : "hover:bg-[var(--background)]/35"
                        }`}
                      >
                        {/* Onay Kutusu */}
                        <td className="py-4 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleItemCheck(item.id)}
                            className={`p-1 rounded-lg transition-transform hover:scale-110 cursor-pointer ${
                              isChecked ? "text-emerald-500" : "text-zinc-600 hover:text-zinc-400"
                            }`}
                            title={isChecked ? "İşlem yapıldı olarak işaretli" : "İşlem yapıldı olarak işaretle"}
                          >
                            {isChecked ? (
                              <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-zinc-950" />
                            ) : (
                              <Square className="w-5 h-5 stroke-[1.5]" />
                            )}
                          </button>
                        </td>

                        <td className="py-4 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                          <div className="flex items-center gap-2">
                            <span>{item.name}</span>
                            {isChecked && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                İşlendi
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="bg-[var(--background)] border border-[var(--border)] px-2.5 py-1 rounded-xl text-[10px] text-zinc-400 font-bold">
                            {item.category}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center font-mono text-zinc-400">
                          {item.weightInfo || "1.000 kg"}
                        </td>

                         {/* Depoda Bulunan — Üstüne Ekle */}
                         <td className="py-4 px-4 text-center">
                           <div className="flex items-center gap-1 justify-center">
                             <div className="text-center">
                               <div className="text-[10px] text-zinc-500 mb-0.5">Mevcut: <span className="font-bold text-zinc-300">{item.depodaBulunan}</span></div>
                               <div className="flex gap-1">
                                 <input
                                   type="number"
                                   min="0"
                                   placeholder="+ekle"
                                   value={depoInputs[item.id] || ""}
                                   onChange={(e) => handleDepoInputChange(item.id, e.target.value)}
                                   className="w-20 bg-[var(--background)] border border-[var(--border)] rounded-xl px-2 py-1.5 text-center font-mono font-bold text-emerald-500 focus:outline-none focus:ring-1 focus:ring-orange-500 text-xs"
                                 />
                                 <button
                                   type="button"
                                   onClick={() => handleDepoAdd(item.id)}
                                   disabled={isSaving || !depoInputs[item.id]}
                                   className="px-2 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white text-[10px] font-bold cursor-pointer transition-colors"
                                 >
                                   Ekle
                                 </button>
                               </div>
                             </div>
                           </div>
                         </td>

                        <td className="py-4 px-4 text-center font-mono text-red-400 font-bold">
                          {item.depodanAlinan} {item.unit}
                        </td>

                        <td className="py-4 px-4 text-center font-mono font-extrabold text-orange-500 text-sm">
                          {item.quantity} {item.unit}
                        </td>

                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            disabled={isSaving}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                            title="Ürünü Listeden Kaldır"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[var(--border)] bg-[var(--card)] py-4 px-6 flex items-center justify-between text-xs text-zinc-500">
        <span>© 2026 Değirmen Cafe. Tüm hakları saklıdır.</span>
        <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          İşlem Onay Kutusu Aktif
        </span>
      </footer>

    </div>
  );
}
