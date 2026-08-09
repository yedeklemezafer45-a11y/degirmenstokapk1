"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import MusicPlayer from "@/components/MusicPlayer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Tarayıcıdaki oturum kontrolü
    const activeUser = localStorage.getItem("activeUser");
    if (!activeUser) {
      // Oturum yoksa doğrudan giriş sayfasına yönlendir
      window.location.href = "/";
    } else {
      try {
        const parsed = JSON.parse(activeUser);
        if (parsed && parsed.username) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("activeUser");
          window.location.href = "/";
        }
      } catch (e) {
        localStorage.removeItem("activeUser");
        window.location.href = "/";
      }
    }
    setChecking(false);
  }, []);

  if (checking || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-xs text-zinc-400 font-semibold">Oturum Kontrol Ediliyor...</p>
      </div>
    );
  }

  return (
    <>
      {children}
      <MusicPlayer />
    </>
  );
}

