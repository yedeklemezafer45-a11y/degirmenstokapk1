// Global Trend & AI Reçete Denge Algoritması Servisi

export interface GlobalTrendItem {
  id: string;
  name: string;
  category: "Cold Foam & Soğuk Köpük" | "Spesiyal Latte & Kahve" | "Katmanlı Mocktail & Spritzer" | "Matcha & Çay İnfüzyonları" | "Fonksiyonel & Yeni Nesil";
  origin: string; // Örn: "Seoul, Güney Kore", "Seattle, ABD", "Melbourne, Avustralya"
  popularityScore: number; // 1 - 100
  trendPeriod: string; // Örn: "2026 Yaz Trendi", "Tüm Zamanlar Viral"
  description: string;
  flavorProfile: {
    sweetness: number; // 1 - 10
    coffeeIntensity: number; // 1 - 10
    creaminess: number; // 1 - 10
    refreshment: number; // 1 - 10
  };
  keyIngredients: string[];
  preparationSummary: string;
  commercialValue: string; // Kafe ortamında kârlılık ve müşteri ilgisi
  tags: string[];
}

export interface EquivalentRecipe {
  id: string;
  title: string;
  originCafe: string;
  matchPercentage: number;
  ingredients: { name: string; amount: string; role: string }[];
  differenceHighlight: string;
  baristaProTip: string;
}

export interface BalanceAnalysisResult {
  overallScore: number; // 0 - 100
  sweetnessIndex: number; // 0 - 100
  sweetnessStatus: "Düşük (Hafif)" | "İdeal & Dengeli" | "Aşırı Tatlı (Baskın)";
  bodyIntensity: number; // 0 - 100
  bodyStatus: "Hafif / Sulu" | "Kremamsı & Dolgun" | "Ağır / Yoğun";
  acidityBalance: number; // 0 - 100
  dilutionResistance: number; // 0 - 100 (Buz erimesine direnç)
  recommendations: string[];
  equivalentRecipes: EquivalentRecipe[];
}

// 1. DÜNYA TRENDLERİ VE VİRAL İÇECEKLER VERİTABANI
export const GLOBAL_TRENDS: GlobalTrendItem[] = [
  {
    id: "pistachio-kunefe-latte",
    name: "Dubai Pistachio Velvet Iced Latte",
    category: "Spesiyal Latte & Kahve",
    origin: "Dubai / Global Viral (TikTok & Instagram)",
    popularityScore: 98,
    trendPeriod: "2026 Global Trend",
    description: "Kavrulmuş antep fıstığı ezmesi, hafif tuzlu vanilya soğuk köpüğü ve çift shot espresso ile katmanlı sunulan ultra popüler lüks latte.",
    flavorProfile: { sweetness: 7, coffeeIntensity: 8, creaminess: 9, refreshment: 6 },
    keyIngredients: ["Double Espresso", "Antep Fıstığı Ezmesi / Şurubu", "Yulaf veya Tam Yağlı Süt", "Tuzlu Vanilya Soğuk Köpük (Cold Foam)"],
    preparationSummary: "Tabana fıstık sosu ve buz, üzerine süt ve espresso katmanı eklenir. En üste mikserle köpürtülmüş vanilyalı soğuk krema ve fıstık parçaları eklenir.",
    commercialValue: "Yüksek satış fiyatı ve olağanüstü sosyal medya çekiciliği. Genç kitlede en çok talep gören ürün.",
    tags: ["Viral", "Pistachio", "Cold Foam", "Lüks", "Katmanlı"]
  },
  {
    id: "strawberry-matcha-cloud",
    name: "Layered Strawberry Cloud Matcha",
    category: "Matcha & Çay İnfüzyonları",
    origin: "Tokyo & Los Angeles Specialty Cafes",
    popularityScore: 95,
    trendPeriod: "2025-2026 Kesintisiz Trend",
    description: "Taze çilek püresi tabanı, soğuk yulaf sütü ve üzerinde kadifemsi çırpılmış seremoniyel yeşil matcha katmanı.",
    flavorProfile: { sweetness: 6, coffeeIntensity: 1, creaminess: 8, refreshment: 9 },
    keyIngredients: ["Çilek Püresi", "Seremoniyel Matcha Tozu", "Buz", "Yulaf Sütü", "Hafif Agave / Şeker Şurubu"],
    preparationSummary: "Bardak dibine 25g çilek püresi konur, buz ve süt eklenir. Bambu fırçayla 60ml sıcak suda köpürtülen matcha buzların üzerinden yavaşça dökülerek 3 renkli katman elde edilir.",
    commercialValue: "Görsel estetiği en yüksek içeceklerden biri. Kahve tüketmeyen veya sağlıklı alternatif arayan kitleyi kafeye çeker.",
    tags: ["Matcha", "Strawberry", "Aesthetic", "Sağlıklı", "Yulaf Sütü"]
  },
  {
    id: "salted-caramel-cold-brew",
    name: "Salted Caramel Velvet Cold Brew",
    category: "Cold Foam & Soğuk Köpük",
    origin: "Seattle, 3. Nesil Dünya Standartı",
    popularityScore: 96,
    trendPeriod: "Klasikleşmiş Küresel Lider",
    description: "16 saat demlenmiş zengin aromalı soğuk kahve üzerine deniz tuzu ve karamel ile zenginleştirilmiş yoğun köpük tabakası.",
    flavorProfile: { sweetness: 6, coffeeIntensity: 9, creaminess: 8, refreshment: 8 },
    keyIngredients: ["Konsantre Cold Brew Kahve", "Tuzlu Karamel Şurubu", "Krema & Süt Karışımı", "Deniz Tuzu Tanesi"],
    preparationSummary: "Cold brew buzla bardağa alınır, içine 10ml vanilya şurubu konur. Ayrı haznede karamel ve krema çırpılarak cold foam yapılır ve kahvenin üzerine yüzdürülür.",
    commercialValue: "Maliyeti son derece düşük (Cold brew + süt köpüğü), kâr marjı %80'in üzerinde olan en verimli kafe içeceği.",
    tags: ["Cold Brew", "Karamel", "Tuzlu Tat", "Düşük Maliyet", "Popüler"]
  },
  {
    id: "hibiscus-passion-spritzer",
    name: "Sparkling Hibiscus Passion Fruit Mocktail",
    category: "Katmanlı Mocktail & Spritzer",
    origin: "Barselona & Milano Yaz Menüleri",
    popularityScore: 92,
    trendPeriod: "2026 Yaz Trendi",
    description: "Doğal mayhoş demlenmiş hibiscus çayı, çarkıfelek (passion fruit) püresi, taze nane ve maden suyu ile hazırlanan alkolsüz ferahlatıcı spritzer.",
    flavorProfile: { sweetness: 5, coffeeIntensity: 0, creaminess: 1, refreshment: 10 },
    keyIngredients: ["Konsantre Hibiscus Çayı", "Passion Fruit Püresi", "Maden Suyu (Soda)", "Lime Dilimi & Taze Nane"],
    preparationSummary: "Bardakta nane ve lime hafifçe ezilir, passion fruit püresi ve bol buz eklenir. Üzerine soda ve en üste yavaşça koyu kırmızı hibiscus dökülerek çift renk oluşturulur.",
    commercialValue: "Sıcak yaz günlerinde kahveye alternatif arayan müşteriler için 1 numaralı susuzluk giderici.",
    tags: ["Mocktail", "Hibiscus", "Ferahlatıcı", "Alkolsüz", "Soda"]
  },
  {
    id: "brown-sugar-shaken-espresso",
    name: "Iced Brown Sugar Oat Shaken Espresso",
    category: "Spesiyal Latte & Kahve",
    origin: "Küresel Trend (Specialty Coffee Movement)",
    popularityScore: 97,
    trendPeriod: "Dünya Çapında En Çok Satan",
    description: "Shaker içinde esmer şeker ve tarçınla buz üzerinde çalkalanarak havalandırılan espresso, üzerine ipeksi soğuk yulaf sütü ilavesi.",
    flavorProfile: { sweetness: 5, coffeeIntensity: 9, creaminess: 7, refreshment: 8 },
    keyIngredients: ["Double Espresso", "Esmer Şeker Şurubu / Tozu", "Toz Tarçın", "Buz", "Barista Yulaf Sütü"],
    preparationSummary: "Sıcak double espresso, esmer şeker şurubu ve tarçın shaker'da bol buzla 15 saniye sertçe çalkalanır. Köpüklü kahve bardağa süzülür, üzerine yulaf sütü eklenir.",
    commercialValue: "Geleneksel buzlu lattelerden %30 daha yüksek fiyatlandırılabilir; hazırlık ritüeli müşteride yüksek kalite algısı yaratır.",
    tags: ["Shaken", "Esmer Şeker", "Tarçın", "Yulaf Sütü", "Hafif Tatlı"]
  },
  {
    id: "lotus-biscoff-cloud-frappe",
    name: "Lotus Biscoff Crumble Cloud Frappe",
    category: "Spesiyal Latte & Kahve",
    origin: "Avrupa & Orta Doğu Popüler Trendi",
    popularityScore: 94,
    trendPeriod: "Viral Tatlı Kahve Trendi",
    description: "Karamelize bisküvi ezmesi, vanilya dondurma bazı, espresso ve üzeri çıtır bisküvi parçacıkları ile zenginleştirilmiş frappe.",
    flavorProfile: { sweetness: 9, coffeeIntensity: 6, creaminess: 10, refreshment: 5 },
    keyIngredients: ["Lotus Biscoff Ezmesi", "Single/Double Espresso", "Süt & Frappe Tozu", "Kremşanti & Bisküvi Kırıntısı"],
    preparationSummary: "Blender'a buz, süt, frappe bazı, 1 kaşık Lotus ezmesi ve espresso eklenip pürüzsüzleşene kadar çekilir. Bardağın kenarları Lotus sosuyla süslenip üzerine kremşanti eklenir.",
    commercialValue: "Tatlı niyetine tüketilen, kış ve sonbahar aylarında sipariş rekoru kıran yüksek ciro kalemi.",
    tags: ["Lotus", "Biscoff", "Frappe", "Tatlı", "Krema"]
  }
];

// 2. DÜNYA STANDARDINDA EŞ DEĞER REÇETELER VERİTABANI (BENCHMARK KÜTÜPHANESİ)
const GLOBAL_BENCHMARK_RECIPES = [
  {
    keywords: ["vanilya", "karamel", "espresso", "sut", "süt"],
    title: "Milano Gold Caramel Macchiato",
    originCafe: "Caffè Cova Milano, İtalya",
    ingredients: [
      { name: "Double Espresso", amount: "30 ml (Hassas Ristretto)", role: "Zengin Gövde" },
      { name: "Vanilya Şurubu", amount: "12 gr (Dengeli Doz)", role: "Arka Plan Aroması" },
      { name: "Yağlı Süt", amount: "180 ml", role: "İpeksi Doku" },
      { name: "Karamel Sosu", amount: "10 gr (Üst Gezdirme)", role: "Damakta Kalan Tat" }
    ],
    differenceHighlight: "İtalyan standardında vanilya şurubu doğrudan süte karıştırılır, espresso süt köpüğünün ortasından dökülür ve karamel en üste çizgi şeklinde çekilir.",
    baristaProTip: "Karamel sosunu sütün dibine değil, üst köpüğe gezdirirseniz ilk yudumda yoğun tatlılık, devamında kahve dengesi hissedilir."
  },
  {
    keywords: ["findik", "fındık", "cikolata", "çikolata", "espresso", "sut", "süt", "mocha"],
    title: "Torino Hazelnut Dark Mocha",
    originCafe: "Bicerin Cafe Torino, İtalya",
    ingredients: [
      { name: "Double Espresso", amount: "36 ml", role: "Yoğun Çikolatamsı Gövde" },
      { name: "Bitter Çikolata Sosu", amount: "20 gr (%70 Kakao)", role: "Ana Karakter" },
      { name: "Fındık Şurubu", amount: "8 gr (Kavrulmuş Fındık)", role: "Aroma Zenginliği" },
      { name: "Süt", amount: "160 ml (65°C)", role: "Gövde" }
    ],
    differenceHighlight: "Fındık şurubu dozajı çikolatayı bastırmayacak şekilde 8g'da sınırlandırılmıştır.",
    baristaProTip: "Sıcak espressoyu bardağın dibindeki çikolata sosuyla önce kaşıkla tamamen çözündürün, ardından sütü ekleyin."
  },
  {
    keywords: ["cilek", "çilek", "bogurtlen", "böğürtlen", "limon", "soda", "hibiscus", "cay", "çay"],
    title: "Kyoto Berry Blossom Spritzer",
    originCafe: "Arabica Kyoto, Japonya",
    ingredients: [
      { name: "Böğürtlen / Çilek Püresi", amount: "25 gr", role: "Meyve Bazı" },
      { name: "Hibiscus Konsantresi", amount: "40 ml", role: "Doğal Asidite & Renk" },
      { name: "Maden Suyu", amount: "150 ml (Soğuk)", role: "Gazlı Ferahlık" },
      { name: "Buz", amount: "120 gr", role: "Sıcaklık Kontrolü" }
    ],
    differenceHighlight: "Şeker şurubu yerine sadece meyve püresi ve soğuk demlenmiş hibiscusun doğal mayhoşluğu kullanılarak kalori ve tatlılık dengelenmiştir.",
    baristaProTip: "Maden suyunu dökmeden önce bardağa 2 damla taze lime suyu sıkmak meyve lezzetlerini iki katına çıkarır."
  },
  {
    keywords: ["hindistan cevizi", "beyaz cikolata", "beyaz çikolata", "espresso", "sut", "süt"],
    title: "Tahiti Coconut White Velvet",
    originCafe: "Specialty Coffee Melbourne, Avustralya",
    ingredients: [
      { name: "Single Shot Espresso", amount: "20 ml", role: "Yumuşak Geçiş" },
      { name: "Hindistan Cevizi Şurubu", amount: "10 gr", role: "Egzotik Aroma" },
      { name: "Beyaz Çikolata Sosu", amount: "15 gr", role: "Kremamsı Tatlılık" },
      { name: "Hindistan Cevizi / İnek Sütü", amount: "180 ml", role: "Doku" }
    ],
    differenceHighlight: "Beyaz çikolatanın yüksek tatlılığı hindistan cevizinin fındıksı aromasıyla dengelenir; kahve dozu yumuşak tutulur.",
    baristaProTip: "Yaz versiyonunda buz miktarını artırıp üzerine hindistan cevizi rendesi serpmek aromayı havaya yayar."
  },
  {
    keywords: ["antep fistigi", "antep fıstığı", "fistik", "fıstık", "espresso", "sut", "süt", "krema"],
    title: "Sicilian Pistachio Crema Freddo",
    originCafe: "Antico Caffè Spinnato Palermo, İtalya",
    ingredients: [
      { name: "Double Espresso", amount: "35 ml", role: "Acılık & Güç" },
      { name: "Antep Fıstığı Ezmesi/Şurubu", amount: "18 gr", role: "Ana Karakter" },
      { name: "Süt", amount: "140 ml", role: "Baz" },
      { name: "Tuzlu Soğuk Krema", amount: "30 gr", role: "Kadife Katman" }
    ],
    differenceHighlight: "Kremaya eklenen bir tutam deniz tuzu fıstığın yağlı lezzetini açığa çıkarır ve tatlılık baygınlığını engeller.",
    baristaProTip: "Fıstık şurubu yerine saf fıstık ezmesi kullanıyorsanız sıcak espresso ile shaker'da homojenize edin."
  }
];

// 3. EŞ DEĞER REÇETE VE LEZZET DENGE HESAPLAMA ALGORİTMASI
export function calculateFlavorBalanceAndEquivalents(ingredients: { name: string; amount: number; unit: string }[]): BalanceAnalysisResult {
  if (!ingredients || ingredients.length === 0) {
    return {
      overallScore: 50,
      sweetnessIndex: 50,
      sweetnessStatus: "İdeal & Dengeli",
      bodyIntensity: 50,
      bodyStatus: "Kremamsı & Dolgun",
      acidityBalance: 50,
      dilutionResistance: 50,
      recommendations: ["Analiz için lütfen içeceğe en az bir kahve/sıvı bazı ve aroma ekleyin."],
      equivalentRecipes: []
    };
  }

  let totalVolume = 0;
  let totalSweetness = 0;
  let totalCoffee = 0;
  let totalMilkOrLiquid = 0;
  let totalIce = 0;
  let totalAcidity = 0;

  const ingredientKeywords: string[] = [];

  ingredients.forEach(item => {
    const lower = item.name.toLowerCase();
    ingredientKeywords.push(...lower.split(/[\s-]+/));

    const amt = item.amount || 0;
    totalVolume += amt;

    // Şuruplar, Soslar, Püreler
    if (lower.includes("şurup") || lower.includes("surup") || lower.includes("sos") || lower.includes("püre") || lower.includes("pure") || lower.includes("bal") || lower.includes("şeker")) {
      totalSweetness += amt * 2.5;
    }

    // Kahve (Espresso, Filtre vb.)
    if (lower.includes("espresso") || lower.includes("kahve") || lower.includes("çekirdek") || lower.includes("ristretto")) {
      totalCoffee += amt * 2.2;
      totalAcidity += amt * 0.8;
    }

    // Süt ve Sıvılar
    if (lower.includes("süt") || lower.includes("sut") || lower.includes("krema") || lower.includes("su") || lower.includes("soda")) {
      totalMilkOrLiquid += amt;
    }

    // Buz
    if (lower.includes("buz") || lower.includes("ice")) {
      totalIce += amt;
    }

    // Meyveli / Çay / Asidik içerikler
    if (lower.includes("hibiscus") || lower.includes("limon") || lower.includes("passion") || lower.includes("çilek") || lower.includes("cilek") || lower.includes("meyve")) {
      totalAcidity += amt * 1.5;
    }
  });

  const sweetRatio = totalVolume > 0 ? (totalSweetness / totalVolume) * 100 : 0;
  const coffeeRatio = totalVolume > 0 ? (totalCoffee / totalVolume) * 100 : 0;
  const iceRatio = totalVolume > 0 ? (totalIce / totalVolume) * 100 : 0;

  // Sweetness Index (0 - 100)
  const sweetnessIndex = Math.min(100, Math.max(10, Math.round(sweetRatio * 4)));
  let sweetnessStatus: "Düşük (Hafif)" | "İdeal & Dengeli" | "Aşırı Tatlı (Baskın)" = "İdeal & Dengeli";
  if (sweetnessIndex > 72) sweetnessStatus = "Aşırı Tatlı (Baskın)";
  else if (sweetnessIndex < 35) sweetnessStatus = "Düşük (Hafif)";

  // Body Intensity (0 - 100)
  const bodyIntensity = Math.min(100, Math.max(10, Math.round((totalCoffee * 1.5 + totalMilkOrLiquid * 0.4) / (totalVolume || 1) * 60)));
  let bodyStatus: "Hafif / Sulu" | "Kremamsı & Dolgun" | "Ağır / Yoğun" = "Kremamsı & Dolgun";
  if (bodyIntensity > 75) bodyStatus = "Ağır / Yoğun";
  else if (bodyIntensity < 38) bodyStatus = "Hafif / Sulu";

  // Dilution Resistance (Buz eridiğinde lezzet kaybı)
  const dilutionResistance = Math.min(100, Math.max(20, Math.round(100 - (iceRatio * 1.2))));

  // Overall Harmony Score (0 - 100)
  let penalty = 0;
  if (sweetnessStatus === "Aşırı Tatlı (Baskın)") penalty += 20;
  if (sweetnessStatus === "Düşük (Hafif)" && totalSweetness > 0) penalty += 10;
  if (bodyStatus === "Hafif / Sulu") penalty += 15;
  if (dilutionResistance < 40) penalty += 15;

  const overallScore = Math.max(45, Math.min(98, 96 - penalty));

  // Öneriler Motoru
  const recommendations: string[] = [];
  if (sweetnessStatus === "Aşırı Tatlı (Baskın)") {
    recommendations.push("🍬 Tatlılık oranı dünya kafe ortalamasının üzerinde. Şurup/sos miktarını 4-6 gr azaltarak kahvenin fındıksı/kakaomsu gövdesini ön plana çıkarabilirsiniz.");
  } else if (sweetnessStatus === "İdeal & Dengeli") {
    recommendations.push("✨ Tatlılık - hammadde dengesi altın orana çok yakın. Müşteriyi baymayan, içimi akıcı bir profil sunuyor.");
  }

  if (totalIce > 120 && totalCoffee < 35) {
    recommendations.push("🧊 Buz oranı yüksek olduğu için içeceğin son yudumlarında sulanma riski var. Kahve dozunu 5ml (çift ristretto) artırmak dengeyi korur.");
  }

  if (totalAcidity > 20 && totalMilkOrLiquid > 100) {
    recommendations.push("🍋 Yüksek asidite ile süt birleşimi kesilme hissi verebilir; süt yerine soğuk köpük (cold foam) veya bitkisel süt alternatifiyle servis edilmesi önerilir.");
  }

  if (recommendations.length === 0) {
    recommendations.push("🎯 Reçete bileşenleri dünya standartlarında dengeli bir lezzet profili oluşturuyor.");
  }

  // Eş Değer Reçeteleri Bulma
  const scoredEquivalents = GLOBAL_BENCHMARK_RECIPES.map(bm => {
    let matchCount = 0;
    bm.keywords.forEach(kw => {
      if (ingredientKeywords.some(ikw => ikw.includes(kw) || kw.includes(ikw))) {
        matchCount++;
      }
    });
    const matchPercentage = Math.min(98, Math.max(55, Math.round((matchCount / bm.keywords.length) * 100) + 15));
    return {
      id: bm.title.toLowerCase().replace(/\s+/g, "-"),
      title: bm.title,
      originCafe: bm.originCafe,
      matchPercentage,
      ingredients: bm.ingredients,
      differenceHighlight: bm.differenceHighlight,
      baristaProTip: bm.baristaProTip
    };
  }).sort((a, b) => b.matchPercentage - a.matchPercentage);

  const topEquivalents = scoredEquivalents.slice(0, 3);

  return {
    overallScore,
    sweetnessIndex,
    sweetnessStatus,
    bodyIntensity,
    bodyStatus,
    acidityBalance: Math.min(95, Math.max(30, Math.round(totalAcidity * 3 + 40))),
    dilutionResistance,
    recommendations,
    equivalentRecipes: topEquivalents
  };
}

// 4. AI BARISTA TREND DANIŞMANI (SORU-CEVAP MOTORU)
export async function getAiBaristaConsultation(userQuestion: string): Promise<string> {
  const q = userQuestion.toLowerCase().trim();

  // Akıllı kural tabanlı uzman yanıt motoru
  if (q.includes("yaz") || q.includes("soğuk") || q.includes("soguk") || q.includes("iced") || q.includes("mocktail") || q.includes("ferah")) {
    return `☕ **Yapay Zeka Barista Danışmanı Yanıtı:**\n\n` +
      `Dünya genelinde 2026 yazının en popüler trendi **"Katmanlı Asidite & Soğuk Köpük (Layered Cold Foam)"** içecekleridir.\n\n` +
      `**Öne Çıkan Global Konseptler:**\n` +
      `1. **Iced Brown Sugar & Cinnamon Shaken Espresso:** Espresso shaker'da esmer şeker ve buzla çalkalanıp üzerine soğuk yulaf sütü dökülür. Maliyeti düşük, algısı çok yüksektir.\n` +
      `2. **Hibiscus Passion Fruit Spritzer:** Mayhoş hibiscus çayı ve meyve püresi maden suyuyla birleşir. Kafeinsiz ferahlatıcı arayan genç kitlede rekor kırar.\n` +
      `3. **Pistachio Cold Foam Cold Brew:** Klasik soğuk kahve üzerine antep fıstığı aromalı hafif tuzlu krema köpüğü yüzdürülür.\n\n` +
      `💡 *Barista Tavsiyesi:* Soğuk içeceklerde şurubu bardağın en dibine değil, espresso veya sütle homojen çalkalayarak verirseniz müşteride ilk yudumda 'aşırı tatlı' hissi oluşmaz.`;
  }

  if (q.includes("denge") || q.includes("tatlı") || q.includes("tatli") || q.includes("oran") || q.includes("şurup") || q.includes("surup") || q.includes("gram")) {
    return `⚖️ **Lezzet Denge & Oran Analizi:**\n\n` +
      `Dünya Specialty Coffee standartlarına göre **350 ml (Orta Boy) bir içecekteki altın lezzet oranları** şöyledir:\n\n` +
      `• **Kahve Dozu:** 30-36 ml Double Espresso (18g kahve çekirdeğinden 36g çıktı)\n` +
      `• **İdeal Şurup Gramajı:** 12 - 16 gr (Maksimum 2 pompa). 20 gr üzeri şuruplar kahvenin doğal çikolata/fındık notalarını tamamen örter.\n` +
      `• **Süt Oranı:** 160 - 180 ml (62°C - 65°C arası buharlandığında sütün doğal laktoz tatlılığı açığa çıkar).\n` +
      `• **Buz Miktarı:** 110 - 130 gr (Bardağın 2/3'ü). Sıcak espresso doğrudan buzun üzerine değil, soğuk sütün üzerine dökülmelidir.\n\n` +
      `💡 *Püf Noktası:* İçeceğin tatlılığını artırmak için şurup miktarını artırmak yerine bir çimdik deniz tuzu eklemek, dilin tat alma tomurcuklarını uyararak tatlılık algısını %25 artırır.`;
  }

  if (q.includes("matcha") || q.includes("çay") || q.includes("cay") || q.includes("chai") || q.includes("bitki")) {
    return `🍵 **Matcha & Çay İnfüzyonları Global Trendi:**\n\n` +
      `Özellikle Tokyo, New York ve Seul kafelerinde geleneksel çaylar yerine **"Meyveli Katmanlı Matcha Latteler"** pazar payını hızla artırıyor.\n\n` +
      `• **Çilek & Matcha Uyumu:** Bardağın dibine 25g çilek püresi, üzerine buz ve yulaf sütü, en üste fırçalanmış yeşil matcha. Renk kontrastı sosyal medyada organik reklam yaratır.\n` +
      `• **Iced Vanilla Chai with Espresso (Dirty Chai):** Baharatlı chai konsantresi ile single shot espresso harmanı sonbahar/kış için en güçlü sadakat içeceğidir.`;
  }

  if (q.includes("maliyet") || q.includes("fiyat") || q.includes("kâr") || q.includes("kar")) {
    return `💰 **Ticari Değerlendirme & Kârlılık:**\n\n` +
      `Dünya standartlarında kafelerde en yüksek kâr marjına sahip 3 içecek grubu:\n\n` +
      `1. **Cold Foam İçecekler (%82 Kâr Marjı):** Standart süte 10ml şurup eklenip el mikseriyle köpürtülerek normal lattenin %25-30 üzerinde bir fiyatla satılabilir.\n` +
      `2. **Ev Yapımı Konsantre Spritzerlar (%85 Kâr Marjı):** Demlenmiş hibiscus/meyve çayı + soda. Hammadde maliyeti 4-6 TL bandındayken satış fiyatı premium düzeydedir.\n` +
      `3. **Shaken Espresso Çeşitleri (%78 Kâr Marjı):** Süt miktarı klasik latteye göre daha az (100ml) kullanılır; çalkalama köpüğü bardağı doldurur.`;
  }

  // Genel Kapsamlı Yanıt
  return `☕ **Yapay Zeka Barista Danışmanı:**\n\n` +
    `Sorunuzu dünya kahve trendleri ve Değirmen Kafe hammadde envanteri perspektifinden değerlendirdim.\n\n` +
    `Dünya çapında başarılı kafelerin en önemli formülü **"Görsel Katman + Dengeli Tatlılık + Güçlü Kahve Gövdesi"** üçlüsüdür.\n\n` +
    `Eğer yeni bir reçete geliştirmeyi düşünüyorsanız, sol paneldeki **"Eş Değer Reçete Bulucu & Denge Ölçer"** modülüne malzemeleri girerek dünyadaki muadillerini ve anlık denge skorunu görebilirsiniz!\n\n` +
    `*Başka hangi malzeme veya trend hakkında fikir almak istersiniz? (Örn: Antep fıstığı ezmesi, Cold Foam, Lotus, Meyve Mocktail)*`;
}
