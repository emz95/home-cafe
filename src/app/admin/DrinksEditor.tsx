"use client";

import { type Dispatch, type SetStateAction, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  type AdminDrink,
  type Ingredient,
  sortIngredients,
  TYPE_LABELS,
  TYPE_ORDER,
  type WishlistItem,
} from "@/lib/types";
import { Checkbox, Field, WishlistSection } from "./form";

type Draft = Pick<AdminDrink, "name" | "category" | "description" | "hidden" | "ingredient_ids">;

type View = { kind: "list" } | { kind: "add"; from?: WishlistItem } | { kind: "edit"; id: string };

type Props = {
  drinks: AdminDrink[];
  setDrinks: Dispatch<SetStateAction<AdminDrink[]>>;
  ingredients: Ingredient[];
  wishlist: WishlistItem[];
  // wishlist item to start adding as soon as the tab opens
  pending: WishlistItem | null;
  onWishlistAdded: (id: string) => void;
  onOpenWishlist: (item: WishlistItem) => void;
};

export default function DrinksEditor({
  drinks,
  setDrinks,
  ingredients,
  wishlist,
  pending,
  onWishlistAdded,
  onOpenWishlist,
}: Props) {
  const supabase = createClient();
  const [view, setView] = useState<View>(pending ? { kind: "add", from: pending } : { kind: "list" });
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const categories = [...new Set(drinks.map((d) => d.category))];

  function fail(text: string) {
    setMessage({ kind: "error", text });
  }

  async function add(draft: Draft) {
    const { ingredient_ids, ...fields } = draft;
    const sort_order = Math.max(0, ...drinks.map((d) => d.sort_order)) + 1;
    const { data, error } = await supabase
      .from("drinks")
      .insert({ ...fields, sort_order })
      .select("id, name, category, description, hidden, sort_order")
      .single();
    if (error) return fail(`Couldn't add ${draft.name}: ${error.message}`);

    if (ingredient_ids.length > 0) {
      const { error: linkError } = await supabase
        .from("drink_ingredients")
        .insert(ingredient_ids.map((ingredient_id) => ({ drink_id: data.id, ingredient_id })));
      if (linkError) fail(`Added ${draft.name}, but couldn't save its ingredients: ${linkError.message}`);
    }

    setDrinks((list) => [...list, { ...(data as Omit<AdminDrink, "ingredient_ids">), ingredient_ids }]);
    if (view.kind === "add" && view.from) onWishlistAdded(view.from.id);
    setMessage({ kind: "ok", text: `Added ${draft.name}.` });
    setView({ kind: "list" });
  }

  async function save(drink: AdminDrink, draft: Draft) {
    const { ingredient_ids, ...fields } = draft;
    const { error } = await supabase.from("drinks").update(fields).eq("id", drink.id);
    if (error) return fail(`Couldn't save ${draft.name}: ${error.message}`);

    // Only touch the ingredient links that changed.
    const removed = drink.ingredient_ids.filter((id) => !ingredient_ids.includes(id));
    const added = ingredient_ids.filter((id) => !drink.ingredient_ids.includes(id));
    if (removed.length > 0) {
      const { error } = await supabase
        .from("drink_ingredients")
        .delete()
        .eq("drink_id", drink.id)
        .in("ingredient_id", removed);
      if (error) return fail(`Couldn't update ${draft.name}'s ingredients: ${error.message}`);
    }
    if (added.length > 0) {
      const { error } = await supabase
        .from("drink_ingredients")
        .insert(added.map((ingredient_id) => ({ drink_id: drink.id, ingredient_id })));
      if (error) return fail(`Couldn't update ${draft.name}'s ingredients: ${error.message}`);
    }

    setDrinks((list) => list.map((d) => (d.id === drink.id ? { ...d, ...draft } : d)));
    setMessage({ kind: "ok", text: `Saved ${draft.name}.` });
    setView({ kind: "list" });
  }

  async function remove(drink: AdminDrink) {
    const { error } = await supabase.from("drinks").delete().eq("id", drink.id);
    if (error) return fail(`Couldn't delete ${drink.name}: ${error.message}`);
    setDrinks((list) => list.filter((d) => d.id !== drink.id));
    setMessage({ kind: "ok", text: `Deleted ${drink.name}.` });
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
        <DrinkForm
          title="Add drink"
          defaultName={view.from?.name}
          submitLabel="Add"
          ingredients={ingredients}
          categories={categories}
          onSubmit={add}
          onCancel={() => setView({ kind: "list" })}
        />
      </div>
    );
  }

  const editing = view.kind === "edit" ? drinks.find((d) => d.id === view.id) : undefined;
  if (editing) {
    return (
      <div className="flex flex-col gap-6">
        {status}
        <DrinkForm
          key={editing.id}
          title={`Edit ${editing.name}`}
          initial={editing}
          submitLabel="Save"
          ingredients={ingredients}
          categories={categories}
          onSubmit={(draft) => save(editing, draft)}
          onCancel={() => setView({ kind: "list" })}
          onDelete={() => remove(editing)}
        />
      </div>
    );
  }

  // Categories in the order of their first drink, like the menu.
  const groups = new Map<string, AdminDrink[]>();
  for (const d of [...drinks].sort((a, b) => a.sort_order - b.sort_order)) {
    if (!groups.has(d.category)) groups.set(d.category, []);
    groups.get(d.category)!.push(d);
  }
  const outOfStock = new Set(ingredients.filter((i) => !i.in_stock).map((i) => i.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted">
          {drinks.length} {drinks.length === 1 ? "drink" : "drinks"}
        </p>
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setView({ kind: "add" });
          }}
          className="rounded-md bg-ink px-4 py-2 text-bg"
        >
          Add drink
        </button>
      </div>

      {status}

      {drinks.length === 0 ? (
        <p className="text-muted">No drinks yet. Tap Add drink to add your first one.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {[...groups.entries()].map(([category, list]) => (
            <section key={category}>
              <h3 className="mb-2 text-sm font-semibold tracking-[0.2em] text-muted uppercase">{category}</h3>
              <ul className="flex flex-col">
                {list.map((d) => {
                  const unavailable = d.ingredient_ids.some((id) => outOfStock.has(id));
                  return (
                    <li key={d.id} className="border-t border-line">
                      <button
                        type="button"
                        onClick={() => {
                          setMessage(null);
                          setView({ kind: "edit", id: d.id });
                        }}
                        className="flex w-full flex-wrap items-baseline justify-between gap-x-4 py-3 text-left hover:underline hover:underline-offset-4"
                      >
                        <span className={d.hidden || unavailable ? "text-muted" : ""}>{d.name}</span>
                        <span className="text-sm text-muted">
                          {d.hidden ? "Hidden" : unavailable ? "Unavailable" : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <WishlistSection items={wishlist} onOpen={onOpenWishlist} />
    </div>
  );
}

// One drink at a time: used for both Add and Edit. Back and Cancel leave without saving.
function DrinkForm({
  title,
  initial,
  defaultName,
  submitLabel,
  ingredients,
  categories,
  onSubmit,
  onCancel,
  onDelete,
}: {
  title: string;
  initial?: AdminDrink;
  defaultName?: string;
  submitLabel: string;
  ingredients: Ingredient[];
  categories: string[];
  onSubmit: (draft: Draft) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? defaultName ?? "");
  const [category, setCategory] = useState(initial?.category ?? categories[0] ?? "Coffee");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [hidden, setHidden] = useState(initial?.hidden ?? false);
  const [selected, setSelected] = useState<string[]>(initial?.ingredient_ids ?? []);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !category.trim()) return;
    setBusy(true);
    await onSubmit({
      name: name.trim(),
      category: category.trim(),
      description: description.trim() || null,
      hidden,
      ingredient_ids: selected,
    });
    setBusy(false);
  }

  async function handleDelete() {
    setBusy(true);
    await onDelete?.();
    setBusy(false);
  }

  const byType = TYPE_ORDER.map((type) => ({
    type,
    items: sortIngredients(ingredients.filter((i) => i.type === type)),
  })).filter((g) => g.items.length > 0);

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-5">
      <button type="button" onClick={onCancel} className="self-start text-muted hover:text-ink">
        ← Back
      </button>
      <h3 className="text-2xl font-medium">{title}</h3>

      <Field label="Name" htmlFor="drink-name">
        <input
          id="drink-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Brown Sugar Oat Latte"
          required
          autoFocus={!initial}
          className="rounded-md border border-line bg-surface px-3 py-2"
        />
      </Field>

      <Field label="Category" hint="Pick one or type a new one." htmlFor="drink-category">
        <input
          id="drink-category"
          list="drink-categories"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="rounded-md border border-line bg-surface px-3 py-2"
        />
        <datalist id="drink-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>

      <Field label="Description" hint="Optional. One line under the name on the menu." htmlFor="drink-description">
        <textarea
          id="drink-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="rounded-md border border-line bg-surface px-3 py-2"
        />
      </Field>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-semibold">Ingredients</legend>
        {byType.length === 0 ? (
          <p className="text-muted">No ingredients yet. Add some in the Ingredients tab first.</p>
        ) : (
          byType.map((g) => (
            <div key={g.type} className="flex flex-col gap-1.5">
              <p className="text-sm text-muted">{TYPE_LABELS[g.type]}</p>
              {g.items.map((i) => (
                <Checkbox
                  key={i.id}
                  id={`drink-ing-${i.id}`}
                  label={i.in_stock ? i.name : `${i.name} (out of stock)`}
                  checked={selected.includes(i.id)}
                  onChange={() => toggle(i.id)}
                />
              ))}
            </div>
          ))
        )}
      </fieldset>

      <Checkbox id="drink-hidden" label="Hide from menu" checked={hidden} onChange={() => setHidden(!hidden)} />

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
                <span>Delete for good?</span>
                <button type="button" onClick={handleDelete} disabled={busy} className="font-semibold underline underline-offset-4">
                  Yes, delete
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
