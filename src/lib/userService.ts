import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc
} from "firebase/firestore";

export interface BranchRegion {
  id: string;
  name: string;
}

export const BRANCH_REGIONS: BranchRegion[] = [
  { id: "degirmen-kafe", name: "Değirmen Kafe" },
  { id: "13-eylul-vargel-kafe", name: "13 Eylül Vargel Kafe" },
  { id: "millet-bahcesi-vargel-kafe", name: "Millet Bahçesi Vargel Kafe" },
  { id: "vargel-karavan", name: "Vargel Karavan" },
  { id: "vargel-kitap-kafe", name: "Vargel Kitap Kafe" }
];

const REGIONS_SETTINGS_DOC = doc(db, "settings", "regions_list");

export async function getDynamicRegions(): Promise<BranchRegion[]> {
  try {
    const snap = await getDoc(REGIONS_SETTINGS_DOC);
    if (snap.exists()) {
      const data = snap.data();
      if (data.regions && Array.isArray(data.regions)) {
        return data.regions as BranchRegion[];
      }
    }
    // Seed default regions
    await setDoc(REGIONS_SETTINGS_DOC, { regions: BRANCH_REGIONS });
    return BRANCH_REGIONS;
  } catch (err) {
    console.error("getDynamicRegions hatası:", err);
    return BRANCH_REGIONS;
  }
}

export async function addDynamicRegion(newReg: BranchRegion): Promise<void> {
  const current = await getDynamicRegions();
  if (current.some(r => r.id === newReg.id)) return;
  const updated = [...current, newReg];
  await setDoc(REGIONS_SETTINGS_DOC, { regions: updated });
}

export interface FirestoreUser {
  username: string;
  name: string;
  role: "admin" | "yonetici" | "waiter";
  password: string;
  allowedMenus?: string[];
  mustChangePassword?: boolean;
  allowedRegions?: string[];
}

const USERS_COL = "users";

// Varsayılan kullanıcılar
const DEFAULT_USERS: FirestoreUser[] = [
  { username: "zafer",   name: "Zafer Yönetici",  role: "admin",   password: "1908" },
  { username: "barista", name: "Bar Personeli",    role: "waiter",  password: "1234" },
];

// İlk seeding
async function seedDefaultUsers(): Promise<void> {
  try {
    for (const user of DEFAULT_USERS) {
      await setDoc(doc(db, USERS_COL, user.username), user);
    }
  } catch (err) {
    console.error("Seed hatası:", err);
  }
}

// Tüm kullanıcıları getir
export async function getAllUsers(): Promise<FirestoreUser[]> {
  try {
    const snapshot = await getDocs(collection(db, USERS_COL));
    if (snapshot.empty) {
      await seedDefaultUsers();
      return DEFAULT_USERS;
    }
    return snapshot.docs.map(d => d.data() as FirestoreUser);
  } catch (err) {
    console.error("getAllUsers hatası:", err);
    return DEFAULT_USERS;
  }
}

// Kullanıcı adına göre esnek arama (Case-insensitive & Trim toleranslı)
export async function getUserByUsername(username: string): Promise<FirestoreUser | null> {
  const clean = username.trim().toLowerCase();
  
  try {
    // 1. Doğrudan Doc ID araması
    const snap = await getDoc(doc(db, USERS_COL, clean));
    if (snap.exists()) {
      return snap.data() as FirestoreUser;
    }

    // 2. Bulunamadıysa tüm kullanıcıları getirip harf duyarsız kıyasla
    const all = await getAllUsers();
    const found = all.find(u => u.username.trim().toLowerCase() === clean);
    if (found) return found;

    return null;
  } catch (err) {
    console.error("getUserByUsername hatası:", err);
    // Hata durumunda varsayılan kullanıcılardan bak
    const defaultFound = DEFAULT_USERS.find(u => u.username.trim().toLowerCase() === clean);
    return defaultFound || null;
  }
}

// Yeni kullanıcı ekle / güncelle
export async function saveUser(user: FirestoreUser): Promise<void> {
  const cleanUsername = user.username.trim().toLowerCase();
  await setDoc(doc(db, USERS_COL, cleanUsername), {
    ...user,
    username: cleanUsername,
    password: user.password.trim()
  });
}

// Kullanıcı sil
export async function removeUser(username: string): Promise<void> {
  const cleanUsername = username.trim().toLowerCase();
  await deleteDoc(doc(db, USERS_COL, cleanUsername));
}
