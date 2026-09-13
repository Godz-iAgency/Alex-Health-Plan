# Alex Health Plan V2

## Product architecture, requirement audit, and implementation brief

Status: Implemented and verified.

## 1. Model decision

The current model is strong enough to plan and implement this version of the app. There is no need to switch models before coding.

GPT-6 Astra is the strongest available option for the hardest end-to-end coding and reasoning work. It would be useful for a final independent architecture review, but it is not required to build this plan. The official OpenAI model guide recommends Astra for the most complex reasoning and coding work, while other current models remain capable for normal product implementation.

Source: [OpenAI model guide](https://developers.openai.com/api/docs/models)

## 2. Product intention

Alex Health Plan helps one beginner make the next healthy choice with as little effort as possible.

The app should not feel like a course, a medical chart, or a large dashboard. It should feel like a calm daily guide that answers four questions:

1. What should I do next?
2. What should I eat next?
3. What should I buy this week?
4. Am I moving in the right direction?

The product should optimize for completed healthy actions, not time spent inside the app.

## 3. The measurable goal

### North star metric

Weekly Healthy Action Rate:

`completed recommended actions / recommended actions shown`

This measures whether the app helps Alex act. Weight is an important outcome, but it is too noisy to be the only product metric.

### Supporting outcome measures

- Seven-day average weight trend
- Number of meals checked before eating
- Percentage of planned meals used
- Walking minutes completed
- Sleep and rest check-ins completed
- Grocery list completion
- Seven-day return rate

### Cycle-time targets

- Returning user reaches the next action within 5 seconds
- Daily weight entry takes less than 10 seconds
- Meal recommendation appears within 8 seconds
- First weekly plan is ready within 30 seconds after setup
- Grocery list is created within 5 seconds from an approved plan
- Any common task takes no more than three taps after opening the app

## 4. The five-step product algorithm

### Step 1: Question every requirement

Every feature must answer all four questions below:

1. Does it help Alex make a healthy choice today?
2. Can its effect be measured?
3. Is it safe and accurate?
4. Is it easier than doing the same task without the app?

If the answer is no, the feature should be changed or removed.

### Step 2: Delete what does not contribute

Remove or avoid:

- A separate Coach destination in the main navigation
- Long educational pages before the user can act
- Daily forced consumption of five meals
- Long chatbot replies
- Weight judgments based on one day
- Medical claims about alkalizing the body
- Claims that carbonation itself is harmful
- Claims that carbohydrates must be depleted before fat can be used
- Dr. Sebi branding or disease claims
- Rules that treat organic food as automatically healthier or lower calorie
- A permanent rice ban presented as medically necessary
- Duplicate controls that do the same job
- Decorative cards, badges, colors, and icons that do not guide an action

### Step 3: Simplify and optimize

Use three product pillars:

1. Fuel
2. Move and Recover
3. Mindset

Each day should show one recommended action from each pillar. The most important unfinished action becomes the large primary card.

### Step 4: Increase cycle speed

The home screen should open directly to Today. It should show the next action immediately. Education appears only when the user asks why or opens Learn More.

### Step 5: Automate

The system should automatically:

- Create a seven-day plan
- Build recipes and portions from saved preferences
- Convert approved meals into one grocery list
- Group duplicate grocery ingredients
- Evaluate meals entered by text, voice, or photo
- Save the user's final meal choice
- Update the next best action
- Summarize weekly progress
- Adjust walking difficulty gradually
- Detect when a medical or human professional is needed

## 5. The three-pillar health framework

### Pillar 1: Fuel

Purpose: Help Alex choose satisfying food and drinks that support his goals.

Core guidance:

- Favor vegetables, beans, fruit, whole grains, nuts, seeds, and other whole or minimally processed foods
- Use GBOMBS as a simple memory tool
- Prefer whole fruit over juice most of the time
- Use water as the default drink
- Allow plain sparkling water
- Keep smoothies measured because calories can add up quickly
- If meat is chosen, favor lean, minimally processed options and safe cooking
- Treat rice-free eating as a personal preference that can be turned on or off
- Keep highly processed foods and sugary drinks occasional, while avoiding shame-based language

### Pillar 2: Move and Recover

Purpose: Build fitness without making the first step too difficult.

Progression:

1. Begin with a comfortable 10 to 20 minute walk.
2. Build toward about 150 minutes of moderate activity per week.
3. Add two short strength sessions per week when ready.
4. Start with beginner movements such as chair squats, wall push-ups, supported rows, gentle core work, and step-ups.
5. Progress toward full push-ups, squats, rows or pull-up progressions, and more demanding calisthenics.

Pull-ups, full push-ups, sit-ups, and intense intervals should not be the default starting point. The app should adapt exercises to mobility, pain, fitness level, and medical guidance.

Recovery includes:

- A consistent sleep schedule
- A simple sleep quality check
- A short breathing or meditation practice
- Rest or lighter activity when pain or illness is present

The CDC recommends at least 150 minutes of moderate activity each week and two days of muscle-strengthening activity for adults, while recognizing that starting gradually is useful. Source: [CDC physical activity guidance](https://www.cdc.gov/healthy-weight-growth/physical-activity/)

### Pillar 3: Mindset

Purpose: Help Alex recover from setbacks and continue the next useful behavior.

Core guidance:

- Use short positive statements tied to action
- Offer two to five minutes of affirmations by default
- Allow longer audio as an option, rather than requiring 60 minutes
- Use meditation for stress management and attention
- Never claim that thoughts directly cause or cure disease
- Replace guilt with a clear next step

Example affirmation:

> I do not need a perfect day. I can make my next choice a good one.

## 6. The house analogy for protein, carbohydrates, and fat

The analogy should be simple without teaching a false rule.

### Protein: Building and repair material

Protein is like the wood, brick, wiring, and repair supplies used in a house. The body uses protein to build and repair muscle, skin, organs, enzymes, and other tissue.

### Carbohydrates: The ready energy crew

Carbohydrates are like a crew with energy ready to work. The body breaks many carbohydrates into glucose, which can be used now or stored for later.

### Fat: Long-term energy storage and protection

Fat is like a charged backup battery, insulation, and protective material. The body uses fat for energy, cell structure, organ protection, and other functions.

### Important correction

The body can use carbohydrates and fat at the same time. A person does not have to remove all carbohydrates before the body can use stored fat. Long-term fat loss comes from a sustained energy deficit while preserving nutrition, muscle, sleep, and activity.

Sources: [MedlinePlus on carbohydrates](https://medlineplus.gov/carbohydrates.html), [NIH on fat use and storage](https://nigms.nih.gov/biobeat/2024/01/what-do-fats-do-in-the-body)

## 7. Health statements that must be corrected

### Acid and alkaline claims

Do not teach that illness can only grow in an acidic body or that food can alkalize the blood. The lungs and kidneys tightly regulate blood pH. The healthy part of many alkaline-style plans comes from eating more plants and fewer highly processed foods, not from changing blood pH.

Source: [MD Anderson alkaline diet review](https://www.mdanderson.org/cancerwise/alkaline-diet--what-cancer-patients-should-know.h00-159223356.html)

### Carbonated drinks

Do not teach that carbonation is harmful because the body releases carbon dioxide. Plain unsweetened sparkling water can remain an approved drink. Regular soda should be discouraged mainly because of added sugar, calories, and low nutritional value.

Sources: [FDA on carbonated drinks](https://www.fda.gov/food/buy-store-serve-safe-food/carbonated-soft-drinks-what-you-should-know), [FDA on added sugars](https://www.fda.gov/food/nutrition-facts-label/added-sugars-nutrition-facts-label)

### Digestion and transit time

Do not assign a precise mouth-to-exit time to each food. Diarrhea and constipation are not simply food moving too fast or too slowly. The app should ask about stool comfort and frequency using simple choices:

- Comfortable
- Too loose
- Too hard or difficult
- Pain, blood, or another concern

Persistent symptoms or red flags should direct the user to a healthcare professional.

Sources: [NIDDK on diarrhea](https://www.niddk.nih.gov/health-information/digestive-diseases/diarrhea/symptoms-causes), [NIDDK on constipation](https://www.niddk.nih.gov/health-information/digestive-diseases/constipation/symptoms-causes)

### Rapid or drastic change

Use a firm plan, but avoid crash-diet framing. Healthy change should still provide enough food, protein, fiber, nutrients, and flexibility to be sustained. The CDC notes that gradual weight loss is more likely to last.

Source: [CDC healthy weight loss guidance](https://www.cdc.gov/healthy-weight-growth/losing-weight/)

## 8. Recommended navigation

Use three bottom tabs:

1. Today
2. Plan
3. Progress

Coach becomes a contextual action inside each screen. Examples include Ask Coach, Check This Meal, Change This Meal, and Explain Why. This removes one destination and puts intelligence where it is needed.

Profile and settings remain behind the profile button.

## 9. Screen architecture

### Onboarding

Ask only what is needed to create a safe first plan:

- Name and preferred units
- Current weight
- Height and age range
- Primary goal
- Allergies and foods to avoid
- Medical conditions, medications, pain, or movement limits
- Usual wake and sleep times
- Cooking time, budget, and food preferences
- Preferred starting walk

The first useful plan should appear before asking optional questions. Optional information can be collected later.

### Today

Order of content:

1. Next Best Action card
2. Quick weight entry
3. Today's eating plan
4. Movement and recovery actions
5. Mindset action

The Next Best Action card changes based on time, completion, and recent behavior. Examples:

- Log today's weight
- Review breakfast
- Take a 15-minute walk
- Start a two-minute reset
- Choose tomorrow's meals

### Plan

Show seven days horizontally, with the current day selected.

Each day contains:

- Breakfast
- Lunch
- Dinner
- Optional smoothie
- Optional dessert

Each meal card includes:

- Meal name and image
- Estimated preparation time
- Clear portion guidance
- Recipe button
- Replace button
- Remove button

Smoothies and desserts are choices, not required eating events. This prevents the app from encouraging food that the user does not need.

After changes, one button says Generate Grocery List.

### Grocery list

The list should:

- Combine duplicate ingredients
- Adjust quantities for one person and selected meals
- Group items by store section
- Allow checking items off
- Allow adding a personal item
- Keep pantry items separate
- Remember checked and purchased items
- Offer one-tap regeneration after a meal change

### Progress

Show:

- Seven-day average weight trend
- Weekly Healthy Action Rate
- Walking minutes
- Planned meals used
- Rest and mindset consistency
- One weekly insight

Do not use a red warning for a single weight increase. Daily weight moves because of water, salt, digestion, and other normal factors.

### Contextual coach

Open the coach as a sheet from the current task. The coach receives the screen context automatically.

Examples:

- Why is this meal yellow?
- Replace mushrooms in this recipe.
- I only have 10 minutes to walk.
- I missed yesterday. What should I do now?

Coach replies stay under 50 words. Recipes and structured plans can be longer because they use dedicated cards rather than chat bubbles.

## 10. Seven-day planning logic

The system creates a plan using:

- Allergies and restrictions
- Food preferences
- Budget
- Cooking time
- Available equipment
- Selected meals per day
- Previous likes, dislikes, skips, and replacements
- Whole-food and GBOMBS targets
- Protein and fiber coverage
- Appropriate portions

Default plan:

- Three main meals per day
- Smoothie available on selected days
- Healthy dessert available on selected days
- Repeated ingredients to reduce waste and cost
- Repeated favorite meals to reduce decision fatigue

The plan should use a small recipe library first. AI can choose and adapt recipes. It should not invent every meal from nothing because consistent structured recipes are easier to verify, shop for, and improve.

## 11. Progress tracking rhythm

### Daily

- Weight, if daily weighing feels helpful
- Meals checked and final choices
- Walking or exercise
- Sleep duration and quality
- Short rest or meditation
- Mood or mindset check
- Optional digestion comfort

### Weekly

- Seven-day weight average
- Healthy Action Rate
- Meal and grocery adherence
- Walking total
- One automatic plan adjustment

### Every 30 days

- Weight trend
- Optional waist measurement
- Energy, sleep, mobility, and confidence review
- Favorite and least favorite meals

### Every 90 days

- Goal review
- Activity progression review
- Medical or professional check-in when appropriate
- Full plan refresh

Daily weighing can be useful for some adults when paired with feedback, but daily readings should be interpreted as a trend. Weekly weighing is also a valid choice. The app should allow either and watch for distress or obsessive use.

Source: [Systematic review of self-weighing](https://pmc.ncbi.nlm.nih.gov/articles/PMC4546162/)

## 12. Accountability without shame

Every meal evaluation follows this structure:

1. Verdict: Supports the plan, Improve it, or Choose another option
2. Reason: One plain sentence
3. Best move: One specific change
4. Commitment: What will you choose?

Example:

> Choose another option. This meal has a sugary drink and little fiber. Keep the sandwich, add a vegetable, and choose water. Which version will you eat?

The system records the meal Alex actually chose. This makes accountability measurable without insulting him.

## 13. AI coach architecture

The AI coach should not be the app's database or its main navigation. It should interpret structured data and guide the next action.

### AI responsibilities

- Explain the current recommendation
- Evaluate a planned meal
- Suggest one realistic improvement
- Replace a recipe ingredient
- Generate approved plan variations
- Write the weekly insight
- Answer simple wellness questions

### Deterministic system responsibilities

- Authentication
- Saving health and plan data
- Calculating trends
- Enforcing word limits
- Checking required fields
- Rate limiting
- Grocery quantity math
- Safety escalation rules
- Recording consent and settings

### Safety rules

The coach must never:

- Diagnose or treat disease
- Promise a cure
- Recommend raw meat
- Tell Alex to stop medication
- Recommend extreme fasting or crash diets
- Present alkaline or detox claims as medical facts
- Ignore chest pain, fainting, severe breathing trouble, blood in stool, or other urgent symptoms

## 14. Airtable data architecture

Keep the existing tables that already work, but extend them around weekly plans and weight tracking.

### Keep and refine

- Profiles
- Daily Check-ins
- Meal Checks
- Coach Exchanges
- Grocery Items
- Plan Content

### Add

#### Health Profile

- Profile Key
- Height
- Age range
- Preferred units
- Goal
- Allergies
- Conditions
- Medications
- Mobility limits
- Emergency guidance acknowledged

#### Preferences

- Profile Key
- Foods liked
- Foods disliked
- Foods avoided
- Rice-free preference
- Animal protein preference
- Budget level
- Cooking time
- Cooking equipment
- Meals selected per day

#### Recipes

- Recipe Key
- Name
- Meal type
- Ingredients
- Steps
- Portions
- Preparation time
- Allergens
- GBOMBS groups
- Protein source
- Active

#### Weekly Plans

- Plan Key
- Profile Key
- Week starting
- Status
- Generated at
- Approved at
- Generation version

#### Planned Meals

- Planned Meal Key
- Plan Key
- Date
- Meal slot
- Recipe Key
- Portion
- Status
- Removed
- Replaced from

#### Weight Logs

- Weight Log Key
- Profile Key
- Date
- Weight
- Unit
- Seven-day average
- Source

#### Daily Wellness Logs

- Profile Key
- Date
- Walk minutes
- Exercise type
- Sleep hours
- Sleep quality
- Meditation minutes
- Mindset completed
- Digestion comfort
- Notes

#### Safety Events

- Event Key
- Profile Key
- Created at
- Category
- Trigger text
- Guidance shown
- Escalation level

Do not store secret API keys, raw access tokens, or unnecessary medical detail in Airtable.

## 15. Automation schedule

### Every day

- Prepare today's next actions
- Prompt for weight at the user's preferred time
- Prompt before likely meal times
- Offer the walk based on schedule and weather only if weather access is added later
- Offer a short evening reset

### Every week

- Generate a draft seven-day plan
- Ask Alex to remove or replace meals
- Generate the grocery list after approval
- Create one progress summary
- Adjust the walking goal only when completion and comfort support it

### Every 30 days

- Generate a lifestyle review
- Ask about energy, sleep, mobility, and plan satisfaction
- Suggest one measurable adjustment

### Human involvement

A human coach is needed only when:

- Alex asks for one
- The app detects an urgent or medical concern
- Progress repeatedly stalls and automated changes have not helped
- The user reports pain, distress, disordered eating behavior, or medication concerns

## 16. Product monitoring

### Experience monitoring

Track these events without storing private message text in analytics:

- App opened
- Weight logged
- Next action completed
- Meal checked
- Meal recommendation accepted or rejected
- Weekly plan generated
- Meal replaced or removed
- Grocery list generated
- Grocery item checked
- Recipe opened
- Coach requested
- Weekly review completed

### AI quality monitoring

Measure:

- Response time
- Failed responses
- Invalid structured results
- Responses over 50 words
- Reading level failures
- Safety escalations
- Recommendation acceptance
- Repeat corrections for the same meal

### Reliability monitoring

Measure:

- Airtable read and write failures
- Gemini errors
- Authentication failures
- Page load time
- Offline saves waiting to sync
- Scheduled plan-generation failures

## 17. Apple-like design direction

### Visual rules

- Use a near-white background and one deep green accent
- Use the system font stack for an iPhone-like feel
- Keep body text at 16 pixels where the user reads or types
- Keep supporting text at 13 to 14 pixels
- Keep every touch target at least 44 pixels high
- Use generous spacing and quiet borders
- Use one main action per screen
- Use motion only to confirm progress or explain navigation
- Use bottom sheets for short explanations and quick edits
- Use charts only when they answer a clear question

### Content rules

- Third-grade to fifth-grade reading level for coach replies
- No em dashes
- No shame or labels about body size
- No AI-style filler
- No long introduction before the action
- One clear recommendation at a time
- Explain why only when requested or when safety requires it

## 18. Implementation audit

### Keep

- Mobile-first layout
- Private six-digit access
- Today screen
- Meal checker
- Four simple daily actions
- GBOMBS education
- Grocery checklist
- Airtable persistence
- Short natural-language coach replies
- Progress history
- Sign out

### Combine

- Move Coach into contextual sheets and buttons
- Combine the Food Guide and recipe education inside Plan
- Combine daily habits and the next action into one ordered Today flow
- Combine meal approval and grocery generation into the weekly-plan flow

### Replace

- Replace static meal ideas with a verified recipe library and weekly plan
- Replace the static grocery list with ingredients derived from approved meals
- Replace daily percentage alone with Healthy Action Rate and weight trend
- Replace the current four-tab navigation with three tabs
- Replace the generic coach memory with current profile, plan, and trend context

### Add

- Weight logging and seven-day trend
- Recipe cards
- Seven-day meal plan
- Meal removal and replacement
- Generated grocery quantities
- Sleep and recovery logging
- Beginner strength progression
- Contextual coaching
- Weekly review and automatic adjustment
- Product and AI monitoring

### Corrected during implementation

The coach now receives saved Airtable context and never claims that the app has no database.

## 19. Recommended implementation order

### Release 1: Daily success loop

- Three-tab navigation
- Next Best Action
- Weight logging with seven-day average
- Updated three-pillar daily actions
- Contextual meal checker
- Corrected health language

Success test: Alex can open the app and complete a useful action in under one minute.

### Release 2: Weekly food system

- Recipe library
- Seven-day meal planning
- Remove and replace meal controls
- Grocery list generated from approved meals
- Pantry and quantity handling

Success test: Alex can create and approve a week of meals and a grocery list without human help.

### Release 3: Adaptive coach

- Context-aware coach sheets
- Weekly summary
- Automatic walking progression
- Sleep, recovery, and mindset adaptation
- Safety escalation events

Success test: The app gives an appropriate next action based on real saved behavior.

### Release 4: Monitoring and refinement

- Experience events
- AI response evaluation
- Reliability alerts
- Funnel and retention review
- Thirty-day and ninety-day reviews

Success test: We can identify where Alex stops using the plan and improve that exact step.

## 20. Final product rule

Every screen should help Alex understand one thing, choose one thing, or complete one thing. If a screen does not do one of those jobs, delete it.
