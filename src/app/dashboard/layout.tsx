"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Tarayıcıdaki oturum kontrolü
    const activeUser = sessionStorage.getItem("activeUser");
    if (!activeUser) {
      // Oturum yoksa doğrudan giriş sayfasına yönlendir
      window.location.href = "/";
    } else {
      try {
        const parsed = JSON.parse(activeUser);
        if (parsed && parsed.username) {
          setIsAuthenticated(true);
          
          // Yetki kısıtlaması kontrolü
          if (parsed.allowedMenus && parsed.allowedMenus.length > 0) {
            const isPathAllowed = pathname === "/dashboard" || parsed.allowedMenus.some((menu: string) => {
              return pathname.startsWith(menu);
            });
            if (!isPathAllowed) {
              window.location.href = "/dashboard";
              return;
            }
          }
        } else {
          sessionStorage.removeItem("activeUser");
          window.location.href = "/";
        }
      } catch (e) {
        sessionStorage.removeItem("activeUser");
        window.location.href = "/";
      }
    }
    setChecking(false);
  }, [pathname]);

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
    </>
  );
}

