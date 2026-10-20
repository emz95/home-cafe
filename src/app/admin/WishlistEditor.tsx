"use client";

import { type Dispatch, type SetStateAction, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WISHLIST_KINDS, type WishlistItem, type WishlistKind } from "@/lib/types";
import { Field } from "./form";

type Draft = Pick<WishlistItem, "name" | "kind" | "note">;

type View = { kind: "list" } | { kind: "add" } | { kind: "edit"; id: string };

type Props = {
  wishlist: WishlistItem[];
  setWishlist: Dispatch<SetStateAction<WishlistItem[]>>;
  // open the Add form in the Ingredients or Drinks tab with this item's name
  onPromote: (item: WishlistItem) => void;
  // item to open as soon as the tab opens
  openId: string | null;
};

export default function WishlistEditor({ wishlist, setWishlist, onPromote, openId }: Props) {
  const supabase = createClient();
  const [view, setView] = useState<View>(openId ? { kind: "edit", id: openId } : { kind: "list" });
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  function fail(text: string) {
    setMessage({ kind: "error", text });
  }

  async function add(draft: Draft) {
    const { data, error } = await supabase.from("wishlist").insert(draft).select("id, name, kind, note").single();
    if (error) return fail(`Couldn't add ${draft.name}: ${error.message}`);
    setWishlist((list) => [...list, data as WishlistItem]);
    setMessage({ kind: "ok", text: `Added ${draft.name} to your wishlist.` });
    setView({ kind: "list" });
  }

  async function save(id: string, draft: Draft) {
    const { error } = await supabase.from("wishlist").update(draft).eq("id", id);
    if (error) return fail(`Couldn't save ${draft.name}: ${error.message}`);
    setWishlist((list) => list.map((x) => (x.id === id ? { ...x, ...draft } : x)));
    setMessage({ kind: "ok", text: `Saved ${draft.name}.` });
    setView({ kind: "list" });
  }

  async function remove(item: WishlistItem, text: string) {
    const { error } = await supabase.from("wishlist").delete().eq("id", item.id);
    if (error) return fail(`Couldn't remove ${item.name}: ${error.message}`);
    setWishlist((list) => list.filter((x) => x.id !== item.id));
    setMessage({ kind: "ok", text });
    setView({ kind: "list" });
  }

  const status = message && (
    <p role="status" className={message.kind === "error" ? "font-semibold" : "text-muted"}>
      {message.text}
    </p>
  );

  if (view.kind === "add") {
    return (
      <div className="flex flex-col gap-6">
        {status}
        <WishlistForm title="Add to wishlist" submitLabel="Add" onSubmit={add} onCancel={() => setView({ kind: "list" })} />
      </div>
    );
  }

  const editing = view.kind === "edit" ? wishlist.find((x) => x.id === view.id) : undefined;
  if (editing) {
    return (
      <div className="flex flex-col gap-6">
        {status}
        <WishlistForm
          key={editing.id}
          title={`Edit ${editing.name}`}
          initial={editing}
          submitLabel="Save"
          onSubmit={(draft) => save(editing.id, draft)}
          onCancel={() => setView({ kind: "list" })}
          onDelete={() => remove(editing, `Removed ${editing.name}.`)}
          onDone={
            editing.kind === "material"
              ? { label: "Bought", run: () => remove(editing, `Bought ${editing.name}. Removed from your wishlist.`) }
              : { label: editing.kind === "ingredient" ? "Add to ingredients" : "Add to drinks", run: async () => onPromote(editing) }
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted">
          {wishlist.length} {wishlist.length === 1 ? "item" : "items"}
        </p>
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setView({ kind: "add" });
          }}
          className="rounded-md bg-ink px-4 py-2 text-bg"
        >
          Add to wishlist
        </button>
      </div>

      {status}

      {wishlist.length === 0 ? (
        <p className="text-muted">Nothing on your wishlist yet. Tap Add to wishlist to start one.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {WISHLIST_KINDS.map(({ kind, label }) => {
            const items = wishlist.filter((x) => x.kind === kind).sort((a, b) => a.name.localeCompare(b.name));
            if (items.length === 0) return null;
            return (
              <section key={kind}>
                <h3 className="mb-2 text-sm font-semibold tracking-[0.2em] text-muted uppercase">{label}</h3>
                <ul className="flex flex-col">
                  {items.map((item) => (
                    <li key={item.id} className="border-t border-line">
                      <button
                        type="button"
                        onClick={() => {
                          setMessage(null);
                          setView({ kind: "edit", id: item.id });
                        }}
                        className="w-full py-3 text-left hover:underline hover:underline-offset-4"
                      >
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

// One wishlist item at a time: used for both Add and Edit. Back and Cancel leave without saving.
function WishlistForm({
  title,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
  onDone,
}: {
  title: string;
  initial?: WishlistItem;
  submitLabel: string;
  onSubmit: (draft: Draft) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  // "Add to ingredients", "Add to drinks" or "Bought"
  onDone?: { label: string; run: () => Promise<void> };
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<WishlistKind>(initial?.kind ?? "ingredient");
  const [note, setNote] = useState(initial?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    await action();
    setBusy(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    run(() => onSubmit({ name: name.trim(), kind, note: note.trim() || null }));
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-5">
      <button type="button" onClick={onCancel} className="self-start text-muted hover:text-ink">
        ← Back
      </button>
      <h3 className="text-2xl font-medium">{title}</h3>

      <Field label="Name" htmlFor="wishlist-name">
        <input
          id="wishlist-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ube extract"
          required
          autoFocus={!initial}
          className="rounded-md border border-line bg-surface px-3 py-2"
        />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-semibold">Kind</legend>
        <div className="flex flex-wrap gap-2">
          {WISHLIST_KINDS.map((k) => (
            <label
              key={k.kind}
              htmlFor={`wishlist-kind-${k.kind}`}
              className={`cursor-pointer rounded-md border px-4 py-1.5 ${
                kind === k.kind ? "border-ink bg-ink text-bg" : "border-line bg-surface text-muted"
              }`}
            >
              <input
                id={`wishlist-kind-${k.kind}`}
                type="radio"
                name="wishlist-kind"
                value={k.kind}
                checked={kind === k.kind}
                onChange={() => setKind(k.kind)}
                className="sr-only"
              />
              {k.one}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Note" hint="Optional. Where to get it, a link, a price." htmlFor="wishlist-note">
        <input
          id="wishlist-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-md border border-line bg-surface px-3 py-2"
        />
      </Field>

      {onDone && (
        <button
          type="button"
          onClick={() => run(onDone.run)}
          disabled={busy}
          className="self-start rounded-md border border-ink px-5 py-2 disabled:opacity-60"
        >
          {onDone.label}
        </button>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <button type="submit" disabled={busy} className="rounded-md bg-ink px-5 py-2 text-bg disabled:opacity-60">
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-line px-5 py-2">
          Cancel
        </button>

        {onDelete && (
          <span className="ml-auto flex flex-wrap items-center gap-3">
            {confirmingDelete ? (
              <>
                <span>Remove from wishlist?</span>
                <button
                  type="button"
                  onClick={() => run(onDelete)}
                  disabled={busy}
                  className="font-semibold underline underline-offset-4"
                >
                  Yes, remove
                </button>
                <button type="button" onClick={() => setConfirmingDelete(false)} className="text-muted underline underline-offset-4">
                  Keep
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmingDelete(true)} className="text-muted underline underline-offset-4">
                Delete
              </button>
            )}
          </span>
        )}
      </div>
    </form>
  );
}
