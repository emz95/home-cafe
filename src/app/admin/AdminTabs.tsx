"use client";

import { useState } from "react";
import type { AdminDrink, Ingredient } from "@/lib/types";
import DrinksEditor from "./DrinksEditor";
import IngredientsEditor from "./IngredientsEditor";

const TABS = [
  { id: "ingredients", label: "Ingredients" },
  { id: "drinks", label: "Drinks" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default function AdminTabs({
  initialIngredients,
  initialDrinks,
}: {
  initialIngredients: Ingredient[];
  initialDrinks: AdminDrink[];
}) {
  const [tab, setTab] = useState<Tab>("ingredients");
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [drinks, setDrinks] = useState(initialDrinks);

  // ingredient id → names of drinks that use it
  const usage: Record<string, string[]> = {};
  for (const d of drinks) for (const id of d.ingredient_ids) (usage[id] ??= []).push(d.name);

  return (
    <div className="mt-10 flex flex-col gap-8">
      <div role="tablist" className="flex gap-6 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 pb-3 text-lg ${
              tab === t.id ? "border-ink font-semibold" : "border-transparent text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "ingredients" ? (
          <IngredientsEditor
            ingredients={ingredients}
            setIngredients={setIngredients}
            usage={usage}
            onDeleted={(id) =>
              setDrinks((list) => list.map((d) => ({ ...d, ingredient_ids: d.ingredient_ids.filter((x) => x !== id) })))
            }
          />
        ) : (
          <DrinksEditor drinks={drinks} setDrinks={setDrinks} ingredients={ingredients} />
        )}
      </div>
    </div>
  );
}
