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
  Shield,
  UserCheck,
  Loader2
} from "lucide-react";
import { getAllUsers, saveUser, removeUser, FirestoreUser } from "@/lib/userService";

export default function PersonelYetkileriPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [activeUserRole, setActiveUserRole] = useState<string>("waiter");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Yeni Kullanıcı State'leri
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<FirestoreUser["role"]>("waiter");
  const [newAllowedMenus, setNewAllowedMenus] = useState<string[]>([
    "/dashboard/stok",
    "/dashboard/stok-sayim",
    "/dashboard/receteler",
    "/dashboard/aylik-stok-takibi",
    "/dashboard/ayarlar"
  ]);

  // Toast Bildirim State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const triggerToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }

    // Rol Kontrolü (Sadece Admin girebilir)
    const activeUserStr = sessionStorage.getItem("activeUser");
    if (activeUserStr) {
      const parsed = JSON.parse(activeUserStr);
      setActiveUserRole(parsed.role || "waiter");
      if (parsed.role !== "admin") {
        window.location.href = "/dashboard";
        return;
      }
    } else {
      window.location.href = "/";
      return;
    }

    // Firebase'den kullanıcıları yükle
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const firestoreUsers = await getAllUsers();
      setUsers(firestoreUsers);
    } catch (err) {
      console.error("Kullanıcılar yüklenemedi:", err);
      triggerToast("Kullanıcı listesi yüklenemedi!", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  // Yeni Personel Ekle — Firebase'e Doğrudan Kaydet
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim() || !newName.trim()) {
      triggerToast("Lütfen tüm alanları eksiksiz doldurun!", "error");
      return;
    }

    const cleanUsername = newUsername.trim().toLowerCase();

    // Çakışma Kontrolü
    if (users.some(u => u.username === cleanUsername)) {
      triggerToast("Bu kullanıcı adı zaten kayıtlı!", "error");
      return;
    }

    const newUser: FirestoreUser = {
      username: cleanUsername,
      name: newName.trim(),
      role: newRole,
      password: newPassword.trim(),
      allowedMenus: newAllowedMenus,
      mustChangePassword: true
    };

    setIsSaving(true);
    try {
      await saveUser(newUser);
      setUsers(prev => [...prev, newUser]);
      setNewUsername("");
      setNewPassword("");
      setNewName("");
      setNewRole("waiter");
      setNewAllowedMenus([
        "/dashboard/stok",
        "/dashboard/stok-sayim",
        "/dashboard/receteler",
        "/dashboard/aylik-stok-takibi",
        "/dashboard/ayarlar"
      ]);
      triggerToast(`✅ ${newUser.name} başarıyla eklendi! Artık her cihazdan giriş yapabilir.`);
    } catch (err) {
      console.error("Kullanıcı eklenemedi:", err);
      triggerToast("Kullanıcı eklenirken hata oluştu!", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // İzin verilen menüleri dinamik olarak açıp kapatma fonksiyonu
  const handleToggleMenu = async (user: FirestoreUser, path: string) => {
    if (user.username === "zafer") {
      triggerToast("Ana admin hesabı kısıtlanamaz!", "error");
      return;
    }

    const currentAllowed = user.allowedMenus || [
      "/dashboard/stok",
      "/dashboard/stok-sayim",
      "/dashboard/receteler",
      "/dashboard/aylik-stok-takibi",
      "/dashboard/ayarlar"
    ];

    let newAllowed: string[];
    if (currentAllowed.includes(path)) {
      newAllowed = currentAllowed.filter((p: string) => p !== path);
    } else {
      newAllowed = [...currentAllowed, path];
    }

    const updatedUser = {
      ...user,
      allowedMenus: newAllowed
    };

    setIsSaving(true);
    try {
      await saveUser(updatedUser);
      setUsers(prev => prev.map(u => u.username === user.username ? updatedUser : u));
      triggerToast(`✅ @${user.username} yetki listesi güncellendi.`);
    } catch (err) {
      console.error("Yetki kısıtlaması güncellenemedi:", err);
      triggerToast("İzinler güncellenirken hata oluştu!", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Personel Sil — Firebase'den Kaldır
  const handleDeleteUser = async (usernameToDelete: string) => {
    if (usernameToDelete === "zafer") {
      triggerToast("Ana admin hesabı (zafer) silinemez!", "error");
      return;
    }
    if (!window.confirm(`"${usernameToDelete}" kullanıcısını silmek istediğinizden emin misiniz?`)) return;

    setIsSaving(true);
    try {
      await removeUser(usernameToDelete);
      setUsers(prev => prev.filter(u => u.username !== usernameToDelete));
      triggerToast(`${usernameToDelete} kullanıcısı silindi.`);
    } catch (err) {
      console.error("Kullanıcı silinemedi:", err);
      triggerToast("Kullanıcı silinirken hata oluştu!", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* Toast Bildirimi */}
      {showToast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-xs font-semibold ${toastType === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {toastMessage}
        </div>
      )}

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
            <p className="text-xs text-zinc-500">Bulut Tabanlı · Tüm Cihazlarda Geçerli</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer">
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => window.location.href = "/"} className="p-2 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer" title="Çıkış Yap">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-8 pb-20">

        {/* Firebase Bilgi Kartı */}
        <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-5 py-3">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
          <p className="text-xs text-emerald-400 font-semibold">
            Firebase Bulut Veritabanı Aktif — Eklediğiniz kullanıcılar anında tüm cihazlarda geçerli olur.
          </p>
        </div>

        {/* YENİ KULLANICI EKLEME FORMU */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <UserCheck className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-orange-500">Yeni Personel Ekle</h3>
          </div>
          
          <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Kullanıcı Adı</label>
              <input 
                type="text" 
                placeholder="Örn: oğuzhan" 
                value={newUsername} 
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Giriş Şifresi</label>
              <input 
                type="password" 
                placeholder="Şifre" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Ad Soyad</label>
              <input 
                type="text" 
                placeholder="Örn: Oğuzhan Barista" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Kullanıcı Yetkisi</label>
              <select 
                value={newRole} 
                onChange={(e) => setNewRole(e.target.value as FirestoreUser["role"])}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="waiter">Bar Personeli (Barista)</option>
                <option value="yonetici">Bölge Sorumlusu (Yönetici)</option>
                <option value="admin">Ana Sorumlu (Admin)</option>
              </select>
            </div>

            {/* Menü Erişim Yetkileri Kısıtlama Sekmesi */}
            <div className="md:col-span-5 border-t border-[var(--border)]/60 pt-4 mt-2 space-y-3">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">Görüntüleyebileceği Menüler (Erişim Yetkisi)</span>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { label: "Stok Kontrolü", path: "/dashboard/stok" },
                  { label: "Stok Sayım", path: "/dashboard/stok-sayim" },
                  { label: "Reçeteler", path: "/dashboard/receteler" },
                  { label: "Aylık Stok Takibi", path: "/dashboard/aylik-stok-takibi" },
                  { label: "Ayarlar", path: "/dashboard/ayarlar" },
                ].map((menu) => {
                  const isChecked = newAllowedMenus.includes(menu.path);
                  return (
                    <label key={menu.path} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all duration-200 select-none ${
                      isChecked 
                        ? "bg-orange-500/10 border-orange-500/35 text-orange-400" 
                        : "bg-[var(--card)] border-[var(--border)] text-zinc-500 hover:text-zinc-300"
                    }`}>
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setNewAllowedMenus(prev => prev.filter(p => p !== menu.path));
                          } else {
                            setNewAllowedMenus(prev => [...prev, menu.path]);
                          }
                        }}
                        className="rounded border-zinc-700 bg-zinc-900 text-orange-500 focus:ring-orange-500 focus:ring-offset-zinc-900 w-3.5 h-3.5"
                      />
                      {menu.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-5 flex justify-end pt-2">
              <button 
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-colors shadow-lg h-10 cursor-pointer w-full md:w-auto"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {isSaving ? "Kaydediliyor..." : "Personel Ekle"}
              </button>
            </div>
          </form>

          {/* ROL BAZLI MENÜ ERİŞİM BİLGİSİ */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Admin */}
            <div className={`rounded-2xl border p-4 transition-all ${newRole === "admin" ? "border-red-500/50 bg-red-500/5" : "border-[var(--border)] bg-[var(--background)]"}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-red-400" />
                </div>
                <span className="text-xs font-extrabold text-red-400 uppercase">Ana Sorumlu (Admin)</span>
              </div>
              <div className="space-y-1">
                {["✅ Tüm Sayfalar", "✅ Stok Kontrol (Ekle+Sil)", "✅ Ayarlar", "✅ Personel Yönetimi", "✅ Duyuru Yönetimi", "✅ Aylık Stok Takibi"].map(m => (
                  <div key={m} className="text-[10px] text-zinc-400 font-medium">{m}</div>
                ))}
              </div>
            </div>

            {/* Yönetici */}
            <div className={`rounded-2xl border p-4 transition-all ${newRole === "yonetici" ? "border-amber-500/50 bg-amber-500/5" : "border-[var(--border)] bg-[var(--background)]"}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-xs font-extrabold text-amber-400 uppercase">Bölge Sorumlusu</span>
              </div>
              <div className="space-y-1">
                {["✅ Dashboard", "✅ Stok Görüntüle", "✅ Stok Sayım", "✅ Reçeteler", "✅ Stok Kontrol (Sadece Ekle)", "✅ Aylık Stok Takibi", "❌ Ayarlar / Personel"].map(m => (
                  <div key={m} className={`text-[10px] font-medium ${m.startsWith("❌") ? "text-zinc-600" : "text-zinc-400"}`}>{m}</div>
                ))}
              </div>
            </div>

            {/* Barista */}
            <div className={`rounded-2xl border p-4 transition-all ${newRole === "waiter" ? "border-blue-500/50 bg-blue-500/5" : "border-[var(--border)] bg-[var(--background)]"}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="text-xs font-extrabold text-blue-400 uppercase">Bar Personeli (Barista)</span>
              </div>
              <div className="space-y-1">
                {["✅ Dashboard", "✅ Stok Görüntüle", "✅ Stok Sayım", "✅ Reçeteler", "❌ Stok Kontrol", "❌ Aylık Stok Takibi", "❌ Ayarlar"].map(m => (
                  <div key={m} className={`text-[10px] font-medium ${m.startsWith("❌") ? "text-zinc-600" : "text-zinc-400"}`}>{m}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* MEVCUT PERSONEL LİSTESİ */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-orange-500">Kayıtlı Personel Listesi</h3>
            </div>
            <button
              onClick={loadUsers}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-zinc-200 font-semibold transition-colors cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Yenile
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <span className="ml-3 text-sm text-zinc-400">Firebase'den yükleniyor...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Kullanıcı Adı</th>
                    <th className="py-3 px-4">Adı Soyadı</th>
                    <th className="py-3 px-4">Şifre</th>
                    <th className="py-3 px-4">Rol / Yetki</th>
                    <th className="py-3 px-4">Erişebildiği Menüler</th>
                    <th className="py-3 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/40 text-xs">
                  {users.map((u) => (
                    <tr key={u.username} className="hover:bg-[var(--background)]/35">
                      <td className="py-4 px-4 font-bold text-zinc-800 dark:text-zinc-200">
                        @{u.username}
                      </td>
                      <td className="py-4 px-4 font-medium text-zinc-500">
                        {u.name}
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-orange-500">
                        {"•".repeat(u.password?.length || 4)}
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
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                          {[
                            { label: "Stok", path: "/dashboard/stok" },
                            { label: "Sayım", path: "/dashboard/stok-sayim" },
                            { label: "Reçete", path: "/dashboard/receteler" },
                            { label: "Aylık", path: "/dashboard/aylik-stok-takibi" },
                            { label: "Ayarlar", path: "/dashboard/ayarlar" },
                          ].map((m) => {
                            const isAllowed = !u.allowedMenus || u.allowedMenus.includes(m.path);
                            const disabled = u.username === "zafer" || isSaving;
                            return (
                              <button
                                key={m.path}
                                disabled={disabled}
                                onClick={() => handleToggleMenu(u, m.path)}
                                className={`px-2 py-1 rounded-xl text-[9px] font-black border transition-all duration-200 select-none ${
                                  isAllowed
                                    ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                    : "bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20 hover:bg-red-500/20"
                                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                title={isAllowed ? "Erişimi Kapat" : "Erişime İzin Ver"}
                              >
                                {m.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {u.username !== "zafer" ? (
                          <button 
                            onClick={() => handleDeleteUser(u.username)}
                            disabled={isSaving}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-40"
                            title="Kullanıcıyı Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-bold italic">Sistem Kilidi</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-zinc-500 text-xs">
                        Henüz kayıtlı kullanıcı bulunmuyor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[var(--border)] bg-[var(--card)] py-4 px-6 flex items-center justify-between text-xs text-zinc-500">
        <span>© 2026 Değirmen Cafe. Tüm hakları saklıdır.</span>
        <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Firebase Bağlı
        </span>
      </footer>

    </div>
  );
}
