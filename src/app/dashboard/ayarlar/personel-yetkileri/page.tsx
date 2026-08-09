"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Moon, 
  Sun, 
  LogOut, 
  Plus, 
  Trash2, 
  Save, 
  Undo2,
  CheckCircle2,
  User,
  Key,
  Shield,
  UserCheck
} from "lucide-react";

interface UserProfile {
  username: string;
  role: "admin" | "yonetici" | "waiter";
  name: string;
}

export default function PersonelYetkileriPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [dbUsers, setDbUsers] = useState<UserProfile[]>([]);
  const [activeUserRole, setActiveUserRole] = useState<string>("waiter");
  const [isDirty, setIsDirty] = useState(false);

  // Yeni Kullanıcı State'leri
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<UserProfile["role"]>("waiter");

  // Modern Toast Bildirim State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }

    // Rol Kontrolü (Sadece Admin girebilir)
    const activeUserStr = localStorage.getItem("activeUser");
    if (activeUserStr) {
      const parsed = JSON.parse(activeUserStr);
      setActiveUserRole(parsed.role || "waiter");
      if (parsed.role !== "admin") {
        window.location.href = "/dashboard";
      }
    } else {
      window.location.href = "/";
    }

    // Sistemdeki kayıtlı kullanıcıları ve şifreleri yükle
    const savedUsers = localStorage.getItem("degirmen_users");
    const defaultUsers: UserProfile[] = [
      { username: "zafer", role: "admin", name: "Zafer (Admin)" },
      { username: "barista", role: "waiter", name: "Bar Personeli" }
    ];

    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
      setDbUsers(JSON.parse(savedUsers));
    } else {
      setUsers(defaultUsers);
      setDbUsers(defaultUsers);
      localStorage.setItem("degirmen_users", JSON.stringify(defaultUsers));
      
      // Varsayılan şifreleri de mock veritabanına ekleyelim
      localStorage.setItem("degirmen_pass_zafer", "1908");
      localStorage.setItem("degirmen_pass_barista", "1234");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  // Yeni Personel / Kullanıcı Ekleme
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim() || !newName.trim()) {
      alert("Lütfen tüm alanları (Kullanıcı Adı, Şifre, Ad Soyad) eksiksiz doldurun!");
      return;
    }

    const cleanUsername = newUsername.trim().toLowerCase();

    // Çakışma Kontrolü
    if (users.some(u => u.username === cleanUsername)) {
      alert("Bu kullanıcı adı sistemde zaten kayıtlı!");
      return;
    }

    const newUser: UserProfile = {
      username: cleanUsername,
      role: newRole,
      name: newName.trim()
    };

    const updatedList = [...users, newUser];
    setUsers(updatedList);
    
    // Şifreyi doğrudan localStorage'a geçici olarak yaz (Save edilince kalıcılaşacak)
    localStorage.setItem(`degirmen_pass_${cleanUsername}`, newPassword.trim());

    setNewUsername("");
    setNewPassword("");
    setNewName("");
    setNewRole("waiter");
    setIsDirty(true);
    triggerToast(`Yeni personel (${newUser.name}) taslak listeye eklendi!`);
  };

  // Personel Kaldırma / Silme
  const handleDeleteUser = (usernameToDelete: string) => {
    if (usernameToDelete === "zafer") {
      alert("Ana admin hesabı (zafer) sistemden kaldırılamaz!");
      return;
    }

    const updatedList = users.filter(u => u.username !== usernameToDelete);
    setUsers(updatedList);
    setIsDirty(true);
    triggerToast(`Kullanıcı (${usernameToDelete}) silinmek üzere işaretlendi.`);
  };

  // Toplu Değişiklikleri Kaydet
  const handleSaveChanges = () => {
    localStorage.setItem("degirmen_users", JSON.stringify(users));
    setDbUsers(users);
    setIsDirty(false);
    triggerToast("Personel & Yetki listesi başarıyla kaydedildi!");
  };

  // Değişiklikleri Geri Al
  const handleCancelChanges = () => {
    setUsers(dbUsers);
    setIsDirty(false);
    triggerToast("Değişiklikler geri alındı.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = "/dashboard/ayarlar"}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer mr-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 flex items-center justify-center">
            <img src="/logo.png" alt="Değirmen Cafe Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Yetki & Personel Yönetimi</h1>
            <p className="text-xs text-zinc-500">Sistem Personelleri, Şifreleri ve Yetki Kontrolleri</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => window.location.href = "/"}
            className="p-2 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
            title="Çıkış Yap"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Gövde */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-8 pb-32">
        
        {/* Toast Bildirimi */}
        {showToast && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-orange-600 text-white px-5 py-3 rounded-2xl shadow-xl animate-bounce">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* 1. YENİ KULLANICI / PERSONEL EKLEME FORMU */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-orange-500">Yeni Personel Ekle</h3>
          </div>
          
          <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Kullanıcı Adı</label>
              <input 
                type="text" 
                placeholder="Örn: zafer" 
                value={newUsername} 
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-zinc-800 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Giriş Şifresi</label>
              <input 
                type="password" 
                placeholder="Şifre" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-zinc-800 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Ad Soyad / Bar Rolü</label>
              <input 
                type="text" 
                placeholder="Örn: Zafer Sorumlu" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-zinc-800 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Kullanıcı Yetkisi</label>
              <select 
                value={newRole} 
                onChange={(e) => setNewRole(e.target.value as UserProfile["role"])}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="waiter">Bar Personeli (Barista)</option>
                <option value="yonetici">Bölge Sorumlusu (Yönetici)</option>
                <option value="admin">Ana Sorumlu (Admin)</option>
              </select>
            </div>

            <button 
              type="submit"
              className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-lg shadow-orange-600/10 h-10 w-full"
            >
              <Plus className="w-4 h-4" /> Personel Ekle
            </button>
          </form>
        </div>

        {/* 2. MEVCUT PERSONEL LİSTESİ */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Kullanıcı Adı</th>
                  <th className="py-3 px-4">Adı Soyadı</th>
                  <th className="py-3 px-4">Şifre Kodu</th>
                  <th className="py-3 px-4">Rol / Yetki Seviyesi</th>
                  <th className="py-3 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/40 text-xs">
                {users.map((u) => {
                  const passVal = localStorage.getItem(`degirmen_pass_${u.username}`) || "****";
                  return (
                    <tr key={u.username} className="hover:bg-[var(--background)]/35">
                      <td className="py-4 px-4 font-bold text-zinc-800 dark:text-zinc-200">
                        @{u.username}
                      </td>
                      <td className="py-4 px-4 font-medium text-zinc-500">
                        {u.name}
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-orange-500">
                        {passVal}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-0.5 rounded-xl font-bold border text-[10px] ${
                          u.role === "admin" 
                            ? "bg-red-500/10 text-red-500 border-red-500/20" 
                            : u.role === "yonetici"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        }`}>
                          {u.role === "admin" ? "ADMIN" : u.role === "yonetici" ? "YÖNETİCİ" : "BARISTA"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {u.username !== "zafer" ? (
                          <button 
                            onClick={() => handleDeleteUser(u.username)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                            title="Kullanıcıyı Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-bold italic">Sistem Kilidi</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* HAFIZADA TUTULAN DÜZENLEME DURUMU BAR */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1e293b] border border-orange-500/30 text-white rounded-2xl px-6 py-4 flex items-center gap-6 shadow-2xl animate-slideUp">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-orange-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold">Kullanıcı Değişiklikleri Kaydedilmedi!</span>
              <span className="text-[10px] text-zinc-400">Veritabanına yansıması ve giriş yapabilmeleri için kaydedin.</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCancelChanges}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" /> Geri Al
            </button>
            <button 
              onClick={handleSaveChanges}
              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors shadow-lg shadow-orange-600/20"
            >
              <Save className="w-3.5 h-3.5" /> Değişiklikleri Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-[var(--border)] bg-[var(--card)] py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
        <div>
          <span>© 2026 Değirmen Cafe. Tüm hakları saklıdır.</span>
        </div>
      </footer>

    </div>
  );
}
