import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc
} from "firebase/firestore";

export interface MonthlyReportArchive {
  id: string;
  month: string;      // YYYY-MM
  monthName: string;  // "Ağustos 2026"
  createdAt: string;  // Tarih ve Saat
  archivedBy: string; // Kullanıcı adı
  totalItems: number;
  totalGrams: number;
  stockSnapshot: any[];
}

export function getReportsCollectionPath(regionId: string): string {
  if (!regionId || regionId === "degirmen-kafe") {
    return "monthly_reports";
  }
  return `regions/${regionId}/monthly_reports`;
}

// Tüm Arşiv Raporlarını Getir
export async function getAllReports(regionId: string): Promise<MonthlyReportArchive[]> {
  const path = getReportsCollectionPath(regionId);
  try {
    const snapshot = await getDocs(collection(db, path));
    return snapshot.docs.map(d => d.data() as MonthlyReportArchive);
  } catch (err) {
    console.error(`getAllReports (${regionId}) hatası:`, err);
    return [];
  }
}

// Rapor Kaydet
export async function saveReport(regionId: string, report: MonthlyReportArchive): Promise<void> {
  const path = getReportsCollectionPath(regionId);
  await setDoc(doc(db, path, report.id), report);
}

// Rapor Sil
export async function removeReport(regionId: string, reportId: string): Promise<void> {
  const path = getReportsCollectionPath(regionId);
  await deleteDoc(doc(db, path, reportId));
}
