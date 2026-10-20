import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");

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

      {isAdmin ? (
        <p className="mt-12 text-muted">Signed in as {user.email}. Editing tools coming next.</p>
      ) : (
        <p className="mt-12">
          {user.email} isn&apos;t allowed to edit this menu. Sign out and use the admin email instead.
        </p>
      )}
    </main>
  );
}
