import { db } from './db';
import type { WidgetLayout, MasterPackingItem } from '../types';

const uid = () => Math.random().toString(36).slice(2, 10);

// Starter content for the Spongie Master Packing Library — the user's own
// "Ultimate Packing List", imported in full and grouped the way they group it.
const MASTER_PACKING_LIBRARY: Omit<MasterPackingItem, 'id'>[] = [
  ...[
    'Toothbrush', 'Toothpaste', 'Dental Floss', 'Mouthwash', 'Body Soap', 'B Soap', 'Face Wash',
    'Bath Towels', 'Face Cloth', 'Sponge', 'Underarm Roll-on', 'Deodorant', 'Cologne Holder', 'Cologne',
    'Shampoo', 'Conditioner', 'Hair Cream', 'Brush / Comb', 'Flat Iron', 'Hair Styling Products',
    'Baby Powder', 'Body Moisturizer', 'Hand Moisturiser', 'Sunscreen', 'Face Moisturiser', 'Lip Balm',
    'Contact Lenses', 'Contact Lenses Case', 'Contact Lenses Solution', 'Shaving Cream', 'Razor',
    'Nail Clippers', 'Nail File', 'Tissues', 'Toilet Paper', 'Wet Wipes Bathroom', 'Current Medication',
    'Penicillin', 'Pain Pills', 'Vitamins', 'Breath Mints', 'Plastic Bags', 'Laundry Material Bag',
    'Toilet Spray', 'Ear Buds', 'Tweezers', 'Shower Plastic Head', 'Spark Aligners in Mouth',
    'Spark Aligners Case', 'Aligner Elastics', 'Dog Water Bowls and 💩 Bags', 'Medicine Ready', 'Enough Dog Food',
  ].map(name => ({ group: '🧼 Hygiene', name, qty: 1, requiresCharging: false, isGift: false })),
  ...[
    'Blanket (Small)', 'Formal Wear', 'Underwear', 'Socks', 'Pajamas', 'Jackets', 'Pullover', 'Raincoat',
    'Hat', 'Gloves', 'Scarf', 'T-Shirts', 'Jeans', 'Shorts', 'Exercise Clothing', 'Swimsuits',
    'Athletic Takkies', 'Arm Phone Holder (Running)', 'Leisure Shoes', 'Shower Sandals', 'Belt', 'Umbrella',
  ].map(name => ({ group: '👖 Clothes', name, qty: 1, requiresCharging: false, isGift: false })),
  ...[
    'Snacks', 'Water / Drinks', 'Chewing Gum', 'Motion-Sickness Medication', 'Wallet', 'Cash (Money in Wallet)',
    'Debit Cards (x2)', "Driver's Licence", 'Medical Aid Card', 'Map / Directions on Google Maps',
    'Reading Glasses', 'Sunglasses', 'House Keys / Remote', 'Car / Classroom Keys', 'Lock(s) for Bags',
    'Luggage Tags', 'Empty Containers for Food',
  ].map(name => ({ group: '🛷 Basics', name, qty: 1, requiresCharging: false, isGift: false })),
  ...[
    'Class Exercise', 'Memorandum', 'Marking', 'Red Pen', 'Stickers', 'Classlists',
  ].map(name => ({ group: '🏫 School', name, qty: 1, requiresCharging: false, isGift: false })),
  ...[
    'Journal', 'Stationery Bag', 'Reading Material', '1. Activate Payoneer Card', '2. Euros for Cash',
    '3. Saily Roaming Data', '4. Cell C Roaming', '5. Travel Insurance — Activation 2 Weeks',
    '6. Nedbank Debit Card Visa', '7. Nedbank American Express', 'Mobile Roaming Deactivate: Call Cell C',
    '1. Cancel International Roaming', '2. Cancel WIFI Calling', '3. Cancel Call Barring',
  ].map(name => ({ group: '📝 Pre-Trip Prep', name, qty: 1, requiresCharging: false, isGift: false })),
  ...[
    'SA ID', "SA Driver's License", 'SA Passport', 'Portuguese Passport', 'Plane Tickets', 'Medical Aid Card',
    'Travel Insurance Info', 'Emergency Contact Info', 'Debit Card Info', 'Copies of All Documents',
    'Email Copies of All Documents', 'Travel Pillow', 'Sleeping Mask', 'Visas', 'Luggage Tags',
    'Locks for Baggage', 'Socks', 'Tissues (in Luggage Bag)', 'Pajamas (in Luggage Bag)', 'Airport Lounge',
    'Apple Tag in Bags', 'Take Photos at Luggage Desk',
  ].map(name => ({ group: '✈️ Travelling Docs', name, qty: 1, requiresCharging: false, isGift: false })),
  ...[
    'Gifts', 'Hospitality Gifts',
  ].map(name => ({ group: '🎁 Gifts', name, qty: 1, requiresCharging: false, isGift: true })),
  ...[
    { name: 'iPhone', charge: true }, { name: 'Apple Watch', charge: true }, { name: 'Wireless Keyboard', charge: false },
    { name: 'AirPods', charge: true }, { name: 'iPad', charge: true }, { name: 'Laptop (Personal)', charge: true },
    { name: 'Laptop Earphones', charge: false }, { name: 'School Laptop and Charger', charge: false },
    { name: 'Adapter: 2 Point', charge: false }, { name: 'International Plug Converter', charge: false },
    { name: 'Charging Wooden Holder', charge: false }, { name: '1m Extension Cord', charge: false },
    { name: 'Ultimate Ears Speaker', charge: true }, { name: 'Ultimate Ears Speaker Charger', charge: false },
    { name: 'Desktop Charging Block', charge: false }, { name: 'Computer Mouse', charge: false },
    { name: 'Torch', charge: true }, { name: 'iPhone Charger + Box', charge: false },
    { name: 'Apple Watch Charger', charge: false }, { name: 'Keyboard Charger (long)', charge: false },
    { name: 'AirPods Charger', charge: false }, { name: 'PowerBank and (long) Cord', charge: true },
    { name: 'iPad Charger + Box', charge: false }, { name: 'Laptop Charger', charge: false },
    { name: 'Recharge PowerBank', charge: false }, { name: 'Download Movies / Books', charge: false },
    { name: 'Recharge Laptop', charge: false }, { name: 'Recharge AirPods', charge: false },
    { name: 'Recharge FitBit', charge: false }, { name: 'Enough Petrol in Car?', charge: false },
    { name: 'Etoll Money?', charge: false }, { name: 'Tyres Pumped?', charge: false },
  ].map(({ name, charge }) => ({ group: '🧑‍💻 Technology', name, qty: 1, requiresCharging: charge, isGift: false })),
];

export const DEFAULT_LAYOUT: WidgetLayout[] = [
  // HOME page — 12 col grid
  { id: uid(), type: 'clock', page: 'home', x: 0, y: 0, w: 4, h: 3 },
  { id: uid(), type: 'weather', page: 'home', x: 4, y: 0, w: 4, h: 3 },
  { id: uid(), type: 'nextEvent', page: 'home', x: 8, y: 0, w: 4, h: 3 },
  { id: uid(), type: 'agenda', page: 'home', x: 0, y: 3, w: 4, h: 4 },
  { id: uid(), type: 'tasks', page: 'home', x: 4, y: 3, w: 4, h: 4 },
  { id: uid(), type: 'notes', page: 'home', x: 8, y: 3, w: 4, h: 4 },
  { id: uid(), type: 'countdown', page: 'home', x: 0, y: 7, w: 4, h: 3 },
  { id: uid(), type: 'recipeSpotlight', page: 'home', x: 4, y: 7, w: 4, h: 3 },
  { id: uid(), type: 'quickActions', page: 'home', x: 8, y: 7, w: 4, h: 3 },
  { id: uid(), type: 'quote', page: 'home', x: 0, y: 10, w: 3, h: 3 },
  { id: uid(), type: 'fact', page: 'home', x: 3, y: 10, w: 2, h: 3 },
  { id: uid(), type: 'joke', page: 'home', x: 5, y: 10, w: 3, h: 3 },
  { id: uid(), type: 'wordOfDay', page: 'home', x: 8, y: 10, w: 2, h: 3 },
  { id: uid(), type: 'question', page: 'home', x: 10, y: 10, w: 2, h: 3 },
  { id: uid(), type: 'worldClock', page: 'home', x: 0, y: 13, w: 4, h: 4 },
  { id: uid(), type: 'alarms', page: 'home', x: 4, y: 13, w: 4, h: 4 },
  { id: uid(), type: 'bills', page: 'home', x: 8, y: 13, w: 4, h: 4 },
  { id: uid(), type: 'sunTimes', page: 'home', x: 0, y: 17, w: 4, h: 3 },
  { id: uid(), type: 'currency', page: 'home', x: 4, y: 17, w: 4, h: 3 },
  { id: uid(), type: 'familyBoard', page: 'home', x: 0, y: 20, w: 8, h: 4 },
  { id: uid(), type: 'appShortcuts', page: 'home', x: 0, y: 24, w: 12, h: 3 },

  // PLANNER
  { id: uid(), type: 'agenda', page: 'planner', x: 0, y: 0, w: 6, h: 4 },
  { id: uid(), type: 'mealPlanner', page: 'planner', x: 6, y: 0, w: 6, h: 4 },
  { id: uid(), type: 'tasks', page: 'planner', x: 0, y: 4, w: 6, h: 4 },
  { id: uid(), type: 'bills', page: 'planner', x: 6, y: 4, w: 6, h: 4 },

  // SHOPPING
  { id: uid(), type: 'shopping', page: 'shopping', x: 0, y: 0, w: 8, h: 10 },
  { id: uid(), type: 'quickActions', page: 'shopping', x: 8, y: 0, w: 4, h: 4 },

  // HOME LIFE
  { id: uid(), type: 'chores', page: 'homelife', x: 0, y: 0, w: 6, h: 4 },
  { id: uid(), type: 'bills', page: 'homelife', x: 6, y: 0, w: 6, h: 4 },
  { id: uid(), type: 'notes', page: 'homelife', x: 0, y: 4, w: 6, h: 3 },
  { id: uid(), type: 'countdown', page: 'homelife', x: 6, y: 4, w: 6, h: 3 },

  // ENTERTAINMENT
  { id: uid(), type: 'worldClock', page: 'entertainment', x: 0, y: 0, w: 6, h: 4 },
  { id: uid(), type: 'sunMoon', page: 'entertainment', x: 6, y: 0, w: 6, h: 4 },
  { id: uid(), type: 'timer', page: 'entertainment', x: 0, y: 4, w: 4, h: 5 },
  { id: uid(), type: 'stopwatch', page: 'entertainment', x: 4, y: 4, w: 4, h: 5 },
  { id: uid(), type: 'alarms', page: 'entertainment', x: 8, y: 4, w: 4, h: 5 },
  { id: uid(), type: 'photos', page: 'entertainment', x: 0, y: 9, w: 12, h: 5 },

  // ENERGY
  { id: uid(), type: 'energy', page: 'energy', x: 0, y: 0, w: 12, h: 6 },

  // FUN
  { id: uid(), type: 'quote', page: 'fun', x: 0, y: 0, w: 4, h: 3 },
  { id: uid(), type: 'fact', page: 'fun', x: 4, y: 0, w: 4, h: 3 },
  { id: uid(), type: 'joke', page: 'fun', x: 8, y: 0, w: 4, h: 3 },
  { id: uid(), type: 'wordOfDay', page: 'fun', x: 0, y: 3, w: 4, h: 3 },
  { id: uid(), type: 'question', page: 'fun', x: 4, y: 3, w: 4, h: 3 },
  { id: uid(), type: 'sunMoon', page: 'fun', x: 8, y: 3, w: 4, h: 3 },
  { id: uid(), type: 'sunTimes', page: 'fun', x: 0, y: 6, w: 4, h: 3 },
  { id: uid(), type: 'currency', page: 'fun', x: 4, y: 6, w: 4, h: 3 },
];

export type PresetName = 'default' | 'minimal' | 'kitchen' | 'entertainment' | 'energy';

const homeOnly = (widgets: Omit<WidgetLayout, 'id' | 'page'>[]): WidgetLayout[] =>
  widgets.map(w => ({ ...w, id: uid(), page: 'home' as const }));

export const HOME_PRESETS: Record<PresetName, () => WidgetLayout[]> = {
  default: () => homeOnly([
    { type: 'clock', x: 0, y: 0, w: 4, h: 3 },
    { type: 'weather', x: 4, y: 0, w: 4, h: 3 },
    { type: 'nextEvent', x: 8, y: 0, w: 4, h: 3 },
    { type: 'agenda', x: 0, y: 3, w: 4, h: 4 },
    { type: 'tasks', x: 4, y: 3, w: 4, h: 4 },
    { type: 'notes', x: 8, y: 3, w: 4, h: 4 },
    { type: 'countdown', x: 0, y: 7, w: 4, h: 3 },
    { type: 'recipeSpotlight', x: 4, y: 7, w: 4, h: 3 },
    { type: 'quickActions', x: 8, y: 7, w: 4, h: 3 },
    { type: 'appShortcuts', x: 0, y: 10, w: 12, h: 3 },
  ]),
  minimal: () => homeOnly([
    { type: 'clock', x: 0, y: 0, w: 6, h: 5 },
    { type: 'weather', x: 6, y: 0, w: 6, h: 5 },
    { type: 'agenda', x: 0, y: 5, w: 12, h: 5 },
  ]),
  kitchen: () => homeOnly([
    { type: 'recipeSpotlight', x: 0, y: 0, w: 6, h: 5 },
    { type: 'mealPlanner', x: 6, y: 0, w: 6, h: 5 },
    { type: 'shopping', x: 0, y: 5, w: 4, h: 5 },
    { type: 'timer', x: 4, y: 5, w: 4, h: 5 },
    { type: 'weather', x: 8, y: 5, w: 4, h: 5 },
  ]),
  entertainment: () => homeOnly([
    { type: 'clock', x: 0, y: 0, w: 4, h: 4 },
    { type: 'worldClock', x: 4, y: 0, w: 8, h: 4 },
    { type: 'timer', x: 0, y: 4, w: 6, h: 5 },
    { type: 'stopwatch', x: 6, y: 4, w: 6, h: 5 },
  ]),
  energy: () => homeOnly([
    { type: 'energy', x: 0, y: 0, w: 12, h: 7 },
    { type: 'clock', x: 0, y: 7, w: 4, h: 3 },
    { type: 'weather', x: 4, y: 7, w: 4, h: 3 },
    { type: 'quickActions', x: 8, y: 7, w: 4, h: 3 },
  ]),
};

let seedingPromise: Promise<void> | null = null;

export function seedDemoData() {
  if (!seedingPromise) seedingPromise = doSeed();
  return seedingPromise;
}

async function doSeed() {
  const count = await db.widgets.count();
  if (count > 0) return;

  await db.widgets.bulkAdd(DEFAULT_LAYOUT);

  await db.tasks.bulkAdd([
    { id: uid(), text: 'Buy groceries', done: false, priority: 'important', createdAt: Date.now() },
    { id: uid(), text: 'Pay electricity', done: false, priority: 'urgent', createdAt: Date.now() },
    { id: uid(), text: 'Call John', done: false, priority: 'normal', createdAt: Date.now() },
    { id: uid(), text: 'Water plants', done: true, priority: 'low', createdAt: Date.now() },
  ]);

  await db.notes.bulkAdd([
    { id: uid(), text: 'Remember coffee for tomorrow ☕', color: 'yellow', pinned: true, x: 0, y: 0, createdAt: Date.now() },
    { id: uid(), text: 'Garage door code: ask Sam', color: 'pink', pinned: false, x: 1, y: 0, createdAt: Date.now() },
  ]);

  await db.shopping.bulkAdd([
    { id: uid(), name: 'Milk', category: 'groceries', done: false, createdAt: Date.now() },
    { id: uid(), name: 'Bread', category: 'groceries', done: false, createdAt: Date.now() },
    { id: uid(), name: 'Coffee', category: 'groceries', done: false, createdAt: Date.now() },
    { id: uid(), name: 'Eggs', category: 'groceries', done: true, createdAt: Date.now() },
    { id: uid(), name: 'Dish soap', category: 'household', done: false, createdAt: Date.now() },
  ]);

  const inTwelveDays = new Date(); inTwelveDays.setDate(inTwelveDays.getDate() + 12);
  const inFortyFive = new Date(); inFortyFive.setDate(inFortyFive.getDate() + 45);
  const christmas = new Date(); christmas.setMonth(11, 25);
  if (christmas < new Date()) christmas.setFullYear(christmas.getFullYear() + 1);

  await db.countdowns.bulkAdd([
    { id: uid(), name: 'Holiday', date: inTwelveDays.toISOString(), icon: '🏖️', color: '#22d3ee' },
    { id: uid(), name: 'Birthday', date: inFortyFive.toISOString(), icon: '🎂', color: '#f472b6' },
    { id: uid(), name: 'Christmas', date: christmas.toISOString(), icon: '🎄', color: '#a78bfa' },
  ]);

  await db.chores.bulkAdd([
    { id: uid(), name: 'Laundry', everyDays: 3, lastDone: Date.now() - 2 * 86400000 },
    { id: uid(), name: 'Change bedding', everyDays: 7, lastDone: Date.now() - 5 * 86400000 },
    { id: uid(), name: 'Take bins out', everyDays: 7, lastDone: Date.now() - 6 * 86400000 },
    { id: uid(), name: 'Water plants', everyDays: 2, lastDone: Date.now() - 86400000 },
  ]);

  const nextWeek = (d: number) => new Date(Date.now() + d * 86400000).toISOString();
  await db.bills.bulkAdd([
    { id: uid(), name: 'Electricity', amount: 84.5, due: nextWeek(4), recurring: true, completed: false },
    { id: uid(), name: 'Internet', amount: 59, due: nextWeek(10), recurring: true, completed: false },
    { id: uid(), name: 'Insurance', amount: 120, due: nextWeek(20), recurring: true, completed: false },
  ]);

  await db.members.bulkAdd([
    { id: uid(), name: 'You', role: 'Admin', color: '#a855f7' },
    { id: uid(), name: 'Partner', role: 'Admin', color: '#22d3ee' },
    { id: uid(), name: 'Kiddo', role: 'Kid', color: '#f472b6' },
  ]);

  await db.masterPackingItems.bulkAdd(MASTER_PACKING_LIBRARY.map(item => ({ ...item, id: uid() })));

  await db.recipes.bulkAdd([
    {
      id: uid(), name: 'Creamy Chicken Pasta', category: 'Dinner', minutes: 30, favourite: true,
      ingredients: ['Chicken breast', 'Pasta', 'Cream', 'Garlic', 'Parmesan', 'Spinach'],
      steps: [
        'Boil pasta until al dente.',
        'Sear diced chicken until golden.',
        'Add minced garlic, cook 1 minute.',
        'Pour in cream, simmer 5 minutes.',
        'Stir in parmesan and spinach.',
        'Toss with pasta.',
        'Serve hot with black pepper.',
      ],
    },
    {
      id: uid(), name: 'Sheet Pan Veggie Bake', category: 'Dinner', minutes: 40, favourite: false,
      ingredients: ['Potatoes', 'Bell peppers', 'Zucchini', 'Olive oil', 'Rosemary'],
      steps: ['Preheat oven to 220°C.', 'Chop vegetables evenly.', 'Toss with oil and rosemary.', 'Roast 35 minutes, tossing halfway.', 'Season and serve.'],
    },
    {
      id: uid(), name: 'Morning Oats Bowl', category: 'Breakfast', minutes: 10, favourite: true,
      ingredients: ['Oats', 'Milk', 'Banana', 'Honey', 'Cinnamon'],
      steps: ['Simmer oats in milk for 5 minutes.', 'Slice banana on top.', 'Drizzle honey and cinnamon.'],
    },
  ]);

  await db.settings.put({
    id: 'settings', name: 'Home', theme: 'neonDream', timeFormat: '24h', tempUnit: 'C',
    defaultPage: 'home', sidebarWidth: 240, ambientAfterMs: 5 * 60 * 1000,
    nightModeStart: '22:00', nightModeEnd: '07:00', demoCleared: false, location: 'Cape Town',
    textScale: 'normal', highContrast: false, reducedMotion: false,
  labels: {}, soundEnabled: true, soundVolume: 0.5, clickSoundId: 'softPop',
  timerTickSoundId: 'tick', timerRingSoundId: 'melody', alarmSoundId: 'melody',
  currency: 'ZAR', wakeWordEnabled: false, wakeWord: 'Jeeves', voiceReplyEnabled: true, voicePack: 'default', pantryItems: [], weatherForecastStyle: 'bars', ezvizAppKey: '', ezvizAppSecret: '', ezvizAccessToken: '', ezvizTokenExpiresAt: 0, ezvizCameras: [], googleClientId: '', googleAccessToken: '', googleTokenExpiresAt: 0, googleCalendarConnected: false, googleSyncIntervalSec: 5, googleLastSync: 0, googleCalendarIds: [], ecowittAppKey: '', ecowittApiKey: '', ecowittMac: '', ecowittSyncIntervalSec: 60, ecowittLastSync: 0, widgetColorGroups: true,
    nightDimEnabled: true, nightAccentColor: '#f5ff00', nightGlowIntensity: 'subtle', motionWakeEnabled: false,
    googleMapsApiKey: '', googleMapsQuery: '', appleMusicDeveloperToken: '',
    googleTasksConnected: false, googleTasksAccessToken: '', googleTasksTokenExpiresAt: 0, googleTasksSyncIntervalSec: 10, googleTasksLastSync: 0,
    commuteOrigin: '', commuteDestination: '', commuteLabel: 'Work', commuteRefreshIntervalSec: 300,
    dropboxAppKey: '', dropboxAccessToken: '', dropboxTokenExpiresAt: 0, dropboxConnected: false, dropboxFolderPath: '',
    spoonacularApiKey: '',
    youtubeApiKey: '',
  });
}
