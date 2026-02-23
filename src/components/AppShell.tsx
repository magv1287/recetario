"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { AccessManager } from "@/components/AccessManager";
import { Users, LogOut, ChefHat } from "lucide-react";

const NO_NAV_ROUTES = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuthContext();
  const [showAccess, setShowAccess] = useState(false);

  const showNav = user && !loading && !NO_NAV_ROUTES.includes(pathname);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <>
      {showNav && <TopNav />}
      {showNav && (
        <header className="lg:hidden flex items-center justify-between px-5 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <ChefHat className="text-[var(--accent)]" size={20} />
            <span className="text-base font-bold text-[var(--foreground)]">Recetario</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAccess(true)}
              className="text-[var(--muted-dark)] hover:text-[var(--muted)] p-2 rounded-lg transition-colors"
              title="Gestionar acceso"
            >
              <Users size={18} />
            </button>
            <button
              onClick={handleSignOut}
              className="text-[var(--muted-dark)] hover:text-[var(--muted)] p-2 rounded-lg transition-colors"
              title="Cerrar sesion"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
      )}
      {children}
      {showNav && <BottomNav />}
      {showAccess && user?.email && (
        <AccessManager userEmail={user.email} onClose={() => setShowAccess(false)} />
      )}
    </>
  );
}
