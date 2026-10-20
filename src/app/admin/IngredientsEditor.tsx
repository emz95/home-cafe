"use client";

import { type Dispatch, type SetStateAction, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Ingredient, type IngredientType, sortIngredients, TYPE_LABELS, TYPE_ORDER } from "@/lib/types";

const COLUMNS = "id, name, display_name, type, in_stock, homemade, addon, note";

type Draft = Pick<Ingredient, "name" | "display_name" | "type" | "homemade" | "addon">;

type View = { kind: "list" } | { kind: "add" } | { kind: "edit"; id: string };

type Props = {
  ingredients: Ingredient[];
  setIngredients: Dispatch<SetStateAction<Ingredient[]>>;
  // ingredient id → names of drinks that use it
  usage: Record<string, string[]>;
  // drop a deleted ingredient from drinks held by the other tab
  onDeleted: (id: string) => void;
};

export default function IngredientsEditor({ ingredients, setIngredients, usage, onDeleted }: Props) {
  const supabase = createClient();
  const [view, setView] = useState<View>({ kind: "list" });
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  function fail(text: string) {
    setMessage({ kind: "error", text });
  }

  // Stock checkbox: change the row now, roll back if the save fails.
  async function toggleStock(i: Ingredient) {
    const before = ingredients;
    setIngredients((list) => list.map((x) => (x.id === i.id ? { ...x, in_stock: !i.in_stock } : x)));
    const { error } = await supabase.from("ingredients").update({ in_stock: !i.in_stock }).eq("id", i.id);
    if (error) {
      setIngredients(before);
      fail(`Couldn't update ${i.name}: ${error.message}`);
    } else {
      setMessage(null);
    }
  }

  async function add(draft: Draft) {
    const { data, error } = await supabase
      .from("ingredients")
      .insert({ ...draft, in_stock: true })
      .select(COLUMNS)
      .single();
    if (error) return fail(`Couldn't add ${draft.name}: ${error.message}`);
    setIngredients((list) => [...list, data as Ingredient]);
    setMessage({ kind: "ok", text: `Added ${draft.name}.` });
    setView({ kind: "list" });
  }

  async function save(id: string, draft: Draft) {
    const { error } = await supabase.from("ingredients").update(draft).eq("id", id);
    if (error) return fail(`Couldn't save ${draft.name}: ${error.message}`);
    setIngredients((list) => list.map((x) => (x.id === id ? { ...x, ...draft } : x)));
    setMessage({ kind: "ok", text: `Saved ${draft.name}.` });
    setView({ kind: "list" });
  }

  async function remove(i: Ingredient) {
    const { error } = await supabase.from("ingredients").delete().eq("id", i.id);
    if (error) return fail(`Couldn't delete ${i.name}: ${error.message}`);
    setIngredients((list) => list.filter((x) => x.id !== i.id));
    onDeleted(i.id);
    setMessage({ kind: "ok", text: `Deleted ${i.name}.` });
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
        <IngredientForm title="Add ingredient" submitLabel="Add" onSubmit={add} onCancel={() => setView({ kind: "list" })} />
      </div>
    );
  }

  const editing = view.kind === "edit" ? ingredients.find((i) => i.id === view.id) : undefined;
  if (editing) {
    return (
      <div className="flex flex-col gap-6">
        {status}
        <IngredientForm
          key={editing.id}
          title={`Edit ${editing.name}`}
          initial={editing}
          submitLabel="Save"
          usedIn={usage[editing.id] ?? []}
          onSubmit={(draft) => save(editing.id, draft)}
          onCancel={() => setView({ kind: "list" })}
          onDelete={() => remove(editing)}
        />
      </div>
    );
  }

  const q = search.trim().toLowerCase();
  const shown = sortIngredients(ingredients).filter(
    (i) => !q || i.name.toLowerCase().includes(q) || i.display_name?.toLowerCase().includes(q),
  );
  const outCount = ingredients.filter((i) => !i.in_stock).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted">{outCount === 0 ? "Everything is in stock." : `${outCount} out of stock`}</p>
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setView({ kind: "add" });
          }}
          className="rounded-md bg-ink px-4 py-2 text-bg"
        >
          Add ingredient
        </button>
      </div>

      {status}

      <div className="flex flex-col gap-3">
        <input
          id="ingredient-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ingredients"
          className="w-full rounded-md border border-line bg-surface px-3 py-2 sm:max-w-xs"
        />

        {shown.length === 0 ? (
          <p className="text-muted">
            {ingredients.length === 0 ? "No ingredients yet. Tap Add ingredient to add your first one." : "No matches."}
          </p>
        ) : (
          <ul className="flex flex-col">
            <li className="flex justify-between pb-2 text-sm text-muted" aria-hidden>
              <span>Ingredient</span>
              <span>In stock</span>
            </li>
            {shown.map((i) => (
              <li key={i.id} className="flex items-center gap-4 border-t border-line py-3">
                <button
                  type="button"
                  onClick={() => {
                    setMessage(null);
                    setView({ kind: "edit", id: i.id });
                  }}
                  className={`min-w-0 flex-1 text-left hover:underline hover:underline-offset-4 ${i.in_stock ? "" : "text-muted"}`}
                >
                  {i.name}
                </button>
                <input
                  id={`stock-${i.id}`}
                  type="checkbox"
                  aria-label={`${i.name} in stock`}
                  checked={i.in_stock}
                  onChange={() => toggleStock(i)}
                  className="size-5 shrink-0 cursor-pointer accent-[var(--ink)]"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// One ingredient at a time: used for both Add and Edit. Back leaves without saving.
function IngredientForm({
  title,
  initial,
  submitLabel,
  usedIn = [],
  onSubmit,
  onCancel,
  onDelete,
}: {
  title: string;
  initial?: Ingredient;
  submitLabel: string;
  usedIn?: string[];
  onSubmit: (draft: Draft) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [displayName, setDisplayName] = useState(initial?.display_name ?? "");
  const [type, setType] = useState<IngredientType>(initial?.type ?? "syrup");
  const [homemade, setHomemade] = useState(initial?.homemade ?? false);
  const [addon, setAddon] = useState(initial?.addon ?? false);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    await onSubmit({ name: name.trim(), display_name: displayName.trim() || null, type, homemade, addon });
    setBusy(false);
  }

  async function handleDelete() {
    setBusy(true);
    await onDelete?.();
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-5">
      <button type="button" onClick={onCancel} className="self-start text-muted hover:text-ink">
        ← Back
      </button>
      <h3 className="text-2xl font-medium">{title}</h3>

      <Field label="Name" htmlFor="ingredient-name">
        <input
          id="ingredient-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Lavender syrup"
          required
          autoFocus={!initial}
          className="rounded-md border border-line bg-surface px-3 py-2"
        />
      </Field>

      <Field label="Menu name" hint="What the menu shows. Leave empty to use the name." htmlFor="ingredient-display-name">
        <input
          id="ingredient-display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Same as name"
          className="rounded-md border border-line bg-surface px-3 py-2"
        />
      </Field>

      <Field label="Type" htmlFor="ingredient-type">
        <select
          id="ingredient-type"
          value={type}
          onChange={(e) => setType(e.target.value as IngredientType)}
          className="rounded-md border border-line bg-surface px-3 py-2"
        >
          {TYPE_ORDER.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex flex-col gap-2">
        <Checkbox id="ingredient-homemade" label="Homemade" checked={homemade} onChange={setHomemade} />
        <Checkbox id="ingredient-addon" label="Offer as an add-on" checked={addon} onChange={setAddon} />
      </div>

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
                <span>{usedIn.length > 0 ? `Also removes it from ${usedIn.join(", ")}.` : "Delete for good?"}</span>
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

function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor: string; children: React.ReactNode }) {
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

function Checkbox({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
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
