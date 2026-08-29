"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Moon, 
  Sun, 
  LogOut, 
  Search, 
  BookOpen, 
  Flame, 
  Layers, 
  Sparkles,
  ArrowRight,
  FileDown,
  CheckCircle2,
  Share2
} from "lucide-react";
import { mockRecipes, Recipe, RECIPE_CATEGORY_PRIORITY, sortRecipeCategories } from "@/lib/recipeStore";
import { logUserAction } from "@/lib/auditLogService";
import { useRouter } from "next/navigation";

export default function RecetelerPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [categories, setCategories] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("degirmen-kafe");
  const [selectedRegionName, setSelectedRegionName] = useState("Değirmen Kafe");

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

    const activeUser = sessionStorage.getItem("activeUser");
    let activeRegion = "degirmen-kafe";
    if (activeUser) {
      const parsed = JSON.parse(activeUser);
      const reg = parsed.selectedRegion || "degirmen-kafe";
      activeRegion = reg;
      setSelectedRegion(reg);
      setSelectedRegionName(parsed.selectedRegionName || "Değirmen Kafe");
    }

    const storageKey = activeRegion === "degirmen-kafe" ? "degirmen_recipes" : `degirmen_recipes_${activeRegion}`;
    const savedRecipes = localStorage.getItem(storageKey);
    if (savedRecipes) {
      setRecipes(JSON.parse(savedRecipes));
    } else {
      setRecipes(mockRecipes);
    }

    const savedCategories = localStorage.getItem("recipe_categories");
    let cats = RECIPE_CATEGORY_PRIORITY;
    if (savedCategories) {
      try {
        cats = JSON.parse(savedCategories);
      } catch {
        cats = RECIPE_CATEGORY_PRIORITY;
      }
    } else {
      localStorage.setItem("recipe_categories", JSON.stringify(RECIPE_CATEGORY_PRIORITY));
    }
    setCategories(sortRecipeCategories(cats));
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };



  // Pop-up engeline takılmayan HTML5 Blob tabanlı yazdır / PDF İndir fonksiyonu
  const handleDownloadPDF = async () => {
    try {
      let content = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Degirmen Cafe - Tüm Reçeteler Kitapçığı</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #1e293b; background-color: #fff; line-height: 1.5; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #ea580c; padding-bottom: 15px; }
            .header h1 { color: #ea580c; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 1px; }
            .header p { color: #64748b; margin: 5px 0 0 0; font-size: 13px; }
            .category-block { page-break-inside: avoid; margin-bottom: 30px; }
            .category-title { background-color: #fff7ed; border-left: 5px solid #ea580c; padding: 10px 15px; font-size: 15px; font-weight: bold; color: #9a3412; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
            .recipe-item { margin-bottom: 20px; padding: 12px 15px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; page-break-inside: avoid; }
            .recipe-header { font-size: 14px; font-weight: bold; color: #0f172a; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 8px; }
            .recipe-gramaj { font-size: 11px; color: #ea580c; background-color: #ffedd5; padding: 2px 8px; border-radius: 12px; font-weight: bold; }
            .ingredients-list { font-size: 12px; color: #334155; margin: 6px 0 10px 0; padding-left: 20px; }
            .ingredients-list li { margin-bottom: 3px; }
            .instructions-text { font-size: 12px; color: #475569; background-color: #fff; padding: 8px 12px; border-radius: 6px; border-left: 3px solid #cbd5e1; }
            @media print {
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DEĞİRMEN CAFE REÇETE KİTAPÇIĞI</h1>
            <p>Tüm Menü Grupları ve Hazırlanış Detayları (Oluşturulma: ${new Date().toLocaleDateString("tr-TR")})</p>
          </div>
      `;

      categories.forEach(cat => {
        const catRecipes = recipes.filter(r => r.category === cat);
        if (catRecipes.length === 0) return;

        content += `
          <div class="category-block">
            <div class="category-title">${cat}</div>
        `;

        catRecipes.forEach(recipe => {
          content += `
            <div class="recipe-item">
              <div class="recipe-header">
                <span>${recipe.name}</span>
                <span class="recipe-gramaj">${recipe.gramaj}</span>
              </div>
              <ul class="ingredients-list">
                ${recipe.ingredients.map(ing => `<li><strong>${ing.product}</strong>: ${ing.amount} ${ing.unit}</li>`).join("")}
              </ul>
              <div class="instructions-text"><strong>Yapılışı:</strong> ${recipe.instructions}</div>
            </div>
          `;
        });

        content += `</div>`;
      });

      content += `</body></html>`;

      // Blob oluştur ve gizli iframe ile pop-up engelleyicisine takılmadan yazdır/indir
      const blob = new Blob([content], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.src = url;

      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        }, 300);
      };

      // Firestore Audit Log kaydı
      await logUserAction(
        "Reçete Kitapçığı İndirildi / Yazdırıldı",
        "RECETE",
        "Tüm içecek ve ürün reçeteleri PDF / Yazıcı çıktısı olarak indirildi."
      );

      triggerToast("Reçeteler başarıyla hazırlandı ve yazdırılıyor! (Firestore'a İşlendi)");
    } catch (err) {
      console.error("PDF indirme hatası:", err);
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          recipe.ingredients.some(ing => ing.product.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer mr-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 flex items-center justify-center">
            <img src="/logo.png" alt="Değirmen Cafe Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Bar & Mutfak Ürün Reçeteleri</h1>
            <p className="text-xs text-zinc-500">{selectedRegionName} · Standart Hazırlanış & Gramaj Rehberi</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* PDF İndir Butonu */}
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            Tüm Reçeteleri İndir (PDF)
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 pb-20">
        
        {/* Arama ve Filtre */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Reçete adı veya malzeme ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === null
                  ? "bg-orange-600 text-white shadow-md"
                  : "bg-[var(--card)] border border-[var(--border)] text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Tüm Reçeteler
            </button>
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

        {/* Reçete Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredRecipes.map((recipe) => (
            <div 
              key={recipe.id || recipe.name}
              onClick={() => setSelectedRecipe(recipe)}
              className="group bg-[var(--card)] border border-[var(--border)] hover:border-orange-500/50 rounded-3xl p-5 transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2.5 py-0.5 rounded-lg text-[9px] font-bold">
                  {recipe.category}
                </span>
                <span className="text-[9px] text-zinc-400 font-mono bg-[var(--background)] px-2 py-0.5 rounded-md border border-[var(--border)] font-bold">
                  {recipe.gramaj}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 group-hover:text-orange-500 transition-colors leading-snug">
                  {recipe.name}
                </h3>
              </div>

              <div className="flex items-center justify-between text-[10px] text-orange-500 font-bold group-hover:translate-x-0.5 transition-transform pt-1">
                <span>Reçeteyi Göster</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>

        {/* DETAY MODAL */}
        {selectedRecipe && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
                <div>
                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider bg-orange-500/10 px-3 py-1 rounded-xl border border-orange-500/20">
                    {selectedRecipe.category}
                  </span>
                  <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mt-2">
                    {selectedRecipe.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-200 rounded-xl hover:bg-[var(--background)] transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Malzemeler */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-500">Reçete Malzemeleri</h4>
                <div className="bg-[var(--background)] rounded-2xl p-4 border border-[var(--border)] space-y-2">
                  {selectedRecipe.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[var(--border)]/30 last:border-0">
                      <span className="font-semibold text-zinc-300">{ing.product}</span>
                      <span className="font-mono font-bold text-orange-400">{ing.amount} {ing.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hazırlanış */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-500">Hazırlanış Adımları</h4>
                <p className="text-xs text-zinc-300 leading-relaxed bg-[var(--background)] rounded-2xl p-4 border border-[var(--border)] whitespace-pre-line">
                  {selectedRecipe.instructions}
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Kapat
                </button>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[var(--border)] bg-[var(--card)] py-4 px-6 flex items-center justify-between text-xs text-zinc-500">
        <span>© 2026 Değirmen Cafe. Tüm hakları saklıdır.</span>
        <span className="text-orange-500 font-semibold">Tüm Reçeteler Standartlaştırılmıştır</span>
      </footer>

    </div>
  );
}
