"use client";

import { ShoppingList, ShoppingItem } from "@/lib/types";
import { Check, ShoppingCart } from "lucide-react";

interface ShoppingListViewProps {
  shoppingList: ShoppingList;
  onToggleItem: (index: number) => void;
}

const categoryOrder = ["Proteinas", "Verduras", "Frutas", "Lacteos", "Condimentos", "Otros"];

const categoryIcons: Record<string, string> = {
  Proteinas: "🥩",
  Verduras: "🥦",
  Frutas: "🍓",
  Lacteos: "🧀",
  Condimentos: "🧂",
  Otros: "📦",
};

export function ShoppingListView({ shoppingList, onToggleItem }: ShoppingListViewProps) {
  const grouped = shoppingList.items.reduce<Record<string, { item: ShoppingItem; index: number }[]>>(
    (acc, item, index) => {
      const cat = item.category || "Otros";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push({ item, index });
      return acc;
    },
    {}
  );

  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) -
              (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b))
  );

  const total = shoppingList.items.length;
  const checked = shoppingList.items.filter((i) => i.checked).length;

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-3 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
        <ShoppingCart size={18} className="text-[var(--accent)]" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-[var(--foreground)]">
              {checked} de {total} items
            </span>
            <span className="text-xs text-[var(--muted-dark)]">
              {total > 0 ? Math.round((checked / total) * 100) : 0}%
            </span>
          </div>
          <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--sage)] rounded-full transition-all duration-300"
              style={{ width: `${total > 0 ? (checked / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Items grouped by category */}
      {sortedCategories.map((category) => (
        <div key={category}>
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <span className="text-sm">{categoryIcons[category] || "📦"}</span>
            <h3 className="text-xs font-bold text-[var(--muted-dark)] uppercase tracking-wider">{category}</h3>
            <span className="text-[10px] text-[var(--muted-dark)]">({grouped[category].length})</span>
          </div>
          <div className="space-y-1">
            {grouped[category].map(({ item, index }) => (
              <button
                key={index}
                onClick={() => onToggleItem(index)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  item.checked
                    ? "bg-[var(--sage-soft)] opacity-60"
                    : "bg-[var(--card)] border border-[var(--border)] hover:border-[var(--border-light)]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    item.checked
                      ? "bg-[var(--sage)] border-[var(--sage)]"
                      : "border-[var(--border-light)]"
                  }`}
                >
                  {item.checked && <Check size={12} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.checked ? "line-through text-[var(--muted-dark)]" : "text-[var(--foreground)]"}`}>
                    {item.name}
                  </p>
                </div>
                <span className={`text-xs shrink-0 ${item.checked ? "text-[var(--muted-dark)]" : "text-[var(--muted)]"}`}>
                  {item.quantity}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
