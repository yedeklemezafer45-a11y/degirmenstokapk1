import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  onSnapshot,
  Unsubscribe,
  deleteDoc
} from "firebase/firestore";
import { StockItem, mockStockItems } from "./stockStore";
import { getDynamicRegions } from "./userService";

// Get collection path based on region
export function getStocksCollectionPath(regionId: string): string {
  if (!regionId || regionId === "degirmen-kafe") {
    return "stocks";
  }
  return `regions/${regionId}/stocks`;
}

export function isVargelRegion(regionId: string): boolean {
  if (!regionId) return false;
  const lower = regionId.toLowerCase();
  return lower !== "degirmen-kafe" && (
    lower.includes("vargel") || 
    lower.includes("karavan") || 
    lower.includes("eylul") || 
    lower.includes("millet")
  );
}

export async function getVargelRegionIds(): Promise<string[]> {
  try {
    const dynamic = await getDynamicRegions();
    const vargels = dynamic.filter(r => isVargelRegion(r.id)).map(r => r.id);
    if (vargels.length > 0) return Array.from(new Set(vargels));
  } catch (e) {
    console.error("getVargelRegionIds error:", e);
  }
  return ["13-eylul-vargel-kafe", "millet-bahcesi-vargel-kafe", "vargel-karavan", "vargel-kitap-kafe"];
}

// Tekli Stok Sil
export async function deleteStockItem(regionId: string, id: string): Promise<void> {
  const path = getStocksCollectionPath(regionId);
  await deleteDoc(doc(db, path, id));
}

// Tekli Stok Sil (Vargel ise tüm Vargellerden siler)
export async function deleteStockItemAcrossVargel(regionId: string, id: string): Promise<void> {
  await deleteStockItem(regionId, id);

  if (isVargelRegion(regionId)) {
    const vargelIds = await getVargelRegionIds();
    const otherVargels = vargelIds.filter(v => v !== regionId);
    await Promise.all(
      otherVargels.map(async (vId) => {
        try {
          await deleteStockItem(vId, id);
        } catch (err) {
          console.error(`Vargel delete sync error for ${vId}:`, err);
        }
      })
    );
  }
}

// Varsayılan stokları belirli bir bölge için Firestore'a yükle (Seeding)
export async function seedDefaultStocksForRegion(regionId: string): Promise<void> {
  const path = getStocksCollectionPath(regionId);
  const batch = writeBatch(db);

  for (const item of mockStockItems) {
    const itemRef = doc(db, path, item.id);
    // Sıfır stokla başlat
    const seedItem: StockItem = {
      ...item,
      depodaBulunan: 0,
      depodanAlinan: 0,
      quantity: 0,
      expDate: "",
      orderable: true
    };
    batch.set(itemRef, seedItem);
  }

  // Göçün tamamlandığını işaretlemek için özel dokümanı yaz
  const migrationRef = doc(db, path, "_migration_v3");
  const migrationDoc: StockItem = {
    id: "_migration_v3",
    name: "MIGRATION_V3_METADATA",
    category: "Yan Ürünler",
    depodaBulunan: 0,
    depodanAlinan: 0,
    quantity: 0,
    unit: "Adet",
    minLimit: 0,
    price: 0,
    weightInfo: "",
    orderable: false
  };
  batch.set(migrationRef, migrationDoc);

  await batch.commit();
}

// Eksik varsayılan ürünleri Firestore'a yükle (Yeni kategori/ürün güncellemeleri için)
export async function ensureAllDefaultStocksExist(regionId: string, currentItems: StockItem[]): Promise<void> {
  const hasMigrationV3 = currentItems.some(i => i.id === "_migration_v3");
  if (hasMigrationV3) {
    // Göç zaten yapılmış, silinen ürünleri geri yükleme
    return;
  }

  const currentIds = new Set(currentItems.map(i => i.id));
  const missingItems = mockStockItems.filter(item => !currentIds.has(item.id));
  
  const path = getStocksCollectionPath(regionId);
  const batch = writeBatch(db);

  if (missingItems.length > 0) {
    console.log(`Region ${regionId} has ${missingItems.length} missing items. Seeding them...`);
    for (const item of missingItems) {
      const itemRef = doc(db, path, item.id);
      const seedItem: StockItem = {
        ...item,
        depodaBulunan: 0,
        depodanAlinan: 0,
        quantity: 0,
        expDate: "",
        orderable: true
      };
      batch.set(itemRef, seedItem);
    }
  }

  // Göç v3 tamamlandı işaretle
  const migrationRef = doc(db, path, "_migration_v3");
  const migrationDoc: StockItem = {
    id: "_migration_v3",
    name: "MIGRATION_V3_METADATA",
    category: "Yan Ürünler",
    depodaBulunan: 0,
    depodanAlinan: 0,
    quantity: 0,
    unit: "Adet",
    minLimit: 0,
    price: 0,
    weightInfo: "",
    orderable: false
  };
  batch.set(migrationRef, migrationDoc);

  await batch.commit();
}

export function sanitizeStockItem(item: StockItem): StockItem {
  if (!item) return item;
  let updatedName = item.name ? item.name.replace(/\s+MONTE\s+CR[İI]STO/gi, "").trim() : item.name;
  let updatedUnit = item.unit;
  let updatedWeight = item.weightInfo;

  // Soft içecekler Koli birimi
  if (item.category === "Soft İçecek Ürünleri" && (!updatedUnit || updatedUnit === "Adet")) {
    updatedUnit = "Koli";
    if (!updatedWeight || updatedWeight.includes("Lt")) {
      updatedWeight = "1 Koli (24 Adet)";
    }
  }

  // Pastalar Adet birimi
  if (item.category === "Pastalar") {
    updatedUnit = "Adet";
    if (updatedWeight && updatedWeight.includes("Dilim")) {
      updatedWeight = "1 Adet";
    }
  }

  if (updatedName !== item.name || updatedUnit !== item.unit || updatedWeight !== item.weightInfo) {
    return {
      ...item,
      name: updatedName,
      unit: updatedUnit,
      weightInfo: updatedWeight
    };
  }
  return item;
}

// Tüm Stokları Getir (tek seferlik)
export async function getAllStocks(regionId: string): Promise<StockItem[]> {
  const path = getStocksCollectionPath(regionId);
  try {
    const snapshot = await getDocs(collection(db, path));
    if (snapshot.empty) {
      await seedDefaultStocksForRegion(regionId);
      const freshSnap = await getDocs(collection(db, path));
      const rawItems = freshSnap.docs.map(d => d.data() as StockItem);
      const items = rawItems
        .filter(item => item.id !== "_migration_v3" && item.id !== "_migration_v2")
        .map(sanitizeStockItem);
      return [...items].sort((a, b) => a.name.localeCompare(b.name, "tr"));
    }
    const rawItems = snapshot.docs.map(d => d.data() as StockItem);
    await ensureAllDefaultStocksExist(regionId, rawItems);
    const items = rawItems
      .filter(item => item.id !== "_migration_v3" && item.id !== "_migration_v2")
      .map(sanitizeStockItem);
    return [...items].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  } catch (err) {
    console.error(`getAllStocks (${regionId}) hatası:`, err);
    return [...mockStockItems].map(sanitizeStockItem).sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }
}

/**
 * Gerçek zamanlı stok dinleyicisi (onSnapshot).
 */
export function subscribeToStocks(
  regionId: string,
  callback: (items: StockItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = getStocksCollectionPath(regionId);
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (snapshot.empty) {
        seedDefaultStocksForRegion(regionId).then(() => {
          // İlk kez tetiklendiğinde seed sonrası Snapshot zaten tekrar ateşlenecektir.
        });
        return;
      }
      const rawItems = snapshot.docs.map(d => d.data() as StockItem);
      // Arka planda eksik olanları ekle
      ensureAllDefaultStocksExist(regionId, rawItems).then(() => {
        const items = rawItems
          .filter(item => item.id !== "_migration_v3" && item.id !== "_migration_v2")
          .map(sanitizeStockItem);
        const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, "tr"));
        callback(sorted);
      });
    },
    (error) => {
      console.error(`subscribeToStocks (${regionId}) hatası:`, error);
      if (onError) onError(error);
    }
  );
}

// Tekli Stok Güncelle/Ekle
export async function saveStockItem(regionId: string, item: StockItem): Promise<void> {
  const sanitized = sanitizeStockItem(item);
  const path = getStocksCollectionPath(regionId);
  await setDoc(doc(db, path, sanitized.id), sanitized);
}

// Tekli Stok Güncelle/Ekle (Vargel ise tüm Vargellere senkronize eder)
export async function saveStockItemAcrossVargel(regionId: string, item: StockItem): Promise<void> {
  const sanitized = sanitizeStockItem(item);
  await saveStockItem(regionId, sanitized);

  if (isVargelRegion(regionId)) {
    const vargelIds = await getVargelRegionIds();
    const otherVargels = vargelIds.filter(v => v !== regionId);
    
    await Promise.all(
      otherVargels.map(async (vId) => {
        try {
          const path = getStocksCollectionPath(vId);
          const targetDocRef = doc(db, path, sanitized.id);
          const targetSnap = await getDoc(targetDocRef);
          if (targetSnap.exists()) {
            const existing = targetSnap.data() as StockItem;
            const mergedItem: StockItem = {
              ...existing,
              name: sanitized.name,
              category: sanitized.category,
              unit: sanitized.unit,
              weightInfo: sanitized.weightInfo,
              price: sanitized.price,
              minLimit: sanitized.minLimit,
              orderable: sanitized.orderable
            };
            await setDoc(targetDocRef, mergedItem);
          } else {
            const newItem: StockItem = {
              ...sanitized,
              depodaBulunan: 0,
              depodanAlinan: 0,
              quantity: 0
            };
            await setDoc(targetDocRef, newItem);
          }
        } catch (err) {
          console.error(`Vargel sync error for ${vId}:`, err);
        }
      })
    );
  }
}

// Tüm Stok Listesini Toplu Kaydet
export async function saveAllStocks(regionId: string, items: StockItem[]): Promise<void> {
  const sanitizedItems = items.map(sanitizeStockItem);
  const batch = writeBatch(db);
  const path = getStocksCollectionPath(regionId);
  for (const item of sanitizedItems) {
    const itemRef = doc(db, path, item.id);
    batch.set(itemRef, item);
  }
  await batch.commit();
}

// Tüm Stok Listesini Toplu Kaydet (Vargel ise tüm Vargellere senkronize eder)
export async function saveAllStocksAcrossVargel(regionId: string, items: StockItem[]): Promise<void> {
  const sanitizedItems = items.map(sanitizeStockItem);
  await saveAllStocks(regionId, sanitizedItems);

  if (isVargelRegion(regionId)) {
    const vargelIds = await getVargelRegionIds();
    const otherVargels = vargelIds.filter(v => v !== regionId);
    
    await Promise.all(
      otherVargels.map(async (vId) => {
        try {
          const currentTargetStocks = await getAllStocks(vId);
          const targetMap = new Map(currentTargetStocks.map(i => [i.id, i]));
          
          const updatedTargetStocks: StockItem[] = [];
          for (const sItem of sanitizedItems) {
            const existing = targetMap.get(sItem.id);
            if (existing) {
              updatedTargetStocks.push({
                ...existing,
                name: sItem.name,
                category: sItem.category,
                unit: sItem.unit,
                weightInfo: sItem.weightInfo,
                price: sItem.price,
                minLimit: sItem.minLimit,
                orderable: sItem.orderable
              });
              targetMap.delete(sItem.id);
            } else {
              updatedTargetStocks.push({
                ...sItem,
                depodaBulunan: 0,
                depodanAlinan: 0,
                quantity: 0
              });
            }
          }
          await saveAllStocks(vId, updatedTargetStocks);
        } catch (err) {
          console.error(`Vargel batch sync error for ${vId}:`, err);
        }
      })
    );
  }
}

// Özel Kategorileri Getir ve Kaydet (Vargel ve Değirmen için Firestore tabanlı)
export async function getCustomCategoriesFromFirestore(regionId: string): Promise<string[]> {
  const isVargel = isVargelRegion(regionId);
  const docId = isVargel ? "vargel_custom_categories" : "degirmen_custom_categories";
  try {
    const snap = await getDoc(doc(db, "settings", docId));
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.categories)) {
        return data.categories as string[];
      }
    }
  } catch (err) {
    console.error("getCustomCategoriesFromFirestore error:", err);
  }
  const localKey = isVargel ? "vargel_siparis_custom_categories" : "degirmen_siparis_custom_categories";
  const local = typeof window !== "undefined" ? (localStorage.getItem(localKey) || localStorage.getItem("degirmen_siparis_custom_categories")) : null;
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      return [];
    }
  }
  return [];
}

export async function saveCustomCategoryToFirestore(regionId: string, categoryName: string): Promise<string[]> {
  const isVargel = isVargelRegion(regionId);
  const docId = isVargel ? "vargel_custom_categories" : "degirmen_custom_categories";
  const current = await getCustomCategoriesFromFirestore(regionId);
  if (!current.includes(categoryName)) {
    const updated = [...current, categoryName];
    try {
      await setDoc(doc(db, "settings", docId), { categories: updated });
    } catch (err) {
      console.error("saveCustomCategoryToFirestore error:", err);
    }
    if (typeof window !== "undefined") {
      const localKey = isVargel ? "vargel_siparis_custom_categories" : "degirmen_siparis_custom_categories";
      localStorage.setItem(localKey, JSON.stringify(updated));
      localStorage.setItem("degirmen_siparis_custom_categories", JSON.stringify(updated));
    }
    return updated;
  }
  return current;
}
