import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
  onSnapshot,
  Unsubscribe,
  deleteDoc
} from "firebase/firestore";
import { StockItem, mockStockItems } from "./stockStore";

// Get collection path based on region
export function getStocksCollectionPath(regionId: string): string {
  if (!regionId || regionId === "degirmen-kafe") {
    return "stocks";
  }
  return `regions/${regionId}/stocks`;
}

// Tekli Stok Sil
export async function deleteStockItem(regionId: string, id: string): Promise<void> {
  const path = getStocksCollectionPath(regionId);
  await deleteDoc(doc(db, path, id));
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
  await batch.commit();
}

// Eksik varsayılan ürünleri Firestore'a yükle (Yeni kategori/ürün güncellemeleri için)
export async function ensureAllDefaultStocksExist(regionId: string, currentItems: StockItem[]): Promise<void> {
  const currentIds = new Set(currentItems.map(i => i.id));
  const missingItems = mockStockItems.filter(item => !currentIds.has(item.id));
  
  if (missingItems.length > 0) {
    console.log(`Region ${regionId} has ${missingItems.length} missing items. Seeding them...`);
    const path = getStocksCollectionPath(regionId);
    const batch = writeBatch(db);
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
    await batch.commit();
  }
}

// Tüm Stokları Getir (tek seferlik)
export async function getAllStocks(regionId: string): Promise<StockItem[]> {
  const path = getStocksCollectionPath(regionId);
  try {
    const snapshot = await getDocs(collection(db, path));
    if (snapshot.empty) {
      await seedDefaultStocksForRegion(regionId);
      const freshSnap = await getDocs(collection(db, path));
      const items = freshSnap.docs.map(d => d.data() as StockItem);
      return [...items].sort((a, b) => a.name.localeCompare(b.name, "tr"));
    }
    const items = snapshot.docs.map(d => d.data() as StockItem);
    await ensureAllDefaultStocksExist(regionId, items);
    return [...items].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  } catch (err) {
    console.error(`getAllStocks (${regionId}) hatası:`, err);
    return [...mockStockItems].sort((a, b) => a.name.localeCompare(b.name, "tr"));
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
        const sorted = [...rawItems].sort((a, b) => a.name.localeCompare(b.name, "tr"));
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
  const path = getStocksCollectionPath(regionId);
  await setDoc(doc(db, path, item.id), item);
}

// Tüm Stok Listesini Toplu Kaydet
export async function saveAllStocks(regionId: string, items: StockItem[]): Promise<void> {
  const batch = writeBatch(db);
  const path = getStocksCollectionPath(regionId);
  for (const item of items) {
    const itemRef = doc(db, path, item.id);
    batch.set(itemRef, item);
  }
  await batch.commit();
}
