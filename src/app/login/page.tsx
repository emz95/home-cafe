"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [status, setStatus] = useState<"idle" | "redirecting" | "error">("idle");
  const [error, setError] = useState("");

  async function signIn() {
    setStatus("redirecting");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/admin` },
    });
    // On success the browser leaves for Google, so only errors land here.
    if (error) {
      setError(error.message);
      setStatus("error");
    }
  }

  return (
    <main className="mx-auto w-full max-w-sm px-8 pt-24 pb-24">
      <p className="text-sm font-semibold tracking-[0.2em] text-muted uppercase">Admin</p>
      <h1 className="mt-3 text-4xl leading-tight">Sign in</h1>

      <button
        type="button"
        onClick={signIn}
        disabled={status === "redirecting"}
        className="mt-8 w-full rounded-md bg-ink px-4 py-2 text-lg text-bg disabled:opacity-60"
      >
        {status === "redirecting" ? "Opening Google…" : "Sign in with Google"}
      </button>
      {status === "error" && <p className="mt-4 text-muted">Couldn&apos;t start Google sign-in: {error}</p>}
    </main>
  );
}
