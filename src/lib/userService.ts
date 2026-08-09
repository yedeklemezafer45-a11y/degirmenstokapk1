import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc
} from "firebase/firestore";

export interface FirestoreUser {
  username: string;
  name: string;
  role: "admin" | "yonetici" | "waiter";
  password: string;
}

const USERS_COL = "users";

// Varsayılan kullanıcılar — ilk çalıştırmada Firestore'a yazılır
const DEFAULT_USERS: FirestoreUser[] = [
  { username: "zafer",   name: "Zafer Yönetici",  role: "admin",   password: "1908" },
  { username: "barista", name: "Bar Personeli",    role: "waiter",  password: "1234" },
];

// İlk seeding
async function seedDefaultUsers(): Promise<void> {
  for (const user of DEFAULT_USERS) {
    await setDoc(doc(db, USERS_COL, user.username), user);
  }
}

// Tüm kullanıcıları getir
export async function getAllUsers(): Promise<FirestoreUser[]> {
  const snapshot = await getDocs(collection(db, USERS_COL));
  if (snapshot.empty) {
    await seedDefaultUsers();
    return DEFAULT_USERS;
  }
  return snapshot.docs.map(d => d.data() as FirestoreUser);
}

// Kullanıcı adına göre tek kullanıcı getir
export async function getUserByUsername(username: string): Promise<FirestoreUser | null> {
  const snap = await getDoc(doc(db, USERS_COL, username.toLowerCase()));
  return snap.exists() ? (snap.data() as FirestoreUser) : null;
}

// Yeni kullanıcı ekle / güncelle
export async function saveUser(user: FirestoreUser): Promise<void> {
  await setDoc(doc(db, USERS_COL, user.username.toLowerCase()), {
    ...user,
    username: user.username.toLowerCase()
  });
}

// Kullanıcı sil
export async function removeUser(username: string): Promise<void> {
  await deleteDoc(doc(db, USERS_COL, username.toLowerCase()));
}
