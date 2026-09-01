import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe
} from "firebase/firestore";

export interface MonthlyReportArchive {
  id: string;
  month: string;          // YYYY-MM
  monthName: string;      // "31 Ağustos 2026 Sayım Raporu" veya "Ağustos 2026"
  completedDate?: string; // "31.08.2026"
  completedTime?: string; // "23:05"
  createdAt: string;      // "31 Ağustos 2026 23:05:00"
  archivedBy: string;     // Kullanıcı adı
  regionId?: string;      // "degirmen-kafe"
  regionName?: string;    // "Değirmen Kafe"
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
    const reports = snapshot.docs.map(d => d.data() as MonthlyReportArchive);
    reports.sort((a, b) => (b.id || "").localeCompare(a.id || ""));
    return reports;
  } catch (err) {
    console.error(`getAllReports (${regionId}) hatası:`, err);
    return [];
  }
}

// Gerçek Zamanlı Arşiv Dinleyicisi
export function subscribeToReports(
  regionId: string,
  callback: (reports: MonthlyReportArchive[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = getReportsCollectionPath(regionId);
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const reports = snapshot.docs.map(d => d.data() as MonthlyReportArchive);
      reports.sort((a, b) => (b.id || "").localeCompare(a.id || ""));
      callback(reports);
    },
    (err) => {
      console.error(`subscribeToReports (${regionId}) hatası:`, err);
      if (onError) onError(err);
    }
  );
}

// Rapor Kaydet (Ömür Boyu Kalıcı Kayıt)
export async function saveReport(regionId: string, report: MonthlyReportArchive): Promise<void> {
  const path = getReportsCollectionPath(regionId);
  await setDoc(doc(db, path, report.id), report);
}

// Rapor Sil
export async function removeReport(regionId: string, reportId: string): Promise<void> {
  const path = getReportsCollectionPath(regionId);
  await deleteDoc(doc(db, path, reportId));
}
