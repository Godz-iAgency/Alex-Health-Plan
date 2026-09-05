'use client';

import {
  ArrowRight, BookOpen, Bot, Check, ChevronRight, CircleUserRound, Droplets,
  Footprints, HeartHandshake, Home, Leaf, MessageCircle, MoonStar, RotateCcw,
  Send, ShoppingBasket, Sparkles, Sprout, TrendingUp, Utensils, X,
} from 'lucide-react';
import Image from 'next/image';
import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Tab = 'today' | 'coach' | 'learn' | 'shop' | 'progress';
type Rating = 'green' | 'yellow' | 'red';
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

const quickPrompts = ['Plan my next meal', 'Build my grocery list', 'I don’t feel like walking', 'Give me a smoothie', 'Help me reset'];

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

function cleanNaturalText(text: string) {
  return text
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
}

function cleanMealResult(result: MealResult): MealResult {
  return {
    ...result,
    label: cleanNaturalText(result.label),
    headline: cleanNaturalText(result.headline),
    reason: cleanNaturalText(result.reason),
    better: cleanNaturalText(result.better),
    gbombs: result.gbombs.map(cleanNaturalText),
  };
}

function AppLogo() {
  return <Image className="app-logo" src="/alex-logo.png" alt="" width={43} height={43} priority />;
}

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('today');
  const [completed, setCompleted] = useState<string[]>([]);
  const [meal, setMeal] = useState('');
  const [mealResult, setMealResult] = useState<MealResult | null>(null);
  const [mealLoading, setMealLoading] = useState(false);
  const [mealChoice, setMealChoice] = useState<'recommended' | 'original' | null>(null);
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
  }, []);

  useEffect(() => {
    localStorage.setItem('alex-health-plan', JSON.stringify({ completed, messages: messages.slice(-12), walkingStart, checkedGroceries }));
  }, [completed, messages, walkingStart, checkedGroceries]);

  const progress = Math.round((completed.length / habitList.length) * 100);
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }, []);
  const today = useMemo(() => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date()), []);

  const toggleHabit = (id: string) => setCompleted((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleGrocery = (item: string) => setCheckedGroceries((current) => current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item]);

  async function checkMeal(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!meal.trim()) return;
    setMealLoading(true);
    setMealChoice(null);
    const fallback = localMealCheck(meal);
    setMealResult(fallback);
    try {
      const response = await fetch('/api/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'meal', message: meal }) });
      if (response.ok) {
        const data = await response.json() as { result?: MealResult };
        if (data.result?.rating) setMealResult(cleanMealResult(data.result));
      }
    } catch { /* offline fallback is already visible */ }
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

  function exportData() {
    const data = localStorage.getItem('alex-health-plan') ?? '{}';
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'alex-health-plan-data.json'; link.click(); URL.revokeObjectURL(url);
  }

  function resetData() {
    if (!window.confirm('Erase all saved check-ins and start fresh?')) return;
    localStorage.removeItem('alex-health-plan');
    setCompleted([]); setMessages([{ role: 'coach', text: 'Fresh start, Alex. What is your next good choice?' }]); setMealResult(null); setMeal(''); setCheckedGroceries([]);
  }

  return (
    <main className="app-shell">
      <section className="app-frame">
        <header className="topbar">
          <button className="brand" onClick={() => setTab('today')} aria-label="Go to Today"><AppLogo /><span><strong>Alex Health Plan</strong><small>One good choice at a time</small></span></button>
          <button className="profile-button" onClick={() => setShowProfile(true)} aria-label="Open plan settings"><CircleUserRound size={24} /></button>
        </header>

        <div className="screen" key={tab}>
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
                    <button className={mealChoice === 'recommended' ? 'selected' : ''} onClick={() => setMealChoice('recommended')} type="button"><Check size={15} /> Recommended version</button>
                    <button className={mealChoice === 'original' ? 'selected' : ''} onClick={() => setMealChoice('original')} type="button">Original meal</button>
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

              <button className="learn-strip" onClick={() => setTab('learn')}><span className="gbombs-mini">G·B·O·M·B·S</span><span><strong>New here? Start simple.</strong><small>Meet six everyday foods that support your plan.</small></span><ChevronRight size={19} /></button>
              <button className="shop-strip" onClick={() => setTab('shop')}><span><ShoppingBasket size={20} /></span><span><strong>Shop with a plan</strong><small>A one-week grocery list is ready for you.</small></span><ChevronRight size={19} /></button>
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

          {tab === 'learn' && (
            <section className="learn-screen">
              <div className="page-heading compact"><span className="heading-icon"><Sprout size={23} /></span><div><p className="eyebrow">FOOD, MADE SIMPLE</p><h1>Meet GBOMBS</h1></div></div>
              <div className="explain-card"><strong>It’s just a memory trick.</strong><p>GBOMBS stands for six groups of plant foods. You do not need all six at every meal. Start by adding one.</p><div className="simple-rule"><span>Today’s rule</span><b>Add one colorful plant to your next meal.</b></div></div>
              <div className="gbombs-grid">{gbombs.map((item) => <button key={`${item.letter}-${item.name}`} onClick={() => setEducation({ title: item.name, kicker: item.kicker, summary: item.summary, benefits: item.benefits, examples: item.examplesLong, action: item.action, color: item.color })} aria-label={`Learn about ${item.name}`}><span style={{ backgroundColor: item.color }}>{item.letter}</span><span><strong>{item.name}</strong><small>{item.example}</small></span><ChevronRight size={17} /></button>)}</div>
              <section className="lesson-card"><p className="eyebrow">AN EASY FIRST MEAL</p><h2>Build a better bowl</h2><div className="bowl-steps">{bowlSteps.map((step) => <button key={step.number} onClick={() => setEducation(step)} aria-label={`Learn about ${step.label}`}><b>{step.number}</b><span>{step.label}</span><ChevronRight size={15} /></button>)}</div><button onClick={() => { setMeal('Quinoa, black beans, spinach, onions, mushrooms and water'); setTab('today'); }}>Check this example <ArrowRight size={16} /></button></section>
              <section className="smoothie-card"><p className="eyebrow">ENERGY SMOOTHIE</p><h2>Chocolate banana seed blend</h2><p>1 small banana · 1 tbsp peanut butter · 1 tbsp chia or ground flax · 1 tsp unsweetened cocoa · milk or unsweetened plant milk · ice</p><small>Treat it as a measured meal or snack, not an unlimited drink. Check allergies and medication interactions before using supplements such as turmeric or maca.</small></section>
              <section className="sebi-note"><p className="eyebrow">PLANT-FORWARD IDEAS</p><h2>What we keep from “Dr. Sebi-style” eating</h2><p>We use the helpful overlap: more vegetables, beans, fruits, nuts, seeds, quinoa, herbs, and fewer ultra-processed foods. We do not use “alkaline cure,” detox, or disease-treatment claims because those claims are not established medical evidence.</p></section>
            </section>
          )}

          {tab === 'shop' && (
            <section className="shop-screen">
              <div className="page-heading compact"><span className="heading-icon"><ShoppingBasket size={23} /></span><div><p className="eyebrow">ONE WEEK · ONE PERSON</p><h1>Grocery list</h1></div></div>
              <section className="shop-intro"><div><span>{checkedGroceries.length}</span><small>items in cart</small></div><p>Shop the edges first: produce, plain proteins, and frozen whole foods. Skip soda and most packaged snack aisles.</p></section>
              <div className="rice-free-banner"><strong>Six-month rice-free preference</strong><p>This plan suggests quinoa, cauliflower, lentils, beans, or extra vegetables instead. Rice is excluded as your chosen rule. This does not mean all rice is inherently unhealthy.</p></div>
              <div className="grocery-groups">
                {groceryGroups.map((group) => (
                  <section key={group.name} className={`grocery-group ${group.color}`}>
                    <header><div><h2>{group.name}</h2><p>{group.note}</p></div><span>{group.items.filter(([item]) => checkedGroceries.includes(item)).length}/{group.items.length}</span></header>
                    <div>{group.items.map(([item, note]) => {
                      const checked = checkedGroceries.includes(item);
                      return <button key={item} className={checked ? 'checked' : ''} onClick={() => toggleGrocery(item)}><span className="grocery-check">{checked && <Check size={14} strokeWidth={3} />}</span><span><strong>{item}</strong><small>{note}</small></span></button>;
                    })}</div>
                  </section>
                ))}
              </div>
              <section className="meal-ideas"><div className="section-heading"><div><p className="eyebrow">USE WHAT YOU BOUGHT</p><h2>Six easy meal choices</h2></div></div>{mealIdeas.map(([name, ingredients]) => <button key={name} onClick={() => { setMeal(ingredients); setTab('today'); }}><span><strong>{name}</strong><small>{ingredients}</small></span><ChevronRight size={17} /></button>)}</section>
              <section className="meat-note"><strong>What “organic meat” means here</strong><p>Look for the USDA Organic seal, then still choose lean, minimally processed cuts and sensible portions. Organic describes how the food was produced; it does not automatically make every cut healthier. Always cook meat safely.</p></section>
              <Button variant="outline" className="clear-list" onClick={() => setCheckedGroceries([])}>Clear checked items</Button>
            </section>
          )}

          {tab === 'progress' && (
            <section className="progress-screen">
              <div className="page-heading compact"><span className="heading-icon"><TrendingUp size={23} /></span><div><p className="eyebrow">PROGRESS, NOT PERFECTION</p><h1>Your week</h1></div></div>
              <section className="week-card"><div><span className="big-number">{progress}%</span><small>of today’s promises kept</small></div><div className="week-bars" aria-label="Seven day progress"><i style={{height:'35%'}}/><i style={{height:'52%'}}/><i style={{height:'46%'}}/><i style={{height:'70%'}}/><i style={{height:'58%'}}/><i style={{height:'82%'}}/><i className="current" style={{height:`${Math.max(progress,8)}%`}}/></div><div className="day-labels"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>T</span></div></section>
              <div className="stat-grid"><article><span className="stat-icon lime"><Footprints /></span><strong>65</strong><small>walking minutes</small></article><article><span className="stat-icon gold"><Sparkles /></span><strong>3</strong><small>day streak</small></article></div>
              <section className="reflection-card"><p className="eyebrow">YOUR WEEKLY TRUTH</p><h2>You’re showing up.</h2><p>You completed more movement than last week. Your next focus is checking meals before you eat, not after.</p></section>
              <section className="data-controls"><h2>Your data stays on this device</h2><p>No account is required. You can save a copy or erase everything at any time.</p><div><Button variant="outline" onClick={exportData}>Export my data</Button><Button variant="destructive" onClick={resetData}><RotateCcw /> Reset</Button></div></section>
            </section>
          )}
        </div>

        <nav className="bottom-nav" aria-label="Main navigation">
          <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}><Home /><span>Today</span></button>
          <button className={tab === 'coach' ? 'active' : ''} onClick={() => setTab('coach')}><MessageCircle /><span>Coach</span></button>
          <button className={tab === 'learn' ? 'active' : ''} onClick={() => setTab('learn')}><BookOpen /><span>Learn</span></button>
          <button className={tab === 'shop' ? 'active' : ''} onClick={() => setTab('shop')}><ShoppingBasket /><span>Shop</span></button>
          <button className={tab === 'progress' ? 'active' : ''} onClick={() => setTab('progress')}><TrendingUp /><span>Progress</span></button>
        </nav>
      </section>

      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="welcome-dialog" showCloseButton={false}>
          <div className="welcome-logo"><AppLogo /></div><DialogHeader><DialogTitle>Welcome, Alex.</DialogTitle><DialogDescription>This plan starts small on purpose. What feels like a comfortable first walk?</DialogDescription></DialogHeader>
          <div className="walk-options">{['10','15','20'].map((minutes) => <button key={minutes} className={walkingStart === minutes ? 'selected' : ''} onClick={() => setWalkingStart(minutes)}><strong>{minutes}</strong><span>minutes</span></button>)}</div>
          <p className="dialog-safety">If you have chest pain, dizziness, severe breathlessness, uncontrolled blood pressure, diabetes complications, or significant joint pain, ask a healthcare professional before changing activity.</p>
          <Button className="dialog-primary" size="lg" onClick={() => setShowWelcome(false)}>Create my simple plan <ArrowRight /></Button>
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
        <DialogContent className="profile-dialog"><DialogHeader><DialogTitle>Your plan</DialogTitle><DialogDescription>Keep the starting point comfortable and realistic.</DialogDescription></DialogHeader><label>Starting walk<select value={walkingStart} onChange={(e) => setWalkingStart(e.target.value)}><option value="10">10 minutes</option><option value="15">15 minutes</option><option value="20">20 minutes</option><option value="30">30 minutes</option></select></label><div className="profile-info"><strong>About this coach</strong><p>It gives educational wellness support, not medical diagnosis or treatment. It will never recommend raw meat, crash diets, or ignoring symptoms.</p></div><Button className="dialog-primary" onClick={() => setShowProfile(false)}>Save plan</Button></DialogContent>
      </Dialog>
    </main>
  );
}
