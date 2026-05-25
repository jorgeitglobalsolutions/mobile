import { FOODS_CATALOG } from '../data/foodsCatalog';
import type { FoodCatalogItem } from '../types/food';
import type { CustomFoodRow } from '../types/food';
import type { FoodCategoryFilter } from '../data/foodsCatalog';

export type SearchableFood =
  | { source: 'catalog'; item: FoodCatalogItem }
  | { source: 'custom'; item: CustomFoodRow };

function normalizeQuery(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function searchCatalogFoods(query: string, category: FoodCategoryFilter): FoodCatalogItem[] {
  const nq = normalizeQuery(query);
  return FOODS_CATALOG.filter((f) => {
    if (category !== 'all' && f.category !== category) return false;
    if (!nq) return true;
    const name = normalizeQuery(f.name);
    const sub = normalizeQuery(f.subcategory);
    return name.includes(nq) || sub.includes(nq);
  });
}

export function searchCustomFoods(customFoods: CustomFoodRow[], query: string): CustomFoodRow[] {
  const nq = normalizeQuery(query);
  if (!nq) return customFoods;
  return customFoods.filter((row) => normalizeQuery(row.data.name).includes(nq));
}
