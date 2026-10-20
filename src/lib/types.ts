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

// A drink as the admin editor holds it: ingredient ids instead of full ingredients.
export type AdminDrink = Omit<Drink, "ingredients"> & { ingredient_ids: string[] };

export type WishlistKind = "ingredient" | "material" | "drink";

export type WishlistItem = {
  id: string;
  name: string;
  kind: WishlistKind;
  note: string | null;
};

// Wishlist sections, in order.
export const WISHLIST_KINDS: { kind: WishlistKind; label: string; one: string }[] = [
  { kind: "ingredient", label: "Ingredients", one: "Ingredient" },
  { kind: "material", label: "Materials", one: "Material" },
  { kind: "drink", label: "Drinks", one: "Drink" },
];

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

// Type names in the admin editor.
export const TYPE_LABELS: Record<IngredientType, string> = {
  espresso: "Espresso",
  tea: "Tea",
  milk: "Milk",
  syrup: "Syrup",
  foam: "Cold foam",
  topping: "Topping",
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
