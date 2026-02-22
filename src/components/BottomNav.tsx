"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { CalendarDays, BookOpen, ShoppingCart } from "lucide-react";

const tabs = [
  { href: "/", label: "Calendario", icon: CalendarDays },
  { href: "/recipes", label: "Recetario", icon: BookOpen },
  { href: "/shopping-list", label: "Compras", icon: ShoppingCart },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#111113]/95 backdrop-blur-xl border-t border-[#1E1E22] lg:hidden safe-bottom-nav">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors min-h-0 ${
                active
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted-dark)] active:text-[var(--muted)]"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[11px] font-semibold tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
