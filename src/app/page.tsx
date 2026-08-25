"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Moon, Sun, X, Mail, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { getUserByUsername, getAllUsers, BRANCH_REGIONS } from "@/lib/userService";
import { logUserAction } from "@/lib/auditLogService";

// Toast Bildirim Tipi
interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function LoginPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // İlk Girişte Şifre Değiştirme Modalı
  const [tempResetUser, setTempResetUser] = useState<any>(null);
  const [currentPassVal, setCurrentPassVal] = useState("");
  const [newPassVal, setNewPassVal] = useState("");
  const [confirmPassVal, setConfirmPassVal] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Bölge Seçim Modalı/Adımı State'leri
  const [showRegionSelect, setShowRegionSelect] = useState(false);
  const [regionUser, setRegionUser] = useState<any>(null);
  const [availableRegions, setAvailableRegions] = useState<any[]>([]);

  // Şifremi Unuttum Modalı
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotInput, setForgotInput] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotEmailSentTo, setForgotEmailSentTo] = useState("");
  const [forgotError, setForgotError] = useState("");

  // Modern Toast Bildirim State'i
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast Ekleme Fonksiyonu
  const showToast = (message: string, type: "success" | "error" | "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // 4 saniye sonra otomatik sil
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    } else {
      document.documentElement.className = "dark";
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      showToast("Lütfen tüm alanları doldurun.", "error");
      return;
    }

    setIsLoading(true);
    try {
      // Firebase Firestore'dan kullanıcıyı sorgula
      const user = await getUserByUsername(username.trim().toLowerCase());

      if (user && user.password.trim() === password.trim()) {
        if (user.mustChangePassword) {
          setTempResetUser(user);
          setCurrentPassVal(password.trim());
          setNewPassVal("");
          setConfirmPassVal("");
          setIsLoading(false);
          return;
        }

        // Bölge seçim adımını başlat!
        setRegionUser(user);
        
        let userRegions = BRANCH_REGIONS;
        if (user.allowedRegions && user.allowedRegions.length > 0) {
          userRegions = BRANCH_REGIONS.filter(r => user.allowedRegions!.includes(r.id));
        }
        
        setAvailableRegions(userRegions);
        setShowRegionSelect(true);
        setIsLoading(false);
      } else {
        showToast("Hatalı kullanıcı adı veya şifre!", "error");
      }
    } catch (err) {
      console.error("Firebase login error:", err);
      showToast("Bağlantı hatası. Lütfen tekrar deneyin.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRegion = async (regionId: string) => {
    if (!regionUser) return;
    setIsLoading(true);

    const regionName = BRANCH_REGIONS.find(r => r.id === regionId)?.name || regionId;

    sessionStorage.setItem("activeUser", JSON.stringify({
      username: regionUser.username,
      role: regionUser.role,
      fullName: regionUser.name,
      allowedMenus: regionUser.allowedMenus || null,
      allowedRegions: regionUser.allowedRegions || null,
      selectedRegion: regionId,
      selectedRegionName: regionName
    }));

    await logUserAction(
      "Sisteme Giriş Yapıldı",
      "GIRIS",
      `@${regionUser.username} (${regionUser.name}) kullanıcısı ${regionName} bölgesini seçerek sisteme girdi.`
    );

    showToast(`Hoşgeldiniz, ${regionUser.name}! Giriş Başarılı (${regionName}).`, "success");
    setShowRegionSelect(false);
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1000);
  };

  // Google ile Giriş Simülasyonu (Modern Modal)
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");

  const handleGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail) return;

    setIsLoading(true);
    setIsGoogleModalOpen(false);

    try {
      const allUsers = await getAllUsers();
      const user = allUsers.find(
        (u) => u.username.toLowerCase() === googleEmail.split("@")[0].toLowerCase()
      );

      if (user) {
        setRegionUser(user);
        
        let userRegions = BRANCH_REGIONS;
        if (user.allowedRegions && user.allowedRegions.length > 0) {
          userRegions = BRANCH_REGIONS.filter(r => user.allowedRegions!.includes(r.id));
        }
        
        setAvailableRegions(userRegions);
        setShowRegionSelect(true);
        setGoogleEmail("");
      } else {
        showToast("Bu Google hesabı sistemde kayıtlı değil!", "error");
      }
    } catch (err) {
      showToast("Bağlantı hatası oluştu.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    if (!forgotInput) return;

    setForgotLoading(true);
    try {
      const user = await getUserByUsername(forgotInput.trim().toLowerCase());

      if (user) {
        setForgotEmailSentTo(`${user.username}@degirmen.com`);
        setForgotSuccess(true);
        showToast("Şifreniz yöneticiniz tarafından sıfırlanabilir.", "success");
        setTimeout(() => {
          setIsForgotOpen(false);
          setForgotSuccess(false);
          setForgotInput("");
        }, 4000);
      } else {
        setForgotError("Kullanıcı adı bulunamadı.");
        showToast("Kayıt bulunamadı, bilgilerinizi kontrol edin.", "error");
      }
    } catch (err) {
      setForgotError("Bağlantı hatası.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleFirstLoginPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempResetUser) return;

    if (!currentPassVal || !newPassVal || !confirmPassVal) {
      showToast("Lütfen tüm şifre alanlarını doldurun.", "error");
      return;
    }

    if (currentPassVal.trim() !== tempResetUser.password.trim()) {
      showToast("Girdiğiniz mevcut geçici şifre yanlış!", "error");
      return;
    }

    if (newPassVal !== confirmPassVal) {
      showToast("Yeni şifreler birbiriyle uyuşmuyor!", "error");
      return;
    }

    if (newPassVal.trim().length < 4) {
      showToast("Yeni şifre en az 4 karakter uzunluğunda olmalıdır!", "error");
      return;
    }

    if (newPassVal.trim() === tempResetUser.password.trim()) {
      showToast("Yeni şifre, geçici şifre ile aynı olamaz!", "error");
      return;
    }

    setIsResetLoading(true);
    try {
      const { saveUser } = await import("@/lib/userService");
      
      const updatedUser = {
        ...tempResetUser,
        password: newPassVal.trim(),
        mustChangePassword: false
      };

      await saveUser(updatedUser);

      // Başarılı şifre güncelleme sonrası bölge seçimine sokalım
      setRegionUser(updatedUser);
      
      let userRegions = BRANCH_REGIONS;
      if (updatedUser.allowedRegions && updatedUser.allowedRegions.length > 0) {
        userRegions = BRANCH_REGIONS.filter(r => updatedUser.allowedRegions!.includes(r.id));
      }
      
      setAvailableRegions(userRegions);
      setShowRegionSelect(true);

      await logUserAction(
        "İlk Giriş Şifresi Değiştirildi",
        "PERSONEL",
        `@${updatedUser.username} (${updatedUser.name}) ilk girişte şifresini başarıyla güncelledi.`
      );

      showToast("Şifreniz başarıyla güncellendi! Şimdi şubenizi seçin.", "success");
      setTempResetUser(null);
    } catch (err) {
      console.error("Şifre güncelleme hatası:", err);
      showToast("Şifre güncellenirken hata oluştu!", "error");
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[var(--background)] p-4 relative overflow-hidden transition-colors duration-300 text-[var(--foreground)]">
      
      {/* Modern Toast Bildirim Konteyneri */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 w-full max-w-[360px] pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 pointer-events-auto animate-slideDown ${
              toast.type === "success"
                ? "bg-green-500/10 border-green-500/20 text-green-500 dark:text-green-400"
                : toast.type === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400"
                : "bg-blue-500/10 border-blue-500/20 text-blue-500 dark:text-blue-400"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            {toast.type === "info" && <Info className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium leading-relaxed">{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="ml-auto p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Sağ Üst Tema Paneli */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <span className="text-[#a1a1aa] dark:text-[#a1a1aa] text-zinc-500 text-sm font-mono tracking-wider select-none">
          {theme === "dark" ? "#121212" : "#F8FAFC"}
        </span>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] cursor-pointer hover:opacity-90 transition-colors shadow-sm"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-600" />
          )}
          <span className="text-xs font-medium">
            {theme === "dark" ? "Aydınlık" : "Karanlık"}
          </span>
        </button>
      </div>

      {/* Cam Efektli (Glassmorphism) Giriş Kartı */}
      <div className="w-full max-w-[400px] bg-[var(--card)]/10 dark:bg-white/5 light:bg-white/80 border border-[var(--border)] rounded-[32px] p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] backdrop-blur-xl transition-all duration-300 relative z-10 flex flex-col items-center">
        
        {/* Logo */}
        <div className="w-64 h-64 flex items-center justify-center mb-6">
          <img src="/logo.png" alt="Değirmen Logo" className="w-full h-full object-contain" />
        </div>

        {/* Başlık */}
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6 text-center select-none">
          Tekrar hoşgeldiniz!
        </h1>

        {/* Form */}
        <form onSubmit={handleLogin} className="w-full space-y-4">

          {/* Kullanıcı Adı Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Kullanıcı Adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all duration-200 text-sm"
            />
          </div>

          {/* Şifre Input */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all duration-200 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-[var(--foreground)] cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Giriş Yap Butonu */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 font-medium text-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </button>

          {/* Google Giriş Butonu */}
          <button
            type="button"
            onClick={() => setIsGoogleModalOpen(true)}
            className="w-full py-3.5 rounded-xl bg-transparent hover:bg-[var(--foreground)]/5 border border-[var(--border)] text-[var(--foreground)] font-medium text-sm flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.66l3.15-3.15C17.45 1.84 14.93 1 12 1 7.37 1 3.43 3.65 1.55 7.5l3.77 2.92C6.2 7.29 8.87 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.11 2.74-2.35 3.58l3.66 2.84c2.14-1.98 3.74-4.88 3.74-8.52z" />
              <path fill="#FBBC05" d="M5.32 14.58c-.24-.72-.37-1.48-.37-2.58s.13-1.86.37-2.58L1.55 6.5C.56 8.48 0 10.68 0 12s.56 3.52 1.55 5.5l3.77-2.92z" />
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.66-2.84c-1.1.74-2.5 1.18-4.3 1.18-3.13 0-5.8-2.25-6.75-5.38L1.48 15.97C3.36 19.82 7.3 23.5 12 23z" />
            </svg>
            Google ile giriş yapın
          </button>
        </form>

        {/* Alt Bilgiler */}
        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => setIsForgotOpen(true)}
            className="text-xs text-zinc-500 hover:underline cursor-pointer bg-transparent border-none outline-none"
          >
            Şifrenizi mi unuttunuz?
          </button>
        </div>
      </div>

      {/* Şifremi Unuttum Modalı */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-[380px] bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl relative">
            
            {/* Kapat Butonu */}
            <button
              onClick={() => {
                setIsForgotOpen(false);
                setForgotSuccess(false);
                setForgotInput("");
                setForgotError("");
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--foreground)]/10 text-zinc-400 hover:text-[var(--foreground)] cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {forgotSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
                  <Mail className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">Şifre Gönderildi!</h2>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Geçici şifreniz başarıyla maskelenmiş olan <b>{forgotEmailSentTo}</b> adresine gönderildi. Lütfen e-postanızı kontrol edin.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="text-center">
                  <h2 className="text-lg font-bold text-[var(--foreground)]">Şifremi Unuttum</h2>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Sistemde kayıtlı kullanıcı adınızı veya e-posta adresinizi girin.
                  </p>
                </div>

                {forgotError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center font-medium">
                    {forgotError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <input
                    type="text"
                    required
                    placeholder="Kullanıcı adı veya E-posta"
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all duration-200 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3.5 rounded-xl bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 font-medium text-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {forgotLoading ? "Doğrulanıyor..." : "Geçici Şifre Gönder"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Google Giriş Modalı (Prompt yerine) */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-[380px] bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl relative">
            <button
              onClick={() => {
                setIsGoogleModalOpen(false);
                setGoogleEmail("");
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--foreground)]/10 text-zinc-400 hover:text-[var(--foreground)] cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleGoogleLogin} className="space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-bold text-[var(--foreground)]">Google ile Giriş Yap</h2>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Sisteme kayıtlı Google e-posta adresinizi girin.
                </p>
              </div>

              <div className="space-y-1.5">
                <input
                  type="email"
                  required
                  placeholder="isim@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all duration-200 text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 font-medium text-sm transition-all duration-200 cursor-pointer"
              >
                Devam Et
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Bölge Seçim Modalı */}
      {showRegionSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-[440px] bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-8 shadow-2xl relative space-y-6">
            
            {/* Kapat Butonu */}
            <button
              onClick={() => {
                setShowRegionSelect(false);
                setRegionUser(null);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-[var(--foreground)]/10 text-zinc-400 hover:text-[var(--foreground)] cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-64 h-64 mx-auto flex items-center justify-center">
                <img src="/logo.png" alt="Değirmen Logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-lg font-black tracking-tight text-[var(--foreground)]">Çalışma Bölgesi Seçin</h2>
              <p className="text-xs text-zinc-500">
                Giriş yapacağınız şubeyi seçerek envanter ve reçete işlemlerini başlatın.
              </p>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
              {availableRegions.map((region) => (
                <button
                  key={region.id}
                  onClick={() => handleSelectRegion(region.id)}
                  className="w-full text-left p-4 rounded-2xl border border-[var(--border)] bg-[var(--background)]/40 hover:bg-orange-500/10 hover:border-orange-500/30 text-zinc-300 hover:text-orange-400 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-bold block">{region.name}</span>
                    <span className="text-[9px] text-zinc-500 group-hover:text-orange-500/80">Envanter & Reçete Yönetimi</span>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-[var(--foreground)]/5 group-hover:bg-orange-500/20 flex items-center justify-center text-zinc-500 group-hover:text-orange-400 transition-all">
                    →
                  </div>
                </button>
              ))}
              {availableRegions.length === 0 && (
                <p className="text-xs text-zinc-500 italic text-center py-4">Bu kullanıcı için atanmış yetkili bölge bulunmuyor.</p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* İlk Giriş Şifre Değiştirme Modalı */}
      {tempResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-[380px] bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl relative space-y-5">
            
            {/* Kapat Butonu */}
            <button
              onClick={() => {
                setTempResetUser(null);
                setCurrentPassVal("");
                setNewPassVal("");
                setConfirmPassVal("");
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--foreground)]/10 text-zinc-400 hover:text-[var(--foreground)] cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleFirstLoginPasswordChange} className="space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-bold text-[var(--foreground)]">Şifrenizi Güncelleyin</h2>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Hesabınızın güvenliği için yöneticinin belirlediği geçici şifreyi değiştirip yeni şifrenizi oluşturmanız gerekmektedir.
                </p>
              </div>

              {/* Geçici Şifre */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Mevcut Geçici Şifre</label>
                <input
                  type="password"
                  required
                  placeholder="Geçici Şifre"
                  value={currentPassVal}
                  onChange={(e) => setCurrentPassVal(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all text-xs"
                />
              </div>

              {/* Yeni Şifre */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Yeni Şifre</label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    required
                    placeholder="En az 4 karakter"
                    value={newPassVal}
                    onChange={(e) => setNewPassVal(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Yeni Şifre Tekrar */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Yeni Şifre (Tekrar)</label>
                <input
                  type="password"
                  required
                  placeholder="Şifreyi Onaylayın"
                  value={confirmPassVal}
                  onChange={(e) => setConfirmPassVal(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isResetLoading}
                className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs transition-all duration-200 cursor-pointer disabled:opacity-50 animate-pulse"
              >
                {isResetLoading ? "Şifre Güncelleniyor..." : "Şifreyi Güncelle ve Giriş Yap"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
