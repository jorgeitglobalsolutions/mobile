export type FoodMacros = {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
};

export type FoodCatalogItem = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  /** Values per 100g (or 100ml where noted in source doc). */
  macrosPer100g: FoodMacros;
};

export type CustomFoodDoc = {
  name: string;
  /** Per 100g equivalent — custom entries use the same scaling as catalog foods. */
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  caloriesPer100g: number;
  createdAtMs: number;
  updatedAtMs: number;
};

export type CustomFoodRow = { id: string; data: CustomFoodDoc };
