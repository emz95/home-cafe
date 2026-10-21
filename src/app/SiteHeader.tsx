import Link from "next/link";
import { SITE } from "@/lib/site";

const TABS = [
  { href: "/", label: "Menu" },
  { href: "/wishlist", label: "Wishlist" },
] as const;

export default function SiteHeader({ active }: { active: (typeof TABS)[number]["href"] }) {
  return (
    <header className="mb-12 text-center sm:mb-16">
      <h1 className="text-5xl leading-tight font-normal sm:text-6xl">{SITE.name}</h1>
      <nav aria-label="Pages" className="mt-6 flex justify-center gap-6">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active === t.href ? "page" : undefined}
            className={`border-b-2 pb-1 text-lg ${
              active === t.href ? "border-ink font-semibold" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
