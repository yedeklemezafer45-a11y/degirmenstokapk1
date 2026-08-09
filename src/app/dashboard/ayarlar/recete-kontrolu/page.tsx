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
  BookOpen,
  Sparkles,
  Layers,
  Flame
} from "lucide-react";
import { mockRecipes, Recipe, RecipeIngredient } from "@/lib/recipeStore";
import { StockItem } from "@/lib/stockStore";
import { subscribeToStocks } from "@/lib/stockService";

export default function ReceteKontroluPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [recipesList, setRecipesList] = useState<Recipe[]>([]);
  const [dbRecipesList, setDbRecipesList] = useState<Recipe[]>([]); // Veritabanındaki asıl durum
  const [stockOptions, setStockOptions] = useState<StockItem[]>([]);
  const [userRole, setUserRole] = useState<string>("waiter");
  const [isDirty, setIsDirty] = useState(false);

  // Arama & Kategori Filtreleme
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");

  // Yeni Reçete Ekleme Form State'leri
  const [newRecipeName, setNewRecipeName] = useState("");
  const [newRecipeCategory, setNewRecipeCategory] = useState<Recipe["category"]>("SICAK KAHVELER");
  const [newRecipeGramaj, setNewRecipeGramaj] = useState("12 oz");
  const [newRecipeInstructions, setNewRecipeInstructions] = useState("");
  const [newRecipeIngredients, setNewRecipeIngredients] = useState<RecipeIngredient[]>([]);

  // Geçici Malzeme Ekleme State'leri
  const [tempProduct, setTempProduct] = useState("");
  const [tempAmount, setTempAmount] = useState("");
  const [tempUnit, setTempUnit] = useState("gr");

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
    const activeUser = sessionStorage.getItem("activeUser");
    if (activeUser) {
      const parsed = JSON.parse(activeUser);
      setUserRole(parsed.role || "waiter");
      if (parsed.role !== "admin") {
        window.location.href = "/dashboard";
      }
    } else {
      window.location.href = "/";
    }

    // Gerçek zamanlı Firestore dinleyicisi ile stok seçeneklerini yükle
    const unsubscribe = subscribeToStocks(
      (items) => {
        setStockOptions(items);
      },
      () => {
        console.error("Reçete kontrolünde stok seçenekleri yüklenemedi.");
      }
    );

    // Reçeteleri yükle
    const savedRecipes = localStorage.getItem("degirmen_recipes");
    if (savedRecipes) {
      setRecipesList(JSON.parse(savedRecipes));
      setDbRecipesList(JSON.parse(savedRecipes));
    } else {
      setRecipesList(mockRecipes);
      setDbRecipesList(mockRecipes);
    }

    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  const categories = [
    "SICAK KAHVELER", 
    "SOĞUK KAHVELER", 
    "FREŞHLER", 
    "FROZEN ÇEŞİTLERİ", 
    "FRAPPE ÇEŞİTLERİ", 
    "MİLKSHAKE ÇEŞİTLERİ",
    "ALTERNATİF FREŞHLER"
  ];

  // Malzeme Formu Geçici Ekleme
  const addTempIngredient = () => {
    if (!tempProduct || !tempAmount) return;
    const amountVal = parseFloat(tempAmount) || 0;
    
    // Zaten ekli mi kontrolü
    if (newRecipeIngredients.some(i => i.product === tempProduct)) {
      triggerToast("Bu malzeme zaten reçeteye eklendi!");
      return;
    }

    setNewRecipeIngredients([
      ...newRecipeIngredients,
      { product: tempProduct, amount: amountVal, unit: tempUnit }
    ]);
    setTempAmount("");
  };

  const removeTempIngredient = (prodName: string) => {
    setNewRecipeIngredients(newRecipeIngredients.filter(i => i.product !== prodName));
  };

  // Yeni Reçeteyi Listeye Ekle (Geçici Belleğe Alır)
  const handleAddNewRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipeName.trim()) {
      triggerToast("Reçete adı boş olamaz!");
      return;
    }
    if (newRecipeIngredients.length === 0) {
      triggerToast("Lütfen en az bir malzeme ekleyin!");
      return;
    }

    // İsme göre mükerrer kontrolü
    if (recipesList.some(r => r.name.toLowerCase() === newRecipeName.trim().toLowerCase())) {
      triggerToast("Bu isimde bir reçete zaten var!");
      return;
    }

    const newRecipe: Recipe = {
      name: newRecipeName.trim(),
      category: newRecipeCategory,
      gramaj: newRecipeGramaj,
      instructions: newRecipeInstructions.trim() || "Tarif adımları girilmemiş.",
      ingredients: newRecipeIngredients
    };

    const updatedList = [newRecipe, ...recipesList];
    setRecipesList(updatedList);
    setIsDirty(true);

    // Formu Temizle
    setNewRecipeName("");
    setNewRecipeGramaj("12 oz");
    setNewRecipeInstructions("");
    setNewRecipeIngredients([]);
    setTempProduct("");
    setTempAmount("");
    triggerToast("Reçete geçici hafızaya eklendi! Kaydetmeyi unutmayın.");
  };

  // Reçeteyi Silme (Geçici Bellek)
  const handleDeleteRecipe = (recipeName: string) => {
    const updated = recipesList.filter(r => r.name !== recipeName);
    setRecipesList(updated);
    setIsDirty(true);
    triggerToast("Reçete geçici hafızadan silindi.");
  };

  // Yapılan Değişiklikleri Kaydet (Tüm kategoriler için toplu sisteme yansıtır)
  const handleSaveChanges = () => {
    localStorage.setItem("degirmen_recipes", JSON.stringify(recipesList));
    // Eşzamanlılığı korumak için sayfalardaki reset bayrağını da tazeleyelim
    localStorage.setItem("degirmen_recipes_reset_03", "true");
    setDbRecipesList(recipesList);
    setIsDirty(false);
    triggerToast("Tüm değişiklikler başarıyla veritabanına kaydedildi!");
  };

  // Değişiklikleri Geri Al (Kaydedilmemiş durum)
  const handleCancelChanges = () => {
    setRecipesList(dbRecipesList);
    setIsDirty(false);
    triggerToast("Kaydedilmemiş değişiklikler geri alındı.");
  };

  // Arama ve Filtreleme Uygula
  const filteredRecipes = recipesList.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          recipe.ingredients.some(ing => ing.product.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "Tümü" || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
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
            <h1 className="font-bold text-lg tracking-tight">Reçeteler Listesi Kontrolü</h1>
            <p className="text-xs text-zinc-500">Reçete Ekleme, Düzenleme ve Silme Paneli</p>
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8 pb-32">
        
        {/* Toast Bildirim Alanı */}
        {showToast && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-orange-600 text-white px-5 py-3 rounded-2xl shadow-xl shadow-orange-600/10 animate-bounce">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SOL KOLON: YENİ REÇETE EKLEME PANELİ */}
          <div className="lg:col-span-4 bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-500" /> Yeni Reçete Tanımla
              </h2>
              <p className="text-xs text-zinc-500 mt-1">İsim, kategori, mililitre ve yapılış adımlarını belirleyin.</p>
            </div>

            <form onSubmit={handleAddNewRecipe} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1">REÇETE / İÇECEK ADI</label>
                <input 
                  type="text" 
                  placeholder="Örn: White Chocolate Mocha"
                  value={newRecipeName}
                  onChange={(e) => setNewRecipeName(e.target.value)}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1">KATEGORİ</label>
                  <select 
                    value={newRecipeCategory}
                    onChange={(e) => setNewRecipeCategory(e.target.value as Recipe["category"])}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1">GRAMAJ (BARDAK)</label>
                  <input 
                    type="text" 
                    placeholder="Örn: 12 oz"
                    value={newRecipeGramaj}
                    onChange={(e) => setNewRecipeGramaj(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Malzeme Ekleme Segmenti */}
              <div className="border border-[var(--border)] rounded-2xl p-4 bg-[var(--background)]/30 space-y-3">
                <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">Malzeme Listesi Ekle</span>
                
                <div className="grid grid-cols-1 gap-2">
                  <select
                    value={tempProduct}
                    onChange={(e) => setTempProduct(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="">-- Ürün/Malzeme Seçin --</option>
                    {stockOptions.map(item => (
                      <option key={item.id} value={item.name}>{item.name}</option>
                    ))}
                    <option value="Sıcak Su">Sıcak Su</option>
                    <option value="Buz">Buz</option>
                    <option value="Taze Çilek Dilimi">Taze Çilek Dilimi</option>
                    <option value="Limon Dilimi">Limon Dilimi</option>
                    <option value="Nane Yaprağı">Nane Yaprağı</option>
                  </select>

                  <div className="flex gap-2">
                    <input 
                      type="number"
                      placeholder="Miktar"
                      value={tempAmount}
                      onChange={(e) => setTempAmount(e.target.value)}
                      className="w-20 bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                    <select
                      value={tempUnit}
                      onChange={(e) => setTempUnit(e.target.value)}
                      className="w-20 bg-[var(--background)] border border-[var(--border)] rounded-xl px-2 py-2 text-xs focus:outline-none"
                    >
                      <option value="gr">gr</option>
                      <option value="ml">ml</option>
                      <option value="Adet">Adet</option>
                      <option value="Dilim">Dilim</option>
                    </select>
                    <button
                      type="button"
                      onClick={addTempIngredient}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Ekle
                    </button>
                  </div>
                </div>

                {/* Eklenen Geçici Malzemeler */}
                <div className="space-y-1.5 pt-2 max-h-36 overflow-y-auto">
                  {newRecipeIngredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[var(--background)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
                      <span className="text-[11px] font-medium text-zinc-300 truncate max-w-[140px]">{ing.product}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-orange-500">{ing.amount} {ing.unit}</span>
                        <button 
                          type="button" 
                          onClick={() => removeTempIngredient(ing.product)}
                          className="text-red-500 hover:text-red-400 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1">HAZIRLANIŞ YÖNERGESİ</label>
                <textarea 
                  placeholder="Shaker içerisine buz ekleyip karıştırın..."
                  rows={4}
                  value={newRecipeInstructions}
                  onChange={(e) => setNewRecipeInstructions(e.target.value)}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Reçeteyi Listeye Ekle
              </button>
            </form>
          </div>

          {/* SAĞ KOLON: REÇETELER TABLOSU VE ARAMA PANELİ */}
          <div className="lg:col-span-8 bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Filtre ve Arama Alanı */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border)] pb-4">
                <div>
                  <h2 className="text-base font-bold">Mevcut Reçeteler ({recipesList.length})</h2>
                  <p className="text-xs text-zinc-500">Sistemde baristalar tarafından erişilebilir tarifler.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <input 
                      type="text" 
                      placeholder="Reçete ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-[var(--background)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2 text-xs w-full sm:w-48 focus:outline-none"
                    />
                  </div>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="Tümü">Tüm Kategoriler</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reçeteler Listesi / Tablo Görünümü */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Kategori / Ürün</th>
                      <th className="py-3 px-4">Gramaj</th>
                      <th className="py-3 px-4">Malzemeler</th>
                      <th className="py-3 px-4">Talimatlar</th>
                      <th className="py-3 px-4 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]/40">
                    {filteredRecipes.map((recipe, idx) => (
                      <tr key={idx} className="hover:bg-[var(--background)]/35 text-xs">
                        <td className="py-4 px-4">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">{recipe.name}</div>
                          <div className="text-[9px] text-zinc-500 font-semibold uppercase">{recipe.category}</div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-zinc-600 dark:text-zinc-400">
                          {recipe.gramaj}
                        </td>
                        <td className="py-4 px-4 max-w-[200px]">
                          <div className="flex flex-wrap gap-1">
                            {recipe.ingredients.map((ing, iIdx) => (
                              <span key={iIdx} className="bg-zinc-500/10 text-zinc-400 text-[9px] font-medium px-2 py-0.5 rounded-md">
                                {ing.product} ({ing.amount}{ing.unit})
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4 max-w-[200px] truncate font-medium text-zinc-500" title={recipe.instructions}>
                          {recipe.instructions}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleDeleteRecipe(recipe.name)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Reçeteyi Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredRecipes.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-zinc-500">
                          Aradığınız kriterlere uygun reçete bulunmamaktadır.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* HAFIZADA TUTULAN DÜZENLEME DURUMU BAR (KAYDET & İPTAL) */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1e293b] border border-orange-500/30 text-white rounded-2xl px-6 py-4 flex items-center gap-6 shadow-2xl animate-slideUp">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold">Kaydedilmemiş Reçete Düzenlemeleri Var!</span>
              <span className="text-[10px] text-zinc-400">Yaptığınız değişikliklerin kalıcı olması için sağdan kaydedin.</span>
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
