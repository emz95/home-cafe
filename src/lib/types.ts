export type IngredientType = "espresso" | "milk" | "syrup" | "foam" | "tea" | "topping" | "other";

export type Ingredient = {
  id: string;
  name: string;
  display_name: string | null;
  type: IngredientType;
  in_stock: boolean;
  homemade: boolean;
  addon: boolean;
  note: string | null;
};

export type Drink = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  hidden: boolean;
  sort_order: number;
  ingredients: Ingredient[];
};

// Order ingredients are listed in under a drink, and add-on groups on the menu.
export const TYPE_ORDER: IngredientType[] = ["espresso", "tea", "milk", "syrup", "foam", "topping", "other"];

// Add-on group headings.
export const ADDON_LABELS: Record<IngredientType, string> = {
  espresso: "Espresso",
  tea: "Tea",
  milk: "Milk",
  syrup: "Syrups",
  foam: "Cold foam",
  topping: "Toppings",
  other: "Other",
};

export function menuName(i: Ingredient) {
  return i.display_name?.trim() || i.name;
}

// A drink is unavailable when any of its ingredients is out of stock.
export function isAvailable(d: Drink) {
  return d.ingredients.every((i) => i.in_stock);
}

export function sortIngredients(list: Ingredient[]) {
  return [...list].sort(
    (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || menuName(a).localeCompare(menuName(b)),
  );
}
