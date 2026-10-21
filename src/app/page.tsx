import { createClient } from "@/lib/supabase/server";
import type { Drink, Ingredient } from "@/lib/types";
import MenuView from "./MenuView";
import SiteHeader from "./SiteHeader";

// Always read fresh stock levels.
export const dynamic = "force-dynamic";

const INGREDIENT_COLUMNS = "id, name, display_name, type, in_stock, homemade, addon, note";

type Row = Omit<Drink, "ingredients"> & {
  drink_ingredients: { ingredients: Ingredient | null }[];
};

async function loadMenu(): Promise<{ drinks: Drink[]; addons: Ingredient[] } | null> {
  const supabase = await createClient();
  const [drinksRes, addonsRes] = await Promise.all([
    supabase
      .from("drinks")
      .select(`id, name, category, description, hidden, sort_order, drink_ingredients(ingredients(${INGREDIENT_COLUMNS}))`)
      .eq("hidden", false)
      .order("sort_order")
      .order("name"),
    supabase.from("ingredients").select(INGREDIENT_COLUMNS).eq("addon", true).order("name"),
  ]);

  const error = drinksRes.error ?? addonsRes.error;
  if (error) {
    console.error("Failed to load menu:", error.message);
    return null;
  }

  const drinks = (drinksRes.data as unknown as Row[]).map(({ drink_ingredients, ...d }) => ({
    ...d,
    ingredients: drink_ingredients.flatMap((di) => (di.ingredients ? [di.ingredients] : [])),
  }));
  return { drinks, addons: addonsRes.data as Ingredient[] };
}

export default async function MenuPage() {
  const menu = await loadMenu();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pt-16 pb-24 sm:px-6 sm:pt-24">
      <SiteHeader active="/" />

      {menu === null ? (
        <p className="rounded-lg border border-line bg-surface p-6 text-muted">
          The menu couldn&apos;t load right now. Try refreshing in a minute.
        </p>
      ) : (
        <MenuView drinks={menu.drinks} addons={menu.addons} />
      )}
    </main>
  );
}
