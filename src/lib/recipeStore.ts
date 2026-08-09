export interface RecipeIngredient {
  product: string;
  amount: number;
  unit: string;
}

export interface Recipe {
  name: string;
  ingredients: RecipeIngredient[];
  instructions: string;
  gramaj: string;
  category: "SICAK KAHVELER" | "SOĞUK KAHVELER" | "FREŞHLER" | "FROZEN ÇEŞİTLERİ" | "FRAPPE ÇEŞİTLERİ" | "MİLKSHAKE ÇEŞİTLERİ" | "ALTERNATİF FREŞHLER";
}

export const mockRecipes: Recipe[] = [
  // SICAK KAHVELER
  {
    name: "Espresso",
    category: "SICAK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" }
    ],
    instructions: "7-9 gr kahve.",
    gramaj: "Standard"
  },
  {
    name: "Double Espresso",
    category: "SICAK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 18, unit: "gr" }
    ],
    instructions: "14-18 gr kahve.",
    gramaj: "Double"
  },
  {
    name: "Americano",
    category: "SICAK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 18, unit: "gr" },
      { product: "Sicak Su", amount: 180, unit: "ml" }
    ],
    instructions: "14-18 gr kahve uzerine sicak su.",
    gramaj: "12 oz"
  },
  {
    name: "Flat White",
    category: "SICAK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 18, unit: "gr" },
      { product: "HM-SÜT", amount: 180, unit: "ml" }
    ],
    instructions: "Ince sut kopugu ile servis edilir.",
    gramaj: "12 oz"
  },
  {
    name: "Cafe Latte",
    category: "SICAK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-SÜT", amount: 180, unit: "ml" }
    ],
    instructions: "Bol sut, az kopuk (1 cm).",
    gramaj: "12 oz"
  },
  {
    name: "Toffienut Latte",
    category: "SICAK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-TOFFEE NUT AROMALI KOKTEYL ŞURUBU", amount: 20, unit: "gr" },
      { product: "HM-SÜT", amount: 180, unit: "ml" }
    ],
    instructions: "Espresso, Toffeenut Şurubu ve sıcak süt karıştırılarak sunulur.",
    gramaj: "12 oz"
  },
  {
    name: "Hazelnut Latte",
    category: "SICAK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-FINDIK AROMALI KOKTEYL ŞURUBU", amount: 20, unit: "gr" },
      { product: "HM-SÜT", amount: 180, unit: "ml" }
    ],
    instructions: "Fındık şurubu, sıcak süt ve espresso birleşimi.",
    gramaj: "12 oz"
  },
  {
    name: "Karamel Latte",
    category: "SICAK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-KARAMEL AROMALI KOKTEYL ŞURUBU", amount: 20, unit: "gr" },
      { product: "HM-SÜT", amount: 180, unit: "ml" }
    ],
    instructions: "Karamel şurubu, sıcak süt ve espresso.",
    gramaj: "12 oz"
  },
  {
    name: "Vanilyalı Latte",
    category: "SICAK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-VANİLYA AROMALI KOKTEYL ŞURUBU", amount: 20, unit: "gr" },
      { product: "HM-SÜT", amount: 180, unit: "ml" }
    ],
    instructions: "Vanilya şurubu, sıcak süt ve espresso.",
    gramaj: "12 oz"
  },
  {
    name: "Cookie Latte",
    category: "SICAK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-COOKİE AROMALI KOKTEYL ŞURUBU", amount: 20, unit: "gr" },
      { product: "HM-SÜT", amount: 180, unit: "ml" }
    ],
    instructions: "Cookie şurubu, sıcak süt ve espresso.",
    gramaj: "12 oz"
  },
  {
    name: "Almond Latte",
    category: "SICAK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-KAVRULMUŞ BADEM AROMALI KOKTEYL ŞURUP", amount: 20, unit: "gr" },
      { product: "HM-SÜT", amount: 180, unit: "ml" }
    ],
    instructions: "Badem şurubu, sıcak süt ve espresso.",
    gramaj: "12 oz"
  },
  {
    name: "Mocha",
    category: "SICAK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-BİTTER ÇİKOLATALI BAR SOS MONTE CRİSTO", amount: 25, unit: "gr" },
      { product: "HM-SÜT", amount: 180, unit: "ml" }
    ],
    instructions: "Bitter çikolata sosu, espresso ve sıcak süt karışımı.",
    gramaj: "12 oz"
  },
  {
    name: "White Mocha",
    category: "SICAK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-BEYAZ ÇİKOLATALI BAR SOS MONTE CRİSTO", amount: 25, unit: "gr" },
      { product: "HM-SÜT", amount: 180, unit: "ml" }
    ],
    instructions: "Beyaz çikolata sosu, espresso ve sıcak süt karışımı.",
    gramaj: "12 oz"
  },

  // SOĞUK KAHVELER
  {
    name: "Iced Americano",
    category: "SOĞUK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 18, unit: "gr" }
    ],
    instructions: "2 Shot Espresso uzerine su ve buz.",
    gramaj: "12 oz"
  },
  {
    name: "Iced Latte",
    category: "SOĞUK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-SÜT", amount: 150, unit: "ml" }
    ],
    instructions: "-ESPRESSO : 9 GRAM\n-SUT : 150 GRAM\n-BUZ : BARDAK HACMI KADAR",
    gramaj: "12 oz"
  },
  {
    name: "Iced Flat White",
    category: "SOĞUK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-SÜT", amount: 150, unit: "ml" }
    ],
    instructions: "-ESPRESSO : 13 GRAM\n-SUT : 150 GRAM\n-BUZ : BARDAK HACMI KADAR",
    gramaj: "12 oz"
  },
  {
    name: "Iced Toffienut",
    category: "SOĞUK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-TOFFEE NUT AROMALI KOKTEYL ŞURUBU", amount: 20, unit: "gr" },
      { product: "HM-SÜT", amount: 150, unit: "ml" }
    ],
    instructions: "-ESPRESSO : 9 GRAM\n-TOFFIENUT SURUBU : 20 GRAM\n-SUT : 150 GRAM\n-BUZ : BARDAK HACMI KADAR",
    gramaj: "12 oz"
  },
  {
    name: "Iced Hazelnut",
    category: "SOĞUK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-FINDIK AROMALI KOKTEYL ŞURUBU", amount: 20, unit: "gr" },
      { product: "HM-SÜT", amount: 150, unit: "ml" }
    ],
    instructions: "-ESPRESSO : 9 GRAM\n-HAZELNUT SURUBU : 20 GRAM\n-SUT : 150 GRAM\n-BUZ : BARDAK HACMI KADAR",
    gramaj: "12 oz"
  },
  {
    name: "Iced Karamel",
    category: "SOĞUK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-KARAMEL AROMALI KOKTEYL ŞURUBU", amount: 20, unit: "gr" },
      { product: "HM-SÜT", amount: 150, unit: "ml" }
    ],
    instructions: "-ESPRESSO : 9 GRAM\n-KARAMEL SURUBU : 20 GRAM\n-SUT : 150 GRAM\n-BUZ : BARDAK HACMI KADAR",
    gramaj: "12 oz"
  },
  {
    name: "Iced Vanilya",
    category: "SOĞUK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-VANİLYA AROMALI KOKTEYL ŞURUBU", amount: 20, unit: "gr" },
      { product: "HM-SÜT", amount: 150, unit: "ml" }
    ],
    instructions: "-ESPRESSO : 9 GRAM\n-VANILYA SURUBU : 20 GRAM\n-SUT : 150 GRAM\n-BUZ : BARDAK HACMI KADAR",
    gramaj: "12 oz"
  },
  {
    name: "Iced Cookie",
    category: "SOĞUK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-COOKİE AROMALI KOKTEYL ŞURUBU", amount: 20, unit: "gr" },
      { product: "HM-SÜT", amount: 150, unit: "ml" }
    ],
    instructions: "-ESPRESSO : 9 GRAM\n-COOKIE SURUBU : 20 GRAM\n-SUT : 150 GRAM\n-BUZ : BARDAK HACMI KADAR",
    gramaj: "12 oz"
  },
  {
    name: "Iced Almond",
    category: "SOĞUK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-KAVRULMUŞ BADEM AROMALI KOKTEYL ŞURUP", amount: 20, unit: "gr" },
      { product: "HM-SÜT", amount: 150, unit: "ml" }
    ],
    instructions: "-ESPRESSO : 9 GRAM\n-ALMOND SURUBU : 20 GRAM\n-SUT : 150 GRAM\n-BUZ : BARDAK HACMI KADAR",
    gramaj: "12 oz"
  },
  {
    name: "Iced Mocha",
    category: "SOĞUK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-BİTTER ÇİKOLATALI BAR SOS MONTE CRİSTO", amount: 25, unit: "gr" },
      { product: "HM-SÜT", amount: 150, unit: "ml" }
    ],
    instructions: "-ESPRESSO : 9 GRAM\n-CIKOLATA BAR SOS : 25 ML\n-SUT : 150 GRAM\n-BUZ : BARDAK HACMI KADAR",
    gramaj: "12 oz"
  },
  {
    name: "Iced White Mocha",
    category: "SOĞUK KAHVELER",
    ingredients: [
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-BEYAZ ÇİKOLATALI BAR SOS MONTE CRİSTO", amount: 25, unit: "gr" },
      { product: "HM-SÜT", amount: 150, unit: "ml" }
    ],
    instructions: "-ESPRESSO : 9 GRAM\n-WHITE MOCHA SOS : 25 ML\n-SUT : 150 GRAM\n-BUZ : BARDAK HACMI KADAR",
    gramaj: "12 oz"
  },
  {
    name: "Iced Antep Fistikli",
    category: "SOĞUK KAHVELER",
    ingredients: [
      { product: "HM-ANTEP FISTIK SOS", amount: 30, unit: "ml" },
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-SÜT", amount: 150, unit: "ml" }
    ],
    instructions: "SHAKER ICERISINE\n-ESPRESSO : 9 GRAM\n-ANTEP FISTIK SOS : 30 GRAM\n-SUT : 150 GRAM\n-BUZ : BARDAK HACMI KADAR\n\nANTEP FISTIK SOS,SUT,BUZ Urunleri SHAKERDA Hazirlayip Shakei Tamamlayip SONRASINDA UZERINE TEK SHAT ESPRESSO DOKUP Servise Hazir Halde sunuyoruz.",
    gramaj: "12 oz"
  },
  {
    name: "Iced Madagaskar Vanilya",
    category: "SOĞUK KAHVELER",
    ingredients: [
      { product: "HM-MADAGASKAR SOS", amount: 30, unit: "ml" },
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" },
      { product: "HM-SÜT", amount: 150, unit: "ml" }
    ],
    instructions: "SHAKER ICERISINE\n-ESPRESSO : 9 GRAM\n-MADAGASKAR SOS : 30 GRAM\n-SUT : 150 GRAM\n-BUZ : BARDAK HACMI KADAR\n\nMADAGASKAR SOS,SUT,BUZ Urunleri Hazirlayip Shakei Tamamlayip UZERINE TEK SHAT ESPRESSO DOKUP Servise Hazir Halde sunuyoruz.",
    gramaj: "12 oz"
  },

  // FREŞHLER
  {
    name: "Sakura Base",
    category: "FREŞHLER",
    ingredients: [
      { product: "HM-SAKURA BASE", amount: 40, unit: "ml" }
    ],
    instructions: "Shakirin Icerisine\n- Sakura Surubu : 40 ML\n- Buz : BIR KUREK\n- Su : 150 ML\n\nUrunleri Hazirlayip Shakei Tamamlayip Servise Hazir Halde sunuyoruz.",
    gramaj: "12 oz"
  },
  {
    name: "Sakura Limonata",
    category: "FREŞHLER",
    ingredients: [
      { product: "HM-SAKURA BASE", amount: 20, unit: "ml" },
      { product: "HM-LİMONATA", amount: 150, unit: "ml" }
    ],
    instructions: "Shakirin Icerine\n- Sakura Surubu : 20 ML\n- Ev Yapimi Limonata : 150 Ml\n- Buz : BIR KUREK\n\nUrunleri Hazirlayip Shakei Tamamlayip Servise Hazir Halde sunuyoruz.",
    gramaj: "12 oz"
  },
  {
    name: "Sakura Mojito",
    category: "FREŞHLER",
    ingredients: [
      { product: "HM-SAKURA BASE", amount: 20, unit: "ml" },
      { product: "HM-MOJITO SURUBU", amount: 20, unit: "ml" },
      { product: "HM-SADE SODA", amount: 1, unit: "Adet" }
    ],
    instructions: "- Sakura Surubu : 20 ML\n- Mojito Surubu : 20 Ml\n- Sade Soda : 1 ADET\n- Buz : BIR KUREK\n\nBardagin Icerisine Suruplari Ve Buzlari Ekledikten Sonra Uzerine Sade Soda Dokulup Karistirilip Servisi Tamamliyoruz.",
    gramaj: "12 oz"
  },
  {
    name: "Cilekli Mojito",
    category: "FREŞHLER",
    ingredients: [
      { product: "HM-ÇİLEK AROMALI KOKTEYL ŞURUBU", amount: 20, unit: "ml" },
      { product: "HM-MOJITO SURUBU", amount: 20, unit: "ml" },
      { product: "HM-SADE SODA", amount: 1, unit: "Adet" }
    ],
    instructions: "-Cilek Surubu : 20 Ml\n-Mojito Surubu : 20 Ml\n-Sade Soda : 1 adet\n-Buz : Bir Kurek\n\nBardagin Icerisine Suruplari Ve Buzlari Ekledikten Sonra Uzerine Sade Soda Dokulup Karistirilip Servisi Tamamliyoruz.",
    gramaj: "12 oz"
  },
  {
    name: "Blue Lime",
    category: "FREŞHLER",
    ingredients: [
      { product: "HM-TURUNÇ AROMALI KOKTEYL ŞURUBU", amount: 20, unit: "ml" },
      { product: "HM-ANANAS SUYU", amount: 150, unit: "ml" }
    ],
    instructions: "Shakir Icerisine\n- 20 Ml Turunc Surubu\n- 5 Ml Limon Suyu\n- 150 Ml Ananas Suyu\n- Buz\n\nUrunleri Hazirlayip Shakei Tamamlayip Servise Hazir Halde sunuyoruz.",
    gramaj: "12 oz"
  },
  {
    name: "Aronya",
    category: "FREŞHLER",
    ingredients: [
      { product: "HM-ARONYA SURUBU", amount: 40, unit: "ml" },
      { product: "HM-ELMA SUYU", amount: 150, unit: "ml" }
    ],
    instructions: "Shaker Icerisine\n- Aronya Surup : 40 Ml\n- Buz : Bir Kurek\n- Elma Suyu : 150Ml\n\nUrunleri Hazirlayip Shakei Tamamlayip Servise Hazir Halde sunuyoruz.",
    gramaj: "12 oz"
  },
  {
    name: "Passion Guava",
    category: "FREŞHLER",
    ingredients: [
      { product: "HM-PASSION GUAVA BASE", amount: 40, unit: "ml" }
    ],
    instructions: "Shake Icerisine\n-Passion Guava Surup : 40 Ml\n-Buz : Bir Kurek Olcusu\n-Su : 150 Ml\n\nUrunleri Hazirlayip Shakei Tamamlayip Servise Hazir Halde sunuyoruz.",
    gramaj: "12 oz"
  },
  {
    name: "Robios Seftali",
    category: "FREŞHLER",
    ingredients: [
      { product: "HM-ROBIOS SEFTALI BASE", amount: 25, unit: "ml" }
    ],
    instructions: "Shake Icerisine\n- Robios Seftali Surup : 25 ml\n- Buz : Bir Kurek\n- Su : 150 Ml\n\nUrunleri Hazirlayip Shakei Tamamlayip Servise Hazir Halde sunuyoruz.",
    gramaj: "12 oz"
  },
  {
    name: "Kuzu Kulagi",
    category: "FREŞHLER",
    ingredients: [
      { product: "HM-KUZU KULAGI BASE", amount: 30, unit: "ml" }
    ],
    instructions: "Shaker Icerisine\n- Kuzu Kulagi Base : 30 Ml\n- Buz : Bir Kurek\n- Su : 150 Ml\n\nUrunleri Hazirlayip Shakei Tamamlayip Servise Hazir Halde sunuyoruz.",
    gramaj: "12 oz"
  },
  {
    name: "Rasbery Acai",
    category: "FREŞHLER",
    ingredients: [
      { product: "HM-RASBERY ACAI BASE", amount: 30, unit: "ml" }
    ],
    instructions: "Shaker Icerisine\n- Rasberry Acai : 30 Ml\n- Buz : BIR KUREK\n- Su : 150 Ml\n\nUrunleri Hazirlayip Shakei Tamamlayip Servise Hazir Halde sunuyoruz.",
    gramaj: "12 oz"
  },
  {
    name: "Berry Hibiscus",
    category: "FREŞHLER",
    ingredients: [
      { product: "HM-BERRY HIBISCUS AROMALI KOKTEYL ŞURUBU", amount: 40, unit: "ml" }
    ],
    instructions: "Shakirin Icerisine\n- BERRY HIBISCUS Surubu : 40 ML\n- Buz : BIR KUREK\n- Su : 150 ML\n- KURUTULMUS BOGURTLEN : 1 DILIM\n\nUrunleri Hazirlayip Shakei Tamamlayip Servise Hazir Halde sunuyoruz.",
    gramaj: "12 oz"
  },
  {
    name: "Cool Lime",
    category: "FREŞHLER",
    ingredients: [
      { product: "HM-COOL LIME AROMALI KOKTEYL ŞURUBU", amount: 40, unit: "ml" }
    ],
    instructions: "Shakirin Icerisine\n- COOL LIME Surubu : 40 ML\n- Buz : BIR KUREK\n- Su : 150 ML\n- KURUTULMUS LIME : 1 DILIM\n\nUrunleri Hazirlayip Shakei Tamamlayip Servise Hazir Halde sunuyoruz.",
    gramaj: "12 oz"
  },
  {
    name: "Orange Mango",
    category: "FREŞHLER",
    ingredients: [
      { product: "HM-ORANGE & MANGO AROMALI KOKTEYL ŞURUP", amount: 40, unit: "ml" }
    ],
    instructions: "Shakirin Icerisine\n- ORANGE MANGO Surubu : 40 ML\n- Buz : BIR KUREK\n- Su : 150 ML\n- PORTAKAL : 1 DILIM\n\nUrunleri Hazirlayip Shakei Tamamlayip Servise Hazir Halde sunuyoruz.",
    gramaj: "12 oz"
  },
  {
    name: "İtalyan Sodası",
    category: "FREŞHLER",
    ingredients: [
      { product: "HM-NAR AROMALI KOKTEYL ŞURUBU", amount: 20, unit: "ml" },
      { product: "HM-MEYVELİ SODA KARPUZ ÇİLEK", amount: 150, unit: "ml" },
      { product: "HM-TURUNÇ AROMALI KOKTEYL ŞURUBU", amount: 20, unit: "ml" }
    ],
    instructions: "BARDAK Icerisine\n- NAR Surubu : 20 ML\n- Buz : BARDAK HACMI KADAR\n- KARPUZ CILEK SODA : 150 ML\n- TURUNC SURUBU : 20 ML\n\nNAR SURUBU EN ALT KISIMDA KALACAK SEKILDE UZERINE BARDAK HACMI KADAR BUZ, UZERINE KARPUZ CILEK SODA YAVAS DOKUP UZERINE TURUNC SURUBU",
    gramaj: "12 oz"
  },

  // FROZEN ÇEŞİTLERİ
  {
    name: "Orman Meyveli Frozen",
    category: "FROZEN ÇEŞİTLERİ",
    ingredients: [
      { product: "HM-ORMAN MEYVELİ PÜRE", amount: 80, unit: "gr" },
      { product: "HM-SU", amount: 100, unit: "ml" }
    ],
    instructions: "Orman meyveli püre, su ve buz blenderda çekilerek frozen kıvamında sunulur.",
    gramaj: "12 oz"
  },
  {
    name: "Mangolu Frozen",
    category: "FROZEN ÇEŞİTLERİ",
    ingredients: [
      { product: "HM-MANGO PÜRE", amount: 80, unit: "gr" },
      { product: "HM-SU", amount: 100, unit: "ml" }
    ],
    instructions: "Mango püresi, su ve bol buz blenderdan geçirilir.",
    gramaj: "12 oz"
  },
  {
    name: "Çilekli Frozen",
    category: "FROZEN ÇEŞİTLERİ",
    ingredients: [
      { product: "HM-ÇİLEK PÜRE", amount: 80, unit: "gr" },
      { product: "HM-SU", amount: 100, unit: "ml" }
    ],
    instructions: "Çilek püresi, su ve buz blenderdan geçirilerek dondurulmuş sunulur.",
    gramaj: "12 oz"
  },
  {
    name: "Yeşil Elmalı Frozen",
    category: "FROZEN ÇEŞİTLERİ",
    ingredients: [
      { product: "HM-YEŞİL ELMA PÜRE", amount: 80, unit: "gr" },
      { product: "HM-SU", amount: 100, unit: "ml" }
    ],
    instructions: "Yeşil elma püresi, su ve buz blenderda çekilir.",
    gramaj: "12 oz"
  },

  // FRAPPE ÇEŞİTLERİ
  {
    name: "Mocha Nut Frappe",
    category: "FRAPPE ÇEŞİTLERİ",
    ingredients: [
      { product: "HM-BİTTER ÇİKOLATALI BAR SOS MONTE CRİSTO", amount: 20, unit: "ml" },
      { product: "HM-FINDIK AROMALI KOKTEYL ŞURUBU", amount: 10, unit: "ml" },
      { product: "HM-SÜT", amount: 50, unit: "ml" },
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" }
    ],
    instructions: "BLEANDER ICERISINE\n- Cikolata Bar Sos : 20 Ml\n- Findik Surubu : 10 Ml\n- Buz : BIR KUREK\n- Sut : 50 Ml\n- Espresso : TEK SHAT ESPRESSO\n\nHazirlayip Servise Hazir Halde sunuyoruz.",
    gramaj: "12 oz"
  },
  {
    name: "Almond Caramel Frappe",
    category: "FRAPPE ÇEŞİTLERİ",
    ingredients: [
      { product: "HM-BEYAZ ÇİKOLATALI BAR SOS MONTE CRİSTO", amount: 30, unit: "ml" },
      { product: "HM-KAVRULMUŞ BADEM AROMALI KOKTEYL ŞURUP", amount: 10, unit: "ml" },
      { product: "HM-SÜT", amount: 50, unit: "ml" },
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" }
    ],
    instructions: "BLEANDER ICERISINE\n- BEYAZ Cikolata Bar Sos : 30 Ml\n- Badem Surubu : 10 Ml\n- Buz : BIR KUREK\n- Sut : 50 Ml\n- Espresso : 9 Ml\n\nHazirlayip Servise Hazir Halde sunuyoruz.",
    gramaj: "12 oz"
  },
  {
    name: "Antep Fıstıklı Frappe",
    category: "FRAPPE ÇEŞİTLERİ",
    ingredients: [
      { product: "HM-ANTEP FISTIK SOS", amount: 40, unit: "ml" },
      { product: "HM-SÜT", amount: 50, unit: "ml" },
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" }
    ],
    instructions: "BLEANDER ICERISINE\n- ANTEP FISTIK BAR SOS : 40 Ml\n- Buz : BIR KUREK\n- Sut : 50 Ml\n- Espresso : 9 Ml\n\nHazirlayip Servise Hazir Halde sunuyoruz.",
    gramaj: "12 oz"
  },
  {
    name: "Lotus Frappe",
    category: "FRAPPE ÇEŞİTLERİ",
    ingredients: [
      { product: "HM-LOTUS BİSCOFF SPREAD SÜRÜLEBİLİR BİSKÜVİ EZMESİ", amount: 50, unit: "ml" },
      { product: "HM-SÜT", amount: 50, unit: "ml" },
      { product: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", amount: 9, unit: "gr" }
    ],
    instructions: "BLEANDER ICERISINE\n- LOTUS : 50 Ml\n- Buz : BIR KUREK\n- Sut : 50 Ml\n- Espresso : 9 Ml\n\nHazirlayip Servise Hazir Halde sunuyoruz.",
    gramaj: "12 oz"
  },

  // MİLKSHAKE ÇEŞİTLERİ
  {
    name: "Milkshake (Standart)",
    category: "MİLKSHAKE ÇEŞİTLERİ",
    ingredients: [
      { product: "HM-ÇİKOLATA AROMALI MİLKSHAKE TOZU", amount: 25, unit: "gr" },
      { product: "HM-ÇİLEK AROMALI MİLKSHAKE TOZU", amount: 25, unit: "gr" },
      { product: "HM-KARAMEL AROMALI MİLKSHAKE TOZU", amount: 25, unit: "gr" },
      { product: "HM-MUZ AROMALI MİLKSHAKE TOZU", amount: 25, unit: "gr" },
      { product: "HM-VANİLYA AROMALI MİLKSHAKE TOZU", amount: 25, unit: "gr" }
    ],
    instructions: "BLEANDER ICERISINE\n- Yaklasik 2-2.5 olcek toz.\n- BUZ : 1 KUREK",
    gramaj: "12 oz"
  },

  // ALTERNATİF FREŞHLER
  {
    name: "Limonata",
    category: "ALTERNATİF FREŞHLER",
    ingredients: [
      { product: "HM-LİMONATA", amount: 150, unit: "ml" },
      { product: "HM-SU", amount: 150, unit: "ml" }
    ],
    instructions: "Nane ve limon dilimi ile servis edin.",
    gramaj: "12 oz"
  },
  {
    name: "Sakura Limonata",
    category: "ALTERNATİF FREŞHLER",
    ingredients: [
      { product: "HM-SAKURA BASE", amount: 20, unit: "ml" },
      { product: "HM-LİMONATA", amount: 150, unit: "ml" }
    ],
    instructions: "Shakirin Icerine\n- Sakura Surubu : 20 ML\n- Ev Yapimi Limonata : 150 Ml\n- Buz : BIR KUREK\n\nUrunleri Hazirlayip Shakei Tamamlayip Servise Hazir Halde sunuyoruz.",
    gramaj: "12 oz"
  },
  {
    name: "İtalyan Sodası",
    category: "ALTERNATİF FREŞHLER",
    ingredients: [
      { product: "HM-NAR AROMALI KOKTEYL ŞURUBU", amount: 20, unit: "ml" },
      { product: "HM-MEYVELİ SODA KARPUZ ÇİLEK", amount: 150, unit: "ml" },
      { product: "HM-TURUNÇ AROMALI KOKTEYL ŞURUBU", amount: 20, unit: "ml" }
    ],
    instructions: "BARDAK Icerisine\n- NAR Surubu : 20 ML\n- Buz : BARDAK HACMI KADAR\n- KARPUZ CILEK SODA : 150 ML\n- TURUNC SURUBU : 20 ML\n\nNAR SURUBU EN ALT KISIMDA KALACAK SEKILDE UZERINE BARDAK HACMI KADAR BUZ, UZERINE KARPUZ CILEK SODA YAVAS DOKUP UZERINE TURUNC SURUBU",
    gramaj: "12 oz"
  },
  {
    name: "Çilekli Limonata",
    category: "ALTERNATİF FREŞHLER",
    ingredients: [
      { product: "HM-ÇİLEK AROMALI KOKTEYL ŞURUBU", amount: 20, unit: "ml" },
      { product: "HM-LİMONATA", amount: 150, unit: "ml" }
    ],
    instructions: "Bardağa buz doldurun. Ev yapımı limonatayı ekledikten sonra üzerine çilek kokteyl şurubunu yavaşça süzerek renk geçişini sağlayın. Taze çilek dilimi ile servis edin.",
    gramaj: "12 oz"
  },
  {
    name: "Naneli Limonata",
    category: "ALTERNATİF FREŞHLER",
    ingredients: [
      { product: "HM-BAHÇE NANE AROMALI KOKTEYL ŞURUBU", amount: 15, unit: "ml" },
      { product: "HM-LİMONATA", amount: 150, unit: "ml" }
    ],
    instructions: "Taze limonata içerisine nane şurubunu ve taze nane yapraklarını ekleyip shaker yardımıyla buzla birlikte çalkalayın. Serinletici yeşil renkli sunum elde edin.",
    gramaj: "12 oz"
  }
];
