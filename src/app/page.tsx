"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Moon, Sun, X, Mail, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { mockUsers } from "@/lib/userStore";

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      showToast("Lütfen tüm alanları doldurun.", "error");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      
      // Kayıtlı dinamik kullanıcıları çek
      const savedUsersStr = localStorage.getItem("degirmen_users");
      let allUsers = [...mockUsers];

      if (savedUsersStr) {
        const parsedUsers = JSON.parse(savedUsersStr);
        // degirmen_users içindeki kullanıcıların şifreleri degirmen_pass_[username] altında saklanmaktadır.
        parsedUsers.forEach((u: any) => {
          const pass = localStorage.getItem(`degirmen_pass_${u.username}`);
          // Eğer asıl mockUsers içinde yoksa listeye enjekte et
          if (!allUsers.some(existing => existing.username.toLowerCase() === u.username.toLowerCase())) {
            allUsers.push({
              id: "dyn_" + u.username,
              username: u.username,
              email: `${u.username}@degirmen.com`,
              password: pass || "1234",
              role: u.role,
              fullName: u.name
            });
          }
        });
      }

      const user = allUsers.find(
        (u) =>
          u.username.toLowerCase() === username.toLowerCase() &&
          u.password === password
      );

      if (user) {
        // Oturumu localStorage'e kaydet
        localStorage.setItem("activeUser", JSON.stringify({
          username: user.username,
          role: user.role,
          fullName: user.fullName
        }));

        showToast(`Hoşgeldiniz, ${user.fullName}! Giriş Başarılı.`, "success");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      } else {
        showToast("Hatalı kullanıcı adı veya şifre!", "error");
      }
    }, 1200);
  };

  // Google ile Giriş Simülasyonu (Modern Modal)
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");

  const handleGoogleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail) return;

    setIsLoading(true);
    setIsGoogleModalOpen(false);

    setTimeout(() => {
      setIsLoading(false);
      const user = mockUsers.find(
        (u) => u.email.toLowerCase() === googleEmail.toLowerCase()
      );

      if (user) {
        // Oturumu localStorage'e kaydet
        localStorage.setItem("activeUser", JSON.stringify({
          username: user.username,
          role: user.role,
          fullName: user.fullName
        }));

        showToast(`Google ile giriş başarılı! Hoşgeldiniz, ${user.fullName}`, "success");
        setGoogleEmail("");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      } else {
        showToast("Bu Google hesabı sistemde kayıtlı değil!", "error");
      }
    }, 1200);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    if (!forgotInput) return;

    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      
      const user = mockUsers.find(
        (u) =>
          u.username.toLowerCase() === forgotInput.toLowerCase() ||
          u.email.toLowerCase() === forgotInput.toLowerCase()
      );

      if (user) {
        const [local, domain] = user.email.split("@");
        const maskedEmail = `${local[0]}***${local[local.length - 1]}@${domain}`;
        
        setForgotEmailSentTo(maskedEmail);
        setForgotSuccess(true);
        showToast("Geçici şifreniz e-posta adresinize gönderildi.", "success");
        setTimeout(() => {
          setIsForgotOpen(false);
          setForgotSuccess(false);
          setForgotInput("");
        }, 4000);
      } else {
        setForgotError("Kullanıcı adı veya e-posta adresi bulunamadı.");
        showToast("Kayıt bulunamadı, bilgilerinizi kontrol edin.", "error");
      }
    }, 1500);
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
        
        {/* Kullanıcı Profil İkonu */}
        <div className="w-16 h-16 rounded-2xl border border-[var(--border)] flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-[var(--foreground)]/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
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

            <form onSubmit={handleGoogleLoginSubmit} className="space-y-5">
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
    </main>
  );
}
