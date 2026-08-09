import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteField, updateDoc } from "firebase/firestore";

export interface Announcement {
  active: boolean;
  title: string;
  message: string;
  type: "info" | "warning" | "critical";
  updatedAt: string;
  updatedBy: string;
}

const SETTINGS_DOC = doc(db, "settings", "announcements");

export async function getAnnouncement(): Promise<Announcement | null> {
  try {
    const snap = await getDoc(SETTINGS_DOC);
    if (!snap.exists()) return null;
    const data = snap.data() as Announcement;
    if (!data.active) return null;
    return data;
  } catch {
    return null;
  }
}

export async function setAnnouncement(
  announcement: Omit<Announcement, "updatedAt">
): Promise<void> {
  await setDoc(SETTINGS_DOC, {
    ...announcement,
    active: true,
    updatedAt: new Date().toISOString(),
  });
}

export async function clearAnnouncement(): Promise<void> {
  await setDoc(SETTINGS_DOC, {
    active: false,
    title: "",
    message: "",
    type: "info",
    updatedAt: new Date().toISOString(),
    updatedBy: "",
  });
}
