"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Moon, 
  Sun, 
  Sparkles, 
  Globe2, 
  Scale, 
  Bot, 
  Flame, 
  Send, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Lightbulb, 
  TrendingUp, 
  Compass, 
  Coffee,
  RotateCcw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { 
  GLOBAL_TRENDS, 
  GlobalTrendItem, 
  calculateFlavorBalanceAndEquivalents, 
  BalanceAnalysisResult,
  getAiBaristaConsultation 
} from "@/lib/trendAiService";

export default function AiTrendLaboratuvarPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeTab, setActiveTab] = useState<"trends" | "balance" | "aiChat">("trends");
  
  // Tab 1 States (Trends)
  const [trendCategoryFilter, setTrendCategoryFilter] = useState<string>("all");
  const [selectedTrend, setSelectedTrend] = useState<GlobalTrendItem | null>(GLOBAL_TRENDS[0]);

  // Tab 2 States (Balance & Equivalents)
  const [ingredients, setIngredients] = useState<{ name: string; amount: number; unit: string }[]>([
    { name: "Double Espresso", amount: 36, unit: "ml" },
    { name: "Yağlı Süt", amount: 180, unit: "ml" },
    { name: "Vanilya Şurubu", amount: 14, unit: "gr" },
    { name: "Buz", amount: 100, unit: "gr" }
  ]);
  const [newIngName, setNewIngName] = useState("");
  const [newIngAmount, setNewIngAmount] = useState(15);
  const [newIngUnit, setNewIngUnit] = useState("gr");
  const [balanceResult, setBalanceResult] = useState<BalanceAnalysisResult | null>(null);

  // Tab 3 States (AI Chat)
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "ai"; text: string; time: string }[]>([
    {
      sender: "ai",
      text: "Merhaba! Ben Değirmen Kafe AI Trend ve Reçete Danışmanıyım. ☕\n\nDünya genelinde popülerleşen kahve ve mocktail trendlerini araştırabilir, lezzet dengesi hakkında fikir alabilir veya yeni ürün konseptleri için istişare edebiliriz. Size bugün nasıl yardımcı olabilirim?",
      time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Toast
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
  }, []);

  // Balance calculation on ingredients change
  useEffect(() => {
    const res = calculateFlavorBalanceAndEquivalents(ingredients);
    setBalanceResult(res);
  }, [ingredients]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  // Add ingredient to balance calculator
  const handleAddIngredient = () => {
    if (!newIngName.trim()) {
      triggerToast("Lütfen malzeme adı girin!");
      return;
    }
    setIngredients(prev => [...prev, { name: newIngName.trim(), amount: Number(newIngAmount) || 10, unit: newIngUnit }]);
    setNewIngName("");
    setNewIngAmount(15);
    triggerToast("Malzeme denge analizine eklendi.");
  };

  // Remove ingredient
  const handleRemoveIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  // Quick preset loading into balance calculator
  const handleLoadPreset = (presetName: string) => {
    if (presetName === "pistachio") {
      setIngredients([
        { name: "Double Espresso", amount: 35, unit: "ml" },
        { name: "Antep Fıstığı Ezmesi", amount: 18, unit: "gr" },
        { name: "Süt", amount: 140, unit: "ml" },
        { name: "Soğuk Krema Köpüğü", amount: 30, unit: "gr" },
        { name: "Buz", amount: 90, unit: "gr" }
      ]);
    } else if (presetName === "mocha") {
      setIngredients([
        { name: "Double Espresso", amount: 36, unit: "ml" },
        { name: "Bitter Çikolata Sosu", amount: 20, unit: "gr" },
        { name: "Fındık Şurubu", amount: 8, unit: "gr" },
        { name: "Süt", amount: 160, unit: "ml" }
      ]);
    } else if (presetName === "spritzer") {
      setIngredients([
        { name: "Böğürtlen / Çilek Püresi", amount: 25, unit: "gr" },
        { name: "Hibiscus Konsantresi", amount: 40, unit: "ml" },
        { name: "Maden Suyu", amount: 150, unit: "ml" },
        { name: "Buz", amount: 120, unit: "gr" }
      ]);
    }
    triggerToast(`"${presetName.toUpperCase()}" şablonu yüklendi!`);
  };

  // Send AI Message
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || userInput;
    if (!textToSend.trim()) return;

    const userMsgTime = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    setChatMessages(prev => [...prev, { sender: "user", text: textToSend, time: userMsgTime }]);
    setUserInput("");
    setIsAiTyping(true);

    try {
      const aiReply = await getAiBaristaConsultation(textToSend);
      const aiMsgTime = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
      setChatMessages(prev => [...prev, { sender: "ai", text: aiReply, time: aiMsgTime }]);
    } catch {
      triggerToast("AI yanıtı oluşturulurken bir sorun oluştu.");
    } finally {
      setIsAiTyping(false);
    }
  };

  // Filtered Trends
  const filteredTrends = trendCategoryFilter === "all" 
    ? GLOBAL_TRENDS 
    : GLOBAL_TRENDS.filter(t => t.category === trendCategoryFilter);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-2xl bg-[var(--background)] hover:bg-[var(--border)] text-zinc-400 hover:text-[var(--foreground)] transition-all cursor-pointer"
            title="Ana Sayfaya Dön"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
              </div>
              <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                AI Trend & Reçete Denge Laboratuvarı
              </h1>
            </div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
              Dünya Trendleri • Eş Değer Reçete Algoritması • Fikir Danışmanı
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-2xl bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--border)] text-zinc-400 hover:text-[var(--foreground)] transition-all cursor-pointer"
            title="Tema Değiştir"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
          </button>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <div className="w-full bg-[var(--card)]/50 border-b border-[var(--border)] px-4 sm:px-8 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
          
          <button
            onClick={() => setActiveTab("trends")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
              activeTab === "trends"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[var(--card)]"
            }`}
          >
            <Globe2 className="w-4 h-4" />
            <span>1. Dünya Trendleri & Viral İçecekler</span>
          </button>

          <button
            onClick={() => setActiveTab("balance")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
              activeTab === "balance"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[var(--card)]"
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>2. Eş Değer Reçete Bulucu & Denge Ölçer</span>
          </button>

          <button
            onClick={() => setActiveTab("aiChat")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
              activeTab === "aiChat"
                ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[var(--card)]"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>3. AI Barista Danışmanı</span>
          </button>

        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* ========================================================================= */}
        {/* TAB 1: DÜNYA TRENDLERİ VE VİRAL İÇECEKLER */}
        {/* ========================================================================= */}
        {activeTab === "trends" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header / Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-sm">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-orange-500 flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  Küresel Kahve & İçecek Trendleri (2026)
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Sosyal medyada viral olan ve 3. nesil dünya kafelerinde en çok satan içeceklerin reçete sırları ve analizi.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {[
                  { id: "all", label: "Tümü" },
                  { id: "Spesiyal Latte & Kahve", label: "Spesiyal Latte" },
                  { id: "Cold Foam & Soğuk Köpük", label: "Cold Foam" },
                  { id: "Matcha & Çay İnfüzyonları", label: "Matcha & Çay" },
                  { id: "Katmanlı Mocktail & Spritzer", label: "Mocktail" }
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setTrendCategoryFilter(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                      trendCategoryFilter === c.id
                        ? "bg-orange-500 text-white shadow-sm"
                        : "bg-[var(--background)] text-zinc-400 hover:text-zinc-200 border border-[var(--border)]"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Global Trend Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrends.map((t) => (
                <div 
                  key={t.id}
                  onClick={() => setSelectedTrend(t)}
                  className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-xl hover:-translate-y-1 select-none ${
                    selectedTrend?.id === t.id
                      ? "bg-[var(--card)] border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.15)] ring-1 ring-orange-500"
                      : "bg-[var(--card)] border-[var(--border)] hover:border-orange-500/50"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
                        {t.category}
                      </span>
                      <span className="text-[10px] font-extrabold text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        %{t.popularityScore} İlgi
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-zinc-900 dark:text-white leading-tight">
                        {t.name}
                      </h3>
                      <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-1">
                        <Compass className="w-3 h-3 text-zinc-400" />
                        {t.origin}
                      </p>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {t.description}
                    </p>

                    {/* Lezzet Profili Çubukları */}
                    <div className="space-y-1.5 pt-2 border-t border-[var(--border)]/60 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 font-bold">Tatlılık</span>
                        <span className="font-black text-amber-500">{t.flavorProfile.sweetness} / 10</span>
                      </div>
                      <div className="w-full bg-[var(--background)] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${t.flavorProfile.sweetness * 10}%` }} />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-zinc-500 font-bold">Kahve Gövdesi</span>
                        <span className="font-black text-orange-500">{t.flavorProfile.coffeeIntensity} / 10</span>
                      </div>
                      <div className="w-full bg-[var(--background)] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: `${t.flavorProfile.coffeeIntensity * 10}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--border)]/60 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {t.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[var(--background)] text-zinc-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                      İncele →
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Trend Deep Dive Drawer / Modal */}
            {selectedTrend && (
              <div className="p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-orange-500/30 rounded-3xl text-zinc-100 shadow-2xl space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-400" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-orange-400">
                      Trend Reçete Sırları: {selectedTrend.name}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase bg-zinc-800 px-3 py-1 rounded-full">
                    {selectedTrend.trendPeriod}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Temel Bileşenler</h4>
                    <div className="space-y-1.5">
                      {selectedTrend.keyIngredients.map((ing, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs bg-zinc-800/60 p-2 rounded-xl">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                          <span>{ing}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Hazırlanış & Sunum Püf Noktası</h4>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-700/40">
                      {selectedTrend.preparationSummary}
                    </p>

                    <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider pt-2">Ticari Değerlendirme & Müşteri İlgisi</h4>
                    <p className="text-xs text-emerald-400 font-bold bg-emerald-950/30 p-3 rounded-2xl border border-emerald-500/20">
                      💰 {selectedTrend.commercialValue}
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: EŞ DEĞER REÇETE BULUCU VE CANLI DENGE ÖLÇER */}
        {/* ========================================================================= */}
        {activeTab === "balance" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
            
            {/* SOL SÜTUN: REÇETE BİLEŞENLERİ FORMU (5 Kolon) */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                    <Scale className="w-4 h-4" />
                    İçecek Bileşenleri & Oranlar
                  </h3>
                  <span className="text-[10px] font-bold text-zinc-400">
                    {ingredients.length} Bileşen
                  </span>
                </div>

                {/* Hızlı Şablonlar */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">Hızlı Test Şablonu Yükle</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleLoadPreset("pistachio")}
                      className="p-2 rounded-xl text-[10px] font-bold bg-[var(--background)] hover:bg-orange-500/10 hover:text-orange-500 border border-[var(--border)] transition-all cursor-pointer truncate"
                    >
                      Pistachio Latte
                    </button>
                    <button
                      onClick={() => handleLoadPreset("mocha")}
                      className="p-2 rounded-xl text-[10px] font-bold bg-[var(--background)] hover:bg-amber-500/10 hover:text-amber-500 border border-[var(--border)] transition-all cursor-pointer truncate"
                    >
                      Hazelnut Mocha
                    </button>
                    <button
                      onClick={() => handleLoadPreset("spritzer")}
                      className="p-2 rounded-xl text-[10px] font-bold bg-[var(--background)] hover:bg-teal-500/10 hover:text-teal-500 border border-[var(--border)] transition-all cursor-pointer truncate"
                    >
                      Berry Spritzer
                    </button>
                  </div>
                </div>

                {/* Malzeme Ekleme Formu */}
                <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-2xl space-y-2.5">
                  <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">+ Yeni Bileşen Ekle</span>
                  <div className="grid grid-cols-12 gap-2">
                    <input
                      type="text"
                      placeholder="Malzeme Adı (Örn: Karamel Şurubu, Süt)"
                      value={newIngName}
                      onChange={(e) => setNewIngName(e.target.value)}
                      className="col-span-6 bg-[var(--card)] border border-[var(--border)] rounded-xl p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <input
                      type="number"
                      value={newIngAmount}
                      onChange={(e) => setNewIngAmount(Number(e.target.value))}
                      className="col-span-3 bg-[var(--card)] border border-[var(--border)] rounded-xl p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                    />
                    <select
                      value={newIngUnit}
                      onChange={(e) => setNewIngUnit(e.target.value)}
                      className="col-span-3 bg-[var(--card)] border border-[var(--border)] rounded-xl p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="gr">gr</option>
                      <option value="ml">ml</option>
                      <option value="pompa">pompa</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAddIngredient}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Bileşeni Dengeye Ekle
                  </button>
                </div>

                {/* Ekli Malzemeler Listesi */}
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 no-scrollbar">
                  {ingredients.map((ing, idx) => (
                    <div 
                      key={idx}
                      className="p-2.5 bg-[var(--background)]/70 border border-[var(--border)] rounded-xl flex items-center justify-between text-xs animate-fadeIn"
                    >
                      <div className="flex items-center gap-2">
                        <Coffee className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{ing.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md text-[11px]">
                          {ing.amount} {ing.unit}
                        </span>
                        <button
                          onClick={() => handleRemoveIngredient(idx)}
                          className="text-zinc-500 hover:text-red-500 p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>

            {/* SAĞ SÜTUN: CANLI DENGE ANALİZİ & EŞ DEĞER REÇETELER (7 Kolon) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* CANLI DENGE SKOR KARTI */}
              {balanceResult && (
                <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-black">
                        {balanceResult.overallScore}
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                          Canlı Lezzet Dengesi Skoru
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">
                          Dünya Specialty Standartlarına Göre Uyum Puanı
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                      balanceResult.overallScore >= 80 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    }`}>
                      {balanceResult.overallScore >= 80 ? "Altın Oran ✨" : "Geliştirilebilir ⚡"}
                    </span>
                  </div>

                  {/* Metrik Göstergeleri */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* Tatlılık */}
                    <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-2xl space-y-1">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase block">Tatlılık Seviyesi</span>
                      <span className={`text-xs font-black block ${
                        balanceResult.sweetnessStatus === "İdeal & Dengeli" ? "text-emerald-500" : "text-amber-500"
                      }`}>
                        {balanceResult.sweetnessStatus}
                      </span>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: `${balanceResult.sweetnessIndex}%` }} />
                      </div>
                    </div>

                    {/* Kahve Gövdesi */}
                    <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-2xl space-y-1">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase block">Gövde & Doku</span>
                      <span className="text-xs font-black text-orange-500 block">
                        {balanceResult.bodyStatus}
                      </span>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: `${balanceResult.bodyIntensity}%` }} />
                      </div>
                    </div>

                    {/* Buz Erime Dayanımı */}
                    <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-2xl space-y-1">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase block">Seyrelme Direnci</span>
                      <span className="text-xs font-black text-teal-400 block">
                        %{balanceResult.dilutionResistance}
                      </span>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-teal-400 h-full rounded-full" style={{ width: `${balanceResult.dilutionResistance}%` }} />
                      </div>
                    </div>

                  </div>

                  {/* Öneriler Kutusu */}
                  <div className="space-y-2 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                    <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5" />
                      Algoritmik Dengeleme Tavsiyesi
                    </h4>
                    {balanceResult.recommendations.map((rec, i) => (
                      <p key={i} className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {rec}
                      </p>
                    ))}
                  </div>

                  {/* DÜNYA STANDARDINDA EŞ DEĞER (BENCHMARK) REÇETELER */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-teal-500 flex items-center gap-1.5">
                      <Globe2 className="w-4 h-4" />
                      Dünya Genelindeki Eş Değer (Benchmark) Reçeteler
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Girdiğiniz bileşen profiliyle dünya master baristalarının kullandığı en yakın 3 küresel reçete:
                    </p>

                    <div className="space-y-3">
                      {balanceResult.equivalentRecipes.map((eq) => (
                        <div 
                          key={eq.id}
                          className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl space-y-2.5 hover:border-teal-500/40 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                                {eq.title}
                              </h5>
                              <span className="text-[10px] text-zinc-500 font-bold">{eq.originCafe}</span>
                            </div>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20">
                              %{eq.matchPercentage} Eşleşme
                            </span>
                          </div>

                          {/* Malzeme Karşılaştırma Hapları */}
                          <div className="flex flex-wrap gap-1.5">
                            {eq.ingredients.map((ing, j) => (
                              <span key={j} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[var(--card)] text-zinc-300 border border-[var(--border)]">
                                <b className="text-orange-400">{ing.name}:</b> {ing.amount}
                              </span>
                            ))}
                          </div>

                          {/* Fark ve Pro Tip */}
                          <div className="text-[11px] text-zinc-400 space-y-1 pt-1 border-t border-[var(--border)]/40">
                            <p><b className="text-zinc-300">Fark / İncelik:</b> {eq.differenceHighlight}</p>
                            <p className="text-emerald-400 font-medium">💡 <b className="text-emerald-300">Barista İpucu:</b> {eq.baristaProTip}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>

                </div>
              )}

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: YAPAY ZEKA BARİSTA DANIŞMANI (CANLI İSTİŞARE SOHBETİ) */}
        {/* ========================================================================= */}
        {activeTab === "aiChat" && (
          <div className="max-w-4xl mx-auto space-y-4 animate-fadeIn">
            
            {/* Quick Inspiration Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider shrink-0">Hızlı Sor:</span>
              {[
                "2026 Yazının En Çok Satan Trendleri Neler?",
                "Kahvede Şurup-Süt Altın Denge Oranı Nedir?",
                "En Yüksek Kâr Marjına Sahip İçecekler Hangileri?",
                "Meyveli Mocktail Formülasyonu Nasıl Olmalı?"
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[var(--card)] hover:bg-purple-500/10 hover:text-purple-400 border border-[var(--border)] transition-all cursor-pointer shrink-0 text-zinc-300"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Messages Container */}
            <div className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-sm min-h-[460px] max-h-[560px] flex flex-col justify-between overflow-hidden">
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar mb-4">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} animate-fadeIn`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      {msg.sender === "ai" ? (
                        <>
                          <Bot className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-[9px] font-black uppercase text-purple-400 tracking-wider">AI Barista Danışmanı</span>
                        </>
                      ) : (
                        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Siz (Yetkili)</span>
                      )}
                      <span className="text-[8px] text-zinc-500">{msg.time}</span>
                    </div>

                    <div className={`p-4 rounded-2xl text-xs leading-relaxed max-w-[85%] whitespace-pre-line shadow-sm ${
                      msg.sender === "user"
                        ? "bg-purple-600 text-white font-medium rounded-tr-none"
                        : "bg-[var(--background)] text-zinc-800 dark:text-zinc-200 border border-[var(--border)] rounded-tl-none"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isAiTyping && (
                  <div className="flex items-center gap-2 text-xs text-purple-400 animate-pulse p-2">
                    <Bot className="w-4 h-4 animate-spin-slow" />
                    <span>Yapay zeka trend veritabanını araştırıyor ve analiz ediyor...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="pt-3 border-t border-[var(--border)] flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Trendler, lezzet uyumları veya malzeme oranları hakkında soru sorun..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 text-[var(--foreground)] placeholder-zinc-500"
                />
                <button
                  type="submit"
                  disabled={!userInput.trim() || isAiTyping}
                  className="px-5 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-800 text-white rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md shrink-0 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Danış</span>
                </button>
              </form>

            </div>

          </div>
        )}

      </main>

      {/* TOAST NOTIFICATION */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-5 py-3 rounded-2xl text-xs font-bold shadow-xl backdrop-blur-md animate-slideUp flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

    </div>
  );
}
