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
  FileDown
} from "lucide-react";
import { mockRecipes, Recipe } from "@/lib/recipeStore";

export default function RecetelerPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }

    // Reçeteleri yükle
    const savedRecipes = localStorage.getItem("degirmen_recipes");
    const recipeResetFlag = localStorage.getItem("degirmen_recipes_reset_03");

    if (savedRecipes && recipeResetFlag === "true") {
      setRecipes(JSON.parse(savedRecipes));
    } else {
      setRecipes(mockRecipes);
      localStorage.setItem("degirmen_recipes", JSON.stringify(mockRecipes));
      localStorage.setItem("degirmen_recipes_reset_03", "true");
    }
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

  // PDF / Yazıcı Çıktısı indirme fonksiyonu
  const handleDownloadPDF = () => {
    // Baskıya uygun geçici stil ekle ve pencereyi yazdır
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    let content = `
      <html>
      <head>
        <title>Degirmen Cafe - Tum Receteler Raporu</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 30px; color: #1e293b; background-color: #fff; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #ea580c; padding-bottom: 20px; }
          .header h1 { color: #ea580c; margin: 0; font-size: 28px; }
          .header p { color: #64748b; margin: 5px 0 0 0; font-size: 14px; }
          .category-block { page-break-inside: avoid; margin-bottom: 35px; }
          .category-title { background-color: #f8fafc; border-left: 4px solid #ea580c; padding: 8px 15px; font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
          .recipe-item { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px dashed #e2e8f0; }
          .recipe-name { font-size: 14px; font-weight: bold; color: #1e293b; display: flex; justify-content: space-between; margin-bottom: 5px; }
          .recipe-gramaj { font-size: 11px; color: #ea580c; background-color: #fff7ed; padding: 2px 6px; border-radius: 4px; border: 1px solid #ffedd5; }
          .ingredients-list { font-size: 12px; color: #475569; margin: 5px 0 8px 15px; list-style-type: square; }
          .instructions-text { font-size: 11.5px; color: #64748b; font-style: italic; margin-left: 15px; line-height: 1.4; white-space: pre-line; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DEĞİRMEN CAFE REÇETE KİTAPÇIĞI</h1>
          <p>Tüm Menü Grupları ve Hazırlanış Detayları (Tarih: ${new Date().toLocaleDateString("tr-TR")})</p>
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
            <div class="recipe-name">
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

    content += `
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  // Seçili kategoriye ve aramaya göre reçeteleri filtrele
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          recipe.ingredients.some(ing => ing.product.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* Üst Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (selectedRecipe) {
                setSelectedRecipe(null);
              } else if (selectedCategory) {
                setSelectedCategory(null);
              } else {
                window.location.href = "/dashboard";
              }
            }}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer mr-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 flex items-center justify-center">
            <img src="/logo.png" alt="Değirmen Cafe Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-zinc-800 dark:text-zinc-100">
              {selectedRecipe 
                ? selectedRecipe.name 
                : selectedCategory 
                  ? `${selectedCategory} Reçeteleri` 
                  : "Reçete Kategorileri"}
            </h1>
            <p className="text-xs text-zinc-500">Değirmen Cafe Standartları</p>
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

      {/* Ana Gövde */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-8 flex flex-col justify-center pb-24">
        
        {/* Karşılama ve Arama / Filtre Bölümü */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card)]/50 border border-[var(--border)] rounded-3xl p-6 backdrop-blur-sm">
          <div>
            <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
              {selectedRecipe 
                ? `${selectedRecipe.name} Detayı` 
                : selectedCategory 
                  ? `${selectedCategory} Menüsü` 
                  : "Reçete Kategorileri"}
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {selectedRecipe 
                ? "Hazırlanış aşamaları ve mililitre/gramaj oranları." 
                : "Hazırlamak istediğiniz içecek grubunu seçerek tarif kartını açın."}
            </p>
          </div>
          
          {/* Arama çubuğu ve PDF İndirme Butonu */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-lg shadow-orange-600/15"
              title="Tüm Reçeteleri PDF Olarak İndir"
            >
              <FileDown className="w-4 h-4" /> PDF İndir
            </button>

            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Reçete veya malzeme ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* EKRAN 1: KATEGORİ SEÇİM EKRANI (Ana Sayfadaki custom-border-card Tasarımı ile) */}
        {!selectedCategory && !selectedRecipe && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center py-4 w-full">
            {categories.map((category) => (
              <div 
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="custom-border-card"
                style={{
                  boxShadow: "0 10px 30px -10px rgba(234, 88, 12, 0.3), inset 0 0 0 1px rgba(234, 88, 12, 0.2)"
                }}
              >
                {/* SVG Yuvarlatılmış Köşeli Çerçeve Çizgisi */}
                <svg className="custom-card-border-svg">
                  <rect 
                    style={{ 
                      stroke: "#ea580c",
                      strokeDashoffset: "0"
                    }} 
                  />
                </svg>

                {/* Varsayılan Başlık Görünümü */}
                <div className="card-logo flex flex-col items-center justify-center text-center px-6">
                  <span className="text-sm font-extrabold tracking-wider text-zinc-200 uppercase">
                    {category}
                  </span>
                </div>

                {/* Hover Durumunda Beliren Detay / Giriş Metni */}
                <div className="card-text flex flex-col items-center gap-1.5">
                  <span className="text-orange-500 text-xs font-bold uppercase tracking-wider">Reçeteleri Gör</span>
                  <span className="text-white text-xs font-medium uppercase px-2">{category}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EKRAN 2: SEÇİLİ KATEGORİDEKİ REÇETELER LİSTESİ VEYA ARAMA YAPILDIYSA GENEL SONUÇLAR */}
        {(selectedCategory || searchQuery.trim() !== "") && !selectedRecipe && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map(recipe => (
              <div
                key={recipe.name}
                onClick={() => setSelectedRecipe(recipe)}
                className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-5 hover:border-orange-500/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-44 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                      {recipe.category}
                    </span>
                    <span className="text-[9px] font-extrabold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">
                      {recipe.ingredients.length} Malzeme
                    </span>
                  </div>
                  {/* Menü ürününün ismi her iki temada da tam net okunması için net siyah veya koyu renk yapıldı */}
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mt-2 group-hover:text-orange-500 transition-colors">
                    {recipe.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                    {recipe.instructions}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]/40 mt-2">
                  <span className="text-[10px] text-zinc-500">Tarife Git ({recipe.gramaj})</span>
                  <ArrowRight className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}

            {filteredRecipes.length === 0 && (
              <div className="col-span-full text-center py-12 text-zinc-500 text-xs">
                Seçimlerinize uygun reçete bulunmamaktadır.
              </div>
            )}
          </div>
        )}

        {/* EKRAN 3: SEÇİLİ REÇETENİN DETAY GÖRÜNÜMÜ */}
        {selectedRecipe && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Sol Kolon: Gerekli Malzemeler */}
            <div className="lg:col-span-5 bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-500" /> Gerekli Malzemeler
                </h3>
                <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded uppercase">
                  {selectedRecipe.gramaj}
                </span>
              </div>
              <div className="space-y-3">
                {selectedRecipe.ingredients.map((ing, index) => (
                  <div 
                    key={index} 
                    className="bg-[var(--background)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between"
                  >
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-300">{ing.product}</span>
                    <span className="text-[10px] font-bold text-orange-500 bg-orange-500/5 border border-orange-500/10 px-2.5 py-1 rounded-lg">
                      {ing.amount} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sağ Kolon: Yapılışı & Barista İpuçları */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 space-y-6">
                <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-[var(--border)] pb-3">
                  <Sparkles className="w-4 h-4 text-orange-500" /> Hazırlanış ve Yapılış Aşamaları
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium whitespace-pre-line bg-[var(--background)] border border-[var(--border)] p-5 rounded-2xl">
                  {selectedRecipe.instructions}
                </p>
              </div>

              {/* Barista İpucu Notu */}
              <div className="flex gap-3 bg-orange-500/5 border border-orange-500/20 p-5 rounded-3xl">
                <Flame className="w-5 h-5 text-orange-500 shrink-0" />
                <div className="space-y-1">
                  <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider block">Barista Notu</span>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal">
                    Servis sıcaklığı ve sunum bardağının temizliği içeceğin lezzetini doğrudan etkiler. Her zaman reçetedeki mililitre/shot oranlarına birebir sadık kalın.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

    </div>
  );
}
