import {
  airtableConfigured,
  createRecord,
  findRecord,
  formulaEquals,
  listRecords,
  updateRecord,
  updateRecords,
  upsertRecord,
} from '@/lib/airtable';

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

function completedFromFields(fields: Record<string, unknown>) {
  return [
    checked(fields.Water) ? 'water' : '',
    checked(fields.Walk) ? 'walk' : '',
    checked(fields.Reset) ? 'reset' : '',
    checked(fields.Mindset) ? 'mindset' : '',
  ].filter(Boolean);
}

export function validDateKey(value: unknown) {
  const date = text(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
}

export async function loadAppState(date: string, weekOf: string) {
  if (!airtableConfigured()) return { connected: false as const };

  const [profile, dailyRecords, groceries, exchanges, content] = await Promise.all([
    findRecord('Profiles', 'Profile Key', PROFILE_KEY),
    listRecords('Daily Check-ins', {
      filterByFormula: formulaEquals('Profile Key', PROFILE_KEY),
      maxRecords: 14,
      sort: [{ field: 'Date', direction: 'desc' }],
    }),
    listRecords('Grocery Items', {
      filterByFormula: `AND(${formulaEquals('Profile Key', PROFILE_KEY)},${formulaEquals('Week Of', weekOf)})`,
      maxRecords: 100,
    }),
    listRecords('Coach Exchanges', {
      filterByFormula: formulaEquals('Profile Key', PROFILE_KEY),
      maxRecords: 6,
      sort: [{ field: 'Created At', direction: 'desc' }],
    }),
    listRecords('Plan Content', {
      filterByFormula: '{Active}=1',
      maxRecords: 100,
      sort: [{ field: 'Sort Order', direction: 'asc' }],
    }),
  ]);

  const todayRecord = dailyRecords.find((record) => text(record.fields.Date, 10) === date);
  const history: DailyHistoryItem[] = dailyRecords.map((record) => ({
    date: text(record.fields.Date, 10),
    completed: completedFromFields(record.fields),
    walkMinutes: number(record.fields['Walk Minutes']),
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

  return {
    connected: true as const,
    walkingStart: String(number(profile?.fields['Walk Goal Minutes'], 15)),
    completed: todayRecord ? completedFromFields(todayRecord.fields) : [],
    checkedGroceries: groceries.filter((record) => checked(record.fields.Checked)).map((record) => text(record.fields['Item Name'], 200)).filter(Boolean),
    messages,
    history,
    planContent,
  };
}

export async function saveDaily(date: string, completed: string[], walkGoal: number) {
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
    'Updated At': new Date().toISOString(),
  });
}

export async function saveProfile(walkGoal: number) {
  return upsertRecord('Profiles', 'Profile Key', PROFILE_KEY, {
    Name: 'Alex',
    'Profile Key': PROFILE_KEY,
    'Walk Goal Minutes': walkGoal,
    Timezone: 'America/Chicago',
    Active: true,
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
    'GBOMBS Present': input.gbombs.filter((item) => ['Greens', 'Beans', 'Onions', 'Mushrooms', 'Berries', 'Seeds & nuts'].includes(item)),
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

export async function loadCoachContext(date: string) {
  if (!airtableConfigured()) return '';
  const [profile, daily, meals] = await Promise.all([
    findRecord('Profiles', 'Profile Key', PROFILE_KEY),
    findRecord('Daily Check-ins', 'Record Key', `${PROFILE_KEY}:${date}`),
    listRecords('Meal Checks', {
      filterByFormula: formulaEquals('Profile Key', PROFILE_KEY),
      maxRecords: 5,
      sort: [{ field: 'Created At', direction: 'desc' }],
    }),
  ]);
  const wins = daily ? completedFromFields(daily.fields) : [];
  const recentMeals = meals.map((record) => `${text(record.fields.Meal, 120)} (${text(record.fields.Rating, 20)})`).join('; ');
  return [
    `Walk goal: ${number(profile?.fields['Walk Goal Minutes'], 15)} minutes.`,
    `Today's completed wins: ${wins.length ? wins.join(', ') : 'none yet'}.`,
    recentMeals ? `Recent meal checks: ${recentMeals}.` : '',
  ].filter(Boolean).join(' ');
}
