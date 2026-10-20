import type { WishlistItem } from "@/lib/types";

// Pieces shared by the admin editors.

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="font-semibold">
        {label}
      </label>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      {children}
    </div>
  );
}

export function Checkbox({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 cursor-pointer accent-[var(--ink)]"
      />
      {label}
    </label>
  );
}

// Wishlist items shown at the bottom of the Ingredients and Drinks tabs.
export function WishlistSection({ items, onOpen }: { items: WishlistItem[]; onOpen: (item: WishlistItem) => void }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-4">
      <h3 className="mb-2 text-sm font-semibold tracking-[0.2em] text-muted uppercase">Wishlist</h3>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.id} className="border-t border-line">
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="w-full py-3 text-left hover:underline hover:underline-offset-4"
            >
              {item.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
