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

const STOCKS_COL = "stocks";

// Tekli Stok Sil
export async function deleteStockItem(id: string): Promise<void> {
  await deleteDoc(doc(db, STOCKS_COL, id));
}

// Varsayılan stokları Firestore'a yükle (Seeding)
export async function seedDefaultStocks(): Promise<void> {
  const batch = writeBatch(db);
  for (const item of mockStockItems) {
    const itemRef = doc(db, STOCKS_COL, item.id);
    batch.set(itemRef, item);
  }
  await batch.commit();
}

// Tüm Stokları Getir (tek seferlik)
export async function getAllStocks(): Promise<StockItem[]> {
  try {
    const snapshot = await getDocs(collection(db, STOCKS_COL));
    if (snapshot.empty) {
      await seedDefaultStocks();
      return mockStockItems;
    }
    return snapshot.docs.map(d => d.data() as StockItem);
  } catch (err) {
    console.error("getAllStocks hatası:", err);
    return mockStockItems;
  }
}

/**
 * Gerçek zamanlı stok dinleyicisi (onSnapshot).
 * Herhangi bir kullanıcı stok güncellediğinde tüm açık sayfalar otomatik güncellenir.
 * @returns Dinleyiciyi durdurmak için çağrılacak unsubscribe fonksiyonu
 */
export function subscribeToStocks(
  callback: (items: StockItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, STOCKS_COL),
    (snapshot) => {
      if (snapshot.empty) {
        // İlk kez çalışıyorsa seed et
        seedDefaultStocks().then(() => {
          callback(mockStockItems);
        });
        return;
      }
      const items = snapshot.docs.map(d => d.data() as StockItem);
      callback(items);
    },
    (error) => {
      console.error("subscribeToStocks hatası:", error);
      if (onError) onError(error);
    }
  );
}

// Tekli Stok Güncelle/Ekle
export async function saveStockItem(item: StockItem): Promise<void> {
  await setDoc(doc(db, STOCKS_COL, item.id), item);
}

// Tüm Stok Listesini Toplu Kaydet
export async function saveAllStocks(items: StockItem[]): Promise<void> {
  const batch = writeBatch(db);
  for (const item of items) {
    const itemRef = doc(db, STOCKS_COL, item.id);
    batch.set(itemRef, item);
  }
  await batch.commit();
}
