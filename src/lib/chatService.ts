import { db } from "./firebase";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  doc, 
  setDoc 
} from "firebase/firestore";

export interface ChatMessage {
  id?: string;
  senderId: string; // username
  senderName: string; // fullName
  senderRole: string; // role
  content: string;
  timestamp: string; // ISO
  fileUrl?: string | null;
  fileType?: 'image' | 'document' | 'audio' | null;
  fileName?: string | null;
}

export interface ActiveSession {
  username: string;
  fullName: string;
  role: string;
  lastActive: string; // ISO
}

const MESSAGES_COL = "chat_messages";
const SESSIONS_COL = "active_sessions";

// Sohbet mesajlarını gerçek zamanlı dinle (son 80 mesaj)
export function subscribeToMessages(callback: (messages: ChatMessage[]) => void) {
  const q = query(
    collection(db, MESSAGES_COL),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const list: ChatMessage[] = [];
    snapshot.forEach((docSnap) => {
      list.push({
        id: docSnap.id,
        ...docSnap.data()
      } as ChatMessage);
    });
    // Son 80 mesajı filtrele
    callback(list.slice(-80));
  }, (err) => {
    console.error("Sohbet dinleme hatası:", err);
  });
}

// Mesaj gönder
export async function sendChatMessage(msg: ChatMessage) {
  try {
    await addDoc(collection(db, MESSAGES_COL), msg);
  } catch (err) {
    console.error("Mesaj gönderilirken hata oluştu:", err);
    throw err;
  }
}

// Kullanıcının aktifliğini güncelle
export async function updateUserActiveSession(username: string, fullName: string, role: string) {
  if (!username) return;
  try {
    const docRef = doc(db, SESSIONS_COL, username);
    await setDoc(docRef, {
      username,
      fullName,
      role,
      lastActive: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("Aktiflik güncellenirken hata oluştu:", err);
  }
}

// Aktif şubeleri/kullanıcıları dinle
export function subscribeToActiveSessions(callback: (sessions: ActiveSession[]) => void) {
  const q = collection(db, SESSIONS_COL);
  return onSnapshot(q, (snapshot) => {
    const list: ActiveSession[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as ActiveSession);
    });
    callback(list);
  }, (err) => {
    console.error("Aktiflik dinleme hatası:", err);
  });
}
