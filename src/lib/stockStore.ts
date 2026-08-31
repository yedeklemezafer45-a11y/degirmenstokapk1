export type StockCategory = 
  | "Çay Ve Bitki Çayları"
  | "Kahveler"
  | "Şuruplar"
  | "Soslar"
  | "Püreler"
  | "Toz Grubu"
  | "Ek Ürünler"
  | "Litrelik Ürünler"
  | "Yan Ürünler"
  | "Kutu Ve Plastik Ürünler"
  | "Soft İçecek Ürünleri"
  | "Pastalar";

export interface StockItem {
  id: string;
  name: string;
  category: StockCategory;
  depodaBulunan: number; // Depoya ilk girilen toplu miktar
  depodanAlinan: number;  // Personel tarafından eksiltilen toplam miktar
  quantity: number;      // Depoda Kalan (depodaBulunan - depodanAlinan)
  unit: string;
  minLimit: number;
  price: number;
  weightInfo?: string;   // Ürün paket ağırlık bilgisi (örn: "0.970 kg", "2.500 kg")
  expDate?: string;      // Son Tüketim Tarihi (YYYY-MM-DD formatında)
  orderable?: boolean;   // Sipariş verilebilir mi?
}

export const mockStockItems: StockItem[] = [
  // ŞURUPLAR (Her ürünün kilogramı 0,970 gram)
  { id: "sy1", name: "HM-BAHÇE NANE AROMALI KOKTEYL ŞURUBU", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy2", name: "HM-BERRY HIBISCUS AROMALI KOKTEYL ŞURUBU", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy3", name: "HM-BÖĞÜRTLEN AROMALI KOKTEYL ŞURUBU", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy4", name: "HM-COOKİE AROMALI KOKTEYL ŞURUBU", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy5", name: "HM-COOL LIME AROMALI KOKTEYL ŞURUBU", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy6", name: "HM-ÇARKIFELEK (PASSION FRUIT) AROMALI KOKTEYL ŞURUBU", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy7", name: "HM-ÇİLEK AROMALI KOKTEYL ŞURUBU", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy8", name: "HM-FINDIK AROMALI KOKTEYL ŞURUBU", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy9", name: "HM-KARAMEL AROMALI KOKTEYL ŞURUBU", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy10", name: "HM-KAVRULMUŞ BADEM AROMALI KOKTEYL ŞURUP", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy11", name: "HM-MUZ AROMALI KOKTEYL ŞURUBU", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy12", name: "HM-NAR AROMALI KOKTEYL ŞURUBU", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy13", name: "HM-ORANGE & MANGO AROMALI KOKTEYL ŞURUP", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy14", name: "HM-PECAN CEVİZİ AROMALI KOKTEYL ŞURUBU", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy15", name: "HM-ŞEKER AROMALI KOKTEYL ŞURUBU", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy16", name: "HM-TOFFEE NUT AROMALI KOKTEYL ŞURUBU", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy17", name: "HM-TURUNÇ AROMALI KOKTEYL ŞURUBU", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy18", name: "HM-VANİLYA AROMALI KOKTEYL ŞURUBU", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy19", name: "HM-SAKURA BASE", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy20", name: "HM-MOJITO SURUBU", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy21", name: "HM-ARONYA SURUBU", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy22", name: "HM-PASSION GUAVA BASE", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy23", name: "HM-ROBIOS SEFTALI BASE", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy24", name: "HM-KUZU KULAGI BASE", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },
  { id: "sy25", name: "HM-RASBERY ACAI BASE", category: "Şuruplar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 2, price: 150, weightInfo: "0.970 kg" },

  // KAHVELER
  { id: "cf1", name: "HM-DAMLA SAKIZLI TÜRK KAHVESİ", category: "Kahveler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 3, price: 280, weightInfo: "0.500 kg" },
  { id: "cf2", name: "HM-ESPRESSO ÇEKİRDEĞİ (ORTA KAVRULMUŞ)", category: "Kahveler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 10, price: 650, weightInfo: "1.000 kg" },
  { id: "cf3", name: "HM-FİLTRE KAHVE", category: "Kahveler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 5, price: 320, weightInfo: "1.000 kg" },
  { id: "cf4", name: "HM-GRANÜL KAHVE (NESCAFE)", category: "Kahveler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 2, price: 400, weightInfo: "0.500 kg" },
  { id: "cf5", name: "HM-MENENGİÇ KAHVESİ", category: "Kahveler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 2, price: 260, weightInfo: "0.250 kg" },
  { id: "cf6", name: "HM-OSMANLI DİBEK KAHVESİ", category: "Kahveler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 3, price: 290, weightInfo: "0.500 kg" },
  { id: "cf7", name: "HM-TÜRK KAHVESİ (ORTA KAVRULMUŞ)", category: "Kahveler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 5, price: 250, weightInfo: "0.500 kg" },

  // SOSLAR
  { id: "sc1", name: "HM-BEYAZ ÇİKOLATALI BAR SOS MONTE CRİSTO", category: "Soslar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Şişe", minLimit: 2, price: 310, weightInfo: "2.500 kg" },
  { id: "sc2", name: "HM-BİTTER ÇİKOLATALI BAR SOS MONTE CRİSTO", category: "Soslar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Şişe", minLimit: 2, price: 310, weightInfo: "2.500 kg" },
  { id: "sc3", name: "HM-KARAMEL AROMALI BAR SOS MONTE CRİSTO", category: "Soslar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Şişe", minLimit: 2, price: 310, weightInfo: "2.500 kg" },
  { id: "sc4", name: "HM-ANTEP FISTIK SOS", category: "Soslar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Şişe", minLimit: 1, price: 450, weightInfo: "1.000 kg" },
  { id: "sc5", name: "HM-MADAGASKAR SOS", category: "Soslar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Şişe", minLimit: 1, price: 450, weightInfo: "1.000 kg" },

  // TOZ GRUBU (Tümü 1,000 gram)
  { id: "dg1", name: "HM-BAL BADEM SALEP", category: "Toz Grubu", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 2, price: 280, weightInfo: "1.000 kg" },
  { id: "dg2", name: "HM-DAMLA SAKIZLI SALEP", category: "Toz Grubu", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 2, price: 280, weightInfo: "1.000 kg" },
  { id: "dg3", name: "HM-KLASİK SALEP", category: "Toz Grubu", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 3, price: 240, weightInfo: "1.000 kg" },
  { id: "dg4", name: "HM-SICAK BEYAZ ÇİKOLATA", category: "Toz Grubu", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 2, price: 320, weightInfo: "1.000 kg" },
  { id: "dg5", name: "HM-SICAK ÇİKOLATA", category: "Toz Grubu", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 4, price: 290, weightInfo: "1.000 kg" },
  { id: "dg6", name: "HM-ÇİKOLATA AROMALI MİLKSHAKE TOZU", category: "Toz Grubu", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 2, price: 340, weightInfo: "1.000 kg" },
  { id: "dg7", name: "HM-ÇİLEK AROMALI MİLKSHAKE TOZU", category: "Toz Grubu", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 2, price: 340, weightInfo: "1.000 kg" },
  { id: "dg8", name: "HM-KARAMEL AROMALI MİLKSHAKE TOZU", category: "Toz Grubu", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 2, price: 340, weightInfo: "1.000 kg" },
  { id: "dg9", name: "HM-MUZ AROMALI MİLKSHAKE TOZU", category: "Toz Grubu", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 2, price: 340, weightInfo: "1.000 kg" },
  { id: "dg10", name: "HM-VANİLYA AROMALI MİLKSHAKE TOZU", category: "Toz Grubu", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 2, price: 340, weightInfo: "1.000 kg" },

  // ÇAY VE BİTKİ ÇAYLARI
  { id: "bc1", name: "HM-IHLAMUR", category: "Çay Ve Bitki Çayları", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 1, price: 600, weightInfo: "0.250 kg" },
  { id: "bc2", name: "HM-ADA ÇAYI", category: "Çay Ve Bitki Çayları", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 1, price: 450, weightInfo: "0.250 kg" },
  { id: "bc3", name: "HM-HİBİSCUS", category: "Çay Ve Bitki Çayları", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 1, price: 380, weightInfo: "0.250 kg" },
  { id: "bc4", name: "HM-KIŞ ÇAYI", category: "Çay Ve Bitki Çayları", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 2, price: 480, weightInfo: "0.250 kg" },
  { id: "bc5", name: "HM-KUŞBURNU", category: "Çay Ve Bitki Çayları", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 1, price: 350, weightInfo: "0.250 kg" },
  { id: "bc6", name: "HM-NANE LİMON", category: "Çay Ve Bitki Çayları", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 1, price: 320, weightInfo: "0.250 kg" },
  { id: "bc7", name: "HM-YEŞİL ÇAY", category: "Çay Ve Bitki Çayları", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 1, price: 400, weightInfo: "0.250 kg" },
  { id: "bc8", name: "HM-DEMLİK POŞET ÇAY 30 GR 30'LU", category: "Çay Ve Bitki Çayları", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Kutu", minLimit: 3, price: 180, weightInfo: "1.050 kg" },

  // PÜRELER (Tümü 1,000 gram)
  { id: "pr1", name: "HM-BÖĞÜRTLEN MEYVELİ PÜRE", category: "Püreler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Şişe", minLimit: 2, price: 210, weightInfo: "1.000 kg" },
  { id: "pr2", name: "HM-ÇİLEK PÜRE", category: "Püreler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Şişe", minLimit: 3, price: 210, weightInfo: "1.000 kg" },
  { id: "pr3", name: "HM-MANGO PÜRE", category: "Püreler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Şişe", minLimit: 2, price: 210, weightInfo: "1.000 kg" },
  { id: "pr4", name: "HM-ORMAN MEYVELİ PÜRE", category: "Püreler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Şişe", minLimit: 2, price: 210, weightInfo: "1.000 kg" },
  { id: "pr5", name: "HM-YABAN MERSİNLİ PÜRE", category: "Püreler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Şişe", minLimit: 2, price: 210, weightInfo: "1.000 kg" },
  { id: "pr6", name: "HM-YEŞİL ELMA PÜRE", category: "Püreler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Şişe", minLimit: 2, price: 210, weightInfo: "1.000 kg" },

  // LİTRELİK ÜRÜNLER
  { id: "lt1", name: "HM-ANANAS SUYU", category: "Litrelik Ürünler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Litre", minLimit: 5, price: 45, weightInfo: "1.000 Litre" },
  { id: "lt2", name: "HM-LİMONATA", category: "Litrelik Ürünler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Litre", minLimit: 10, price: 35, weightInfo: "2.000 Litre" },
  { id: "lt3", name: "HM-SÜT", category: "Litrelik Ürünler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Litre", minLimit: 20, price: 32, weightInfo: "1.000 Litre" },
  { id: "lt4", name: "HM-ELMA SUYU", category: "Litrelik Ürünler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Litre", minLimit: 5, price: 45, weightInfo: "1.000 Litre" },

  // YAN ÜRÜNLER
  { id: "yn2", name: "HM-ANTEP FISTIKLI LOKUM", category: "Yan Ürünler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 1, price: 450, weightInfo: "3.000 kg" },
  { id: "yn3", name: "HM-DONDURULARAK KURUTULMUŞ BÖĞÜRTLEN", category: "Yan Ürünler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Paket", minLimit: 1, price: 290, weightInfo: "0.050 kg" },
  { id: "yn4", name: "HM-DONDURULARAK KURUTULMUŞ LİME", category: "Yan Ürünler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Paket", minLimit: 1, price: 290, weightInfo: "0.050 kg" },

  // EK ÜRÜNLER
  { id: "ex2", name: "HM-CİCİ BEBE", category: "Ek Ürünler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Kutu", minLimit: 2, price: 65, weightInfo: "0.700 kg" },
  { id: "ex3", name: "HM-KATLA BALLA SÜZME ÇİÇEK BALI (STİCK)", category: "Ek Ürünler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 50, price: 3.5, weightInfo: "Kutu: 0.800 kg (120 Adet x 7g)" },
  { id: "ex4", name: "HM-KÜP ŞEKER", category: "Ek Ürünler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Kutu", minLimit: 3, price: 80, weightInfo: "1.000 kg" },
  { id: "ex5", name: "HM-LOTUS BİSCOFF SPREAD SÜRÜLEBİLİR BİSKÜVİ EZMESİ", category: "Ek Ürünler", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "kg", minLimit: 1, price: 160, weightInfo: "1.000 kg" },

  // SOFT İÇECEK ÜRÜNLERİ
  { id: "soft1", name: "HM-SU", category: "Soft İçecek Ürünleri", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 10, price: 10, weightInfo: "0.500 Lt" },
  { id: "soft2", name: "HM-FANTA", category: "Soft İçecek Ürünleri", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 10, price: 30, weightInfo: "0.330 Lt" },
  { id: "soft3", name: "HM-COCA COLA", category: "Soft İçecek Ürünleri", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 10, price: 30, weightInfo: "0.330 Lt" },
  { id: "soft4", name: "HM-COCA COLA ZERO", category: "Soft İçecek Ürünleri", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 10, price: 30, weightInfo: "0.330 Lt" },
  { id: "soft5", name: "HM-SPRİTE", category: "Soft İçecek Ürünleri", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 10, price: 30, weightInfo: "0.330 Lt" },
  { id: "soft6", name: "HM-LİPTON ICE TEA ŞEFTALİ", category: "Soft İçecek Ürünleri", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 10, price: 30, weightInfo: "0.330 Lt" },
  { id: "soft7", name: "HM-LİPTON ICE TEA MANGO", category: "Soft İçecek Ürünleri", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 10, price: 30, weightInfo: "0.330 Lt" },
  { id: "soft8", name: "HM-LİPTON ICE TEA KARPUZ ÇİLEK", category: "Soft İçecek Ürünleri", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 10, price: 30, weightInfo: "0.330 Lt" },
  { id: "soft9", name: "HM-MEYVE SUYU ŞEFTALİ", category: "Soft İçecek Ürünleri", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 10, price: 25, weightInfo: "0.200 Lt" },
  { id: "soft10", name: "HM-MEYVE SUYU VİŞNE", category: "Soft İçecek Ürünleri", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 10, price: 25, weightInfo: "0.200 Lt" },
  { id: "soft11", name: "HM-MEYVE SUYU KARIŞIK", category: "Soft İçecek Ürünleri", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 10, price: 25, weightInfo: "0.200 Lt" },
  { id: "soft12", name: "HM-MEYVELİ SODA LİMON", category: "Soft İçecek Ürünleri", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 10, price: 20, weightInfo: "0.200 Lt" },
  { id: "soft13", name: "HM-MEYVELİ SODA ELMA", category: "Soft İçecek Ürünleri", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 10, price: 20, weightInfo: "0.200 Lt" },
  { id: "soft14", name: "HM-MEYVELİ SODA KARPUZ ÇİLEK", category: "Soft İçecek Ürünleri", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 10, price: 20, weightInfo: "0.200 Lt" },
  { id: "soft15", name: "HM-SADE SODA", category: "Soft İçecek Ürünleri", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 10, price: 15, weightInfo: "0.200 Lt" },

  // PASTALAR
  { id: "cake1", name: "HM-LATTE KARE PASTA", category: "Pastalar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 5, price: 100, weightInfo: "1 Dilim" },
  { id: "cake2", name: "HM-FRAMBUAZ CHESECAKE", category: "Pastalar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 5, price: 100, weightInfo: "1 Dilim" },
  { id: "cake3", name: "HM-TRAMİSU", category: "Pastalar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 5, price: 100, weightInfo: "1 Dilim" },
  { id: "cake4", name: "HM-LİMONLU CHESECAKE", category: "Pastalar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 5, price: 100, weightInfo: "1 Dilim" },
  { id: "cake5", name: "HM-DEVİLS PASTA", category: "Pastalar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 5, price: 100, weightInfo: "1 Dilim" },
  { id: "cake6", name: "HM-MAGNOLYA LOTUS", category: "Pastalar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 5, price: 80, weightInfo: "1 Adet" },
  { id: "cake7", name: "HM-MAGNOLYA YABAN MERSİNLİ", category: "Pastalar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 5, price: 80, weightInfo: "1 Adet" },
  { id: "cake8", name: "HM-MAGNOLYA ORMAN MEYVELİ", category: "Pastalar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 5, price: 80, weightInfo: "1 Adet" },
  { id: "cake9", name: "HM-DAĞ MEYVELİ PASTA", category: "Pastalar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 5, price: 100, weightInfo: "1 Dilim" },
  { id: "cake10", name: "HM-KREMALI TARÇINLI PASTA", category: "Pastalar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 5, price: 100, weightInfo: "1 Dilim" },
  { id: "cake11", name: "HM-SPONFULL", category: "Pastalar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 5, price: 100, weightInfo: "1 Adet" },
  { id: "cake12", name: "HM-LOTUS CHEESECAKE", category: "Pastalar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 5, price: 100, weightInfo: "1 Dilim" },
  { id: "cake13", name: "HM-BOOMCAKE", category: "Pastalar", depodaBulunan: 0, depodanAlinan: 0, quantity: 0, unit: "Adet", minLimit: 5, price: 100, weightInfo: "1 Adet" }
];

export function isProductAllowedForRegion(regionId: string, item: { name: string; category: string }): boolean {
  if (regionId !== "degirmen-kafe") {
    // Çay Ve Bitki Çayları kısıtlaması (Sadece HM-DEMLİK POŞET ÇAY 30 GR 30'LU kalacak)
    if (item.category === "Çay Ve Bitki Çayları" && item.name !== "HM-DEMLİK POŞET ÇAY 30 GR 30'LU") {
      return false;
    }
    // Yan Ürünler kısıtlaması
    if (item.category === "Yan Ürünler" && item.name === "HM-ANTEP FISTIKLI LOKUM") {
      return false;
    }
    // Şuruplar kısıtlaması
    const forbiddenSyrups = [
      "HM-ÇARKIFELEK (PASSION FRUIT) AROMALI KOKTEYL ŞURUBU",
      "HM-MUZ AROMALI KOKTEYL ŞURUBU",
      "HM-NAR AROMALI KOKTEYL ŞURUBU",
      "HM-PECAN CEVİZİ AROMALI KOKTEYL ŞURUBU",
      "HM-ŞEKER AROMALI KOKTEYL ŞURUBU"
    ];
    if (item.category === "Şuruplar" && forbiddenSyrups.includes(item.name)) {
      return false;
    }
    // Toz Grubu kısıtlaması
    const forbiddenPowders = [
      "HM-BAL BADEM SALEP",
      "HM-DAMLA SAKIZLI SALEP",
      "HM-SICAK BEYAZ ÇİKOLATA",
      "HM-MUZ AROMALI MİLKSHAKE TOZU"
    ];
    if (item.category === "Toz Grubu" && forbiddenPowders.includes(item.name)) {
      return false;
    }
    // Püreler kısıtlaması (tamamı kalkacak)
    if (item.category === "Püreler") {
      return false;
    }
    // Ek Ürünler kısıtlaması
    const forbiddenEkUrunler = [
      "HM-CİCİ BEBE",
      "HM-KATLA BALLA SÜZME ÇİÇEK BALI (STİCK)"
    ];
    if (item.category === "Ek Ürünler" && forbiddenEkUrunler.includes(item.name)) {
      return false;
    }
    // Kahveler kısıtlaması
    const forbiddenCoffees = [
      "HM-MENENGİÇ KAHVESİ",
      "HM-DAMLA SAKIZLI TÜRK KAHVESİ",
      "HM-OSMANLI DİBEK KAHVESİ"
    ];
    if (item.category === "Kahveler" && forbiddenCoffees.includes(item.name)) {
      return false;
    }
    // Pastalar kısıtlaması (13 Eylül Vargel ve Millet Bahçesi Vargel'de sadece bu 9 pasta olacak, diğer şubelerde hepsi kalabilir)
    if (regionId === "13-eylul-vargel-kafe" || regionId === "millet-bahcesi-vargel-kafe") {
      const allowedCakes = [
        "HM-DEVİLS PASTA",
        "HM-DAĞ MEYVELİ PASTA",
        "HM-KREMALI TARÇINLI PASTA",
        "HM-TRAMİSU",
        "HM-FRAMBUAZ CHESECAKE",
        "HM-LATTE KARE PASTA",
        "HM-SPONFULL",
        "HM-LOTUS CHEESECAKE",
        "HM-BOOMCAKE"
      ];
      if (item.category === "Pastalar" && !allowedCakes.includes(item.name)) {
        return false;
      }
    }
  }
  return true;
}
