import {
  airtableConfigured,
  createRecord,
  findRecord,
  formulaEquals,
  listRecords,
  updateRecord,
  updateRecords,
  upsertRecord,
  upsertRecords,
} from '@/lib/airtable';
import { buildWeeklyPlan, type PlannedMeal, recipeById } from '@/lib/plan';

export const PROFILE_KEY = 'alex';

export type PlanContentItem = {
  key: string;
  type: string;
  title: string;
  summary: string;
  benefits: string[];
  examples: string;
  nextMove: string;
  sortOrder: number;
};

export type DailyHistoryItem = {
  date: string;
  completed: string[];
  walkMinutes: number;
  sleepHours: number;
  meditationMinutes: number;
  mood: string;
};

export type WeightLogItem = {
  date: string;
  weight: number;
  unit: 'lb' | 'kg';
};

export type ProfileSettings = {
  walkGoal: number;
  goal: string;
  currentWeight: number;
  weightUnit: 'lb' | 'kg';
  dailyWeighing: boolean;
  sleepGoal: number;
  cookingMinutes: number;
  budget: string;
  animalProtein: string;
  allergies: string;
  mobilityNotes: string;
  onboarded: boolean;
};

export type DailyWellness = {
  sleepHours: number;
  sleepQuality: string;
  meditationMinutes: number;
  mood: string;
  digestion: string;
};

function text(value: unknown, maximum = 1000) {
  return String(value ?? '').trim().slice(0, maximum);
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function checked(value: unknown) {
  return value === true;
}

async function dataStep<T>(name: string, task: () => Promise<T>) {
  try {
    return await task();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown data error';
    throw new Error(`${name}: ${message}`);
  }
}

function completedFromFields(fields: Record<string, unknown>) {
  return [
    checked(fields.Water) ? 'water' : '',
    checked(fields.Walk) ? 'walk' : '',
    checked(fields.Reset) ? 'reset' : '',
    checked(fields.Mindset) ? 'mindset' : '',
  ].filter(Boolean);
}

function profileFromFields(fields: Record<string, unknown> = {}): ProfileSettings {
  return {
    walkGoal: number(fields['Walk Goal Minutes'], 15),
    goal: text(fields.Goal, 120) || 'Build steady healthy habits',
    currentWeight: number(fields['Current Weight']),
    weightUnit: fields['Weight Unit'] === 'kg' ? 'kg' : 'lb',
    dailyWeighing: fields['Daily Weighing'] !== false,
    sleepGoal: number(fields['Sleep Goal Hours'], 7.5),
    cookingMinutes: number(fields['Cooking Minutes'], 25),
    budget: text(fields.Budget, 40) || 'moderate',
    animalProtein: text(fields['Animal Protein'], 40) || 'optional',
    allergies: text(fields.Allergies, 500),
    mobilityNotes: text(fields['Mobility Notes'], 500),
    onboarded: checked(fields.Onboarded),
  };
}

export function validDateKey(value: unknown) {
  const date = text(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
}

export async function loadAppState(date: string, weekOf: string) {
  if (!airtableConfigured()) return { connected: false as const };

  const planKey = `${PROFILE_KEY}:${weekOf}`;
  const profileRecord = await dataStep('profile', () => findRecord('Profiles', 'Profile Key', PROFILE_KEY));
  const dailyRecords = await dataStep('daily', () => listRecords('Daily Check-ins', {
    filterByFormula: formulaEquals('Profile Key', PROFILE_KEY),
    maxRecords: 30,
    sort: [{ field: 'Date', direction: 'desc' }],
  }));
  const groceries = await dataStep('groceries', () => listRecords('Grocery Items', {
    filterByFormula: `AND(${formulaEquals('Profile Key', PROFILE_KEY)},${formulaEquals('Week Of', weekOf)})`,
    maxRecords: 100,
  }));
  const exchanges = await dataStep('coach', () => listRecords('Coach Exchanges', {
    filterByFormula: formulaEquals('Profile Key', PROFILE_KEY),
    maxRecords: 6,
    sort: [{ field: 'Created At', direction: 'desc' }],
  }));
  const content = await dataStep('content', () => listRecords('Plan Content', {
    filterByFormula: '{Active}=1',
    maxRecords: 100,
    sort: [{ field: 'Sort Order', direction: 'asc' }],
  }));
  const weightRecords = await dataStep('weights', () => listRecords('Weight Logs', {
    filterByFormula: formulaEquals('Profile Key', PROFILE_KEY),
    maxRecords: 30,
    sort: [{ field: 'Date', direction: 'desc' }],
  }));
  const plannedRecords = await dataStep('planned meals', () => listRecords('Planned Meals', {
    filterByFormula: formulaEquals('Plan Key', planKey),
    maxRecords: 100,
    sort: [{ field: 'Date', direction: 'asc' }, { field: 'Meal Slot', direction: 'asc' }],
  }));

  const profile = profileFromFields(profileRecord?.fields);
  const todayRecord = dailyRecords.find((record) => text(record.fields.Date, 10) === date);
  const history: DailyHistoryItem[] = dailyRecords.map((record) => ({
    date: text(record.fields.Date, 10),
    completed: completedFromFields(record.fields),
    walkMinutes: number(record.fields['Walk Minutes']),
    sleepHours: number(record.fields['Sleep Hours']),
    meditationMinutes: number(record.fields['Meditation Minutes']),
    mood: text(record.fields.Mood, 40),
  })).filter((item) => item.date);

  const messages = exchanges.slice().reverse().flatMap((record) => {
    const userMessage = text(record.fields['Alex Message'], 800);
    const coachReply = text(record.fields['Coach Reply'], 800);
    return [
      ...(userMessage ? [{ role: 'user' as const, text: userMessage }] : []),
      ...(coachReply ? [{ role: 'coach' as const, text: coachReply }] : []),
    ];
  });

  const planContent: PlanContentItem[] = content.map((record) => ({
    key: text(record.fields['Content Key'], 80),
    type: text(record.fields.Type, 40),
    title: text(record.fields.Title, 120),
    summary: text(record.fields.Summary, 1200),
    benefits: text(record.fields.Benefits, 2000).split('|').map((item) => item.trim()).filter(Boolean),
    examples: text(record.fields.Examples, 1200),
    nextMove: text(record.fields['Next Move'], 1200),
    sortOrder: number(record.fields['Sort Order']),
  })).filter((item) => item.key && item.title);

  const weightLogs: WeightLogItem[] = weightRecords.map((record) => ({
    date: text(record.fields.Date, 10),
    weight: number(record.fields.Weight),
    unit: record.fields.Unit === 'kg' ? 'kg' as const : 'lb' as const,
  })).filter((item) => item.date && item.weight > 0);

  const savedMeals: PlannedMeal[] = plannedRecords.map((record) => ({
    key: text(record.fields['Planned Meal Key'], 100),
    date: text(record.fields.Date, 10),
    slot: text(record.fields['Meal Slot'], 20) as PlannedMeal['slot'],
    recipeKey: text(record.fields['Recipe Key'], 100),
    removed: checked(record.fields.Removed),
  })).filter((item) => item.key && item.date && recipeById(item.recipeKey));

  const dailyWellness: DailyWellness = {
    sleepHours: number(todayRecord?.fields['Sleep Hours']),
    sleepQuality: text(todayRecord?.fields['Sleep Quality'], 40),
    meditationMinutes: number(todayRecord?.fields['Meditation Minutes']),
    mood: text(todayRecord?.fields.Mood, 40),
    digestion: text(todayRecord?.fields.Digestion, 40),
  };

  return {
    connected: true as const,
    profile,
    walkingStart: String(profile.walkGoal),
    completed: todayRecord ? completedFromFields(todayRecord.fields) : [],
    dailyWellness,
    checkedGroceries: groceries.filter((record) => checked(record.fields.Checked)).map((record) => text(record.fields['Item Name'], 200)).filter(Boolean),
    messages,
    history,
    planContent,
    weightLogs,
    weeklyMeals: savedMeals.length ? savedMeals : buildWeeklyPlan(weekOf, profile.animalProtein !== 'none'),
    planSaved: savedMeals.length > 0,
  };
}

export async function saveDaily(date: string, completed: string[], walkGoal: number, wellness: Partial<DailyWellness> = {}) {
  const allowed = new Set(completed.filter((item) => ['water', 'walk', 'reset', 'mindset'].includes(item)));
  const recordKey = `${PROFILE_KEY}:${date}`;
  return upsertRecord('Daily Check-ins', 'Record Key', recordKey, {
    'Record Key': recordKey,
    'Profile Key': PROFILE_KEY,
    Date: date,
    Water: allowed.has('water'),
    Walk: allowed.has('walk'),
    'Walk Minutes': allowed.has('walk') ? walkGoal : 0,
    Reset: allowed.has('reset'),
    Mindset: allowed.has('mindset'),
    'Sleep Hours': number(wellness.sleepHours),
    'Sleep Quality': text(wellness.sleepQuality, 40),
    'Meditation Minutes': number(wellness.meditationMinutes),
    Mood: text(wellness.mood, 40),
    Digestion: text(wellness.digestion, 40),
    'Updated At': new Date().toISOString(),
  });
}

export async function saveProfile(profile: ProfileSettings) {
  return upsertRecord('Profiles', 'Profile Key', PROFILE_KEY, {
    Name: 'Alex',
    'Profile Key': PROFILE_KEY,
    'Walk Goal Minutes': profile.walkGoal,
    Goal: text(profile.goal, 120),
    'Current Weight': profile.currentWeight || undefined,
    'Weight Unit': profile.weightUnit,
    'Daily Weighing': profile.dailyWeighing,
    'Sleep Goal Hours': profile.sleepGoal,
    'Cooking Minutes': profile.cookingMinutes,
    Budget: text(profile.budget, 40),
    'Animal Protein': text(profile.animalProtein, 40),
    Allergies: text(profile.allergies, 500),
    'Mobility Notes': text(profile.mobilityNotes, 500),
    Onboarded: profile.onboarded,
    Timezone: 'America/Chicago',
    Active: true,
    'Updated At': new Date().toISOString(),
  });
}

export async function saveWeight(date: string, weight: number, unit: 'lb' | 'kg') {
  const recordKey = `${PROFILE_KEY}:${date}`;
  await upsertRecord('Weight Logs', 'Record Key', recordKey, {
    'Record Key': recordKey,
    'Profile Key': PROFILE_KEY,
    Date: date,
    Weight: weight,
    Unit: unit,
    'Updated At': new Date().toISOString(),
  });
  const profile = await findRecord('Profiles', 'Profile Key', PROFILE_KEY);
  if (profile) await updateRecord('Profiles', profile.id, { 'Current Weight': weight, 'Weight Unit': unit, 'Updated At': new Date().toISOString() });
}

export async function saveWeeklyPlan(weekOf: string, meals: PlannedMeal[]) {
  const planKey = `${PROFILE_KEY}:${weekOf}`;
  const now = new Date().toISOString();
  await upsertRecord('Weekly Plans', 'Plan Key', planKey, {
    'Plan Key': planKey,
    'Profile Key': PROFILE_KEY,
    'Week Of': weekOf,
    Status: 'active',
    'Generated At': now,
    'Updated At': now,
  });
  await upsertRecords('Planned Meals', ['Planned Meal Key'], meals.map((meal) => ({
    'Planned Meal Key': meal.key,
    'Profile Key': PROFILE_KEY,
    'Plan Key': planKey,
    Date: meal.date,
    'Meal Slot': meal.slot,
    'Recipe Key': meal.recipeKey,
    Removed: meal.removed,
    'Updated At': now,
  })));
}

export async function savePlannedMeal(weekOf: string, meal: PlannedMeal) {
  const planKey = `${PROFILE_KEY}:${weekOf}`;
  return upsertRecord('Planned Meals', 'Planned Meal Key', meal.key, {
    'Planned Meal Key': meal.key,
    'Profile Key': PROFILE_KEY,
    'Plan Key': planKey,
    Date: meal.date,
    'Meal Slot': meal.slot,
    'Recipe Key': meal.recipeKey,
    Removed: meal.removed,
    'Updated At': new Date().toISOString(),
  });
}

export async function saveGrocery(input: {
  weekOf: string;
  item: string;
  category: string;
  quantity: string;
  isChecked: boolean;
  sortOrder: number;
}) {
  const itemKey = `${PROFILE_KEY}:${input.weekOf}:${input.item.toLowerCase()}`.slice(0, 500);
  return upsertRecord('Grocery Items', 'Item Key', itemKey, {
    'Item Key': itemKey,
    'Profile Key': PROFILE_KEY,
    'Week Of': input.weekOf,
    'Item Name': input.item,
    Category: input.category,
    Quantity: input.quantity,
    Checked: input.isChecked,
    Custom: false,
    'Sort Order': input.sortOrder,
    'Updated At': new Date().toISOString(),
  });
}

export async function clearGroceries(weekOf: string) {
  const records = await listRecords('Grocery Items', {
    filterByFormula: `AND(${formulaEquals('Profile Key', PROFILE_KEY)},${formulaEquals('Week Of', weekOf)})`,
    maxRecords: 100,
  });
  return updateRecords('Grocery Items', records.map((record) => ({
    id: record.id,
    fields: { Checked: false, 'Updated At': new Date().toISOString() },
  })));
}

export async function saveMeal(input: {
  meal: string;
  rating: string;
  headline: string;
  reason: string;
  better: string;
  gbombs: string[];
}) {
  const mealId = crypto.randomUUID();
  await createRecord('Meal Checks', {
    'Meal ID': mealId,
    'Profile Key': PROFILE_KEY,
    'Created At': new Date().toISOString(),
    Meal: text(input.meal, 500),
    Rating: ['green', 'yellow', 'red'].includes(input.rating) ? input.rating : 'yellow',
    Headline: text(input.headline, 160),
    Reason: text(input.reason, 500),
    'Better Choice': text(input.better, 500),
    'GBOMBS Present': input.gbombs.filter((item) => ['Greens', 'Beans', 'Onions', 'Mushrooms', 'Berries', 'Seeds and nuts', 'Seeds & nuts'].includes(item)),
    'Final Choice': 'not selected',
  });
  return mealId;
}

export async function saveMealChoice(mealId: string, choice: 'recommended' | 'original') {
  const record = await findRecord('Meal Checks', 'Meal ID', mealId);
  if (!record) throw new Error('Meal check not found');
  return updateRecord('Meal Checks', record.id, { 'Final Choice': choice });
}

export async function saveCoachExchange(userMessage: string, coachReply: string) {
  const lower = userMessage.toLowerCase();
  const topic = lower.includes('grocery') ? 'Groceries' : lower.includes('walk') ? 'Walking' : lower.includes('eat') || lower.includes('meal') || lower.includes('food') ? 'Food' : 'General';
  return createRecord('Coach Exchanges', {
    'Exchange ID': crypto.randomUUID(),
    'Profile Key': PROFILE_KEY,
    'Created At': new Date().toISOString(),
    'Alex Message': text(userMessage, 800),
    'Coach Reply': text(coachReply, 800),
    Topic: topic,
    'Follow Up': false,
  });
}

export async function saveAppEvent(category: string, event: string, value = 0, details = '') {
  return createRecord('App Events', {
    'Event Key': crypto.randomUUID(),
    'Profile Key': PROFILE_KEY,
    Category: text(category, 60),
    Event: text(event, 80),
    Value: value,
    Details: text(details, 500),
    'Created At': new Date().toISOString(),
  });
}

export async function saveSafetyEvent(level: string, topic: string, triggerText: string, guidance: string) {
  return createRecord('Safety Events', {
    'Event Key': crypto.randomUUID(),
    'Profile Key': PROFILE_KEY,
    Level: text(level, 40),
    Topic: text(topic, 80),
    'Trigger Text': text(triggerText, 800),
    'Guidance Shown': text(guidance, 800),
    'Created At': new Date().toISOString(),
  });
}

export async function loadCoachContext(date: string) {
  if (!airtableConfigured()) return '';
  const profileRecord = await findRecord('Profiles', 'Profile Key', PROFILE_KEY);
  const profile = profileFromFields(profileRecord?.fields);
  const [daily, meals, weights] = await Promise.all([
    findRecord('Daily Check-ins', 'Record Key', `${PROFILE_KEY}:${date}`),
    listRecords('Meal Checks', {
      filterByFormula: formulaEquals('Profile Key', PROFILE_KEY),
      maxRecords: 5,
      sort: [{ field: 'Created At', direction: 'desc' }],
    }),
    listRecords('Weight Logs', {
      filterByFormula: formulaEquals('Profile Key', PROFILE_KEY),
      maxRecords: 7,
      sort: [{ field: 'Date', direction: 'desc' }],
    }),
  ]);
  const wins = daily ? completedFromFields(daily.fields) : [];
  const recentMeals = meals.map((record) => `${text(record.fields.Meal, 100)} (${text(record.fields.Rating, 20)})`).join('; ');
  const recentWeights = weights.map((record) => number(record.fields.Weight)).filter(Boolean);
  const weightTrend = recentWeights.length > 1 ? recentWeights[0] - recentWeights[recentWeights.length - 1] : 0;
  return [
    `Goal: ${profile.goal}.`,
    `Walk goal: ${profile.walkGoal} minutes.`,
    `Weight unit: ${profile.weightUnit}.`,
    profile.allergies ? `Allergies or foods to avoid: ${profile.allergies}.` : '',
    profile.mobilityNotes ? `Movement notes: ${profile.mobilityNotes}.` : '',
    `Today's completed actions: ${wins.length ? wins.join(', ') : 'none yet'}.`,
    recentMeals ? `Recent meal checks: ${recentMeals}.` : '',
    recentWeights.length > 1 ? `Recent weight change across saved readings: ${weightTrend.toFixed(1)} ${profile.weightUnit}. Focus on the trend, not one reading.` : '',
  ].filter(Boolean).join(' ');
}
