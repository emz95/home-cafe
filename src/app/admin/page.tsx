import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import type { Ingredient } from "@/lib/types";
import IngredientsEditor from "./IngredientsEditor";

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
    <main className="mx-auto w-full max-w-4xl px-4 pt-16 pb-24 sm:px-6">
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
        <section className="mt-12">
          <h2 className="mb-6 text-sm font-semibold tracking-[0.2em] text-muted uppercase">Ingredients</h2>
          <IngredientsEditor initialIngredients={data.ingredients} usage={data.usage} />
        </section>
      ) : isAdmin ? (
        <p className="mt-12">Couldn&apos;t load your ingredients. Refresh to try again.</p>
      ) : (
        <p className="mt-12">
          {user.email} isn&apos;t allowed to edit this menu. Sign out and use the admin email instead.
        </p>
      )}
    </main>
  );
}

async function loadAdminData(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [ingredientsRes, drinksRes] = await Promise.all([
    supabase.from("ingredients").select("id, name, display_name, type, in_stock, homemade, addon, note"),
    supabase.from("drinks").select("name, drink_ingredients(ingredient_id)").order("sort_order"),
  ]);
  if (ingredientsRes.error || drinksRes.error) {
    console.error("Failed to load admin data:", (ingredientsRes.error ?? drinksRes.error)!.message);
    return null;
  }

  // ingredient id → names of drinks that use it
  const usage: Record<string, string[]> = {};
  for (const d of drinksRes.data as { name: string; drink_ingredients: { ingredient_id: string }[] }[]) {
    for (const { ingredient_id } of d.drink_ingredients) (usage[ingredient_id] ??= []).push(d.name);
  }

  return { ingredients: ingredientsRes.data as Ingredient[], usage };
}
