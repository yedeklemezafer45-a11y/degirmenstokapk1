import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

export interface ShiftHandover {
  id: string;
  regionId: string;
  closedBy: string;
  closedByName: string;
  closedAt: string; // TR formatlı tarih saat
  note: string;
  hasDataEntry: boolean;
}

export interface ActiveShiftStatus {
  hasDataEntry: boolean;
}

// Son kapatılan vardiyayı getir
export async function getLatestShiftHandover(regionId: string): Promise<ShiftHandover | null> {
  try {
    const colRef = collection(db, "regions", regionId, "shift_handovers");
    const q = query(colRef, orderBy("closedAt", "desc"), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as ShiftHandover;
    }
    return null;
  } catch (err) {
    console.error("getLatestShiftHandover error:", err);
    return null;
  }
}

// Aktif vardiyadaki veri giriş durumunu getir
export async function getActiveShiftStatus(regionId: string): Promise<ActiveShiftStatus> {
  try {
    const docRef = doc(db, "regions", regionId, "active_shift", "status");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as ActiveShiftStatus;
    }
    return { hasDataEntry: false };
  } catch (err) {
    console.error("getActiveShiftStatus error:", err);
    return { hasDataEntry: false };
  }
}

// Aktif vardiyadaki veri giriş durumunu güncelle
export async function updateActiveShiftDataEntry(regionId: string, hasDataEntry: boolean): Promise<void> {
  try {
    const docRef = doc(db, "regions", regionId, "active_shift", "status");
    await setDoc(docRef, { hasDataEntry }, { merge: true });
  } catch (err) {
    console.error("updateActiveShiftDataEntry error:", err);
  }
}

// Vardiyayı kapat ve yeni bir handover notu oluştur
export async function saveShiftHandover(
  regionId: string,
  username: string,
  fullName: string,
  note: string,
  hasDataEntry: boolean
): Promise<ShiftHandover> {
  const closedAt = new Date().toLocaleString("tr-TR");
  const id = "shift_" + Date.now();
  
  const newHandover: ShiftHandover = {
    id,
    regionId,
    closedBy: username,
    closedByName: fullName,
    closedAt,
    note,
    hasDataEntry
  };

  // 1. Handover kaydını ekle
  const docRef = doc(db, "regions", regionId, "shift_handovers", id);
  await setDoc(docRef, newHandover);

  // 2. Aktif vardiya durumunu sıfırla (Yeni vardiyaya temiz başla)
  const statusRef = doc(db, "regions", regionId, "active_shift", "status");
  await setDoc(statusRef, { hasDataEntry: false });

  return newHandover;
}
