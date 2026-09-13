export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'smoothie' | 'dessert';

export type RecipeIngredient = {
  name: string;
  amount: string;
  category: 'Produce' | 'Beans and protein' | 'Grains' | 'Nuts and seeds' | 'Drinks and pantry';
};

export type Recipe = {
  id: string;
  name: string;
  slot: MealSlot;
  description: string;
  minutes: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  why: string;
  gbombs: string[];
  animalProtein?: boolean;
};

export type PlannedMeal = {
  key: string;
  date: string;
  slot: MealSlot;
  recipeKey: string;
  removed: boolean;
};

export type GroceryItem = {
  name: string;
  amount: string;
  category: RecipeIngredient['category'];
};

export const RECIPES: Recipe[] = [
  {
    id: 'berry-chia-oats',
    name: 'Berry chia oats',
    slot: 'breakfast',
    description: 'Warm oats with berries, chia, and walnuts.',
    minutes: 8,
    ingredients: [
      { name: 'Rolled oats', amount: '1/2 cup', category: 'Grains' },
      { name: 'Unsweetened milk', amount: '1 cup', category: 'Drinks and pantry' },
      { name: 'Berries', amount: '1/2 cup', category: 'Produce' },
      { name: 'Chia seeds', amount: '1 tablespoon', category: 'Nuts and seeds' },
      { name: 'Walnuts', amount: '2 tablespoons', category: 'Nuts and seeds' },
    ],
    steps: ['Cook the oats with the milk.', 'Top with berries, chia, and walnuts.'],
    why: 'This meal gives you fiber, useful energy, and a measured amount of healthy fat.',
    gbombs: ['Berries', 'Seeds and nuts'],
  },
  {
    id: 'veggie-egg-scramble',
    name: 'Veggie egg scramble',
    slot: 'breakfast',
    description: 'Eggs cooked with spinach, mushrooms, and onions.',
    minutes: 12,
    ingredients: [
      { name: 'Eggs', amount: '2', category: 'Beans and protein' },
      { name: 'Baby spinach', amount: '1 large handful', category: 'Produce' },
      { name: 'Mushrooms', amount: '1/2 cup', category: 'Produce' },
      { name: 'Onion', amount: '1/4', category: 'Produce' },
      { name: 'Olive oil', amount: '1 teaspoon', category: 'Drinks and pantry' },
    ],
    steps: ['Cook the onion and mushrooms until tender.', 'Add spinach.', 'Add beaten eggs and cook until firm.'],
    why: 'Eggs provide protein. The vegetables add fiber, color, and volume.',
    gbombs: ['Greens', 'Onions', 'Mushrooms'],
    animalProtein: true,
  },
  {
    id: 'apple-cinnamon-quinoa',
    name: 'Apple cinnamon quinoa',
    slot: 'breakfast',
    description: 'Warm quinoa with apple, cinnamon, and ground flax.',
    minutes: 10,
    ingredients: [
      { name: 'Cooked quinoa', amount: '3/4 cup', category: 'Grains' },
      { name: 'Apple', amount: '1', category: 'Produce' },
      { name: 'Ground flaxseed', amount: '1 tablespoon', category: 'Nuts and seeds' },
      { name: 'Cinnamon', amount: '1/2 teaspoon', category: 'Drinks and pantry' },
    ],
    steps: ['Warm the quinoa.', 'Chop the apple.', 'Add the apple, flax, and cinnamon.'],
    why: 'Quinoa gives you useful energy. Apple and flax add fiber.',
    gbombs: ['Seeds and nuts'],
  },
  {
    id: 'black-bean-quinoa-bowl',
    name: 'Black bean quinoa bowl',
    slot: 'lunch',
    description: 'A filling bowl with beans, greens, vegetables, and quinoa.',
    minutes: 15,
    ingredients: [
      { name: 'Black beans', amount: '1/2 cup', category: 'Beans and protein' },
      { name: 'Cooked quinoa', amount: '1/2 cup', category: 'Grains' },
      { name: 'Baby spinach', amount: '2 handfuls', category: 'Produce' },
      { name: 'Bell pepper', amount: '1/2', category: 'Produce' },
      { name: 'Onion', amount: '1/4', category: 'Produce' },
      { name: 'Salsa', amount: '2 tablespoons', category: 'Drinks and pantry' },
    ],
    steps: ['Warm the beans and quinoa.', 'Add the spinach, pepper, and onion.', 'Top with salsa.'],
    why: 'Beans give you protein and fiber. The vegetables help make the bowl filling.',
    gbombs: ['Greens', 'Beans', 'Onions'],
  },
  {
    id: 'lentil-crunch-salad',
    name: 'Lentil crunch salad',
    slot: 'lunch',
    description: 'Lentils, cabbage, cucumber, berries, and pumpkin seeds.',
    minutes: 12,
    ingredients: [
      { name: 'Cooked lentils', amount: '3/4 cup', category: 'Beans and protein' },
      { name: 'Shredded cabbage', amount: '2 cups', category: 'Produce' },
      { name: 'Cucumber', amount: '1/2', category: 'Produce' },
      { name: 'Berries', amount: '1/3 cup', category: 'Produce' },
      { name: 'Pumpkin seeds', amount: '1 tablespoon', category: 'Nuts and seeds' },
      { name: 'Lemon', amount: '1/2', category: 'Produce' },
    ],
    steps: ['Put the lentils and vegetables in a bowl.', 'Add berries and seeds.', 'Squeeze lemon over the salad.'],
    why: 'Lentils provide protein and fiber. The plants add crunch and color.',
    gbombs: ['Beans', 'Berries', 'Seeds and nuts'],
  },
  {
    id: 'chickpea-lettuce-cups',
    name: 'Chickpea lettuce cups',
    slot: 'lunch',
    description: 'Seasoned chickpeas in crisp lettuce with vegetables.',
    minutes: 12,
    ingredients: [
      { name: 'Chickpeas', amount: '3/4 cup', category: 'Beans and protein' },
      { name: 'Romaine lettuce', amount: '4 large leaves', category: 'Produce' },
      { name: 'Bell pepper', amount: '1/2', category: 'Produce' },
      { name: 'Onion', amount: '1/4', category: 'Produce' },
      { name: 'Hummus', amount: '2 tablespoons', category: 'Drinks and pantry' },
    ],
    steps: ['Mix chickpeas with chopped pepper and onion.', 'Spread hummus on the lettuce.', 'Add the chickpea mix.'],
    why: 'Chickpeas give you protein and fiber in a simple hand-held meal.',
    gbombs: ['Greens', 'Beans', 'Onions'],
  },
  {
    id: 'mushroom-lentil-stew',
    name: 'Mushroom lentil stew',
    slot: 'dinner',
    description: 'A warm one-pot meal with lentils, mushrooms, and greens.',
    minutes: 30,
    ingredients: [
      { name: 'Cooked lentils', amount: '1 cup', category: 'Beans and protein' },
      { name: 'Mushrooms', amount: '1 cup', category: 'Produce' },
      { name: 'Kale', amount: '2 cups', category: 'Produce' },
      { name: 'Onion', amount: '1/2', category: 'Produce' },
      { name: 'No-salt-added tomatoes', amount: '1 cup', category: 'Drinks and pantry' },
      { name: 'Low-sodium broth', amount: '1 cup', category: 'Drinks and pantry' },
    ],
    steps: ['Cook the onion and mushrooms until tender.', 'Add lentils, tomatoes, and broth.', 'Simmer for 15 minutes.', 'Stir in kale until soft.'],
    why: 'This meal combines protein, fiber, vegetables, and a warm satisfying texture.',
    gbombs: ['Greens', 'Beans', 'Onions', 'Mushrooms'],
  },
  {
    id: 'lemon-salmon-greens',
    name: 'Lemon salmon and greens',
    slot: 'dinner',
    description: 'Baked salmon with broccoli, cabbage, and lemon.',
    minutes: 25,
    ingredients: [
      { name: 'Salmon fillet', amount: '1 palm-sized piece', category: 'Beans and protein' },
      { name: 'Broccoli', amount: '1 cup', category: 'Produce' },
      { name: 'Shredded cabbage', amount: '1 cup', category: 'Produce' },
      { name: 'Lemon', amount: '1/2', category: 'Produce' },
      { name: 'Olive oil', amount: '1 teaspoon', category: 'Drinks and pantry' },
    ],
    steps: ['Heat the oven to 400 F.', 'Bake the salmon until it reaches a safe temperature and flakes easily.', 'Steam the vegetables.', 'Add lemon.'],
    why: 'Salmon gives you protein and useful fats. The vegetables add fiber and volume.',
    gbombs: ['Greens'],
    animalProtein: true,
  },
  {
    id: 'chicken-broccoli-quinoa',
    name: 'Chicken broccoli quinoa',
    slot: 'dinner',
    description: 'Lean chicken, broccoli, mushrooms, onions, and quinoa.',
    minutes: 25,
    ingredients: [
      { name: 'Chicken breast', amount: '1 palm-sized piece', category: 'Beans and protein' },
      { name: 'Broccoli', amount: '1 cup', category: 'Produce' },
      { name: 'Mushrooms', amount: '1/2 cup', category: 'Produce' },
      { name: 'Onion', amount: '1/4', category: 'Produce' },
      { name: 'Cooked quinoa', amount: '1/2 cup', category: 'Grains' },
    ],
    steps: ['Cook the chicken fully and safely.', 'Cook the broccoli, mushrooms, and onion until tender.', 'Serve with quinoa.'],
    why: 'This plate includes lean protein, vegetables, and a measured energy source.',
    gbombs: ['Greens', 'Onions', 'Mushrooms'],
    animalProtein: true,
  },
  {
    id: 'tofu-vegetable-bowl',
    name: 'Tofu vegetable bowl',
    slot: 'dinner',
    description: 'Crisp tofu with cabbage, mushrooms, spinach, and quinoa.',
    minutes: 25,
    ingredients: [
      { name: 'Plain tofu', amount: '1/2 block', category: 'Beans and protein' },
      { name: 'Shredded cabbage', amount: '1 cup', category: 'Produce' },
      { name: 'Baby spinach', amount: '1 handful', category: 'Produce' },
      { name: 'Mushrooms', amount: '1/2 cup', category: 'Produce' },
      { name: 'Cooked quinoa', amount: '1/2 cup', category: 'Grains' },
      { name: 'Low-sodium tamari', amount: '1 teaspoon', category: 'Drinks and pantry' },
    ],
    steps: ['Cook the tofu until lightly crisp.', 'Cook the vegetables until tender.', 'Serve with quinoa and a little tamari.'],
    why: 'Tofu gives you protein. The vegetables and quinoa make the meal complete.',
    gbombs: ['Greens', 'Mushrooms'],
  },
  {
    id: 'cocoa-berry-smoothie',
    name: 'Cocoa berry smoothie',
    slot: 'smoothie',
    description: 'A measured smoothie with berries, cocoa, chia, and peanut butter.',
    minutes: 5,
    ingredients: [
      { name: 'Berries', amount: '1/2 cup', category: 'Produce' },
      { name: 'Small banana', amount: '1', category: 'Produce' },
      { name: 'Unsweetened milk', amount: '1 cup', category: 'Drinks and pantry' },
      { name: 'Chia seeds', amount: '1 tablespoon', category: 'Nuts and seeds' },
      { name: 'Natural peanut butter', amount: '1 tablespoon', category: 'Nuts and seeds' },
      { name: 'Unsweetened cocoa', amount: '1 teaspoon', category: 'Drinks and pantry' },
    ],
    steps: ['Put everything in a blender.', 'Blend until smooth.', 'Drink it slowly.'],
    why: 'Measured amounts keep this filling smoothie from becoming too heavy.',
    gbombs: ['Berries', 'Seeds and nuts'],
  },
  {
    id: 'green-mango-smoothie',
    name: 'Green mango smoothie',
    slot: 'smoothie',
    description: 'Spinach, mango, flax, and unsweetened milk.',
    minutes: 5,
    ingredients: [
      { name: 'Baby spinach', amount: '1 large handful', category: 'Produce' },
      { name: 'Frozen mango', amount: '1/2 cup', category: 'Produce' },
      { name: 'Unsweetened milk', amount: '1 cup', category: 'Drinks and pantry' },
      { name: 'Ground flaxseed', amount: '1 tablespoon', category: 'Nuts and seeds' },
    ],
    steps: ['Put everything in a blender.', 'Blend until smooth.', 'Add water if it is too thick.'],
    why: 'This is a simple way to add greens, fruit, and seeds.',
    gbombs: ['Greens', 'Seeds and nuts'],
  },
  {
    id: 'baked-apple-walnuts',
    name: 'Warm apple and walnuts',
    slot: 'dessert',
    description: 'Warm apple with cinnamon and a small amount of walnuts.',
    minutes: 8,
    ingredients: [
      { name: 'Apple', amount: '1', category: 'Produce' },
      { name: 'Walnuts', amount: '1 tablespoon', category: 'Nuts and seeds' },
      { name: 'Cinnamon', amount: '1/2 teaspoon', category: 'Drinks and pantry' },
    ],
    steps: ['Chop the apple.', 'Heat until soft.', 'Add cinnamon and walnuts.'],
    why: 'Whole fruit keeps its fiber and gives you a naturally sweet finish.',
    gbombs: ['Seeds and nuts'],
  },
  {
    id: 'berry-yogurt-cup',
    name: 'Berry yogurt cup',
    slot: 'dessert',
    description: 'Plain yogurt with berries, chia, and cinnamon.',
    minutes: 3,
    ingredients: [
      { name: 'Plain unsweetened yogurt', amount: '3/4 cup', category: 'Beans and protein' },
      { name: 'Berries', amount: '1/2 cup', category: 'Produce' },
      { name: 'Chia seeds', amount: '1 teaspoon', category: 'Nuts and seeds' },
      { name: 'Cinnamon', amount: '1 pinch', category: 'Drinks and pantry' },
    ],
    steps: ['Put the yogurt in a small bowl.', 'Add berries, chia, and cinnamon.'],
    why: 'This gives you a sweet taste with protein, fiber, and no added sugar.',
    gbombs: ['Berries', 'Seeds and nuts'],
    animalProtein: true,
  },
];

const dayRecipes = [
  ['berry-chia-oats', 'black-bean-quinoa-bowl', 'mushroom-lentil-stew', 'cocoa-berry-smoothie', 'baked-apple-walnuts'],
  ['veggie-egg-scramble', 'lentil-crunch-salad', 'tofu-vegetable-bowl'],
  ['apple-cinnamon-quinoa', 'chickpea-lettuce-cups', 'lemon-salmon-greens', 'green-mango-smoothie', 'berry-yogurt-cup'],
  ['berry-chia-oats', 'black-bean-quinoa-bowl', 'chicken-broccoli-quinoa'],
  ['veggie-egg-scramble', 'lentil-crunch-salad', 'mushroom-lentil-stew', 'cocoa-berry-smoothie'],
  ['apple-cinnamon-quinoa', 'chickpea-lettuce-cups', 'tofu-vegetable-bowl', 'baked-apple-walnuts'],
  ['berry-chia-oats', 'black-bean-quinoa-bowl', 'lemon-salmon-greens', 'berry-yogurt-cup'],
];

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function buildWeeklyPlan(weekOf: string, includeAnimalProtein = true): PlannedMeal[] {
  return dayRecipes.flatMap((recipeIds, dayIndex) => {
    const date = addDays(weekOf, dayIndex);
    return recipeIds
      .map((recipeId) => RECIPES.find((recipe) => recipe.id === recipeId))
      .filter((recipe): recipe is Recipe => Boolean(recipe))
      .map((recipe) => {
        if (includeAnimalProtein || !recipe.animalProtein) return recipe;
        const plantOptions = RECIPES.filter((item) => item.slot === recipe.slot && !item.animalProtein);
        return plantOptions[dayIndex % plantOptions.length];
      })
      .map((recipe) => ({
        key: `${date}:${recipe.slot}`,
        date,
        slot: recipe.slot,
        recipeKey: recipe.id,
        removed: false,
      }));
  });
}

export function recipeById(id: string) {
  return RECIPES.find((recipe) => recipe.id === id);
}

export function replacementFor(meal: PlannedMeal, meals: PlannedMeal[], includeAnimalProtein = true) {
  const options = RECIPES.filter((recipe) => recipe.slot === meal.slot && recipe.id !== meal.recipeKey && (includeAnimalProtein || !recipe.animalProtein));
  const used = new Set(meals.filter((item) => item.date === meal.date).map((item) => item.recipeKey));
  return options.find((recipe) => !used.has(recipe.id)) ?? options[0];
}

function amountNumber(value: string) {
  if (/^\d+\/\d+$/.test(value)) {
    const [top, bottom] = value.split('/').map(Number);
    return bottom ? top / bottom : 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const UNIT_NAMES: Record<string, [string, string]> = {
  cup: ['cup', 'cups'],
  tablespoon: ['tablespoon', 'tablespoons'],
  teaspoon: ['teaspoon', 'teaspoons'],
  block: ['block', 'blocks'],
  pinch: ['pinch', 'pinches'],
  'large leaf': ['large leaf', 'large leaves'],
  'palm-sized piece': ['palm-sized piece', 'palm-sized pieces'],
};

function parsedAmount(amount: string) {
  const match = amount.trim().match(/^(\d+(?:\.\d+)?|\d+\/\d+)(?:\s+(.*))?$/);
  if (!match) return null;
  const rawUnit = (match[2] ?? '').toLowerCase();
  const normalized = Object.entries(UNIT_NAMES).find(([, names]) => names.includes(rawUnit))?.[0] ?? rawUnit;
  return { value: amountNumber(match[1]), unit: normalized };
}

function combinedAmount(amounts: string[]) {
  const parsed = amounts.map(parsedAmount);
  if (parsed.some((item) => !item)) return `${amounts.length} meal uses`;
  const values = parsed as { value: number; unit: string }[];
  if (new Set(values.map((item) => item.unit)).size !== 1) return `${amounts.length} meal uses`;
  const unit = values[0].unit;
  const total = values.reduce((sum, item) => sum + item.value, 0);
  const rounded = unit ? Math.round(total * 4) / 4 : Math.ceil(total);
  if (!unit) return String(rounded);
  const names = UNIT_NAMES[unit];
  const label = names ? names[Math.abs(rounded - 1) < 0.001 ? 0 : 1] : unit;
  return `${rounded} ${label}`;
}

export function groceryListFor(meals: PlannedMeal[]): GroceryItem[] {
  const combined = new Map<string, GroceryItem & { amounts: string[] }>();
  meals.filter((meal) => !meal.removed).forEach((meal) => {
    recipeById(meal.recipeKey)?.ingredients.forEach((ingredient) => {
      const key = ingredient.name.toLowerCase();
      const current = combined.get(key);
      if (current) current.amounts.push(ingredient.amount);
      else combined.set(key, { name: ingredient.name, amount: ingredient.amount, category: ingredient.category, amounts: [ingredient.amount] });
    });
  });
  return [...combined.values()]
    .map(({ amounts, ...item }) => ({ ...item, amount: combinedAmount(amounts) }))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

export const OPENING_MESSAGES = [
  'Today does not need to be perfect. Make the next choice count.',
  'Small actions become strong habits. Start with the next one.',
  'You are building this one choice at a time. Keep going.',
  'A short walk and one good meal still move you forward.',
  'Your job today is simple. Take the next healthy step.',
  'Progress grows when you return. You showed up today.',
  'Be honest, stay steady, and make the next choice better.',
];

export const FINISH_MESSAGES = [
  'Good work today, Alex. Rest well and begin again tomorrow.',
  'You kept your promise to show up. That matters.',
  'Every honest choice taught you something today. Keep building.',
  'You are done for today. Let your body rest and recover.',
  'Today is complete. Tomorrow gives you another good choice.',
];
