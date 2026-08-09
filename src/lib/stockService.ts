import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch
} from "firebase/firestore";
import { StockItem, mockStockItems } from "./stockStore";

const STOCKS_COL = "stocks";

// Varsayılan stokları Firestore'a yükle (Seeding)
export async function seedDefaultStocks(): Promise<void> {
  const batch = writeBatch(db);
  for (const item of mockStockItems) {
    const itemRef = doc(db, STOCKS_COL, item.id);
    batch.set(itemRef, item);
  }
  await batch.commit();
}

// Tüm Stokları Getir
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

// Tekli veya Toplu Stok Güncelle/Ekle
export async function saveStockItem(item: StockItem): Promise<void> {
  await setDoc(doc(db, STOCKS_COL, item.id), item);
}

// Tüm Stok Listesini Toplu Kaydet (Stok Sayım / Sıfırlama sonrası)
export async function saveAllStocks(items: StockItem[]): Promise<void> {
  const batch = writeBatch(db);
  for (const item of items) {
    const itemRef = doc(db, STOCKS_COL, item.id);
    batch.set(itemRef, item);
  }
  await batch.commit();
}
