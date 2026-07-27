// Deterministic Astana seed generator. Run: `npm run generate-seed`.
// Produces ~185 synthetic vendor rows -> src/data/vendors.json.
// Every row is verified:false, source:"synthetic". Same seed -> same output.

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'lib', 'planner', 'data', 'vendors.json');

// ---- deterministic PRNG (mulberry32) ----
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20241015);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const rint = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
// price snapped to a nice step
const price = (lo, hi, step = 500) =>
  Math.round(rint(lo, hi) / step) * step;
const rating = () => Math.round((3.6 + rnd() * 1.4) * 10) / 10; // 3.6..5.0

const CITY = 'Astana';
const DISTRICTS = ['Esil', 'Almaty', 'Saryarka', 'Baikonyr', 'Nura'];
const PHONE = () => `+7 7172 ${rint(100, 999)}-${rint(10, 99)}-${rint(10, 99)}`;

const rows = [];
let counter = 0;
function add(cat, prefix, fields) {
  counter++;
  const id = `${prefix}-${String(counter).padStart(3, '0')}`;
  rows.push({
    id,
    city: CITY,
    district: pick(DISTRICTS),
    category: cat,
    price_kzt: 0,
    rating: rating(),
    capacity_min: 0,
    capacity_max: 0,
    tags: [],
    contact: PHONE(),
    notes: '',
    source: 'synthetic',
    verified: false,
    ...fields,
  });
}

// ---------------- VENUES (~40) ----------------
const VENUE_INCLUDES = ['sound', 'tables', 'chairs', 'projector', 'parking', 'kitchen', 'stage'];
function venueIncludes(n) {
  const shuffled = [...VENUE_INCLUDES].sort(() => rnd() - 0.5);
  return shuffled.slice(0, n);
}

// Banquet halls: per_person 6 000..20 000
const HALL_NAMES = ['Astana Palace', 'Shanyrak', 'Zhuldyz', 'Aray', 'Dastan', 'Grand Nur', 'Altyn Orda', 'Nomad', 'Bayterek Hall', 'Saltanat', 'Kazyna', 'Aisha Bibi'];
for (const nm of HALL_NAMES) {
  const cmin = rint(30, 60);
  add('venue', 'ven', {
    name: `Banquet Hall «${nm}»`,
    price_model: 'per_person',
    price_kzt: price(6000, 20000, 500),
    capacity_min: cmin,
    capacity_max: cmin + rint(60, 340),
    includes: venueIncludes(rint(3, 5)),
    tags: ['banquet', 'hall', 'indoor', pick(['toi', 'wedding', 'corporate'])],
    notes: 'Banquet hall with in-house catering option.',
  });
}

// Conference halls: per_day 150 000..900 000
const CONF_NAMES = ['Expo Congress', 'Nazarbayev Center', 'Rixos Conference', 'Hilton Ballroom', 'Talan Towers', 'Astana Marriott', 'Sary-Arka Forum', 'EXPO Pavilion'];
for (const nm of CONF_NAMES) {
  const cmin = rint(20, 40);
  add('venue', 'ven', {
    name: `Conference Hall «${nm}»`,
    price_model: 'per_day',
    price_kzt: price(150000, 900000, 5000),
    capacity_min: cmin,
    capacity_max: cmin + rint(80, 460),
    includes: ['projector', 'sound', 'chairs', 'tables', 'parking'].slice(0, rint(3, 5)),
    tags: ['conference', 'seminar', 'business', 'projector'],
    notes: 'Business conference hall, full A/V.',
  });
}

// Restaurants (banquet): per_person 10 000..30 000
const REST_NAMES = ['Line Brew', 'Farhi', 'Del Papa', 'Tюбетейка', 'Sandyq', 'Barbaris', 'Kaganat', 'Assorti', 'Nurgisa'];
for (const nm of REST_NAMES) {
  const cmin = rint(20, 40);
  add('venue', 'ven', {
    name: `Restaurant «${nm}»`,
    price_model: 'per_person',
    price_kzt: price(10000, 30000, 500),
    capacity_min: cmin,
    capacity_max: cmin + rint(40, 210),
    includes: venueIncludes(rint(2, 4)),
    tags: ['restaurant', 'banquet', 'indoor', pick(['premium', 'family'])],
    notes: 'Restaurant with banquet menu.',
  });
}

// Co-working / meeting: per_day 150 000..500 000
const COWORK_NAMES = ['SmArt.Point', 'MOST Hub', 'Astana Hub', 'Multispace', 'Impact Hub'];
for (const nm of COWORK_NAMES) {
  const cmin = rint(10, 20);
  add('venue', 'ven', {
    name: `Co-working «${nm}»`,
    price_model: 'per_day',
    price_kzt: price(150000, 500000, 5000),
    capacity_min: cmin,
    capacity_max: cmin + rint(40, 160),
    includes: ['projector', 'chairs', 'tables', 'parking'].slice(0, rint(2, 4)),
    tags: ['coworking', 'seminar', 'business', 'flexible'],
    notes: 'Flexible co-working event space.',
  });
}

// Outdoor / tent venues: per_day
const OUT_NAMES = ['Botanical Garden', 'Riverside Terrace', 'Central Park Lawn', 'EXPO Boulevard', 'Yssyk Terrace', 'Left Bank Garden'];
for (const nm of OUT_NAMES) {
  const cmin = rint(50, 100);
  add('venue', 'ven', {
    name: `Outdoor «${nm}»`,
    price_model: 'per_day',
    price_kzt: price(200000, 700000, 5000),
    capacity_min: cmin,
    capacity_max: cmin + rint(100, 400),
    includes: ['parking'],
    tags: ['outdoor', 'summer', 'wedding', 'toi'],
    notes: 'Open-air venue, seasonal.',
  });
}

// ---------------- CATERING (~34) ----------------
const CUISINES = ['Kazakh', 'European', 'Asian', 'Mixed', 'Halal BBQ'];
// Buffet: per_person 5 000..12 000
for (let i = 0; i < 10; i++) {
  const halal = rnd() > 0.2;
  add('catering', 'cat', {
    name: `Buffet Service ${i + 1}`,
    price_model: 'per_person',
    price_kzt: price(5000, 12000, 250),
    min_order: rint(20, 50),
    cuisine: pick(CUISINES),
    halal,
    capacity_max: 1000,
    tags: ['buffet', ...(halal ? ['halal'] : []), ...(rnd() > 0.5 ? ['vegetarian'] : [])],
    notes: 'Buffet-style catering.',
  });
}
// Banquet catering: per_person 8 000..25 000
for (let i = 0; i < 10; i++) {
  const halal = rnd() > 0.15;
  add('catering', 'cat', {
    name: `Banquet Catering ${i + 1}`,
    price_model: 'per_person',
    price_kzt: price(8000, 25000, 250),
    min_order: rint(30, 60),
    cuisine: pick(CUISINES),
    halal,
    capacity_max: 1000,
    tags: ['banquet', 'served', ...(halal ? ['halal'] : []), ...(rnd() > 0.6 ? ['vegetarian'] : [])],
    notes: 'Full served banquet menu.',
  });
}
// Coffee-break: per_person 2 500..6 000
for (let i = 0; i < 8; i++) {
  const halal = rnd() > 0.1;
  add('catering', 'cat', {
    name: `Coffee-break Package ${i + 1}`,
    price_model: 'per_person',
    price_kzt: price(2500, 6000, 250),
    min_order: rint(15, 40),
    cuisine: 'European',
    halal,
    capacity_max: 1000,
    tags: ['coffee-break', 'conference', ...(halal ? ['halal'] : []), 'vegetarian'],
    notes: 'Coffee, tea, pastries for conferences.',
  });
}
// Dastarkhan: per_person 7 000..18 000
for (let i = 0; i < 6; i++) {
  add('catering', 'cat', {
    name: `Dastarkhan Set ${i + 1}`,
    price_model: 'per_person',
    price_kzt: price(7000, 18000, 250),
    min_order: rint(30, 80),
    cuisine: 'Kazakh',
    halal: true,
    capacity_max: 1000,
    tags: ['dastarkhan', 'kazakh', 'halal', 'toi'],
    notes: 'Traditional Kazakh dastarkhan.',
  });
}

// ---------------- STAFF (~46) ----------------
function staff(role, name, model, lo, hi, tags, step = 5000) {
  add('staff', 'stf', {
    name,
    role,
    price_model: model,
    price_kzt: price(lo, hi, step),
    capacity_max: 100000,
    tags: [role, ...tags],
    notes: `${role} service.`,
  });
}
for (let i = 0; i < 7; i++) staff('tamada', `Tamada / Host ${i + 1}`, 'flat', 150000, 450000, ['host', 'toi', pick(['kazakh', 'bilingual', 'russian'])]);
for (let i = 0; i < 6; i++) staff('dj', `DJ + Sound ${i + 1}`, 'flat', 120000, 350000, ['music', 'sound', 'party']);
for (let i = 0; i < 7; i++) staff('photographer', `Photographer ${i + 1}`, 'flat', 100000, 300000, ['photo', pick(['portrait', 'reportage'])]);
for (let i = 0; i < 6; i++) staff('videographer', `Videographer ${i + 1}`, 'flat', 150000, 500000, ['video', pick(['4k', 'drone', 'cinematic'])]);
for (let i = 0; i < 8; i++) staff('waiter', `Waiter ${i + 1}`, 'per_hour', 3000, 6000, ['service', 'banquet'], 250);
for (let i = 0; i < 5; i++) staff('security', `Security Guard ${i + 1}`, 'per_hour', 2500, 5000, ['safety'], 250);
for (let i = 0; i < 4; i++) staff('cleaner', `Cleaning Crew ${i + 1}`, 'per_hour', 2000, 4000, ['cleaning'], 250);
for (let i = 0; i < 3; i++) staff('translator', `Translator ${i + 1}`, 'per_hour', 6000, 12000, ['translation', pick(['en-ru', 'en-kk', 'zh-ru'])], 500);

// ---------------- EQUIPMENT (~30) ----------------
function equip(name, lo, hi, tags, model = 'per_day', step = 2500) {
  add('equipment', 'eqp', {
    name,
    price_model: model,
    price_kzt: price(lo, hi, step),
    capacity_max: 100000,
    tags,
    notes: `${name} rental.`,
  });
}
for (let i = 0; i < 5; i++) equip(`Sound System ${i + 1}`, 40000, 200000, ['sound', 'audio']);
for (let i = 0; i < 5; i++) equip(`Stage Lighting ${i + 1}`, 30000, 180000, ['lighting', 'stage']);
for (let i = 0; i < 6; i++) equip(`Projector + Screen ${i + 1}`, 25000, 80000, ['projector', 'screen', 'conference']);
for (let i = 0; i < 4; i++) equip(`Stage Platform ${i + 1}`, 60000, 250000, ['stage', 'podium']);
for (let i = 0; i < 4; i++) equip(`Event Tent ${i + 1}`, 80000, 400000, ['tent', 'outdoor']);
for (let i = 0; i < 3; i++) equip(`Chairs & Tables Set ${i + 1}`, 30000, 150000, ['furniture', 'chairs', 'tables']);
for (let i = 0; i < 3; i++) equip(`Generator ${i + 1}`, 40000, 120000, ['power', 'generator', 'outdoor']);

// ---------------- DECOR (~20) ----------------
function decor(name, lo, hi, tags) {
  add('decor', 'dec', {
    name,
    price_model: 'flat',
    price_kzt: price(lo, hi, 2500),
    capacity_max: 100000,
    tags,
    notes: `${name}.`,
  });
}
for (let i = 0; i < 5; i++) decor(`Floral Decoration ${i + 1}`, 60000, 300000, ['flowers', 'floral', 'wedding']);
for (let i = 0; i < 4; i++) decor(`Balloon Decor ${i + 1}`, 30000, 120000, ['balloons', 'birthday', 'kids']);
for (let i = 0; i < 6; i++) decor(`Photo-zone / Backdrop ${i + 1}`, 60000, 250000, ['photo-zone', 'backdrop']);
for (let i = 0; i < 5; i++) decor(`Textile & Drapery ${i + 1}`, 40000, 180000, ['textiles', 'drapery', 'toi']);

// ---------------- LOGISTICS (~15) ----------------
function logi(name, model, lo, hi, tags, step = 2500) {
  add('logistics', 'log', {
    name,
    price_model: model,
    price_kzt: price(lo, hi, step),
    capacity_max: 100000,
    tags,
    notes: `${name}.`,
  });
}
for (let i = 0; i < 5; i++) logi(`Shuttle Bus ${i + 1}`, 'per_day', 80000, 300000, ['transport', 'shuttle', 'bus'], 5000);
for (let i = 0; i < 4; i++) logi(`Delivery Service ${i + 1}`, 'flat', 15000, 60000, ['delivery']);
for (let i = 0; i < 3; i++) logi(`Printing & Signage ${i + 1}`, 'flat', 20000, 120000, ['printing', 'signage']);
for (let i = 0; i < 3; i++) logi(`Badges & Lanyards ${i + 1}`, 'per_person', 300, 1200, ['badges', 'conference'], 50);

writeFileSync(OUT, JSON.stringify(rows, null, 2) + '\n', 'utf8');
console.log(`Wrote ${rows.length} vendor rows to ${OUT}`);
