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

const REPORTS_COL = "monthly_reports";

// Tüm Arşiv Raporlarını Getir
export async function getAllReports(): Promise<MonthlyReportArchive[]> {
  try {
    const snapshot = await getDocs(collection(db, REPORTS_COL));
    return snapshot.docs.map(d => d.data() as MonthlyReportArchive);
  } catch (err) {
    console.error("getAllReports hatası:", err);
    return [];
  }
}

// Rapor Kaydet
export async function saveReport(report: MonthlyReportArchive): Promise<void> {
  await setDoc(doc(db, REPORTS_COL, report.id), report);
}

// Rapor Sil
export async function removeReport(reportId: string): Promise<void> {
  await deleteDoc(doc(db, REPORTS_COL, reportId));
}
