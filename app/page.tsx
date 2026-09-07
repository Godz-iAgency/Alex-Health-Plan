'use client';

import {
  ArrowRight, Bot, Check, ChevronRight, CircleUserRound, Droplets,
  Footprints, HeartHandshake, Home, Leaf, MessageCircle, MoonStar,
  Send, Sprout, TrendingUp, Utensils, X,
} from 'lucide-react';
import Image from 'next/image';
import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { DailyHistoryItem, PlanContentItem } from '@/lib/alex-data';
import { chicagoDateKey, weekStartKey } from '@/lib/dates';

type Tab = 'today' | 'coach' | 'plan' | 'progress';
type PlanSection = 'food' | 'groceries';
type Rating = 'green' | 'yellow' | 'red';
type SyncStatus = 'loading' | 'saving' | 'saved' | 'offline';
type AccessStatus = 'checking' | 'locked' | 'open';
type MealResult = { rating: Rating; label: string; headline: string; reason: string; better: string; gbombs: string[] };
type ChatMessage = { role: 'user' | 'coach'; text: string };
type EducationDetail = {
  title: string;
  kicker: string;
  summary: string;
  benefits: string[];
  examples: string;
  action: string;
  color: string;
};

const habitList = [
  { id: 'water', icon: Droplets, label: 'Start with water', note: 'One glass before your next meal', tone: 'aqua' },
  { id: 'walk', icon: Footprints, label: 'Walk 15 minutes', note: 'A comfortable pace is a real workout', tone: 'lime' },
  { id: 'reset', icon: MoonStar, label: 'Reset for 15 minutes', note: 'Sit, breathe, and let your body slow down', tone: 'gold' },
  { id: 'mindset', icon: HeartHandshake, label: 'Say today’s thought', note: 'I can make my next choice a good one', tone: 'rose' },
];

const gbombs = [
  { letter: 'G', name: 'Greens', example: 'spinach, kale, broccoli', color: '#2e7d54', kicker: 'GBOMBS: G', summary: 'Greens add fiber, volume, and important vitamins and minerals without making a meal complicated.', benefits: ['Fiber supports digestion and helps meals feel satisfying.', 'Leafy greens can provide folate, vitamin K, vitamin A, and vitamin C.', 'Their volume can help you build a fuller plate with whole foods.'], examplesLong: 'Spinach, kale, collards, cabbage, broccoli, and romaine.', action: 'Add one handful of spinach or one cup of broccoli to your next meal.' },
  { letter: 'B', name: 'Beans', example: 'black beans, lentils, chickpeas', color: '#9a5c35', kicker: 'GBOMBS: B', summary: 'Beans are a practical plant protein. They also provide fiber, which most animal proteins do not.', benefits: ['Protein helps build and maintain body tissue.', 'Fiber can support digestion and make a meal more filling.', 'Canned no-salt-added beans make a fast, affordable meal.'], examplesLong: 'Black beans, chickpeas, lentils, kidney beans, split peas, and edamame.', action: 'Rinse half a cup of canned beans and add them to a salad, soup, or quinoa bowl.' },
  { letter: 'O', name: 'Onions', example: 'onions, garlic, scallions', color: '#a376b7', kicker: 'GBOMBS: O', summary: 'The onion family adds strong flavor and useful plant compounds to simple meals.', benefits: ['Onions help whole foods taste satisfying without sugary sauces.', 'They provide small amounts of fiber and vitamin C.', 'Garlic, scallions, and leeks make vegetables, beans, and proteins easier to enjoy.'], examplesLong: 'Yellow onions, red onions, garlic, scallions, shallots, and leeks.', action: 'Cook chopped onion and garlic with mushrooms or beans for an easy flavor base.' },
  { letter: 'M', name: 'Mushrooms', example: 'white, cremini, shiitake', color: '#a87952', kicker: 'GBOMBS: M', summary: 'Mushrooms bring a savory flavor and useful nutrients to bowls, soups, eggs, and vegetables.', benefits: ['They can provide B vitamins and minerals such as copper and selenium.', 'Their savory taste can make a plant-forward meal feel more satisfying.', 'They are easy to cook with onions, greens, beans, or lean protein.'], examplesLong: 'White button, cremini, portobello, shiitake, and oyster mushrooms.', action: 'Slice a cup of mushrooms and cook them until tender. Never eat unidentified wild mushrooms.' },
  { letter: 'B', name: 'Berries', example: 'blueberries, strawberries', color: '#8d3d6d', kicker: 'GBOMBS: B', summary: 'Berries provide fiber, vitamin C, and colorful plant compounds in a naturally sweet whole food.', benefits: ['Whole berries keep their fiber, unlike many juices.', 'Fresh and unsweetened frozen berries are both useful choices.', 'They can satisfy a sweet craving without soda or candy.'], examplesLong: 'Blueberries, strawberries, raspberries, and blackberries.', action: 'Add half a cup of berries to oatmeal, plain yogurt, or a measured smoothie.' },
  { letter: 'S', name: 'Seeds & nuts', example: 'chia, flax, walnuts', color: '#ba7a21', kicker: 'GBOMBS: S', summary: 'Seeds and nuts provide unsaturated fats, plant protein, fiber, and texture. Portions matter because they are energy dense.', benefits: ['Unsaturated fats can fit into a heart-supportive eating pattern.', 'Seeds and nuts add some protein and fiber.', 'Chia and ground flax are simple additions to oatmeal or smoothies.'], examplesLong: 'Chia, ground flax, hemp seeds, walnuts, almonds, and pumpkin seeds.', action: 'Use one tablespoon of seeds or a small handful of unsalted nuts.' },
];

const bowlSteps: (EducationDetail & { number: string; label: string })[] = [
  { number: '1', label: 'Greens or vegetables', title: 'Greens and vegetables', kicker: 'BETTER BOWL: STEP 1', color: '#2e7d54', summary: 'Start with vegetables to add color, fiber, nutrients, and satisfying volume.', benefits: ['Vegetables can provide fiber, potassium, folate, vitamin A, and vitamin C.', 'A larger vegetable portion helps the bowl feel substantial.', 'Fresh, frozen, steamed, roasted, or lightly sautéed options all work.'], examples: 'Spinach, kale, broccoli, cabbage, peppers, zucchini, or cauliflower.', action: 'Fill about half of the bowl with vegetables you already enjoy.' },
  { number: '2', label: 'Beans or lean protein', title: 'Beans or lean protein', kicker: 'BETTER BOWL: STEP 2', color: '#9a5c35', summary: 'Add a protein choice for a more satisfying meal. Beans provide both plant protein and fiber.', benefits: ['Beans, lentils, tofu, and tempeh are useful plant proteins.', 'Lean poultry, fish, or eggs can be optional minimally processed choices.', 'Protein supports body tissue and helps make a meal feel complete.'], examples: 'Black beans, chickpeas, lentils, tofu, tempeh, chicken breast, turkey, fish, or eggs.', action: 'Choose one protein. Start with about half a cup of beans or a palm-sized portion of lean protein.' },
  { number: '3', label: 'A whole grain or fruit', title: 'Whole grain or fruit', kicker: 'BETTER BOWL: STEP 3', color: '#8d6f24', summary: 'Add a sensible energy source that brings useful nutrients and fits the rice-free plan.', benefits: ['Whole grains can provide fiber and steady meal energy.', 'Whole fruit adds fiber and natural sweetness.', 'Quinoa also contributes some protein and works well as a bowl base.'], examples: 'Quinoa, oats, amaranth, buckwheat, berries, apples, or oranges.', action: 'Choose a small serving of quinoa or one piece of whole fruit. Skip rice for this personal six-month plan.' },
  { number: '4', label: 'Water on the side', title: 'Water on the side', kicker: 'BETTER BOWL: STEP 4', color: '#287d78', summary: 'Water supports normal body function and replaces sugary drinks without adding calories.', benefits: ['Water helps prevent dehydration.', 'Choosing water instead of soda reduces added sugar and drink calories.', 'Plain sparkling water also works when you want bubbles.'], examples: 'Still water, sparkling water, or water with lemon, lime, cucumber, or berries.', action: 'Pour the water before you begin eating and keep soda out of the meal.' },
];

const quickPrompts = ['Plan my next meal', 'Build my grocery list', 'Help me get moving'];

const groceryGroups = [
  {
    name: 'Fresh plants', note: 'Start in the produce section', color: 'produce',
    items: [
      ['Baby spinach or kale', 'Greens · 2 large containers'],
      ['Broccoli or cabbage', 'Greens · 2 heads or bags'],
      ['Yellow or red onions', 'Onions · 4'],
      ['Garlic', 'Onions family · 1 bulb'],
      ['Mushrooms', 'Mushrooms · 2 packages'],
      ['Fresh or frozen berries', 'Berries · 2 bags or cartons'],
      ['Bell peppers', 'Colorful vegetables · 3'],
      ['Zucchini or cauliflower', 'Easy rice-free base · 2'],
      ['Bananas, apples, or oranges', 'Whole-fruit snacks · 7 pieces'],
      ['Avocados and lemons', 'Flavor and satisfying fats'],
    ],
  },
  {
    name: 'Beans & plant protein', note: 'No-salt-added when possible', color: 'beans',
    items: [
      ['Black beans', '2 cans'], ['Chickpeas', '2 cans'], ['Lentils', '1 bag or 2 cans'],
      ['Plain tofu or tempeh', '1 package'], ['Quinoa', 'Rice-free whole-grain option · 1 bag'],
    ],
  },
  {
    name: 'Seeds, nuts & smoothie basics', note: 'Measure these. Small portions add up', color: 'seeds',
    items: [
      ['Chia seeds', '1 small bag'], ['Ground flaxseed', '1 small bag'], ['Walnuts or almonds', 'Unsalted · 1 bag'],
      ['Natural peanut or almond butter', 'No added sugar'], ['Unsweetened cocoa', 'For smoothies'], ['Unsweetened milk or plant milk', '1 carton'],
    ],
  },
  {
    name: 'Optional animal protein', note: 'Choose lean, minimally processed, and cook safely', color: 'protein',
    items: [
      ['USDA Organic chicken breast', '1 package'], ['USDA Organic turkey', 'Lean and unprocessed · 1 package'],
      ['Wild-caught salmon', 'Fresh or frozen · 2 portions'], ['Eggs', 'USDA Organic if preferred · 1 dozen'],
    ],
  },
  {
    name: 'Flavor & drinks', note: 'No soda aisle needed', color: 'drinks',
    items: [
      ['Still or sparkling water', 'Unsweetened'], ['Herbs and salt-free spices', 'Turmeric, paprika, cumin, pepper'],
      ['Extra-virgin olive oil', 'Use modestly'], ['Salsa or hummus', 'Check for short ingredient lists'],
    ],
  },
];

const mealIdeas = [
  ['Mushroom quinoa bowl', 'Quinoa, mushrooms, spinach, onions, chickpeas'],
  ['Lentil vegetable stew', 'Lentils, tomatoes, kale, onions, herbs'],
  ['Organic chicken power plate', 'Organic chicken, broccoli, quinoa, avocado'],
  ['Black bean lettuce wraps', 'Black beans, peppers, onions, salsa, avocado'],
  ['Berry seed breakfast bowl', 'Oats or quinoa, berries, chia, walnuts'],
  ['Salmon and greens', 'Wild salmon, cabbage or kale, mushrooms, lemon'],
];

const gbombContentKeys: Record<string, string> = {
  Greens: 'gbombs-greens', Beans: 'gbombs-beans', Onions: 'gbombs-onions',
  Mushrooms: 'gbombs-mushrooms', Berries: 'gbombs-berries', 'Seeds & nuts': 'gbombs-seeds-nuts',
};

function localMealCheck(text: string): MealResult {
  const value = text.toLowerCase();
  const goodTerms = ['green', 'salad', 'spinach', 'kale', 'broccoli', 'bean', 'lentil', 'chickpea', 'onion', 'mushroom', 'berry', 'berries', 'seed', 'nut', 'fruit', 'vegetable', 'water', 'oat', 'chicken', 'fish', 'tofu'];
  const cautionTerms = ['fries', 'fried', 'soda', 'coke', 'candy', 'donut', 'pizza', 'chips', 'milkshake', 'sweet tea', 'fast food', 'double burger'];
  const good = goodTerms.filter((term) => value.includes(term));
  const caution = cautionTerms.filter((term) => value.includes(term));
  const found = gbombs.filter((item) => value.includes(item.name.toLowerCase().replace('seeds & nuts', 'seed')) || item.example.split(', ').some((food) => value.includes(food.replace(/s$/, '')))).map((item) => item.name);

  if (/\brice\b/.test(value)) {
    return { rating: 'red', label: 'Not on this plan', headline: 'Choose the rice-free version.', reason: 'Rice is outside your current six-month personal plan. That is a plan preference. It is not a claim that rice is harmful.', better: 'Swap it for quinoa, cauliflower, lentils, beans, or extra non-starchy vegetables.', gbombs: found };
  }

  if (caution.length >= 2 || (caution.length && good.length === 0)) {
    return { rating: 'red', label: 'Not recommended', headline: 'Let’s change this meal.', reason: 'It is heavy on ultra-processed food or a sugary drink and light on foods that keep you full.', better: 'Keep the main food simple, add vegetables or beans, and choose water. If this is fast food, order the smaller portion and skip fries and soda.', gbombs: found };
  }
  if (good.length >= 2 && caution.length === 0) {
    return { rating: 'green', label: 'Good choice', headline: 'This supports your plan.', reason: 'You included whole foods that can provide fiber, nourishment, or satisfying protein.', better: 'Eat slowly, stop when comfortably satisfied, and log it as a win.', gbombs: found };
  }
  return { rating: 'yellow', label: 'Improve it', headline: 'Close. Make one upgrade.', reason: 'This meal may work, but it needs more plants, fiber, or a better drink choice.', better: 'Add a green vegetable, beans, berries, or a small handful of nuts or seeds. Choose water.', gbombs: found };
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

function cleanMealResult(result: MealResult): MealResult {
  return {
    ...result,
    label: cleanNaturalText(result.label, 4),
    headline: cleanNaturalText(result.headline, 8),
    reason: cleanNaturalText(result.reason, 18),
    better: cleanNaturalText(result.better, 20),
    gbombs: result.gbombs.map(cleanNaturalText),
  };
}

function AppLogo() {
  return <Image className="app-logo" src="/alex-logo.png" alt="" width={43} height={43} priority />;
}

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('today');
  const [planSection, setPlanSection] = useState<PlanSection>('food');
  const [completed, setCompleted] = useState<string[]>([]);
  const [meal, setMeal] = useState('');
  const [mealResult, setMealResult] = useState<MealResult | null>(null);
  const [mealLoading, setMealLoading] = useState(false);
  const [mealChoice, setMealChoice] = useState<'recommended' | 'original' | null>(null);
  const [mealRecordId, setMealRecordId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'coach', text: 'Hey Alex. I’m here to make the next choice clear. Tell me what you’re eating, how you’re feeling, or where you feel stuck.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [walkingStart, setWalkingStart] = useState('15');
  const [checkedGroceries, setCheckedGroceries] = useState<string[]>([]);
  const [education, setEducation] = useState<EducationDetail | null>(null);
  const [history, setHistory] = useState<DailyHistoryItem[]>([]);
  const [planContent, setPlanContent] = useState<PlanContentItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('checking');
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [accessLoading, setAccessLoading] = useState(false);
  const dateKey = useMemo(() => chicagoDateKey(), []);
  const weekOf = useMemo(() => weekStartKey(dateKey), [dateKey]);

  useEffect(() => {
    const saved = localStorage.getItem('alex-health-plan');
    queueMicrotask(() => {
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setCompleted(data.completed ?? []);
          const savedMessages = Array.isArray(data.messages)
            ? data.messages.map((item: ChatMessage) => ({ ...item, text: cleanNaturalText(String(item.text ?? '')) })).filter((item: ChatMessage) => item.text)
            : [];
          setMessages(savedMessages.length ? savedMessages : [{ role: 'coach', text: 'Hey Alex. I’m here to make the next choice clear.' }]);
          setWalkingStart(data.walkingStart ?? '15');
          setCheckedGroceries(data.checkedGroceries ?? []);
        } catch { /* keep safe defaults */ }
      } else {
        setShowWelcome(true);
      }
    });
    navigator.serviceWorker?.register('/sw.js').catch(() => undefined);

    void (async () => {
      try {
        const response = await fetch('/api/access', { cache: 'no-store' });
        const data = await response.json() as { authorized?: boolean };
        setAccessStatus(data.authorized ? 'open' : 'locked');
      } catch {
        setAccessStatus('locked');
      }
    })();
  }, []);

  useEffect(() => {
    if (accessStatus !== 'open') return;
    void (async () => {
      try {
        const response = await fetch(`/api/state?date=${encodeURIComponent(dateKey)}&weekOf=${encodeURIComponent(weekOf)}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Sync unavailable');
        const data = await response.json() as {
          connected?: boolean;
          walkingStart?: string;
          completed?: string[];
          checkedGroceries?: string[];
          messages?: ChatMessage[];
          history?: DailyHistoryItem[];
          planContent?: PlanContentItem[];
        };
        if (!data.connected) throw new Error('Sync unavailable');
        setWalkingStart(data.walkingStart || '15');
        setCompleted(Array.isArray(data.completed) ? data.completed : []);
        setCheckedGroceries(Array.isArray(data.checkedGroceries) ? data.checkedGroceries : []);
        if (Array.isArray(data.messages) && data.messages.length) setMessages(data.messages);
        setHistory(Array.isArray(data.history) ? data.history : []);
        setPlanContent(Array.isArray(data.planContent) ? data.planContent : []);
        setSyncStatus('saved');
      } catch {
        setSyncStatus('offline');
      }
    })();
  }, [accessStatus, dateKey, weekOf]);

  useEffect(() => {
    localStorage.setItem('alex-health-plan', JSON.stringify({ completed, messages: messages.slice(-12), walkingStart, checkedGroceries }));
  }, [completed, messages, walkingStart, checkedGroceries]);

  const progress = Math.round((completed.length / habitList.length) * 100);
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }, []);
  const today = useMemo(() => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date()), []);

  const syncedGbombs = useMemo(() => gbombs.map((item) => {
    const saved = planContent.find((entry) => entry.key === gbombContentKeys[item.name]);
    return saved ? {
      ...item,
      summary: saved.summary || item.summary,
      benefits: saved.benefits.length ? saved.benefits : item.benefits,
      examplesLong: saved.examples || item.examplesLong,
      action: saved.nextMove || item.action,
    } : item;
  }), [planContent]);

  const syncedBowlSteps = useMemo(() => bowlSteps.map((step) => {
    const saved = planContent.find((entry) => entry.key === `bowl-${step.number}`);
    return saved ? {
      ...step,
      title: saved.title || step.title,
      summary: saved.summary || step.summary,
      benefits: saved.benefits.length ? saved.benefits : step.benefits,
      examples: saved.examples || step.examples,
      action: saved.nextMove || step.action,
    } : step;
  }), [planContent]);

  const syncedMealIdeas = useMemo(() => {
    const saved = planContent.filter((item) => item.type === 'Meal Idea').sort((a, b) => a.sortOrder - b.sortOrder);
    return saved.length ? saved.map((item) => [item.title, item.examples]) : mealIdeas;
  }, [planContent]);

  async function saveState(payload: Record<string, unknown>) {
    setSyncStatus('saving');
    try {
      const response = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Save unavailable');
      setSyncStatus('saved');
      return await response.json() as { saved?: boolean; mealId?: string };
    } catch {
      setSyncStatus('offline');
      return null;
    }
  }

  async function unlockApp(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessCode.trim() || accessLoading) return;
    setAccessLoading(true);
    setAccessError('');
    try {
      const response = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode.trim() }),
      });
      const data = await response.json() as { authorized?: boolean; error?: string };
      if (!response.ok || !data.authorized) throw new Error(data.error || 'That code is not correct.');
      setAccessCode('');
      setAccessStatus('open');
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : 'That code is not correct.');
    }
    setAccessLoading(false);
  }

  const toggleHabit = (id: string) => {
    const next = completed.includes(id) ? completed.filter((item) => item !== id) : [...completed, id];
    setCompleted(next);
    setHistory((current) => [{ date: dateKey, completed: next, walkMinutes: next.includes('walk') ? Number(walkingStart) : 0 }, ...current.filter((item) => item.date !== dateKey)]);
    void saveState({ action: 'daily', date: dateKey, completed: next, walkGoal: Number(walkingStart) });
  };

  const toggleGrocery = (item: string, category: string, quantity: string, sortOrder: number) => {
    const isChecked = !checkedGroceries.includes(item);
    setCheckedGroceries((current) => isChecked ? [...current, item] : current.filter((entry) => entry !== item));
    void saveState({ action: 'grocery', weekOf, item, category, quantity, checked: isChecked, sortOrder });
  };

  const saveWalkGoal = () => {
    void saveState({ action: 'profile', walkGoal: Number(walkingStart) });
  };

  const clearGroceryList = () => {
    setCheckedGroceries([]);
    void saveState({ action: 'clearGroceries', weekOf });
  };

  const chooseMeal = (choice: 'recommended' | 'original') => {
    setMealChoice(choice);
    if (mealRecordId) void saveState({ action: 'mealChoice', mealId: mealRecordId, choice });
  };

  async function checkMeal(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!meal.trim()) return;
    setMealLoading(true);
    setMealChoice(null);
    setMealRecordId('');
    const fallback = localMealCheck(meal);
    let finalResult = fallback;
    setMealResult(finalResult);
    try {
      const response = await fetch('/api/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'meal', message: meal }) });
      if (response.ok) {
        const data = await response.json() as { result?: MealResult };
        if (data.result?.rating) finalResult = cleanMealResult(data.result);
      }
    } catch { /* offline fallback is already visible */ }
    setMealResult(finalResult);
    const saved = await saveState({ action: 'meal', meal: meal.trim(), result: finalResult });
    if (saved?.mealId) setMealRecordId(saved.mealId);
    setMealLoading(false);
  }

  async function sendChat(text = chatInput) {
    const clean = text.trim();
    if (!clean || chatLoading) return;
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', text: clean }];
    setMessages(nextMessages);
    setChatInput('');
    setChatLoading(true);
    try {
      const response = await fetch('/api/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'chat', message: clean, history: nextMessages.slice(-6) }) });
      if (!response.ok) throw new Error('Coach offline');
      const data = await response.json() as { text?: string };
      setMessages((current) => [...current, { role: 'coach', text: cleanNaturalText(data.text || 'Make your next choice simple and clear.') }]);
    } catch {
      const fallback = clean.toLowerCase().includes('walk')
        ? `You do not need to be perfect. Put on your shoes and walk for 5 minutes. Then ask yourself if you can keep going toward ${walkingStart} minutes.`
        : 'Make one simple choice. Drink water and add one plant food. Your plan still works while the coach is offline.';
      setMessages([...nextMessages, { role: 'coach', text: fallback }]);
    }
    setChatLoading(false);
  }

  if (accessStatus === 'checking') {
    return <main className="access-shell"><section className="access-card access-loading"><AppLogo /><span className="loader" /><p>Opening your plan</p></section></main>;
  }

  if (accessStatus === 'locked') {
    return (
      <main className="access-shell">
        <section className="access-card">
          <AppLogo />
          <p className="eyebrow">ALEX HEALTH PLAN</p>
          <h1>Welcome, Alex.</h1>
          <p>Your plan and progress are private. Enter your six-digit code to continue.</p>
          <form onSubmit={unlockApp}>
            <input value={accessCode} onChange={(event) => setAccessCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" aria-label="Private access code" placeholder="6-digit code" maxLength={6} />
            <Button type="submit" className="dialog-primary" disabled={accessCode.length !== 6 || accessLoading}>{accessLoading ? 'Checking' : 'Open my plan'}</Button>
          </form>
          {accessError && <p className="access-error" role="alert">{accessError}</p>}
          <small>No account or ChatGPT sign-in is needed.</small>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="app-frame">
        <header className="topbar">
          <button className="brand" onClick={() => setTab('today')} aria-label="Go to Today"><AppLogo /><span><strong>Alex Health Plan</strong><small>One good choice at a time</small></span></button>
          <button className="profile-button" onClick={() => setShowProfile(true)} aria-label="Open plan settings"><CircleUserRound size={24} /></button>
        </header>

        <div className="screen" key={tab}>
          {syncStatus === 'offline' && <div className="sync-notice">Saved on this phone. Online sync will retry when you return.</div>}
          {tab === 'today' && (
            <>
              <section className="welcome-row">
                <div><p className="eyebrow">{today.toUpperCase()}</p><h1>{greeting}, Alex.</h1><p>You don’t need a perfect day. You need a clear next choice.</p></div>
                <div className="progress-ring" style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}><span>{progress}%</span></div>
              </section>

              <form className="meal-card" onSubmit={checkMeal}>
                <div className="card-title-row"><span className="meal-icon"><Utensils size={21} /></span><div><p className="eyebrow">BEFORE YOU EAT</p><h2>Check my meal</h2></div></div>
                <p>Type what you’re about to eat. Your coach will give you a clear, honest recommendation.</p>
                <div className="meal-input"><input value={meal} onChange={(e) => setMeal(e.target.value)} placeholder="Chicken sandwich, fries and Coke…" aria-label="Describe your meal" maxLength={500} /><button disabled={!meal.trim() || mealLoading} aria-label="Check this meal">{mealLoading ? <span className="loader" /> : <ArrowRight size={20} />}</button></div>
              </form>

              {mealResult && (
                <section className={`meal-result ${mealResult.rating}`} aria-live="polite">
                  <div className="result-top"><span className="status-dot" /><strong>{mealResult.label}</strong><button onClick={() => setMealResult(null)} aria-label="Close recommendation"><X size={17} /></button></div>
                  <h3>{mealResult.headline}</h3><p>{mealResult.reason}</p>
                  <div className="coach-move"><span>YOUR BEST MOVE</span><p>{mealResult.better}</p></div>
                  <div className="gbomb-found"><Leaf size={15} /><span>{mealResult.gbombs.length ? `GBOMBS found: ${mealResult.gbombs.join(', ')}` : 'No GBOMBS foods found yet'}</span></div>
                  <p className="accountability-copy">Be honest. What are you choosing?</p>
                  <div className="choice-buttons">
                    <button className={mealChoice === 'recommended' ? 'selected' : ''} onClick={() => chooseMeal('recommended')} type="button"><Check size={15} /> Recommended version</button>
                    <button className={mealChoice === 'original' ? 'selected' : ''} onClick={() => chooseMeal('original')} type="button">Original meal</button>
                  </div>
                </section>
              )}

              <section className="today-section">
                <div className="section-heading"><div><p className="eyebrow">KEEP IT SIMPLE</p><h2>Today’s wins</h2></div><span>{completed.length} of {habitList.length}</span></div>
                <div className="habit-list">
                  {habitList.map((habit) => {
                    const Icon = habit.icon; const complete = completed.includes(habit.id);
                    return <button key={habit.id} className={`habit-row ${complete ? 'complete' : ''}`} onClick={() => toggleHabit(habit.id)}><span className={`habit-icon ${habit.tone}`}><Icon size={20} /></span><span className="habit-text"><strong>{habit.id === 'walk' ? `Walk ${walkingStart} minutes` : habit.label}</strong><small>{habit.note}</small></span><span className="check">{complete && <Check size={16} strokeWidth={3} />}</span></button>;
                  })}
                </div>
              </section>

              <button className="plan-strip" onClick={() => { setPlanSection('food'); setTab('plan'); }}><span><Sprout size={19} /></span><span><strong>Open your food plan</strong><small>Food basics, easy meals, and your grocery list.</small></span><ChevronRight size={19} /></button>
              <p className="safety-note">Wellness guidance only, not medical diagnosis or treatment. Stop exercise and seek care for chest pain, fainting, or severe shortness of breath.</p>
            </>
          )}

          {tab === 'coach' && (
            <section className="coach-screen">
              <div className="page-heading"><span className="heading-icon"><Bot size={23} /></span><div><p className="eyebrow">YOUR ACCOUNTABILITY PARTNER</p><h1>Coach Alex</h1><p>Simple answers. Honest recommendations. No judgment.</p></div></div>
              <div className="quick-prompts">{quickPrompts.map((prompt) => <button key={prompt} onClick={() => void sendChat(prompt)}>{prompt}</button>)}</div>
              <div className="chat-log" aria-live="polite">
                {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`message ${message.role}`}><span>{message.role === 'coach' && <AppLogo />}</span><p>{message.role === 'coach' ? cleanNaturalText(message.text) : message.text}</p></div>)}
                {chatLoading && <div className="message coach"><span><AppLogo /></span><p className="typing"><i /><i /><i /></p></div>}
              </div>
              <form className="chat-compose" onSubmit={(event) => { event.preventDefault(); void sendChat(); }}><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask your coach…" aria-label="Message your coach" maxLength={800} /><button disabled={!chatInput.trim() || chatLoading}><Send size={18} /></button></form>
            </section>
          )}

          {tab === 'plan' && (
            <section className="plan-screen">
              <div className="simple-heading"><h1>Your plan</h1><p>Learn what to eat, then shop for it.</p></div>
              <div className="plan-switch" role="tablist" aria-label="Plan sections">
                <button role="tab" aria-selected={planSection === 'food'} className={planSection === 'food' ? 'active' : ''} onClick={() => setPlanSection('food')}>Food guide</button>
                <button role="tab" aria-selected={planSection === 'groceries'} className={planSection === 'groceries' ? 'active' : ''} onClick={() => setPlanSection('groceries')}>Groceries</button>
              </div>

              {planSection === 'food' ? <>
                <section className="plain-card food-intro"><h2>Meet GBOMBS</h2><p>GBOMBS means six groups of plant foods. You do not need all six at once. Add one to your next meal.</p></section>
                <div className="gbombs-grid">{syncedGbombs.map((item) => <button key={`${item.letter}-${item.name}`} onClick={() => setEducation({ title: item.name, kicker: item.kicker, summary: item.summary, benefits: item.benefits, examples: item.examplesLong, action: item.action, color: item.color })} aria-label={`Learn about ${item.name}`}><span style={{ backgroundColor: item.color }}>{item.letter}</span><span><strong>{item.name}</strong><small>{item.example}</small></span><ChevronRight size={17} /></button>)}</div>
                <section className="plain-card lesson-card"><h2>Build a better bowl</h2><div className="bowl-steps">{syncedBowlSteps.map((step) => <button key={step.number} onClick={() => setEducation(step)} aria-label={`Learn about ${step.label}`}><b>{step.number}</b><span>{step.label}</span><ChevronRight size={15} /></button>)}</div><button className="text-action" onClick={() => { setMeal('Quinoa, black beans, spinach, onions, mushrooms and water'); setTab('today'); }}>Try this meal <ChevronRight size={16} /></button></section>
                <section className="plain-card smoothie-card"><h2>Chocolate banana smoothie</h2><p>Use one small banana, one tablespoon of peanut butter, one tablespoon of chia or ground flax, one teaspoon of cocoa, unsweetened milk, and ice.</p><small>Keep the portion measured. Check allergies and medicine interactions before adding supplements.</small></section>
                <section className="plain-note"><h2>Plant-first approach</h2><p>Choose more vegetables, beans, fruit, nuts, seeds, quinoa, and herbs. We do not use detox or disease-cure claims.</p></section>
              </> : <>
                <section className="grocery-summary"><div><strong>{checkedGroceries.length}</strong><span>checked</span></div><p>Start with produce, simple proteins, and frozen whole foods. Skip soda and packaged snacks.</p></section>
                <div className="plain-note rice-note"><h2>Your rice-free choice</h2><p>Choose quinoa, cauliflower, lentils, beans, or extra vegetables. This is your plan choice. It does not mean rice is harmful.</p></div>
                <div className="grocery-groups">
                  {groceryGroups.map((group, groupIndex) => (
                    <section key={group.name} className="grocery-group">
                      <header><div><h2>{group.name}</h2><p>{group.note}</p></div><span>{group.items.filter(([item]) => checkedGroceries.includes(item)).length}/{group.items.length}</span></header>
                      <div>{group.items.map(([item, note], itemIndex) => {
                        const checked = checkedGroceries.includes(item);
                        return <button key={item} className={checked ? 'checked' : ''} onClick={() => toggleGrocery(item, group.name, note, groupIndex * 100 + itemIndex)}><span className="grocery-check">{checked && <Check size={14} strokeWidth={3} />}</span><span><strong>{item}</strong><small>{note}</small></span></button>;
                      })}</div>
                    </section>
                  ))}
                </div>
                <section className="plain-card meal-ideas"><h2>Easy meals</h2>{syncedMealIdeas.map(([name, ingredients]) => <button key={name} onClick={() => { setMeal(ingredients); setTab('today'); }}><span><strong>{name}</strong><small>{ingredients}</small></span><ChevronRight size={17} /></button>)}</section>
                <section className="plain-note meat-note"><h2>Choosing meat</h2><p>Choose lean, simple cuts. The USDA Organic seal tells you how it was produced. It does not make every cut healthier. Cook meat safely.</p></section>
                <Button variant="outline" className="clear-list" onClick={clearGroceryList} disabled={!checkedGroceries.length}>Clear checked items</Button>
              </>}
            </section>
          )}

          {tab === 'progress' && (
            <section className="progress-screen">
              <div className="simple-heading"><h1>Progress</h1><p>Your daily wins are saved and shown here.</p></div>
              <section className="progress-summary"><div><strong>{progress}%</strong><span>Today</span></div><div><h2>{completed.length} of {habitList.length} done</h2><p>Each checked habit counts as one win.</p><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div></section>
              <section className="progress-list">{habitList.map((habit) => <div key={habit.id}><span className={completed.includes(habit.id) ? 'done' : ''}>{completed.includes(habit.id) && <Check size={14} />}</span><p>{habit.id === 'walk' ? `Walk ${walkingStart} minutes` : habit.label}</p><small>{completed.includes(habit.id) ? 'Done' : 'Not done yet'}</small></div>)}</section>
              <section className="history-card"><header><h2>Recent days</h2><span>{syncStatus === 'saving' ? 'Saving' : syncStatus === 'saved' ? 'Synced' : 'On this phone'}</span></header>{history.filter((item) => item.date !== dateKey).slice(0, 7).length ? history.filter((item) => item.date !== dateKey).slice(0, 7).map((item) => <div key={item.date}><time>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${item.date}T12:00:00Z`))}</time><span>{item.completed.length} of 4 wins</span><b>{item.completed.includes('walk') ? `${item.walkMinutes} min walk` : 'No walk logged'}</b></div>) : <p>Your first saved day starts today.</p>}</section>
              <Button variant="outline" className="reset-today" onClick={() => { setCompleted([]); setHistory((current) => [{ date: dateKey, completed: [], walkMinutes: 0 }, ...current.filter((item) => item.date !== dateKey)]); void saveState({ action: 'daily', date: dateKey, completed: [], walkGoal: Number(walkingStart) }); }} disabled={!completed.length}>Reset today</Button>
            </section>
          )}
        </div>

        <nav className="bottom-nav" aria-label="Main navigation">
          <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}><Home /><span>Today</span></button>
          <button className={tab === 'coach' ? 'active' : ''} onClick={() => setTab('coach')}><MessageCircle /><span>Coach</span></button>
          <button className={tab === 'plan' ? 'active' : ''} onClick={() => setTab('plan')}><Sprout /><span>Plan</span></button>
          <button className={tab === 'progress' ? 'active' : ''} onClick={() => setTab('progress')}><TrendingUp /><span>Progress</span></button>
        </nav>
      </section>

      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="welcome-dialog" showCloseButton={false}>
          <div className="welcome-logo"><AppLogo /></div><DialogHeader><DialogTitle>Welcome, Alex.</DialogTitle><DialogDescription>This plan starts small on purpose. What feels like a comfortable first walk?</DialogDescription></DialogHeader>
          <div className="walk-options">{['10','15','20'].map((minutes) => <button key={minutes} className={walkingStart === minutes ? 'selected' : ''} onClick={() => setWalkingStart(minutes)}><strong>{minutes}</strong><span>minutes</span></button>)}</div>
          <p className="dialog-safety">If you have chest pain, dizziness, severe breathlessness, uncontrolled blood pressure, diabetes complications, or significant joint pain, ask a healthcare professional before changing activity.</p>
          <Button className="dialog-primary" size="lg" onClick={() => { saveWalkGoal(); setShowWelcome(false); }}>Create my simple plan <ArrowRight /></Button>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(education)} onOpenChange={(open) => { if (!open) setEducation(null); }}>
        <DialogContent className="education-dialog">
          {education && <>
            <div className="education-scroll">
              <div className="education-icon" style={{ backgroundColor: education.color }}><Leaf size={24} /></div>
              <DialogHeader><p className="eyebrow">{education.kicker}</p><DialogTitle>{education.title}</DialogTitle><DialogDescription>{education.summary}</DialogDescription></DialogHeader>
              <section className="education-section"><h3>Why it helps</h3><ul>{education.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul></section>
              <section className="education-examples"><strong>Easy choices</strong><p>{education.examples}</p></section>
              <section className="education-action"><strong>Your next move</strong><p>{education.action}</p></section>
            </div>
            <div className="education-footer"><Button className="dialog-primary" onClick={() => setEducation(null)}>Got it</Button></div>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="profile-dialog"><DialogHeader><DialogTitle>Your plan</DialogTitle><DialogDescription>Keep the starting point comfortable and realistic.</DialogDescription></DialogHeader><label>Starting walk<select value={walkingStart} onChange={(e) => setWalkingStart(e.target.value)}><option value="10">10 minutes</option><option value="15">15 minutes</option><option value="20">20 minutes</option><option value="30">30 minutes</option></select></label><div className="profile-info"><strong>About this coach</strong><p>It gives educational wellness support, not medical diagnosis or treatment. It will never recommend raw meat, crash diets, or ignoring symptoms.</p></div><Button className="dialog-primary" onClick={() => { saveWalkGoal(); setShowProfile(false); }}>Save plan</Button></DialogContent>
      </Dialog>
    </main>
  );
}
