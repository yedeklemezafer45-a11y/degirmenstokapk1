"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Moon, 
  Sun, 
  LogOut, 
  Search, 
  Save, 
  AlertCircle,
  Undo2,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Scale,
  Loader2,
  CheckSquare,
  Square,
  Check,
  Share2,
  Calculator,
  Mic
} from "lucide-react";
import { StockItem, isProductAllowedForRegion } from "@/lib/stockStore";
import { subscribeToStocks, saveAllStocks } from "@/lib/stockService";
import { saveReport, MonthlyReportArchive } from "@/lib/reportService";
import { logUserAction } from "@/lib/auditLogService";
import { useRouter } from "next/navigation";


export default function StokSayimPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [userRole, setUserRole] = useState<string>("waiter");
  const [isDirty, setIsDirty] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("degirmen-kafe");
  const [selectedRegionName, setSelectedRegionName] = useState("Değirmen Kafe");

  // Sayılan Adet Girişleri (Draft State)
  const [sayilanValues, setSayilanValues] = useState<Record<string, string>>({});
  // Açıkta olan Gramaj / Miktar Girişleri (Draft State)
  const [aciktaValues, setAciktaValues] = useState<Record<string, string>>({});
  
  // İşlem Yapılan / Onaylanan Ürünlerin ID Listesi
  const [checkedItemIds, setCheckedItemIds] = useState<Record<string, boolean>>({});

  // Yetkili Karşılaştırma Raporu (Sadece admin/yonetici görecek)
  const [showReport, setShowReport] = useState(false);

  // Hesap Makinesi State'leri
  const [showCalc, setShowCalc] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState("");
  const [calcExpression, setCalcExpression] = useState("");
  const [calcWarning, setCalcWarning] = useState("");

  // Input Değeri Temizleme & Dönüştürme Yardımcısı (Virgülü Noktaya Çevirir)
  const parseInputValue = (val: any): number => {
    if (val === undefined || val === null) return 0;
    const str = String(val).trim();
    if (!str) return 0;
    const clean = str.replace(",", ".");
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleCalcKeyPress = (key: string) => {
    if (key === "C") {
      setCalcDisplay("");
      setCalcExpression("");
      setCalcWarning("");
    } else if (key === "+/-") {
      if (calcDisplay) {
        if (calcDisplay.startsWith("-")) {
          setCalcDisplay(calcDisplay.slice(1));
        } else {
          setCalcDisplay("-" + calcDisplay);
        }
      }
    } else if (key === "%") {
      try {
        let expr = calcDisplay.replace(/,/g, ".");
        if (expr) {
          const result = Function(`"use strict"; return (${expr})`)();
          if (result !== undefined && !isNaN(result) && isFinite(result)) {
            const percentResult = result / 100;
            setCalcExpression(`${calcDisplay}%`);
            setCalcDisplay(String(Number(percentResult.toFixed(4))).replace(".", ","));
          }
        }
      } catch (err) {
        setCalcDisplay("Hata");
      }
    } else if (key === "=") {
      try {
        let expr = calcDisplay.replace(/,/g, ".");
        if (!/^[0-9+\-*/.]*$/.test(expr)) {
          throw new Error("Geçersiz");
        }
        const result = Function(`"use strict"; return (${expr})`)();
        if (result === undefined || isNaN(result) || !isFinite(result)) {
          setCalcDisplay("Hata");
        } else {
          const resultStr = String(Number(result.toFixed(4))).replace(".", ",");
          setCalcExpression(calcDisplay);
          setCalcDisplay(resultStr);
        }
      } catch (err) {
        setCalcDisplay("Hata");
      }
    } else {
      const isOperator = ["+", "-", "*", "/"].includes(key);
      if (calcExpression && !isOperator) {
        setCalcDisplay(key);
        setCalcExpression("");
      } else {
        setCalcDisplay(prev => {
          if (prev === "Hata") return key;
          return prev + key;
        });
        if (isOperator) {
          setCalcExpression("");
        }
      }
    }
  };

  useEffect(() => {
    if (calcDisplay.includes(".")) {
      setCalcWarning("⚠️ Ondalıklar için lütfen virgül (,) kullanın!");
    } else {
      setCalcWarning("");
    }
  }, [calcDisplay]);

  // Toast Bildirim State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

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
  // Ürünün Litrelik veya Sıvı Olup Olmadığını Kontrol Etme
  const isLiquidItem = (item: StockItem) => {
    return (
      item.category === "Litrelik Ürünler" || 
      item.unit?.toLowerCase() === "litre" || 
      item.unit?.toLowerCase() === "lt" || 
      item.weightInfo?.toLowerCase().includes("lt") ||
      item.weightInfo?.toLowerCase().includes("litre")
    );
  };

  const extractWeightAndUnit = (item: StockItem) => {
    if (item.name.includes("LOTUS BİSCOFF")) {
      return { parsedWeight: 1.0, displayWeight: "1.000 kg" };
    }
    if (item.name.includes("KATLA BALLA")) {
      return { parsedWeight: 0.800, displayWeight: "0.800 kg (120 x 7g)" };
    }
    if (item.weightInfo) {
      const match = item.weightInfo.match(/([0-9.,]+)/);
      if (match) {
        const val = parseFloat(match[1].replace(",", "."));
        if (!isNaN(val)) return { parsedWeight: val, displayWeight: item.weightInfo };
      }
    }
    return { parsedWeight: 1.0, displayWeight: isLiquidItem(item) ? "1.000 lt" : "1.000 kg" };
  };

  const getInitialSayilan = (item: StockItem) => {
    if (item.quantity === undefined || item.quantity === null) return "0";
    return String(item.quantity);
  };

  const getInitialAcikta = () => {
    return "0";
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
      setUserRole(parsed.role || "waiter");
      const reg = parsed.selectedRegion || "degirmen-kafe";
      activeRegion = reg;
      setSelectedRegion(reg);
      setSelectedRegionName(parsed.selectedRegionName || "Değirmen Kafe");
    }

    // Onay kutularını yükleme
    const savedChecked = localStorage.getItem("degirmen_sayim_checked_ids");
    if (savedChecked) {
      setCheckedItemIds(JSON.parse(savedChecked));
    }

    // Gerçek zamanlı Firestore dinleyicisi
    setIsLoading(true);
    const unsubscribe = subscribeToStocks(
      activeRegion,
      (fetchedStocks) => {
        setStockList(fetchedStocks);

        setSayilanValues(prev => {
          const updated = { ...prev };
          fetchedStocks.forEach(item => {
            if (!(item.id in updated)) {
              updated[item.id] = getInitialSayilan(item);
            }
          });
          return updated;
        });

        setAciktaValues(prev => {
          const updated = { ...prev };
          fetchedStocks.forEach(item => {
            if (!(item.id in updated)) {
              updated[item.id] = "0";
            }
          });
          return updated;
        });

        setIsLoading(false);
      },
      () => {
        triggerToast("Stoklar yüklenirken hata oluştu!");
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

  const calculateTotalQuantityInUnit = (item: StockItem, countedQty: number, openUnits: number) => {
    const { parsedWeight } = extractWeightAndUnit(item);
    const unitLower = item.unit.toLowerCase();
    const hasWeight = !!item.weightInfo;
    
    if (item.name.includes("KATLA BALLA")) {
      // Açıkta olan stick bal adeti x 7 gram (kg cinsine çevir: (adet x 7) / 1000)
      const stickGrams = openUnits * 7;
      return Number(((countedQty * parsedWeight) + (stickGrams / 1000)).toFixed(3));
    }

    if (unitLower === "kg" || unitLower === "litre" || unitLower === "lt" || hasWeight) {
      // Doğrudan ağırlık/hacim hesabı: (Sayılan Adet x Paket Ağırlığı) + (Açık Gramaj / 1000)
      return Number(((countedQty * parsedWeight) + (openUnits / 1000)).toFixed(3));
    } else {
      // Paket/Adet bazlı ürünler
      return Number((countedQty + (openUnits / 1000)).toFixed(3));
    }
  };

  const formatTotalDisplay = (item: StockItem, countedQty: number, openUnits: number) => {
    // Litrelik Ürünler: 24 adet gibi noktalama olmadan net adet gösterimi
    if (item.category === "Litrelik Ürünler") {
      if (openUnits > 0) {
        return `${countedQty} Adet + ${openUnits} ml`;
      }
      return `${countedQty} Adet`;
    }

    const isLiquid = isLiquidItem(item);
    const totalCalculated = calculateTotalQuantityInUnit(item, countedQty, openUnits);
    const unitLower = item.unit.toLowerCase();
    const hasWeight = !!item.weightInfo;
    
    const unitLabel = isLiquid 
      ? "lt" 
      : (unitLower === "kg" || hasWeight
          ? "kg" 
          : (item.unit === "Şişe" ? "Adet" : item.unit));

    // Tam sayı ise noktalama olmadan (örn: 9 kg), ondalıklı ise 3 basamak tam (örn: 6.790 kg)
    const cleanNumber = Number.isInteger(totalCalculated)
      ? String(totalCalculated)
      : totalCalculated.toFixed(3);

    return `${cleanNumber} ${unitLabel}`;
  };

  const displayedStockList = stockList.filter(item => {
    if (item.category === "Kutu Ve Plastik Ürünler") {
      return false;
    }
    if (selectedRegion === "degirmen-kafe" && (item.category === "Soft İçecek Ürünleri" || item.category === "Pastalar")) {
      return false;
    }
    return isProductAllowedForRegion(selectedRegion, item);
  });

  const categories = ["Tümü", ...Array.from(new Set(displayedStockList.map((i) => i.category))).sort((a, b) => a.localeCompare(b, "tr"))];

  const filteredStocks = displayedStockList.filter((item) => {
    const matchesCategory = selectedCategory === "Tümü" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Onay Kutusu Manuel Değiştirme
  const toggleItemCheck = (id: string) => {
    setCheckedItemIds(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem("degirmen_sayim_checked_ids", JSON.stringify(updated));
      return updated;
    });
  };

  // Sayılan Adet Değişikliği (Otomatik İşlem Yapıldı İle İşaretler)
  const handleSayilanChange = (id: string, value: string) => {
    setSayilanValues(prev => ({
      ...prev,
      [id]: value
    }));
    // Veri girildiği an ürünü onaylandı olarak işaretle
    setCheckedItemIds(prev => {
      const updated = { ...prev, [id]: true };
      localStorage.setItem("degirmen_sayim_checked_ids", JSON.stringify(updated));
      return updated;
    });
    setIsDirty(true);
  };

  // Açıkta Olan Değişikliği (Otomatik İşlem Yapıldı İle İşaretler)
  const handleAciktaChange = (id: string, value: string) => {
    setAciktaValues(prev => ({
      ...prev,
      [id]: value
    }));
    // Veri girildiği an ürünü onaylandı olarak işaretle
    setCheckedItemIds(prev => {
      const updated = { ...prev, [id]: true };
      localStorage.setItem("degirmen_sayim_checked_ids", JSON.stringify(updated));
      return updated;
    });
    setIsDirty(true);
  };

  // Sayım İşaretlerini Sıfırla
  const handleResetCheckmarks = () => {
    if (window.confirm("Tüm ürünlerdeki 'İşlem Yapıldı' işaretlerini kaldırmak istediğinize emin misiniz?")) {
      setCheckedItemIds({});
      localStorage.removeItem("degirmen_sayim_checked_ids");
      triggerToast("Tüm işlem işaretleri temizlendi.");
    }
  };

  const handleDownloadSayimPDF = (currentList: StockItem[]) => {
    try {
      const activeUserStr = sessionStorage.getItem("activeUser");
      const activeUserName = activeUserStr ? JSON.parse(activeUserStr).fullName : "Yönetici";
      const nowStr = new Date().toLocaleString("tr-TR");

      let content = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>SOMA BELEDİYESİ SOMA PARK DEĞİRMEN KAFE - GIDA SAYIM LİSTESİ</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; padding: 15px; color: #000; background-color: #fff; line-height: 1.3; }
            .header-box { text-align: center; margin-bottom: 10px; border: 1.5px solid #000; padding: 8px 4px; }
            .header-box h1 { margin: 0; font-size: 15px; font-weight: 800; letter-spacing: 0.5px; }
            .header-box h2 { margin: 3px 0; font-size: 13px; font-weight: 700; }
            .header-box h3 { margin: 0; font-size: 12px; font-weight: 700; color: #333; }
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 10px; font-weight: 600; color: #222; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; border: 1.5px solid #000; }
            th, td { border: 1px solid #000; padding: 4px 6px; }
            th { background-color: #f2f2f2; font-weight: 800; text-transform: uppercase; text-align: center; }
            .cat-row { background-color: #e5e7eb !important; font-weight: 800; text-transform: uppercase; font-size: 10px; }
            .font-mono { font-family: monospace; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            @media print {
              body { padding: 0; margin: 6mm; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          <div class="header-box">
            <h1>SOMA BELEDİYESİ SOMA PARK DEĞİRMEN KAFE</h1>
            <h2>GIDA SAYIM LİSTESİ</h2>
            <h3>ANA BAR HAMMADDELER</h3>
          </div>
          <div class="info-grid">
            <div><strong>Tarih:</strong> ${nowStr}</div>
            <div><strong>Sayımı Gerçekleştiren:</strong> ${activeUserName}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 6%;">NO</th>
                <th class="text-left" style="width: 48%;">MALZEME ADI</th>
                <th style="width: 12%;">BİRİM</th>
                <th style="width: 18%;">ADET/KG</th>
                <th class="text-right" style="width: 16%;">TOPLAM</th>
              </tr>
            </thead>
            <tbody>
      `;

      // Filter list for PDF based on region restrictions
      const filteredForPDF = currentList.filter(item => {
        // Kutu ve Plastik hiçbir şubede listelenmez
        if (item.category === "Kutu Ve Plastik Ürünler") {
          return false;
        }
        // Değirmen Kafe'de Pastalar ve Soft İçecekler listelenmez
        if (selectedRegion === "degirmen-kafe" && (item.category === "Pastalar" || item.category === "Soft İçecek Ürünleri")) {
          return false;
        }
        // Şube bazlı genel kısıtlamalar
        return isProductAllowedForRegion(selectedRegion, item);
      });

      // Group by category
      const grouped: Record<string, StockItem[]> = {};
      filteredForPDF.forEach(item => {
        if (!grouped[item.category]) {
          grouped[item.category] = [];
        }
        grouped[item.category].push(item);
      });

      let itemNo = 1;
      Object.entries(grouped).forEach(([catName, items]) => {
        content += `
          <tr class="cat-row">
            <td colspan="5" class="text-left" style="padding-left: 8px;">• ${catName}</td>
          </tr>
        `;
        items.forEach(item => {
          const sayilanVal = sayilanValues[item.id] !== undefined ? sayilanValues[item.id] : getInitialSayilan(item);
          const aciktaVal = aciktaValues[item.id] !== undefined ? aciktaValues[item.id] : "0";
          const countedVal = parseInputValue(sayilanVal) || 0;
          const openVal = parseInputValue(aciktaVal) || 0;
          const totalValText = formatTotalDisplay(item, countedVal, openVal);

          const isLiquid = isLiquidItem(item);
          const isKatlaBal = item.name.includes("KATLA BALLA");
          const packageUnit = isKatlaBal ? "Kutu" : (item.unit === "Şişe" ? "Şişe" : "Adet");
          const openUnitLabel = isKatlaBal ? "Stick" : (isLiquid ? "ml" : "gr");

          let adetKgDetail = "";
          if (countedVal > 0 && openVal > 0) {
            adetKgDetail = `${countedVal} ${packageUnit} + ${openVal} ${openUnitLabel}`;
          } else if (countedVal > 0) {
            adetKgDetail = `${countedVal} ${packageUnit}`;
          } else if (openVal > 0) {
            adetKgDetail = `${openVal} ${openUnitLabel}`;
          } else {
            adetKgDetail = "-";
          }

          content += `
            <tr>
              <td class="text-center font-mono">${itemNo++}</td>
              <td class="text-left"><strong>${item.name}</strong></td>
              <td class="text-center font-mono">${item.unit}</td>
              <td class="text-center font-mono">${adetKgDetail}</td>
              <td class="text-right font-mono">${totalValText}</td>
            </tr>
          `;
        });
      });

      content += `
            </tbody>
          </table>
        </body>
        </html>
      `;

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
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 300);
      };
    } catch (error) {
      console.error("PDF generation error:", error);
    }
  };

  // Toplu Değişiklikleri Firebase Firestore'a Kaydet
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const updatedStock = stockList.map(item => {
        const sayilanVal = sayilanValues[item.id] !== undefined ? sayilanValues[item.id] : getInitialSayilan(item);
        const aciktaVal = aciktaValues[item.id] !== undefined ? aciktaValues[item.id] : "0";
        const countedQty = parseInputValue(sayilanVal) || 0;
        const openUnits = parseInputValue(aciktaVal) || 0;
        const totalQty = calculateTotalQuantityInUnit(item, countedQty, openUnits);

        return {
          ...item,
          quantity: totalQty
        };
      });

      await saveAllStocks(selectedRegion, updatedStock);
      setStockList(updatedStock);
      setIsDirty(false);

      await logUserAction(
        "Fiziki Stok Sayımı Yapıldı",
        "STOK",
        `${stockList.length} kalemin fiziki sayım verileri güncellendi ve Firestore veritabanına işlendi.`
      );

      triggerToast("✅ Sayım sonuçları bulut veritabanına kaydedildi!");

      // Sayım sonuçlarını otomatik PDF/Yazıcı çıktısı olarak tetikle
      setTimeout(() => {
        handleDownloadSayimPDF(updatedStock);
      }, 800);
    } catch (err) {
      console.error("Stok kaydetme hatası:", err);
      triggerToast("Kaydedilirken hata oluştu!");
    } finally {
      setIsSaving(false);
    }
  };

  // Dönemi Kapat
  const handleFinalizeMonthAndReset = async () => {
    if (!window.confirm("DİKKAT: Aylık dönemi kapatmak üzeresiniz. Bu işlem mevcut girdi-çıktı farklarını kalıcı olarak Firestore arşive kaydedecek ve yeni ay için Depoda Bulunan ile Düşülen miktarları SIFIRLAYACAKTIR. Emin misiniz?")) {
      return;
    }

    setIsSaving(true);
    try {
      const activeUserStr = sessionStorage.getItem("activeUser");
      const activeUserName = activeUserStr ? JSON.parse(activeUserStr).fullName : "Yönetici";

      const currentMonth = new Date().toISOString().substring(0, 7);
      const now = new Date();
      const monthName = now.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

      let totalGramsAcc = 0;
      const reportSnapshot = stockList.map(item => {
        const { parsedWeight } = extractWeightAndUnit(item);
        const sayilanVal = sayilanValues[item.id] !== undefined ? sayilanValues[item.id] : getInitialSayilan(item);
        const aciktaVal = aciktaValues[item.id] !== undefined ? aciktaValues[item.id] : "0";
        const countedQty = parseInputValue(sayilanVal) || 0;
        const openGrams = parseInputValue(aciktaVal) || 0;
        const totalQty = calculateTotalQuantityInUnit(item, countedQty, openGrams);

        const unitLower = item.unit.toLowerCase();
        const isMassOrVolume = unitLower === "kg" || unitLower === "litre" || unitLower === "lt";
        const totalCountedGram = isMassOrVolume ? totalQty : Number((totalQty * parsedWeight).toFixed(3));
        totalGramsAcc += totalCountedGram * 1000;

        const sysKalanKg = isMassOrVolume ? item.quantity : Number((item.quantity * parsedWeight).toFixed(3));

        return {
          productId: item.id,
          productName: item.name,
          category: item.category,
          depodaBulunan: item.depodaBulunan,
          depodanAlinan: item.depodanAlinan,
          sysKalan: item.quantity,
          sabitGramaj: item.weightInfo || "1.00",
          sayilanAdet: countedQty,
          sayilanAciktaGrams: openGrams,
          sayilanToplamGramaj: totalCountedGram,
          farkGramaj: Number((sysKalanKg - totalCountedGram).toFixed(3))
        };
      });

      const newArchiveReport: MonthlyReportArchive = {
        id: "archive_" + Date.now(),
        month: currentMonth,
        monthName: monthName,
        createdAt: now.toLocaleString("tr-TR"),
        archivedBy: activeUserName,
        totalItems: stockList.length,
        totalGrams: totalGramsAcc,
        stockSnapshot: reportSnapshot
      };

      await saveReport(selectedRegion, newArchiveReport);

      const resetStock = stockList.map(item => {
        const countedQty = parseInputValue(sayilanValues[item.id]) || 0;
        const openGrams = parseInputValue(aciktaValues[item.id]) || 0;
        const totalQty = calculateTotalQuantityInUnit(item, countedQty, openGrams);

        return {
          ...item,
          depodaBulunan: totalQty,
          depodanAlinan: 0,
          quantity: totalQty
        };
      });

      await saveAllStocks(selectedRegion, resetStock);
      setStockList(resetStock);
      setCheckedItemIds({});
      localStorage.removeItem("degirmen_sayim_checked_ids");
      setIsDirty(false);

      await logUserAction(
        "Aylık Stok Takip Dönemi Kapatıldı ve Sıfırlandı",
        "RAPOR",
        `${monthName} stok raporu arşive alındı. Depo girdi/çıktı değerleri sıfırlandı.`
      );

      triggerToast("✅ Aylık Stok Takip Raporu arşive kaydedildi ve stoklar sıfırlandı!");
    } catch (err) {
      console.error("Dönem kapatma hatası:", err);
      triggerToast("İşlem sırasında hata oluştu!");
    } finally {
      setIsSaving(false);
    }
  };

  const checkedCount = Object.values(checkedItemIds).filter(Boolean).length;
  const totalItemsCount = stockList.length;
  const progressPercent = totalItemsCount > 0 ? Math.round((checkedCount / totalItemsCount) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* Toast Bildirimi */}
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
            <h1 className="font-bold text-lg tracking-tight">Fiziki Stok Sayımı & Gramaj / Litre Hesabı</h1>
            <p className="text-xs text-zinc-500">{selectedRegionName} · İşlem Onay Kutusu Destekli · Canlı Takip</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
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

      {/* Ana İçerik */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 pb-24">
        
        {/* YENİ GÖRSEL 1 STİLİNDEKİ ADIMLI İLERLEME ÇUBUĞU KARTI */}
        {(() => {
          const steps = [
            { id: 1, label: "Çay Grubu", categories: ["Çay Ve Bitki Çayları"] },
            { id: 2, label: "Kahveler", categories: ["Kahveler"] },
            { id: 3, label: "Şurup & Sos & Püre", categories: ["Şuruplar", "Soslar", "Püreler"] },
            { id: 4, label: "Litrelik Ürünler", categories: ["Litrelik Ürünler"] },
            { id: 5, label: "Diğer Grubu", categories: ["Toz Grubu", "Ek Ürünler", "Yan Ürünler"] }
          ];

          const stepsWithStatus = steps.map(step => {
            const stepProducts = stockList.filter(item => step.categories.includes(item.category));
            const totalCount = stepProducts.length;
            const checkedCountInStep = stepProducts.filter(item => checkedItemIds[item.id]).length;
            const isCompleted = totalCount > 0 && checkedCountInStep === totalCount;
            return {
              ...step,
              totalCount,
              checkedCountInStep,
              isCompleted
            };
          });

          const completedStepsCount = stepsWithStatus.filter(s => s.isCompleted).length;
          const fillWidth = completedStepsCount > 0 ? (completedStepsCount * 20 - 10) : 0;

          return (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base tracking-tight text-zinc-800 dark:text-zinc-100">
                    Neredeyse Bitirdiniz!
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Kategorilerin altındaki tüm ürünler sayıldığında adımlar otomatik yeşile dönecektir.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    onClick={handleResetCheckmarks}
                    className="text-[11px] text-zinc-400 hover:text-red-400 font-semibold transition-colors px-3 py-1.5 rounded-xl border border-[var(--border)] hover:border-red-500/30 cursor-pointer"
                  >
                    İşaretleri Sıfırla
                  </button>

                  <button
                    onClick={() => handleDownloadSayimPDF(stockList)}
                    type="button"
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/60 transition-all cursor-pointer shadow-sm"
                    title="Sayım Sonuçlarını PDF Olarak İndir / Yazdır"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <span>PDF İndir</span>
                  </button>

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
                    {isSaving ? "Kaydediliyor..." : isDirty ? "Sayım Sonuçlarını Kaydet" : "Sonuçları Güncelle"}
                  </button>
                </div>
              </div>

              {/* Stepper Progress Bar */}
              <div className="relative pt-4 pb-12 px-2 sm:px-6">
                <div className="w-full bg-zinc-100 dark:bg-zinc-900/50 h-10 rounded-3xl relative border border-zinc-200 dark:border-zinc-800 p-1 overflow-hidden">
                  
                  {/* Progress Fill */}
                  <div 
                    className="bg-gradient-to-r from-emerald-950/70 via-emerald-700 to-emerald-400 h-full rounded-2xl transition-all duration-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                    style={{ width: `${fillWidth}%` }}
                  />

                  {/* Step Indicators */}
                  <div className="absolute inset-0 flex justify-between items-center px-[6%] sm:px-[8%]">
                    {stepsWithStatus.map((step) => {
                      const isCompleted = step.isCompleted;
                      
                      return (
                        <div key={step.id} className="relative flex flex-col items-center">
                          {/* Step Circle */}
                          <div 
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 shadow-lg transition-all duration-500 z-10 ${
                              isCompleted 
                                ? "bg-emerald-500 border-white text-white scale-110" 
                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-emerald-500/40"
                            }`}
                            title={`${step.label}: ${step.checkedCountInStep}/${step.totalCount} ürün sayıldı`}
                          >
                            {isCompleted ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : (
                              <span className="text-[10px] sm:text-[11px] font-black">{step.id}</span>
                            )}
                          </div>

                          {/* Label info under circle */}
                          <div className="absolute top-10 sm:top-11 flex flex-col items-center text-center w-20 sm:w-28 select-none">
                            <span className={`text-[8px] sm:text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center mb-0.5 leading-none ${
                              isCompleted ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                            }`}>
                              {step.id}
                            </span>
                            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider leading-tight whitespace-nowrap ${
                              isCompleted ? "text-emerald-400" : "text-zinc-500"
                            }`}>
                              {step.label}
                            </span>
                            <span className="text-[7px] sm:text-[8px] font-bold text-zinc-500/70">
                              ({step.checkedCountInStep}/{step.totalCount})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>

              {/* Tip box */}
              <div className="flex justify-center pt-2">
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 text-[10px] font-extrabold text-zinc-500 dark:text-zinc-400 tracking-tight">
                  <span className="text-emerald-500 font-black">+ İpucu:</span>
                  <span>Sol sütundaki onay kutularını işaretledikçe kategorilerin ilerlemesi dolacaktır.</span>
                </div>
              </div>

            </div>
          );
        })()}

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

        {/* FİZİKİ SAYIM TABLOSU */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <span className="ml-3 text-sm text-zinc-400">Stoklar bulut veritabanından yükleniyor...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-3 w-12 text-center">Durum</th>
                    <th className="py-3 px-4">Ürün Adı</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-center">Birim / Paket Hacmi</th>
                    <th className="py-3 px-4 text-center w-40">Sayılan Kapalı Adet</th>
                    <th className="py-3 px-4 text-center w-44">Açıkta Olan Miktar</th>
                    <th className="py-3 px-4 text-right">Toplam Miktar Karşılığı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/40 text-xs">
                  {filteredStocks.map((item) => {
                    const { displayWeight } = extractWeightAndUnit(item);
                    const isLiquid = isLiquidItem(item);
                    const unitLabel = isLiquid 
                      ? "lt" 
                      : (item.unit === "kg" || item.unit === "Adet" 
                          ? "kg" 
                          : (item.unit === "Şişe" ? "Adet" : item.unit));
                    const isKatlaBal = item.name.includes("KATLA BALLA");
                    const openLabel = isKatlaBal ? "Adet (7g)" : (isLiquid ? "ml" : "gr");

                    const isChecked = !!checkedItemIds[item.id];
                    const sayilanVal = sayilanValues[item.id] !== undefined ? sayilanValues[item.id] : getInitialSayilan(item);
                    const aciktaVal = aciktaValues[item.id] !== undefined ? aciktaValues[item.id] : "0";
                    const countedQty = parseInputValue(sayilanVal) || 0;
                    const openUnits = parseInputValue(aciktaVal) || 0;
                    const totalCalculated = calculateTotalQuantityInUnit(item, countedQty, openUnits);

                    const sayilanHasDot = String(sayilanVal).includes(".");
                    const aciktaHasDot = String(aciktaVal).includes(".");

                    return (
                      <tr 
                        key={item.id} 
                        className={`transition-colors ${
                          isChecked 
                            ? "bg-emerald-500/5 hover:bg-emerald-500/10 border-l-4 border-l-emerald-500" 
                            : "hover:bg-[var(--background)]/35"
                        }`}
                      >
                        {/* İşlem Yapıldı Onay Kutusu */}
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
                                İşlem Yapıldı
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                            isLiquid 
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                              : "bg-[var(--background)] border-[var(--border)] text-zinc-400"
                          }`}>
                            {item.category}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center font-mono text-zinc-400">
                          {displayWeight}
                        </td>
                        
                        {/* Sayılan Adet Input */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <input
                              type="text"
                              value={sayilanVal}
                              onChange={(e) => handleSayilanChange(item.id, e.target.value)}
                              className={`w-24 bg-[var(--background)] border rounded-xl px-3 py-1.5 text-center font-mono font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                                sayilanHasDot 
                                  ? "text-red-500 border-red-500/50 focus:ring-red-500" 
                                  : "text-orange-500 border-[var(--border)]"
                              }`}
                              title={sayilanHasDot ? "Ondalıklar için lütfen virgül (,) kullanın!" : ""}
                            />
                            {item.name.includes("KATLA BALLA") ? (
                              <span className="text-[9px] text-zinc-500 font-bold uppercase mt-1">Kutu</span>
                            ) : null}
                          </div>
                        </td>

                        {/* Açıkta Miktar Input */}
                        <td className="py-4 px-4 text-center">
                          <div className="relative inline-block w-28">
                            <input
                              type="text"
                              placeholder="0"
                              value={aciktaVal}
                              onChange={(e) => handleAciktaChange(item.id, e.target.value)}
                              className={`w-full bg-[var(--background)] border rounded-xl px-3 py-1.5 text-center font-mono focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                                aciktaHasDot 
                                  ? "text-red-500 border-red-500/50 font-bold focus:ring-red-500" 
                                  : "text-zinc-350 border-[var(--border)]"
                              }`}
                              title={aciktaHasDot ? "Ondalıklar için lütfen virgül (,) kullanın!" : ""}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold pointer-events-none">
                              {openLabel}
                            </span>
                          </div>
                        </td>

                        {/* Toplam Karşılığı */}
                        <td className="py-4 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                          {formatTotalDisplay(item, countedQty, openUnits)}
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

      {/* Floating 3D Calculator Trigger Button */}
      <button
        onClick={() => setShowCalc(!showCalc)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#e76f51] hover:bg-[#eb8870] text-white rounded-full flex items-center justify-center shadow-xl border border-white/10 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
        title="Hesap Makinesi"
      >
        <Calculator className="w-6 h-6" />
      </button>

      {/* Draggable/Floating Embossed 3D Calculator Panel */}
      {showCalc && (
        <div className={`fixed bottom-24 right-6 z-50 w-80 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl space-y-5 animate-fadeIn transition-colors duration-300 ${
          theme === "dark" 
            ? "bg-[#1b1c1e] text-zinc-100 border border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)]" 
            : "bg-[#f3f4f6]/95 text-zinc-900 border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
        }`}>
          {/* Header with Mic Pill and Close Button */}
          <div className="flex items-center justify-between">
            <div className={`w-10 h-7 rounded-full flex items-center justify-center shadow-inner ${
              theme === "dark" ? "bg-zinc-800/40 text-zinc-400" : "bg-white/80 text-zinc-500 shadow-sm border border-black/5"
            }`}>
              <Mic className="w-3.5 h-3.5" />
            </div>
            <button 
              onClick={() => setShowCalc(false)}
              className="text-[10px] text-zinc-500 hover:text-orange-500 font-bold transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>

          {/* Calculator Screen */}
          <div className="text-right pr-2 space-y-1 select-all">
            {calcWarning ? (
              <div className="text-[9px] text-red-500 font-extrabold text-left animate-pulse">
                {calcWarning}
              </div>
            ) : (
              <div className={`h-4 text-xs font-medium tracking-tight truncate ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
                {calcExpression || " "}
              </div>
            )}
            <div className={`text-4xl font-light tracking-tight truncate ${theme === "dark" ? "text-white" : "text-zinc-900"}`}>
              {calcDisplay || "0"}
            </div>
          </div>

          {/* 3D Embossed Keys Grid */}
          <div className="grid grid-cols-4 gap-3.5">
            {/* ROW 1: Function Keys & Operator */}
            <button
              type="button"
              onClick={() => handleCalcKeyPress("C")}
              className={`w-14 h-14 rounded-full text-base font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                theme === "dark" 
                  ? "bg-[#3a3b3d] hover:bg-[#48494b] text-[#d4d4d2] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_0_2px_4px_rgba(0,0,0,0.3)]" 
                  : "bg-[#d4d4d2] hover:bg-[#c7c7c5] text-zinc-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),_0_2px_4px_rgba(0,0,0,0.08)]"
              }`}
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handleCalcKeyPress("+/-")}
              className={`w-14 h-14 rounded-full text-base font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                theme === "dark" 
                  ? "bg-[#3a3b3d] hover:bg-[#48494b] text-[#d4d4d2] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_0_2px_4px_rgba(0,0,0,0.3)]" 
                  : "bg-[#d4d4d2] hover:bg-[#c7c7c5] text-zinc-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),_0_2px_4px_rgba(0,0,0,0.08)]"
              }`}
            >
              +/-
            </button>
            <button
              type="button"
              onClick={() => handleCalcKeyPress("%")}
              className={`w-14 h-14 rounded-full text-base font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                theme === "dark" 
                  ? "bg-[#3a3b3d] hover:bg-[#48494b] text-[#d4d4d2] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_0_2px_4px_rgba(0,0,0,0.3)]" 
                  : "bg-[#d4d4d2] hover:bg-[#c7c7c5] text-zinc-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),_0_2px_4px_rgba(0,0,0,0.08)]"
              }`}
            >
              %
            </button>
            <button
              type="button"
              onClick={() => handleCalcKeyPress("/")}
              className={`w-14 h-14 rounded-full text-xl font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer bg-orange-500 hover:bg-orange-600 text-white shadow-[0_2px_4px_rgba(0,0,0,0.15)]`}
            >
              ÷
            </button>

            {/* ROW 2: Numbers & Operator */}
            {["7", "8", "9"].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => handleCalcKeyPress(n)}
                className={`w-14 h-14 rounded-full text-base font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  theme === "dark"
                    ? "bg-[#282a2d] hover:bg-[#323437] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_2px_4px_rgba(0,0,0,0.3)]"
                    : "bg-[#ffffff] hover:bg-[#f3f4f6] text-zinc-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),_0_2px_4px_rgba(0,0,0,0.06)] border border-black/5"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleCalcKeyPress("*")}
              className={`w-14 h-14 rounded-full text-xl font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer bg-orange-500 hover:bg-orange-600 text-white shadow-[0_2px_4px_rgba(0,0,0,0.15)]`}
            >
              ×
            </button>

            {/* ROW 3: Numbers & Operator */}
            {["4", "5", "6"].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => handleCalcKeyPress(n)}
                className={`w-14 h-14 rounded-full text-base font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  theme === "dark"
                    ? "bg-[#282a2d] hover:bg-[#323437] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_2px_4px_rgba(0,0,0,0.3)]"
                    : "bg-[#ffffff] hover:bg-[#f3f4f6] text-zinc-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),_0_2px_4px_rgba(0,0,0,0.06)] border border-black/5"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleCalcKeyPress("-")}
              className={`w-14 h-14 rounded-full text-xl font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer bg-orange-500 hover:bg-orange-600 text-white shadow-[0_2px_4px_rgba(0,0,0,0.15)]`}
            >
              −
            </button>

            {/* ROW 4: Numbers & Operator */}
            {["1", "2", "3"].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => handleCalcKeyPress(n)}
                className={`w-14 h-14 rounded-full text-base font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  theme === "dark"
                    ? "bg-[#282a2d] hover:bg-[#323437] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_2px_4px_rgba(0,0,0,0.3)]"
                    : "bg-[#ffffff] hover:bg-[#f3f4f6] text-zinc-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),_0_2px_4px_rgba(0,0,0,0.06)] border border-black/5"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleCalcKeyPress("+")}
              className={`w-14 h-14 rounded-full text-xl font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer bg-orange-500 hover:bg-orange-600 text-white shadow-[0_2px_4px_rgba(0,0,0,0.15)]`}
            >
              +
            </button>

            {/* ROW 5: Wide 0, Dot, Equals */}
            <button
              type="button"
              onClick={() => handleCalcKeyPress("0")}
              className={`col-span-2 h-14 rounded-full text-base font-bold flex items-center pl-6 transition-all active:scale-95 cursor-pointer ${
                theme === "dark"
                  ? "bg-[#282a2d] hover:bg-[#323437] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_2px_4px_rgba(0,0,0,0.3)]"
                  : "bg-[#ffffff] hover:bg-[#f3f4f6] text-zinc-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),_0_2px_4px_rgba(0,0,0,0.06)] border border-black/5"
              }`}
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleCalcKeyPress(".")}
              className={`w-14 h-14 rounded-full text-base font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                theme === "dark"
                  ? "bg-[#282a2d] hover:bg-[#323437] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_2px_4px_rgba(0,0,0,0.3)]"
                  : "bg-[#ffffff] hover:bg-[#f3f4f6] text-zinc-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),_0_2px_4px_rgba(0,0,0,0.06)] border border-black/5"
              }`}
            >
              .
            </button>
            <button
              type="button"
              onClick={() => handleCalcKeyPress("=")}
              className={`w-14 h-14 rounded-full text-xl font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer bg-orange-500 hover:bg-orange-600 text-white shadow-[0_2px_4px_rgba(0,0,0,0.15)]`}
            >
              =
            </button>
          </div>

          <div className="flex justify-center border-t border-[var(--border)]/30 pt-3">
            <button
              type="button"
              onClick={() => handleCalcKeyPress(",")}
              className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all active:scale-95 cursor-pointer ${
                theme === "dark" 
                  ? "bg-zinc-900/60 hover:bg-zinc-900 text-orange-400 border border-orange-500/20" 
                  : "bg-white hover:bg-zinc-50 text-orange-600 border border-orange-500/25 shadow-sm"
              }`}
            >
              Virgül (,) Ekle
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-[var(--border)] bg-[var(--card)] py-4 px-6 flex items-center justify-between text-xs text-zinc-500">
        <span>© 2026 Değirmen Cafe. Tüm hakları saklıdır.</span>
        <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          İşlem Onay Kutusu Destekli
        </span>
      </footer>

    </div>
  );
}
