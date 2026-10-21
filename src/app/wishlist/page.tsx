import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import { WISHLIST_KINDS, type WishlistItem } from "@/lib/types";
import SiteHeader from "../SiteHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Wishlist · ${SITE.name}`,
};

type Item = Pick<WishlistItem, "id" | "name" | "kind">;

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("wishlist").select("id, name, kind").order("name");
  if (error) console.error("Failed to load wishlist:", error.message);

  const items = (data ?? []) as Item[];
  const groups = WISHLIST_KINDS.map(({ kind, label }) => ({
    label,
    items: items.filter((w) => w.kind === kind),
  })).filter((g) => g.items.length > 0);

  return (
    <main className="mx-auto w-full max-w-4xl px-8 pt-16 pb-24 sm:px-10 sm:pt-24">
      <SiteHeader active="/wishlist" />

      {error ? (
        <p className="rounded-lg border border-line bg-surface p-6 text-muted">
          The wishlist couldn&apos;t load right now. Try refreshing in a minute.
        </p>
      ) : groups.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-6 text-muted">Nothing on the wishlist right now.</p>
      ) : (
        <div className="flex flex-col gap-14">
          {groups.map((g) => (
            <section key={g.label}>
              <h2 className="mb-6 text-sm font-semibold tracking-[0.2em] text-muted uppercase">{g.label}</h2>
              <ul className="grid gap-x-12 sm:grid-cols-2">
                {g.items.map((w) => (
                  <li key={w.id} className="border-t border-line py-4 text-2xl leading-tight font-medium">
                    {w.name}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
