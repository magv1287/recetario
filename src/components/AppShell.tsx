"use client";

import { usePathname } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";

const NO_NAV_ROUTES = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuthContext();

  const showNav = user && !loading && !NO_NAV_ROUTES.includes(pathname);

  return (
    <>
      {showNav && <TopNav />}
      {children}
      {showNav && <BottomNav />}
    </>
  );
}
