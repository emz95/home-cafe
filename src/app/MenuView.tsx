import {
  ADDON_LABELS,
  type Drink,
  type Ingredient,
  isAvailable,
  menuName,
  sortIngredients,
  TYPE_ORDER,
} from "@/lib/types";

export default function MenuView({ drinks, addons }: { drinks: Drink[]; addons: Ingredient[] }) {
  // Categories appear in the order of their first drink.
  const groups = new Map<string, Drink[]>();
  for (const d of drinks) {
    if (!groups.has(d.category)) groups.set(d.category, []);
    groups.get(d.category)!.push(d);
  }
  const categories = [...groups.entries()];

  // Add-ons grouped by ingredient type (Syrups, Cold foam, …).
  const addonGroups = TYPE_ORDER.map((type) => ({
    label: ADDON_LABELS[type],
    items: sortIngredients(addons.filter((a) => a.type === type)),
  })).filter((g) => g.items.length > 0);

  if (drinks.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-surface p-6 text-muted">
        No drinks on the menu yet. Check back soon.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-14">
        {categories.map(([category, list]) => (
          <section key={category}>
            <SectionHeading>{category}</SectionHeading>
            <ul className="grid gap-x-12 sm:grid-cols-2">
              {list.map((d) => (
                <DrinkItem key={d.id} drink={d} />
              ))}
            </ul>
          </section>
        ))}

        {addonGroups.length > 0 && (
          <section>
            <SectionHeading>Add-ons</SectionHeading>
            <ul className="grid gap-x-12 sm:grid-cols-2">
              {addonGroups.map((g) => (
                <li key={g.label} className="border-t border-line py-5">
                  <h3 className="text-xl leading-tight font-medium">{g.label}</h3>
                  <IngredientList ingredients={g.items} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <p className="mt-16 text-base text-muted italic">Hover or tap an ingredient for details.</p>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-6 text-sm font-semibold tracking-[0.2em] text-muted uppercase">{children}</h2>;
}

function DrinkItem({ drink }: { drink: Drink }) {
  const available = isAvailable(drink);

  return (
    <li className={`border-t border-line py-5 ${available ? "" : "opacity-45"}`}>
      <h3 className="text-2xl leading-tight font-medium">
        {drink.name}
        {!available && <span className="sr-only"> (unavailable today)</span>}
      </h3>
      {drink.description && <p className="mt-1 text-muted">{drink.description}</p>}
      <IngredientList ingredients={sortIngredients(drink.ingredients)} />
    </li>
  );
}

// Ingredients separated by dots; out-of-stock ones are greyed.
function IngredientList({ ingredients }: { ingredients: Ingredient[] }) {
  if (ingredients.length === 0) return null;

  return (
    <ul className="mt-3 flex flex-wrap gap-x-1 gap-y-1.5 text-base">
      {ingredients.map((i, idx) => (
        <li key={i.id} className="flex items-center gap-1.5">
          <span className={i.in_stock ? "" : "text-muted opacity-60"}>
            <IngredientName ingredient={i} />
          </span>
          {!i.in_stock && <span className="sr-only">(out of stock)</span>}
          {idx < ingredients.length - 1 && (
            <span className="text-muted" aria-hidden>
              ·
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

// Shows the menu name. Hovering (or tapping) reveals the real name when it differs, and whether it's homemade.
function IngredientName({ ingredient: i }: { ingredient: Ingredient }) {
  const shown = menuName(i);
  const realName = shown !== i.name ? i.name : null;
  if (!realName && !i.homemade) return <>{shown}</>;

  return (
    <button type="button" className="group relative cursor-help">
      {shown}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded bg-ink px-2.5 py-1 text-sm whitespace-nowrap text-bg opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100"
      >
        {realName && <span className="block">{realName}</span>}
        {i.homemade && <span className="block text-xs font-semibold tracking-wider uppercase">Homemade</span>}
      </span>
    </button>
  );
}
