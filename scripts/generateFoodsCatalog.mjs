import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { englishNameForFood, englishSubcategory } from './foodTranslations.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const md = fs.readFileSync(path.join(root, 'docs/base_datos_alimentos_app.md'), 'utf8');
const lines = md.split(/\r?\n/);

let category = '';
let subcategory = '';
const foods = [];
const catMap = {
  'PROTEÍNAS': 'proteinas',
  'CARBOHIDRATOS': 'carbohidratos',
  'GRASAS SALUDABLES': 'grasas',
  FRUTAS: 'frutas',
  VEGETALES: 'vegetales',
  'SUPLEMENTOS Y OTROS': 'suplementos',
};

function slug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

for (const line of lines) {
  const h2 = line.match(/^## \d+\. (.+)$/);
  if (h2) {
    category = h2[1].trim();
    subcategory = '';
    continue;
  }
  const h3 = line.match(/^### \d+\.\d+ (.+)$/);
  if (h3) {
    subcategory = h3[1].trim();
    continue;
  }
  if (!line.startsWith('|') || line.includes('Alimento') || line.includes('---')) continue;
  const parts = line.split('|').map((s) => s.trim()).filter(Boolean);
  if (parts.length < 5) continue;
  const name = parts[0];
  const protein = parseFloat(parts[1]);
  const carbs = parseFloat(parts[2]);
  const fat = parseFloat(parts[3]);
  const calories = parseFloat(parts[4]);
  if (Number.isNaN(protein) || Number.isNaN(calories)) continue;
  const catKey = Object.keys(catMap).find((k) => category.toUpperCase().includes(k.split(' ')[0]));
  const id = slug(name);
  foods.push({
    id,
    name: englishNameForFood(id, name),
    category: catMap[catKey] ?? 'other',
    subcategory: englishSubcategory(subcategory),
    macrosPer100g: { protein, carbs, fat, calories },
  });
}

const seen = new Map();
for (const f of foods) {
  let id = f.id;
  let n = 1;
  while (seen.has(id)) {
    id = `${f.id}-${n++}`;
  }
  f.id = id;
  seen.set(id, true);
}

const ts = `import type { FoodCatalogItem } from '../types/food';

/** Auto-generated from docs/base_datos_alimentos_app.md (English UI) — run: node scripts/generateFoodsCatalog.mjs */
export const FOODS_CATALOG: FoodCatalogItem[] = ${JSON.stringify(foods, null, 2)} as FoodCatalogItem[];

export const FOOD_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'proteinas', label: 'Protein' },
  { id: 'carbohidratos', label: 'Carbs' },
  { id: 'grasas', label: 'Fats' },
  { id: 'frutas', label: 'Fruit' },
  { id: 'vegetales', label: 'Vegetables' },
  { id: 'suplementos', label: 'Supplements' },
] as const;

export type FoodCategoryFilter = (typeof FOOD_CATEGORIES)[number]['id'];
`;

fs.writeFileSync(path.join(root, 'src/data/foodsCatalog.ts'), ts);
console.log(`Wrote ${foods.length} foods`);
