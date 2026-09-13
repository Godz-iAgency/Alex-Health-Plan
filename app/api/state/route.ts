import {
  clearGroceries,
  loadAppState,
  saveAppEvent,
  saveDaily,
  saveGrocery,
  saveMeal,
  saveMealChoice,
  savePlannedMeal,
  saveProfile,
  saveWeeklyPlan,
  saveWeight,
  validDateKey,
} from '@/lib/alex-data';
import { isAuthorized } from '@/lib/access';
import type { PlannedMeal } from '@/lib/plan';

function safeNumber(value: unknown, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, Math.round(parsed))) : fallback;
}

function safeString(value: unknown, maximum = 1000) {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';
}

function safeDecimal(value: unknown, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, Math.round(parsed * 10) / 10)) : fallback;
}

function safeProfile(value: unknown) {
  const profile = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    walkGoal: safeNumber(profile.walkGoal, 15, 5, 180),
    goal: safeString(profile.goal, 120) || 'Build steady healthy habits',
    currentWeight: safeDecimal(profile.currentWeight, 0, 0, 1500),
    weightUnit: profile.weightUnit === 'kg' ? 'kg' as const : 'lb' as const,
    dailyWeighing: profile.dailyWeighing !== false,
    sleepGoal: safeDecimal(profile.sleepGoal, 7.5, 4, 12),
    cookingMinutes: safeNumber(profile.cookingMinutes, 25, 5, 180),
    budget: safeString(profile.budget, 40) || 'moderate',
    animalProtein: ['optional', 'none', 'yes'].includes(String(profile.animalProtein)) ? String(profile.animalProtein) : 'optional',
    allergies: safeString(profile.allergies, 500),
    mobilityNotes: safeString(profile.mobilityNotes, 500),
    onboarded: profile.onboarded === true,
  };
}

function safePlannedMeal(value: unknown): PlannedMeal | null {
  if (!value || typeof value !== 'object') return null;
  const meal = value as Record<string, unknown>;
  const date = validDateKey(meal.date);
  const slot = safeString(meal.slot, 20) as PlannedMeal['slot'];
  const allowedSlots = ['breakfast', 'lunch', 'dinner', 'smoothie', 'dessert'];
  const key = safeString(meal.key, 100);
  const recipeKey = safeString(meal.recipeKey, 100);
  if (!date || !key || !recipeKey || !allowedSlots.includes(slot)) return null;
  return { key, date, slot, recipeKey, removed: meal.removed === true };
}

export async function GET(request: Request) {
  if (!await isAuthorized(request)) return Response.json({ error: 'Private access required.' }, { status: 401 });
  const url = new URL(request.url);
  const date = validDateKey(url.searchParams.get('date'));
  const weekOf = validDateKey(url.searchParams.get('weekOf'));
  if (!date || !weekOf) return Response.json({ error: 'A valid date is required.' }, { status: 400 });

  try {
    return Response.json(await loadAppState(date, weekOf));
  } catch (error) {
    console.error('Airtable state load failed', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({ connected: false, error: 'Saved progress is temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!await isAuthorized(request)) return Response.json({ error: 'Private access required.' }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = safeString(body.action, 40);

    if (action === 'daily') {
      const date = validDateKey(body.date);
      if (!date) return Response.json({ error: 'A valid date is required.' }, { status: 400 });
      const completed = Array.isArray(body.completed) ? body.completed.filter((item): item is string => typeof item === 'string') : [];
      const wellness = body.wellness && typeof body.wellness === 'object' ? body.wellness as Record<string, unknown> : {};
      await saveDaily(date, completed, safeNumber(body.walkGoal, 15, 5, 180), {
        sleepHours: safeDecimal(wellness.sleepHours, 0, 0, 24),
        sleepQuality: safeString(wellness.sleepQuality, 40),
        meditationMinutes: safeNumber(wellness.meditationMinutes, 0, 0, 240),
        mood: safeString(wellness.mood, 40),
        digestion: safeString(wellness.digestion, 40),
      });
    } else if (action === 'profile') {
      await saveProfile(safeProfile(body.profile ?? body));
    } else if (action === 'weight') {
      const date = validDateKey(body.date);
      const weight = safeDecimal(body.weight, 0, 50, 1500);
      if (!date || !weight) return Response.json({ error: 'A valid weight is required.' }, { status: 400 });
      await saveWeight(date, weight, body.unit === 'kg' ? 'kg' : 'lb');
    } else if (action === 'weeklyPlan') {
      const weekOf = validDateKey(body.weekOf);
      const meals = Array.isArray(body.meals) ? body.meals.map(safePlannedMeal).filter((meal): meal is PlannedMeal => Boolean(meal)) : [];
      if (!weekOf || !meals.length) return Response.json({ error: 'A valid weekly plan is required.' }, { status: 400 });
      await saveWeeklyPlan(weekOf, meals);
    } else if (action === 'plannedMeal') {
      const weekOf = validDateKey(body.weekOf);
      const plannedMeal = safePlannedMeal(body.meal);
      if (!weekOf || !plannedMeal) return Response.json({ error: 'A valid planned meal is required.' }, { status: 400 });
      await savePlannedMeal(weekOf, plannedMeal);
    } else if (action === 'grocery') {
      const weekOf = validDateKey(body.weekOf);
      const item = safeString(body.item, 200);
      if (!weekOf || !item) return Response.json({ error: 'A valid grocery item is required.' }, { status: 400 });
      await saveGrocery({
        weekOf,
        item,
        category: safeString(body.category, 120),
        quantity: safeString(body.quantity, 160),
        isChecked: body.checked === true,
        sortOrder: safeNumber(body.sortOrder, 0, 0, 1000),
      });
    } else if (action === 'clearGroceries') {
      const weekOf = validDateKey(body.weekOf);
      if (!weekOf) return Response.json({ error: 'A valid week is required.' }, { status: 400 });
      await clearGroceries(weekOf);
    } else if (action === 'meal') {
      const result = body.result as Record<string, unknown> | undefined;
      const meal = safeString(body.meal, 500);
      if (!result || !meal) return Response.json({ error: 'A meal result is required.' }, { status: 400 });
      const mealId = await saveMeal({
        meal,
        rating: safeString(result.rating, 20),
        headline: safeString(result.headline, 160),
        reason: safeString(result.reason, 500),
        better: safeString(result.better, 500),
        gbombs: Array.isArray(result.gbombs) ? result.gbombs.filter((item): item is string => typeof item === 'string') : [],
      });
      return Response.json({ saved: true, mealId });
    } else if (action === 'mealChoice') {
      const choice = body.choice === 'original' ? 'original' : 'recommended';
      const mealId = safeString(body.mealId, 100);
      if (!mealId) return Response.json({ error: 'A meal record is required.' }, { status: 400 });
      await saveMealChoice(mealId, choice);
    } else if (action === 'event') {
      await saveAppEvent(safeString(body.category, 60), safeString(body.event, 80), safeDecimal(body.value, 0, -100000, 100000), safeString(body.details, 500));
    } else {
      return Response.json({ error: 'Unknown save action.' }, { status: 400 });
    }

    return Response.json({ saved: true });
  } catch (error) {
    console.error('Airtable state save failed', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({ error: 'Your change could not be saved right now.' }, { status: 503 });
  }
}
