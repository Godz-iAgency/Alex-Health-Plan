import {
  clearGroceries,
  loadAppState,
  saveDaily,
  saveGrocery,
  saveMeal,
  saveMealChoice,
  saveProfile,
  validDateKey,
} from '@/lib/alex-data';
import { isAuthorized } from '@/lib/access';

function safeNumber(value: unknown, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, Math.round(parsed))) : fallback;
}

function safeString(value: unknown, maximum = 1000) {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';
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
      await saveDaily(date, completed, safeNumber(body.walkGoal, 15, 1, 180));
    } else if (action === 'profile') {
      await saveProfile(safeNumber(body.walkGoal, 15, 1, 180));
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
    } else {
      return Response.json({ error: 'Unknown save action.' }, { status: 400 });
    }

    return Response.json({ saved: true });
  } catch (error) {
    console.error('Airtable state save failed', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({ error: 'Your change could not be saved right now.' }, { status: 503 });
  }
}
