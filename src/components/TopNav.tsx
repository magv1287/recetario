"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthContext } from "@/components/AuthProvider";
import { AccessManager } from "@/components/AccessManager";
import { CalendarDays, BookOpen, ShoppingCart, LogOut, ChefHat, Users } from "lucide-react";

const tabs = [
  { href: "/", label: "Calendario", icon: CalendarDays },
  { href: "/recipes", label: "Recetario", icon: BookOpen },
  { href: "/shopping-list", label: "Compras", icon: ShoppingCart },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuthContext();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const [showAccess, setShowAccess] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <>
    <header className="sticky top-0 z-50 bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--border)] safe-top hidden lg:block">
      <div className="max-w-7xl mx-auto px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2.5">
            <ChefHat className="text-[var(--accent)]" size={24} />
            <span className="text-lg font-bold text-[var(--foreground)]">Recetario</span>
          </Link>

          <nav className="flex items-center gap-1">
            {tabs.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)]"
                  }`}
                >
                  <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt=""
              className="w-8 h-8 rounded-full border border-[var(--border)]"
            />
          )}
          <span className="text-sm text-[var(--muted)] hidden xl:inline">
            {user?.displayName || user?.email}
          </span>
          <button
            onClick={() => setShowAccess(true)}
            className="text-[var(--muted-dark)] hover:text-[var(--muted)] p-2 rounded-lg hover:bg-[var(--card)] transition-colors"
            title="Gestionar acceso"
          >
            <Users size={18} />
          </button>
          <button
            onClick={handleSignOut}
            className="text-[var(--muted-dark)] hover:text-[var(--muted)] p-2 rounded-lg hover:bg-[var(--card)] transition-colors"
            title="Cerrar sesion"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
    {showAccess && user?.email && (
      <AccessManager userEmail={user.email} onClose={() => setShowAccess(false)} />
    )}
    </>
  );
}
