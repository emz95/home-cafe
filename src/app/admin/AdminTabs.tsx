"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AdminDrink, Ingredient, WishlistItem } from "@/lib/types";
import DrinksEditor from "./DrinksEditor";
import IngredientsEditor from "./IngredientsEditor";
import WishlistEditor from "./WishlistEditor";

const TABS = [
  { id: "ingredients", label: "Ingredients" },
  { id: "drinks", label: "Drinks" },
  { id: "wishlist", label: "Wishlist" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default function AdminTabs({
  initialIngredients,
  initialDrinks,
  initialWishlist,
}: {
  initialIngredients: Ingredient[];
  initialDrinks: AdminDrink[];
  initialWishlist: WishlistItem[];
}) {
  const [tab, setTab] = useState<Tab>("ingredients");
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [drinks, setDrinks] = useState(initialDrinks);
  const [wishlist, setWishlist] = useState(initialWishlist);
  // A wishlist item being added for real; the target tab opens straight into its Add form.
  const [pending, setPending] = useState<WishlistItem | null>(null);
  // A wishlist item tapped in another tab; the Wishlist tab opens straight to it.
  const [openWishlistId, setOpenWishlistId] = useState<string | null>(null);

  // ingredient id → names of drinks that use it
  const usage: Record<string, string[]> = {};
  for (const d of drinks) for (const id of d.ingredient_ids) (usage[id] ??= []).push(d.name);

  function openTab(t: Tab) {
    setPending(null);
    setOpenWishlistId(null);
    setTab(t);
  }

  function promote(item: WishlistItem) {
    setOpenWishlistId(null);
    setPending(item);
    setTab(item.kind === "drink" ? "drinks" : "ingredients");
  }

  function openWishlistItem(item: WishlistItem) {
    setPending(null);
    setOpenWishlistId(item.id);
    setTab("wishlist");
  }

  // Once a wishlist item is added as a real ingredient or drink, it leaves the wishlist.
  async function finishWishlistItem(id: string) {
    setPending(null);
    setWishlist((list) => list.filter((x) => x.id !== id));
    const { error } = await createClient().from("wishlist").delete().eq("id", id);
    if (error) console.error("Couldn't remove wishlist item:", error.message);
  }

  return (
    <div className="mt-10 flex flex-col gap-8">
      <div role="tablist" className="flex gap-6 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => openTab(t.id)}
            className={`-mb-px border-b-2 pb-3 text-lg ${
              tab === t.id ? "border-ink font-semibold" : "border-transparent text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "ingredients" && (
          <IngredientsEditor
            ingredients={ingredients}
            setIngredients={setIngredients}
            usage={usage}
            onDeleted={(id) =>
              setDrinks((list) => list.map((d) => ({ ...d, ingredient_ids: d.ingredient_ids.filter((x) => x !== id) })))
            }
            wishlist={wishlist.filter((x) => x.kind === "ingredient")}
            pending={pending?.kind === "ingredient" ? pending : null}
            onWishlistAdded={finishWishlistItem}
            onOpenWishlist={openWishlistItem}
          />
        )}
        {tab === "drinks" && (
          <DrinksEditor
            drinks={drinks}
            setDrinks={setDrinks}
            ingredients={ingredients}
            wishlist={wishlist.filter((x) => x.kind === "drink")}
            pending={pending?.kind === "drink" ? pending : null}
            onWishlistAdded={finishWishlistItem}
            onOpenWishlist={openWishlistItem}
          />
        )}
        {tab === "wishlist" && (
          <WishlistEditor wishlist={wishlist} setWishlist={setWishlist} onPromote={promote} openId={openWishlistId} />
        )}
      </div>
    </div>
  );
}
