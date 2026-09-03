import { db } from './db';
import type { MasterPackingItem } from '../types';

const uid = () => Math.random().toString(36).slice(2, 10);

// Starter content for the Master Packing Library — the user's own
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
    'Toilet Spray', 'Ear Buds', 'Tweezers', 'Shower Plastic Head', 'Dental Aligners in Mouth',
    'Dental Aligners Case', 'Aligner Elastics', 'Pet Water Bowl and Waste Bags', 'Medicine Ready', 'Enough Pet Food',
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
  ].map(name => ({ group: '🛝 Basics', name, qty: 1, requiresCharging: false, isGift: false })),
  ...[
    'Class Exercise', 'Memorandum', 'Marking', 'Red Pen', 'Stickers', 'Classlists',
  ].map(name => ({ group: '🏫 School', name, qty: 1, requiresCharging: false, isGift: false })),
  ...[
    'Journal', 'Stationery Bag', 'Reading Material', '1. Activate Payment Card', '2. Foreign Currency Cash',
    '3. Roaming Data eSIM', '4. Mobile Carrier Roaming', '5. Travel Insurance — Activation 2 Weeks',
    '6. Debit Card', '7. Credit Card', 'Mobile Roaming Deactivate: Call Carrier',
    '1. Cancel International Roaming', '2. Cancel WIFI Calling', '3. Cancel Call Barring',
  ].map(name => ({ group: '📝 Pre-Trip Prep', name, qty: 1, requiresCharging: false, isGift: false })),
  ...[
    'ID Document', "Driver's License", 'Passport (Primary)', 'Passport (Secondary)', 'Plane Tickets', 'Medical Aid Card',
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

let seedingPromise: Promise<void> | null = null;

export function seedDemoData() {
  if (!seedingPromise) seedingPromise = doSeed();
  return seedingPromise;
}

async function doSeed() {
  const count = await db.masterPackingItems.count();
  if (count > 0) return;
  await db.masterPackingItems.bulkAdd(MASTER_PACKING_LIBRARY.map(item => ({ ...item, id: uid() })));
}
