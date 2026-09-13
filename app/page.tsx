'use client';

import {
  Activity, ArrowRight, BookOpen, Bot, Brain, Check, ChevronRight,
  CircleUserRound, Clock3, Droplets, Footprints, Home, Leaf, LogOut, MoonStar,
  RefreshCw, Scale, Send, ShoppingBasket, Sparkles, Sprout, TrendingUp,
  Utensils, X,
} from 'lucide-react';
import Image from 'next/image';
import { SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { DailyHistoryItem, DailyWellness, PlanContentItem, ProfileSettings, WeightLogItem } from '@/lib/alex-data';
import { chicagoDateKey, weekStartKey } from '@/lib/dates';
import {
  buildWeeklyPlan, FINISH_MESSAGES, groceryListFor, OPENING_MESSAGES, type PlannedMeal,
  type Recipe, recipeById, replacementFor,
} from '@/lib/plan';

type Tab = 'today' | 'plan' | 'progress';
type PlanView = 'meals' | 'groceries' | 'learn';
type Rating = 'green' | 'yellow' | 'red';
type SyncStatus = 'loading' | 'saving' | 'saved' | 'offline';
type AccessStatus = 'checking' | 'locked' | 'open';
type MealResult = { rating: Rating; label: string; headline: string; reason: string; better: string; gbombs: string[] };
type ChatMessage = { role: 'user' | 'coach'; text: string };
type LearningTopic = { title: string; short: string; body: string; action: string; tone: string };

const DEFAULT_PROFILE: ProfileSettings = {
  walkGoal: 15,
  goal: 'Build steady healthy habits',
  currentWeight: 0,
  weightUnit: 'lb',
  dailyWeighing: true,
  sleepGoal: 7.5,
  cookingMinutes: 25,
  budget: 'moderate',
  animalProtein: 'optional',
  allergies: '',
  mobilityNotes: '',
  onboarded: false,
};

const DEFAULT_WELLNESS: DailyWellness = {
  sleepHours: 0,
  sleepQuality: '',
  meditationMinutes: 0,
  mood: '',
  digestion: '',
};

const habits = [
  { id: 'water', pillar: 'Fuel', icon: Droplets, title: 'Start with water', note: 'Drink one glass before your next meal.' },
  { id: 'walk', pillar: 'Move', icon: Footprints, title: 'Take your walk', note: 'A comfortable walk is real progress.' },
  { id: 'reset', pillar: 'Recover', icon: MoonStar, title: 'Reset for 15 minutes', note: 'Sit, breathe, and let your body slow down.' },
  { id: 'mindset', pillar: 'Mindset', icon: Brain, title: 'Say today’s thought', note: 'I can make my next choice a good one.' },
];

const learningTopics: LearningTopic[] = [
  {
    title: 'The house picture',
    short: 'Protein, carbs, and fat in simple words.',
    body: 'Protein is the building and repair material. Carbs are the ready energy crew. Fat is the backup battery, protection, and part of your body. Your body can use carbs and fat at the same time.',
    action: 'Build meals with a protein, a plant, and a useful energy source.',
    tone: 'green',
  },
  {
    title: 'GBOMBS',
    short: 'Six plant groups that make meals stronger.',
    body: 'GBOMBS means greens, beans, onions, mushrooms, berries, and seeds or nuts. You do not need all six at once. Add one or two to a meal you already know.',
    action: 'Add one colorful plant to your next meal.',
    tone: 'lime',
  },
  {
    title: 'Drinks made simple',
    short: 'Water first. Whole fruit more often than juice.',
    body: 'Water is the normal first choice. Plain sparkling water is also fine. Regular soda can add a lot of sugar without helping you feel full. Whole fruit usually keeps more fiber than juice.',
    action: 'Pour water before your next meal.',
    tone: 'blue',
  },
  {
    title: 'Digestion check',
    short: 'Track comfort instead of timing every food.',
    body: 'Food moves through each person at a different speed. Notice whether your stool feels comfortable, too loose, or too hard. Strong pain, blood, fever, or a lasting problem needs medical care.',
    action: 'Use the simple digestion check in Today.',
    tone: 'gold',
  },
  {
    title: 'Beginner strength',
    short: 'Prepare your body before hard exercise.',
    body: 'Start with chair squats, wall push-ups, supported rows, step-ups, and gentle core work. Full push-ups, pull-ups, and hard intervals come later when your body is ready.',
    action: 'Master easy form before adding more work.',
    tone: 'rose',
  },
  {
    title: 'Weight is a trend',
    short: 'One reading is information, not a verdict.',
    body: 'Body weight can move from water, salt, food, and normal body changes. Look at the seven-day direction. Do not punish yourself for one higher number.',
    action: 'Log honestly, then return to today’s actions.',
    tone: 'violet',
  },
];

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function displayDay(date: string, long = false) {
  return new Intl.DateTimeFormat('en-US', long
    ? { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' }
    : { weekday: 'short', day: 'numeric', timeZone: 'UTC' }
  ).format(new Date(`${date}T12:00:00Z`));
}

function weekdayLabel(date: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`));
}

function cleanNaturalText(text: string, maximum = 50) {
  const clean = text
    .replace(/```(?:\w+)?/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-+*]\s+/gm, '')
    .replace(/(?:^|\s)\d+[.)]\s+/g, ' ')
    .replace(/\*\*|__/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s*[\u2013\u2014]\s*/g, '. ')
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/([.!?])(?=[A-Za-z])/g, '$1 ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= maximum) return clean;
  const shortened = words.slice(0, maximum).join(' ').replace(/[,;:]$/, '');
  return /[.!?]$/.test(shortened) ? shortened : `${shortened}.`;
}

function AppLogo() {
  return <Image className="app-logo" src="/alex-logo.png" alt="" width={44} height={44} priority />;
}

function WeightChart({ logs, unit }: { logs: WeightLogItem[]; unit: string }) {
  const points = [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  if (points.length < 2) return <div className="empty-chart"><TrendingUp size={24} /><p>Add two weight entries to see your trend.</p></div>;
  const values = points.map((item) => item.weight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const path = points.map((item, index) => {
    const x = points.length === 1 ? 50 : 6 + (index / (points.length - 1)) * 88;
    const y = 84 - ((item.weight - min) / range) * 65;
    return `${x},${y}`;
  }).join(' ');
  return (
    <div className="weight-chart">
      <svg viewBox="0 0 100 100">
        <title>Recent weight trend</title>
        <line x1="6" y1="84" x2="94" y2="84" />
        <polyline points={path} />
        {points.map((item, index) => {
          const x = points.length === 1 ? 50 : 6 + (index / (points.length - 1)) * 88;
          const y = 84 - ((item.weight - min) / range) * 65;
          return <circle key={item.date} cx={x} cy={y} r="2.2" />;
        })}
      </svg>
      <div><span>{points[0].weight.toFixed(1)} {unit}</span><span>{points.at(-1)?.weight.toFixed(1)} {unit}</span></div>
    </div>
  );
}

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('today');
  const [planView, setPlanView] = useState<PlanView>('meals');
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('checking');
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [accessLoading, setAccessLoading] = useState(false);
  const [privateAccess, setPrivateAccess] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [profile, setProfile] = useState<ProfileSettings>(DEFAULT_PROFILE);
  const [completed, setCompleted] = useState<string[]>([]);
  const [wellness, setWellness] = useState<DailyWellness>(DEFAULT_WELLNESS);
  const [history, setHistory] = useState<DailyHistoryItem[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLogItem[]>([]);
  const [weightInput, setWeightInput] = useState('');
  const [weeklyMeals, setWeeklyMeals] = useState<PlannedMeal[]>([]);
  const [planSaved, setPlanSaved] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [checkedGroceries, setCheckedGroceries] = useState<string[]>([]);
  const [planContent, setPlanContent] = useState<PlanContentItem[]>([]);
  const [meal, setMeal] = useState('');
  const [mealResult, setMealResult] = useState<MealResult | null>(null);
  const [mealLoading, setMealLoading] = useState(false);
  const [mealChoice, setMealChoice] = useState<'recommended' | 'original' | null>(null);
  const [mealRecordId, setMealRecordId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'coach', text: 'Hi Alex. I can help with food, movement, rest, or your next choice. If anything is unclear, ask me another question.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [coachContext, setCoachContext] = useState('General coaching');
  const [showCoach, setShowCoach] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<LearningTopic | null>(null);
  const [openingMessage, setOpeningMessage] = useState(OPENING_MESSAGES[0]);
  const [finishMessage, setFinishMessage] = useState(FINISH_MESSAGES[0]);
  const weightRef = useRef<HTMLInputElement>(null);
  const dateKey = useMemo(() => chicagoDateKey(), []);
  const weekOf = useMemo(() => weekStartKey(dateKey), [dateKey]);

  const saveState = useCallback(async (payload: Record<string, unknown>, showSaving = true) => {
    if (showSaving) setSyncStatus('saving');
    try {
      const response = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Save unavailable');
      if (showSaving) setSyncStatus('saved');
      return await response.json() as { saved?: boolean; mealId?: string };
    } catch {
      if (showSaving) setSyncStatus('offline');
      return null;
    }
  }, []);

  useEffect(() => {
    const index = Number(sessionStorage.getItem('alex-open-count') || '0');
    queueMicrotask(() => {
      setSelectedDay(dateKey);
      setOpeningMessage(OPENING_MESSAGES[index % OPENING_MESSAGES.length]);
    });
    sessionStorage.setItem('alex-open-count', String(index + 1));
    navigator.serviceWorker?.register('/sw.js').catch(() => undefined);

    const saved = localStorage.getItem('alex-health-plan-v2');
    if (saved) {
      try {
        const data = JSON.parse(saved) as Record<string, unknown>;
        queueMicrotask(() => {
          if (data.profile) setProfile({ ...DEFAULT_PROFILE, ...(data.profile as ProfileSettings) });
          if (Array.isArray(data.completed)) setCompleted(data.completed as string[]);
          if (data.wellness) setWellness({ ...DEFAULT_WELLNESS, ...(data.wellness as DailyWellness) });
          if (Array.isArray(data.weightLogs)) setWeightLogs(data.weightLogs as WeightLogItem[]);
          if (Array.isArray(data.weeklyMeals)) setWeeklyMeals(data.weeklyMeals as PlannedMeal[]);
          if (Array.isArray(data.checkedGroceries)) setCheckedGroceries(data.checkedGroceries as string[]);
        });
      } catch {
        // Safe defaults stay active.
      }
    }

    void (async () => {
      try {
        const response = await fetch('/api/access', { cache: 'no-store' });
        const data = await response.json() as { authorized?: boolean; privateAccess?: boolean };
        setPrivateAccess(data.privateAccess === true);
        setAccessStatus(data.authorized ? 'open' : 'locked');
      } catch {
        setAccessStatus('locked');
      }
    })();
  }, [dateKey]);

  useEffect(() => {
    if (accessStatus !== 'open') return;
    void (async () => {
      try {
        const response = await fetch(`/api/state?date=${encodeURIComponent(dateKey)}&weekOf=${encodeURIComponent(weekOf)}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Sync unavailable');
        const data = await response.json() as {
          connected?: boolean;
          profile?: ProfileSettings;
          completed?: string[];
          dailyWellness?: DailyWellness;
          checkedGroceries?: string[];
          messages?: ChatMessage[];
          history?: DailyHistoryItem[];
          planContent?: PlanContentItem[];
          weightLogs?: WeightLogItem[];
          weeklyMeals?: PlannedMeal[];
          planSaved?: boolean;
        };
        if (!data.connected) throw new Error('Sync unavailable');
        const nextProfile = { ...DEFAULT_PROFILE, ...data.profile };
        setProfile(nextProfile);
        setCompleted(Array.isArray(data.completed) ? data.completed : []);
        setWellness({ ...DEFAULT_WELLNESS, ...data.dailyWellness });
        setCheckedGroceries(Array.isArray(data.checkedGroceries) ? data.checkedGroceries : []);
        if (Array.isArray(data.messages) && data.messages.length) setMessages(data.messages);
        setHistory(Array.isArray(data.history) ? data.history : []);
        setPlanContent(Array.isArray(data.planContent) ? data.planContent : []);
        setWeightLogs(Array.isArray(data.weightLogs) ? data.weightLogs : []);
        const meals = Array.isArray(data.weeklyMeals) && data.weeklyMeals.length
          ? data.weeklyMeals
          : buildWeeklyPlan(weekOf, nextProfile.animalProtein !== 'none');
        setWeeklyMeals(meals);
        setPlanSaved(data.planSaved === true);
        setShowWelcome(!nextProfile.onboarded);
        setSyncStatus('saved');
        void saveState({ action: 'event', category: 'Experience', event: 'app_opened' }, false);
        if (!data.planSaved && nextProfile.onboarded) {
          void saveState({ action: 'weeklyPlan', weekOf, meals }, false);
          setPlanSaved(true);
        }
      } catch {
        setSyncStatus('offline');
        setWeeklyMeals((current) => current.length ? current : buildWeeklyPlan(weekOf));
      }
    })();
  }, [accessStatus, dateKey, saveState, weekOf]);

  useEffect(() => {
    localStorage.setItem('alex-health-plan-v2', JSON.stringify({
      profile,
      completed,
      wellness,
      weightLogs: weightLogs.slice(0, 30),
      weeklyMeals,
      checkedGroceries,
    }));
  }, [profile, completed, wellness, weightLogs, weeklyMeals, checkedGroceries]);

  async function unlockApp(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (accessCode.length !== 6 || accessLoading) return;
    setAccessLoading(true);
    setAccessError('');
    try {
      const response = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode }),
      });
      const data = await response.json() as { authorized?: boolean; error?: string };
      if (!response.ok || !data.authorized) throw new Error(data.error || 'That code is not correct.');
      setAccessStatus('open');
      setAccessCode('');
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : 'That code is not correct.');
    }
    setAccessLoading(false);
  }

  async function signOut() {
    try {
      await fetch('/api/access', { method: 'DELETE' });
    } finally {
      localStorage.removeItem('alex-health-plan-v2');
      setShowProfile(false);
      setAccessStatus('locked');
    }
  }

  function saveDaily(nextCompleted = completed, nextWellness = wellness) {
    setHistory((current) => [{
      date: dateKey,
      completed: nextCompleted,
      walkMinutes: nextCompleted.includes('walk') ? profile.walkGoal : 0,
      sleepHours: nextWellness.sleepHours,
      meditationMinutes: nextWellness.meditationMinutes,
      mood: nextWellness.mood,
    }, ...current.filter((item) => item.date !== dateKey)]);
    void saveState({ action: 'daily', date: dateKey, completed: nextCompleted, walkGoal: profile.walkGoal, wellness: nextWellness });
  }

  function toggleHabit(id: string) {
    const next = completed.includes(id) ? completed.filter((item) => item !== id) : [...completed, id];
    setCompleted(next);
    saveDaily(next, wellness);
    void saveState({ action: 'event', category: 'Action', event: completed.includes(id) ? 'action_unchecked' : 'action_completed', details: id }, false);
  }

  function updateWellness(patch: Partial<DailyWellness>) {
    const next = { ...wellness, ...patch };
    setWellness(next);
    saveDaily(completed, next);
  }

  async function saveWeight(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(weightInput);
    if (!Number.isFinite(value) || value < 50 || value > 1500) return;
    const nextLog: WeightLogItem = { date: dateKey, weight: Math.round(value * 10) / 10, unit: profile.weightUnit };
    setWeightLogs((current) => [nextLog, ...current.filter((item) => item.date !== dateKey)]);
    setProfile((current) => ({ ...current, currentWeight: nextLog.weight }));
    setWeightInput('');
    await saveState({ action: 'weight', date: dateKey, weight: nextLog.weight, unit: nextLog.unit });
    void saveState({ action: 'event', category: 'Progress', event: 'weight_logged', value: nextLog.weight }, false);
  }

  async function saveProfileSettings(nextProfile: ProfileSettings, close = true) {
    const ready = { ...nextProfile, onboarded: true };
    const shouldRefreshPlan = !profile.onboarded || ready.animalProtein !== profile.animalProtein;
    setProfile(ready);
    await saveState({ action: 'profile', profile: ready });
    if (shouldRefreshPlan) {
      const freshMeals = buildWeeklyPlan(weekOf, ready.animalProtein !== 'none');
      setWeeklyMeals(freshMeals);
      setPlanSaved(true);
      await saveState({ action: 'weeklyPlan', weekOf, meals: freshMeals });
    }
    if (ready.currentWeight > 0 && !weightLogs.some((item) => item.date === dateKey)) {
      const log = { date: dateKey, weight: ready.currentWeight, unit: ready.weightUnit } as WeightLogItem;
      setWeightLogs((current) => [log, ...current.filter((item) => item.date !== dateKey)]);
      await saveState({ action: 'weight', ...log });
    }
    if (close) {
      setShowWelcome(false);
      setShowProfile(false);
    }
  }

  async function checkMeal(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!meal.trim() || mealLoading) return;
    setMealLoading(true);
    setMealChoice(null);
    setMealRecordId('');
    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'meal', message: meal }),
      });
      if (!response.ok) throw new Error('Coach unavailable');
      const data = await response.json() as { result?: MealResult };
      if (!data.result) throw new Error('No result');
      const result = { ...data.result, reason: cleanNaturalText(data.result.reason, 18), better: cleanNaturalText(data.result.better, 20) };
      setMealResult(result);
      const saved = await saveState({ action: 'meal', meal: meal.trim(), result });
      if (saved?.mealId) setMealRecordId(saved.mealId);
    } catch {
      setMealResult({
        rating: 'yellow',
        label: 'Check it',
        headline: 'Make one simple upgrade.',
        reason: 'Add a plant, a protein, and water when you can.',
        better: 'Choose water and add one vegetable or bean.',
        gbombs: [],
      });
    }
    setMealLoading(false);
  }

  function chooseMeal(choice: 'recommended' | 'original') {
    setMealChoice(choice);
    if (mealRecordId) void saveState({ action: 'mealChoice', mealId: mealRecordId, choice });
    void saveState({ action: 'event', category: 'Meal', event: 'meal_choice', details: choice }, false);
  }

  function openCoach(context: string, starter = '') {
    setCoachContext(context);
    setChatInput(starter);
    setShowCoach(true);
  }

  async function sendChat(event?: SyntheticEvent<HTMLFormElement>) {
    event?.preventDefault();
    const clean = chatInput.trim();
    if (!clean || chatLoading) return;
    const nextMessages = [...messages, { role: 'user' as const, text: clean }];
    setMessages(nextMessages);
    setChatInput('');
    setChatLoading(true);
    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'chat', message: clean, history: nextMessages.slice(-6), context: coachContext }),
      });
      if (!response.ok) throw new Error('Coach offline');
      const data = await response.json() as { text?: string };
      setMessages((current) => [...current, { role: 'coach', text: cleanNaturalText(data.text || 'Ask me that another way, Alex.') }]);
    } catch {
      setMessages((current) => [...current, { role: 'coach', text: 'The coach is taking a short break. Use your saved plan, or ask again in a moment.' }]);
    }
    setChatLoading(false);
  }

  function updatePlannedMeal(mealToSave: PlannedMeal) {
    setWeeklyMeals((current) => current.map((item) => item.key === mealToSave.key ? mealToSave : item));
    void saveState({ action: 'plannedMeal', weekOf, meal: mealToSave });
  }

  function removeOrRestoreMeal(item: PlannedMeal) {
    updatePlannedMeal({ ...item, removed: !item.removed });
    void saveState({ action: 'event', category: 'Plan', event: item.removed ? 'meal_restored' : 'meal_removed', details: item.slot }, false);
  }

  function replaceMeal(item: PlannedMeal) {
    const replacement = replacementFor(item, weeklyMeals, profile.animalProtein !== 'none');
    if (!replacement) return;
    updatePlannedMeal({ ...item, recipeKey: replacement.id, removed: false });
    void saveState({ action: 'event', category: 'Plan', event: 'meal_replaced', details: item.slot }, false);
  }

  function toggleGrocery(item: string, category: string, amount: string, sortOrder: number) {
    const checked = !checkedGroceries.includes(item);
    setCheckedGroceries((current) => checked ? [...current, item] : current.filter((entry) => entry !== item));
    void saveState({ action: 'grocery', weekOf, item, category, quantity: amount, checked, sortOrder });
  }

  function finishToday() {
    const nextIndex = (completed.length + new Date().getDate()) % FINISH_MESSAGES.length;
    setFinishMessage(FINISH_MESSAGES[nextIndex]);
    setShowFinish(true);
    void saveState({ action: 'event', category: 'Experience', event: 'day_finished', value: completed.length }, false);
  }

  const todayWeight = weightLogs.find((item) => item.date === dateKey);
  const openingProgress = Math.round((completed.length / habits.length) * 100);
  const nextAction = !todayWeight && profile.dailyWeighing
    ? { title: 'Log today’s weight', note: 'Use the number as information. The trend matters most.', action: () => weightRef.current?.focus(), label: 'Log weight', icon: Scale }
    : !completed.includes('water')
      ? { title: 'Start with one glass of water', note: 'A small action starts the day.', action: () => document.getElementById('daily-actions')?.scrollIntoView({ behavior: 'smooth' }), label: 'Show action', icon: Droplets }
      : !completed.includes('walk')
        ? { title: `Walk for ${profile.walkGoal} minutes`, note: 'Keep a pace that feels steady and safe.', action: () => document.getElementById('daily-actions')?.scrollIntoView({ behavior: 'smooth' }), label: 'Show action', icon: Footprints }
        : !completed.includes('reset')
          ? { title: 'Take a quiet reset', note: 'Sit and breathe for a few minutes.', action: () => document.getElementById('daily-actions')?.scrollIntoView({ behavior: 'smooth' }), label: 'Show action', icon: MoonStar }
          : { title: 'Finish today with a good thought', note: 'Notice what worked and let your body rest.', action: finishToday, label: 'Finish today', icon: Sparkles };
  const NextIcon = nextAction.icon;

  const todayMeals = weeklyMeals.filter((item) => item.date === dateKey);
  const selectedMeals = weeklyMeals.filter((item) => item.date === selectedDay);
  const groceryItems = useMemo(() => groceryListFor(weeklyMeals), [weeklyMeals]);
  const groceryGroups = useMemo(() => ['Produce', 'Beans and protein', 'Grains', 'Nuts and seeds', 'Drinks and pantry'].map((category) => ({
    category,
    items: groceryItems.filter((item) => item.category === category),
  })).filter((group) => group.items.length), [groceryItems]);
  const lastSevenHistory = [
    { date: dateKey, completed, walkMinutes: completed.includes('walk') ? profile.walkGoal : 0, sleepHours: wellness.sleepHours, meditationMinutes: wellness.meditationMinutes, mood: wellness.mood },
    ...history.filter((item) => item.date !== dateKey),
  ].slice(0, 7);
  const healthyRate = lastSevenHistory.length
    ? Math.round(lastSevenHistory.reduce((total, item) => total + item.completed.length, 0) / (lastSevenHistory.length * habits.length) * 100)
    : 0;
  const walkingTotal = lastSevenHistory.reduce((total, item) => total + item.walkMinutes, 0);
  const recentWeights = [...weightLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  const averageWeight = recentWeights.length ? recentWeights.reduce((total, item) => total + item.weight, 0) / recentWeights.length : 0;

  if (accessStatus === 'checking') {
    return <main className="access-shell"><section className="access-card loading-card"><AppLogo /><span className="loader" /><p>Opening your plan</p></section></main>;
  }

  if (accessStatus === 'locked') {
    return (
      <main className="access-shell">
        <section className="access-card">
          <AppLogo />
          <p className="eyebrow">ALEX HEALTH PLAN</p>
          <h1>Welcome, Alex.</h1>
          <p>Your plan and progress are private. Enter your six-digit code.</p>
          <form onSubmit={unlockApp}>
            <input value={accessCode} onChange={(event) => setAccessCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" aria-label="Private access code" placeholder="6-digit code" maxLength={6} />
            <Button type="submit" className="primary-button" disabled={accessCode.length !== 6 || accessLoading}>{accessLoading ? 'Checking' : 'Open my plan'}</Button>
          </form>
          {accessError && <p className="form-error" role="alert">{accessError}</p>}
          <small>No account or ChatGPT sign-in is needed.</small>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="app-frame">
        <header className="topbar">
          <button className="brand" onClick={() => setTab('today')} aria-label="Open Today"><AppLogo /><span><strong>Alex Health Plan</strong><small>One good choice at a time</small></span></button>
          <div className="top-actions">
            <button className="coach-button" onClick={() => openCoach(`Current screen: ${tab}.`, 'What should I do next?')}><Bot size={18} /><span>Coach</span></button>
            <button className="profile-button" onClick={() => setShowProfile(true)} aria-label="Open settings"><CircleUserRound size={23} /></button>
          </div>
        </header>

        <div className="screen" key={tab}>
          {syncStatus === 'offline' && <div className="sync-notice">Saved on this phone. Online sync will try again.</div>}
          {tab === 'today' && <>
            <section className="page-intro">
              <div><p className="eyebrow">{displayDay(dateKey, true).toUpperCase()}</p><h1>Good to see you, Alex.</h1></div>
              <span className="daily-score">{openingProgress}%</span>
            </section>

            <section className="motivation-card"><Sparkles size={18} /><p>{openingMessage}</p></section>

            <section className="next-card">
              <div className="next-icon"><NextIcon size={23} /></div>
              <div><p className="eyebrow">NEXT BEST ACTION</p><h2>{nextAction.title}</h2><p>{nextAction.note}</p></div>
              <button onClick={nextAction.action}>{nextAction.label}<ArrowRight size={17} /></button>
            </section>

            <section className="section-block weight-entry">
              <div className="section-title"><div><p className="eyebrow">PROGRESS</p><h2>Today’s weight</h2></div>{todayWeight && <span className="saved-pill"><Check size={13} /> Saved</span>}</div>
              <form onSubmit={saveWeight}>
                <div className="weight-field"><Scale size={19} /><input ref={weightRef} value={weightInput} onChange={(event) => setWeightInput(event.target.value.replace(/[^0-9.]/g, '').slice(0, 6))} inputMode="decimal" placeholder={todayWeight ? todayWeight.weight.toFixed(1) : 'Enter weight'} aria-label="Today’s weight" /><span>{profile.weightUnit}</span></div>
                <button disabled={!weightInput}>Save</button>
              </form>
              <p>One number is not a verdict. We use the seven-day trend.</p>
            </section>

            <section className="section-block meal-check-card">
              <div className="section-title"><div><p className="eyebrow">BEFORE YOU EAT</p><h2>Check a meal</h2></div><Utensils size={20} /></div>
              <p>Tell the coach what you plan to eat. You will get one honest recommendation.</p>
              <form onSubmit={checkMeal}><input value={meal} onChange={(event) => setMeal(event.target.value)} placeholder="Type your meal here" maxLength={500} /><button disabled={!meal.trim() || mealLoading}>{mealLoading ? <span className="loader" /> : <ArrowRight size={19} />}</button></form>
              {mealResult && <div className={`meal-result ${mealResult.rating}`}>
                <div className="result-label"><span />{mealResult.label}<button onClick={() => setMealResult(null)} aria-label="Close"><X size={16} /></button></div>
                <h3>{mealResult.headline}</h3><p>{mealResult.reason}</p>
                <div className="best-move"><small>YOUR BEST MOVE</small><strong>{mealResult.better}</strong></div>
                {mealResult.gbombs.length > 0 && <p className="gbombs-found"><Leaf size={14} /> GBOMBS found: {mealResult.gbombs.join(', ')}</p>}
                <div className="choice-row"><button className={mealChoice === 'recommended' ? 'selected' : ''} onClick={() => chooseMeal('recommended')}>I will improve it</button><button className={mealChoice === 'original' ? 'selected' : ''} onClick={() => chooseMeal('original')}>I will keep it</button></div>
                <button className="ask-link" onClick={() => openCoach(`Meal check: ${meal}. Rating: ${mealResult.label}.`, 'Why did this meal get this result?')}>Ask why <ChevronRight size={15} /></button>
              </div>}
            </section>

            <section className="section-block today-meals">
              <div className="section-title"><div><p className="eyebrow">FUEL</p><h2>Today’s meals</h2></div><button className="text-button" onClick={() => { setTab('plan'); setPlanView('meals'); setSelectedDay(dateKey); }}>View plan</button></div>
              <div className="compact-list">{todayMeals.filter((item) => !item.removed).map((item) => {
                const recipe = recipeById(item.recipeKey);
                if (!recipe) return null;
                return <button key={item.key} onClick={() => setSelectedRecipe(recipe)}><span className={`slot-icon ${item.slot}`}><Utensils size={17} /></span><span><small>{item.slot}</small><strong>{recipe.name}</strong></span><span className="time"><Clock3 size={13} />{recipe.minutes} min</span><ChevronRight size={16} /></button>;
              })}</div>
            </section>

            <section id="daily-actions" className="section-block">
              <div className="section-title"><div><p className="eyebrow">MOVE, RECOVER, MINDSET</p><h2>Today’s actions</h2></div><span>{completed.length} of {habits.length}</span></div>
              <div className="action-list">{habits.map((habit) => {
                const Icon = habit.icon;
                const done = completed.includes(habit.id);
                const title = habit.id === 'walk' ? `Walk ${profile.walkGoal} minutes` : habit.title;
                return <button key={habit.id} className={done ? 'done' : ''} onClick={() => toggleHabit(habit.id)}><span className="action-icon"><Icon size={20} /></span><span><small>{habit.pillar}</small><strong>{title}</strong><em>{habit.note}</em></span><span className="action-check">{done && <Check size={15} />}</span></button>;
              })}</div>
            </section>

            <section className="section-block quick-check">
              <div className="section-title"><div><p className="eyebrow">HOW YOUR BODY FEELS</p><h2>Quick check</h2></div></div>
              <label>Sleep last night<div className="inline-options">{['6', '7', '8', '9'].map((hours) => <button key={hours} className={wellness.sleepHours === Number(hours) ? 'selected' : ''} onClick={() => updateWellness({ sleepHours: Number(hours) })}>{hours} hr</button>)}</div></label>
              <label>Digestion<div className="inline-options three">{['Comfortable', 'Too loose', 'Too hard'].map((value) => <button key={value} className={wellness.digestion === value ? 'selected' : ''} onClick={() => updateWellness({ digestion: value })}>{value}</button>)}</div></label>
              <button className="ask-link" onClick={() => openCoach(`Wellness check. Sleep: ${wellness.sleepHours || 'not logged'} hours. Digestion: ${wellness.digestion || 'not logged'}.`, 'Help me understand today’s check.')}>Ask Coach about this <ChevronRight size={15} /></button>
            </section>

            <button className="finish-button" onClick={finishToday}><Sparkles size={18} /> Finish for today</button>
            <p className="safety-note">Stop exercise and seek care for chest pain, fainting, or severe breathing trouble.</p>
          </>}

          {tab === 'plan' && <>
            <section className="simple-heading"><p className="eyebrow">YOUR WEEK</p><h1>Plan</h1><p>Choose your meals. Your grocery list updates for you.</p></section>
            <div className="segmented"><button className={planView === 'meals' ? 'active' : ''} onClick={() => setPlanView('meals')}>Meals</button><button className={planView === 'groceries' ? 'active' : ''} onClick={() => setPlanView('groceries')}>Groceries</button><button className={planView === 'learn' ? 'active' : ''} onClick={() => setPlanView('learn')}>Learn</button></div>

            {planView === 'meals' && <>
              <div className="day-strip">{Array.from({ length: 7 }, (_, index) => addDays(weekOf, index)).map((date) => <button key={date} className={selectedDay === date ? 'active' : ''} onClick={() => setSelectedDay(date)} aria-label={displayDay(date, true)}><small>{weekdayLabel(date)}</small><strong>{date.slice(-2)}</strong>{date === dateKey && <i />}</button>)}</div>
              <div className="plan-date-row"><div><p className="eyebrow">{selectedDay === dateKey ? 'TODAY' : 'PLANNED DAY'}</p><h2>{displayDay(selectedDay, true)}</h2></div><span className={planSaved ? 'saved-pill' : 'draft-pill'}>{planSaved ? 'Saved' : 'Draft'}</span></div>
              <div className="plan-meals">{selectedMeals.map((item) => {
                const recipe = recipeById(item.recipeKey);
                if (!recipe) return null;
                return <article key={item.key} className={item.removed ? 'removed' : ''}>
                  <button className="meal-main" onClick={() => setSelectedRecipe(recipe)}><span className={`slot-icon ${item.slot}`}><Utensils size={18} /></span><span><small>{item.slot}{item.slot === 'smoothie' || item.slot === 'dessert' ? ' · optional' : ''}</small><strong>{recipe.name}</strong><em>{recipe.description}</em></span><ChevronRight size={17} /></button>
                  <div className="meal-tools"><button onClick={() => replaceMeal(item)}><RefreshCw size={14} /> Replace</button><button onClick={() => removeOrRestoreMeal(item)}>{item.removed ? <Check size={14} /> : <X size={14} />}{item.removed ? 'Restore' : 'Remove'}</button><button onClick={() => openCoach(`Planned ${item.slot}: ${recipe.name}. ${recipe.description}`, `Can you help me with ${recipe.name}?`)}><Bot size={14} /> Ask Coach</button></div>
                </article>;
              })}</div>
              <button className="primary-wide" onClick={() => { setPlanView('groceries'); void saveState({ action: 'event', category: 'Plan', event: 'grocery_list_opened' }, false); }}><ShoppingBasket size={18} /> Build my grocery list</button>
            </>}

            {planView === 'groceries' && <>
              <section className="grocery-hero"><div><ShoppingBasket size={23} /><span><p className="eyebrow">THIS WEEK</p><h2>{groceryItems.length} simple items</h2></span></div><p>The list uses only meals that are still in your plan.</p><div className="grocery-progress"><span style={{ width: `${groceryItems.length ? checkedGroceries.length / groceryItems.length * 100 : 0}%` }} /></div><small>{checkedGroceries.length} of {groceryItems.length} checked</small></section>
              <div className="grocery-groups">{groceryGroups.map((group) => <section key={group.category}>
                <header><h2>{group.category}</h2><span>{group.items.filter((item) => checkedGroceries.includes(item.name)).length}/{group.items.length}</span></header>
                {group.items.map((item, index) => {
                  const checked = checkedGroceries.includes(item.name);
                  return <button key={item.name} className={checked ? 'checked' : ''} onClick={() => toggleGrocery(item.name, item.category, item.amount, index)}><span className="grocery-check">{checked && <Check size={14} />}</span><span><strong>{item.name}</strong><small>{item.amount}</small></span></button>;
                })}
              </section>)}</div>
            </>}

            {planView === 'learn' && <>
              <section className="learn-intro"><BookOpen size={21} /><div><h2>Learn only what helps today</h2><p>Open one simple idea. Ask Coach if any part is unclear.</p></div></section>
              <div className="learning-list">{learningTopics.map((topic) => <button key={topic.title} onClick={() => setSelectedTopic(topic)}><span className={topic.tone}><BookOpen size={19} /></span><span><strong>{topic.title}</strong><small>{topic.short}</small></span><ChevronRight size={17} /></button>)}</div>
              {planContent.length > 0 && <p className="content-note">Your food lessons are connected to the saved plan.</p>}
            </>}
          </>}

          {tab === 'progress' && <>
            <section className="simple-heading"><p className="eyebrow">YOUR DIRECTION</p><h1>Progress</h1><p>Look at trends. Keep the next action simple.</p></section>
            <section className="metric-grid"><div><span><Activity size={18} /></span><strong>{healthyRate}%</strong><small>Healthy action rate</small></div><div><span><Footprints size={18} /></span><strong>{walkingTotal}</strong><small>Walk minutes</small></div></section>
            <section className="section-block trend-card"><div className="section-title"><div><p className="eyebrow">SEVEN-DAY VIEW</p><h2>Weight trend</h2></div>{averageWeight > 0 && <span>{averageWeight.toFixed(1)} {profile.weightUnit} avg</span>}</div><WeightChart logs={weightLogs} unit={profile.weightUnit} /><p>Daily changes are normal. Watch the direction over time.</p></section>
            <section className="section-block history-card"><div className="section-title"><div><p className="eyebrow">RECENT DAYS</p><h2>Your actions</h2></div><span>{syncStatus === 'saving' ? 'Saving' : syncStatus === 'saved' ? 'Synced' : 'On phone'}</span></div>{lastSevenHistory.map((item) => <div className="history-row" key={item.date}><time>{displayDay(item.date)}</time><span>{item.completed.length} of {habits.length} actions</span><strong>{item.walkMinutes ? `${item.walkMinutes} min walk` : 'Keep going'}</strong></div>)}</section>
            <section className="weekly-insight"><Sparkles size={20} /><div><p className="eyebrow">THIS WEEK</p><h2>{healthyRate >= 75 ? 'Your steady work is showing.' : healthyRate >= 40 ? 'You are building the habit.' : 'Start with one repeatable action.'}</h2><p>{walkingTotal > 0 ? `You logged ${walkingTotal} walking minutes. Keep the next walk comfortable.` : 'Your first walk is ready when you are.'}</p></div></section>
            <button className="primary-wide" onClick={() => openCoach(`Progress screen. Healthy action rate: ${healthyRate} percent. Walking: ${walkingTotal} minutes.`, 'What should I focus on this week?')}><Bot size={18} /> Ask Coach about my progress</button>
          </>}
        </div>

        <nav className="bottom-nav" aria-label="Main navigation">
          <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}><Home /><span>Today</span></button>
          <button className={tab === 'plan' ? 'active' : ''} onClick={() => setTab('plan')}><Sprout /><span>Plan</span></button>
          <button className={tab === 'progress' ? 'active' : ''} onClick={() => setTab('progress')}><TrendingUp /><span>Progress</span></button>
        </nav>
      </section>

      <Dialog open={showCoach} onOpenChange={setShowCoach}><DialogContent className="coach-dialog">
        <DialogHeader><div className="dialog-icon"><Bot size={22} /></div><div><DialogTitle>Coach Alex</DialogTitle><DialogDescription>Clear answers. Honest help. No judgment.</DialogDescription></div></DialogHeader>
        <div className="chat-context">{coachContext}</div>
        <div className="chat-log">{messages.slice(-8).map((message, index) => <div key={`${message.role}-${index}`} className={`message ${message.role}`}><span>{message.role === 'coach' && <AppLogo />}</span><p>{message.role === 'coach' ? cleanNaturalText(message.text) : message.text}</p></div>)}{chatLoading && <div className="message coach"><span><AppLogo /></span><p className="typing"><i /><i /><i /></p></div>}</div>
        <form className="chat-compose" onSubmit={sendChat}><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Ask your coach" maxLength={800} /><button disabled={!chatInput.trim() || chatLoading}><Send size={18} /></button></form>
        <small className="coach-help">If anything is unclear, ask another question.</small>
      </DialogContent></Dialog>

      <Dialog open={Boolean(selectedRecipe)} onOpenChange={(open) => { if (!open) setSelectedRecipe(null); }}><DialogContent className="detail-dialog">{selectedRecipe && <>
        <div className="recipe-top"><span><Utensils size={22} /></span><div><p className="eyebrow">{selectedRecipe.slot.toUpperCase()}</p><DialogTitle>{selectedRecipe.name}</DialogTitle><p>{selectedRecipe.description}</p></div></div>
        <div className="recipe-meta"><span><Clock3 size={15} /> {selectedRecipe.minutes} minutes</span><span><Leaf size={15} /> {selectedRecipe.gbombs.length ? selectedRecipe.gbombs.join(', ') : 'Simple whole foods'}</span></div>
        <section><h3>What you need</h3><ul>{selectedRecipe.ingredients.map((item) => <li key={item.name}><span>{item.name}</span><strong>{item.amount}</strong></li>)}</ul></section>
        <section><h3>How to make it</h3><ol>{selectedRecipe.steps.map((step) => <li key={step}>{step}</li>)}</ol></section>
        <div className="why-card"><strong>Why it works</strong><p>{selectedRecipe.why}</p></div>
        <Button className="primary-button" onClick={() => openCoach(`Recipe: ${selectedRecipe.name}. ${selectedRecipe.description}`, `I have a question about ${selectedRecipe.name}.`)}>Ask Coach</Button>
      </>}</DialogContent></Dialog>

      <Dialog open={Boolean(selectedTopic)} onOpenChange={(open) => { if (!open) setSelectedTopic(null); }}><DialogContent className="detail-dialog learning-dialog">{selectedTopic && <>
        <div className={`learning-mark ${selectedTopic.tone}`}><BookOpen size={23} /></div><DialogHeader><DialogTitle>{selectedTopic.title}</DialogTitle><DialogDescription>{selectedTopic.short}</DialogDescription></DialogHeader>
        <p className="learning-body">{selectedTopic.body}</p><div className="why-card"><strong>Your next move</strong><p>{selectedTopic.action}</p></div>
        <Button className="primary-button" onClick={() => openCoach(`Learning topic: ${selectedTopic.title}. ${selectedTopic.body}`, `Can you explain ${selectedTopic.title} another way?`)}>Ask Coach to explain</Button>
      </>}</DialogContent></Dialog>

      <Dialog open={showFinish} onOpenChange={setShowFinish}><DialogContent className="finish-dialog"><div className="finish-mark"><Sparkles size={30} /></div><DialogHeader><DialogTitle>Today is complete.</DialogTitle><DialogDescription>{finishMessage}</DialogDescription></DialogHeader><div className="finish-score"><strong>{completed.length}</strong><span>healthy actions today</span></div><Button className="primary-button" onClick={() => setShowFinish(false)}>Done</Button></DialogContent></Dialog>

      <Dialog open={showWelcome} onOpenChange={() => undefined}><DialogContent className="profile-dialog" showCloseButton={false}><div className="welcome-brand"><AppLogo /><span><p className="eyebrow">WELCOME, ALEX</p><h2>Let’s make this fit you.</h2></span></div><p className="profile-lead">Answer a few short questions. You can change these later.</p><ProfileForm profile={profile} submitLabel="Create my plan" onSubmit={(next) => void saveProfileSettings(next)} /></DialogContent></Dialog>

      <Dialog open={showProfile} onOpenChange={setShowProfile}><DialogContent className="profile-dialog"><DialogHeader><DialogTitle>Your settings</DialogTitle><DialogDescription>Keep the plan realistic for your life.</DialogDescription></DialogHeader><ProfileForm profile={profile} submitLabel="Save settings" onSubmit={(next) => void saveProfileSettings(next)} />{privateAccess && <Button variant="outline" className="sign-out-button" onClick={() => void signOut()}><LogOut size={16} /> Sign out</Button>}</DialogContent></Dialog>
    </main>
  );
}

function ProfileForm({ profile, submitLabel, onSubmit }: { profile: ProfileSettings; submitLabel: string; onSubmit: (profile: ProfileSettings) => void }) {
  const [draft, setDraft] = useState(profile);
  return <form className="profile-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ ...draft, onboarded: true }); }}>
    <label>Your main goal<select value={draft.goal} onChange={(event) => setDraft({ ...draft, goal: event.target.value })}><option>Build steady healthy habits</option><option>Lose weight steadily</option><option>Move with more energy</option><option>Sleep and recover better</option></select></label>
    <div className="field-pair"><label>Current weight<input value={draft.currentWeight || ''} onChange={(event) => setDraft({ ...draft, currentWeight: Number(event.target.value) || 0 })} inputMode="decimal" placeholder="Optional" /></label><label>Unit<select value={draft.weightUnit} onChange={(event) => setDraft({ ...draft, weightUnit: event.target.value === 'kg' ? 'kg' : 'lb' })}><option value="lb">lb</option><option value="kg">kg</option></select></label></div>
    <div className="field-pair"><label>Starting walk<select value={draft.walkGoal} onChange={(event) => setDraft({ ...draft, walkGoal: Number(event.target.value) })}><option value="10">10 minutes</option><option value="15">15 minutes</option><option value="20">20 minutes</option><option value="30">30 minutes</option></select></label><label>Sleep goal<select value={draft.sleepGoal} onChange={(event) => setDraft({ ...draft, sleepGoal: Number(event.target.value) })}><option value="7">7 hours</option><option value="7.5">7.5 hours</option><option value="8">8 hours</option><option value="9">9 hours</option></select></label></div>
    <label>Allergies or foods to avoid<textarea value={draft.allergies} onChange={(event) => setDraft({ ...draft, allergies: event.target.value })} placeholder="Leave blank if none" maxLength={500} /></label>
    <label>Pain or movement limits<textarea value={draft.mobilityNotes} onChange={(event) => setDraft({ ...draft, mobilityNotes: event.target.value })} placeholder="Movement to avoid, if any" maxLength={500} /></label>
    <div className="field-pair"><label>Cooking time<select value={draft.cookingMinutes} onChange={(event) => setDraft({ ...draft, cookingMinutes: Number(event.target.value) })}><option value="15">15 minutes</option><option value="25">25 minutes</option><option value="40">40 minutes</option></select></label><label>Animal protein<select value={draft.animalProtein} onChange={(event) => setDraft({ ...draft, animalProtein: event.target.value })}><option value="optional">Optional</option><option value="yes">Yes</option><option value="none">No</option></select></label></div>
    <div className="toggle-row"><input id="daily-weighing" type="checkbox" checked={draft.dailyWeighing} onChange={(event) => setDraft({ ...draft, dailyWeighing: event.target.checked })} /><label htmlFor="daily-weighing"><strong>Daily weight reminder</strong><small>You can turn this off if it does not feel helpful.</small></label></div>
    <p className="profile-safety">This app gives wellness education. It does not diagnose or treat medical conditions.</p>
    <Button type="submit" className="primary-button">{submitLabel}<ArrowRight size={17} /></Button>
  </form>;
}
