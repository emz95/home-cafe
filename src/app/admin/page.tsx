import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import type { AdminDrink, Ingredient, WishlistItem } from "@/lib/types";
import AdminTabs from "./AdminTabs";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  const data = isAdmin ? await loadAdminData(supabase) : null;

  return (
    <main className="mx-auto w-full max-w-4xl px-8 pt-16 pb-24 sm:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-[0.2em] text-muted uppercase">Admin</p>
          <h1 className="mt-3 text-4xl leading-tight">{SITE.name}</h1>
        </div>
        <div className="flex items-center gap-4 text-muted">
          <Link href="/" className="underline underline-offset-4">
            View menu
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="underline underline-offset-4">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {data ? (
        <AdminTabs initialIngredients={data.ingredients} initialDrinks={data.drinks} initialWishlist={data.wishlist} />
      ) : isAdmin ? (
        <p className="mt-12">Couldn&apos;t load your menu. Refresh to try again.</p>
      ) : (
        <p className="mt-12">
          {user.email} isn&apos;t allowed to edit this menu. Sign out and use the admin email instead.
        </p>
      )}
    </main>
  );
}

async function loadAdminData(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [ingredientsRes, drinksRes, wishlistRes] = await Promise.all([
    supabase.from("ingredients").select("id, name, display_name, type, in_stock, homemade, addon, note"),
    supabase
      .from("drinks")
      .select("id, name, category, description, hidden, sort_order, drink_ingredients(ingredient_id)")
      .order("sort_order")
      .order("name"),
    supabase.from("wishlist").select("id, name, kind, note").order("created_at"),
  ]);
  const error = ingredientsRes.error ?? drinksRes.error ?? wishlistRes.error;
  if (error) {
    console.error("Failed to load admin data:", error.message);
    return null;
  }

  type Row = Omit<AdminDrink, "ingredient_ids"> & { drink_ingredients: { ingredient_id: string }[] };
  const drinks: AdminDrink[] = (drinksRes.data as Row[]).map(({ drink_ingredients, ...d }) => ({
    ...d,
    ingredient_ids: drink_ingredients.map((di) => di.ingredient_id),
  }));

  return { ingredients: ingredientsRes.data as Ingredient[], drinks, wishlist: wishlistRes.data as WishlistItem[] };
}
