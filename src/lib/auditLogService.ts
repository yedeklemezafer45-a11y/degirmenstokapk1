import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit
} from "firebase/firestore";

export interface AuditLog {
  id?: string;
  timestamp: string;      // ISO Tarih/Saat
  displayTime: string;    // "09.08.2026 17:45:00"
  username: string;       // İşlemi yapan kullanıcı
  userRole: string;       // İşlemi yapan kullanıcının rolü
  action: string;         // "Stok Sayımı Kaydedildi", "Reçete İndirildi", "Yeni Personel Eklendi" vb.
  category: "STOK" | "RECETE" | "PERSONEL" | "RAPOR" | "GIRIS";
  details: string;        // Detay açıklaması
}

const LOGS_COL = "audit_logs";

// Yeni Log Ekle
export async function logUserAction(
  action: string,
  category: AuditLog["category"],
  details: string
): Promise<void> {
  try {
    const activeUserStr = localStorage.getItem("activeUser");
    let username = "Sistem";
    let userRole = "Bilinmiyor";

    if (activeUserStr) {
      const parsed = JSON.parse(activeUserStr);
      username = parsed.fullName || parsed.username || "Sistem";
      userRole = parsed.role || "Kullanıcı";
    }

    const now = new Date();
    const newLog: Omit<AuditLog, "id"> = {
      timestamp: now.toISOString(),
      displayTime: now.toLocaleString("tr-TR"),
      username,
      userRole,
      action,
      category,
      details
    };

    await addDoc(collection(db, LOGS_COL), newLog);
  } catch (err) {
    console.error("Log ekleme hatası:", err);
  }
}

// En Son Logları Getir (Son 100 Log)
export async function getRecentAuditLogs(maxLogs: number = 100): Promise<AuditLog[]> {
  try {
    const q = query(collection(db, LOGS_COL), orderBy("timestamp", "desc"), limit(maxLogs));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as AuditLog));
  } catch (err) {
    console.error("Log getirme hatası:", err);
    return [];
  }
}
