"use client";

import React, { useEffect, useState } from "react";
import { User, Shield, ShieldCheck, Award } from "lucide-react";

export interface UserProfileInfo {
  username: string;
  fullName: string;
  role: "admin" | "yonetici" | "waiter" | string;
}

export default function UserProfileWidget() {
  const [user, setUser] = useState<UserProfileInfo | null>(null);

  useEffect(() => {
    const activeUserStr = sessionStorage.getItem("activeUser");
    if (activeUserStr) {
      try {
        const parsed = JSON.parse(activeUserStr);
        setUser({
          username: parsed.username || "kullanici",
          fullName: parsed.fullName || parsed.name || parsed.username || "Değirmen Personeli",
          role: parsed.role || "waiter"
        });
      } catch (e) {
        console.error("User widget parse error:", e);
      }
    }
  }, []);

  if (!user) return null;

  // Rol Etiketi & Rengi
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return {
          title: "ANA SORUMLU (ADMIN)",
          colorClass: "bg-red-500/10 text-red-400 border-red-500/30",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
        };
      case "yonetici":
        return {
          title: "BÖLGE SORUMLUSU (YÖNETİCİ)",
          colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: <Award className="w-3.5 h-3.5 text-amber-400" />
        };
      default:
        return {
          title: "BAR PERSONELİ (BARİSTA)",
          colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          icon: <User className="w-3.5 h-3.5 text-emerald-400" />
        };
    }
  };

  const roleBadge = getRoleBadge(user.role);

  // İsim Başharfi (Avatar için)
  const initial = user.fullName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 bg-[var(--card)]/90 border border-[var(--border)] rounded-2xl px-3.5 py-1.5 shadow-sm hover:border-orange-500/30 transition-all">
      {/* Profil Resmi / Avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-extrabold text-xs shadow-md shrink-0">
        {initial}
      </div>

      {/* Ad Soyad ve Rol Bilgisi */}
      <div className="flex flex-col text-left">
        <span className="font-bold text-xs text-zinc-800 dark:text-zinc-100 tracking-tight leading-none">
          {user.fullName}
        </span>
        <div className="flex items-center gap-1 mt-1">
          <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border ${roleBadge.colorClass}`}>
            {roleBadge.icon}
            {roleBadge.title}
          </span>
        </div>
      </div>
    </div>
  );
}
