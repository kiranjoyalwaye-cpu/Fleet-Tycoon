import { WhiteLabelConfig, ZoneConfig, KitchenConfig, KitchenJoinReq, UpgradeConfig, TeamRoleConfig } from '../types/game';

// Default Generic White-Label Configuration
export const DEFAULT_WHITE_LABEL: WhiteLabelConfig = {
  appName: 'Fleet Tycoon',
  appShortTag: 'FLEET',
  metroName: 'Metro Central District',
  currencySymbol: '₹',
  rivalAlphaName: 'Aggregator Alpha',
  rivalBetaName: 'Aggregator Beta',
  rivalOthersName: 'Local Couriers',
  hubName: 'Central Dispatch Hub',
  regulatorName: 'Commerce Commission',
  enterpriseLabel: 'Enterprise Logistics'
};

// Generic Districts (Scrubbed of proprietary geographic names)
export const GENERIC_ZONES: Record<string, ZoneConfig> = {
  zone_alpha: {
    id: 'zone_alpha',
    nameKey: 'Tech Park District',
    shortKey: 'TPD',
    blurbKey: 'Commercial IT parks and the 12:30 lunch crush. Your launchpad.',
    likes: ['Healthy Bowls', 'Regional Classic'],
    lx: 22,
    ly: 62,
    tx: 26,
    ty: 71,
    cost: 0,
    demand: 16,
    start: true
  },
  zone_beta: {
    id: 'zone_beta',
    nameKey: 'Residential Urban Sector',
    shortKey: 'RUS',
    blurbKey: 'High-density apartment complexes. Group carts spread fast.',
    likes: ['European Bistro', 'Street Food'],
    lx: 74,
    ly: 58,
    tx: 74,
    ty: 71,
    cost: 25000,
    demand: 11
  },
  zone_gamma: {
    id: 'zone_gamma',
    nameKey: 'Suburban Tech Corridor',
    shortKey: 'STC',
    blurbKey: 'Enterprise desks and high average delivery radius.',
    likes: ['Continental Mix', 'Traditional Breakfast'],
    lx: 18,
    ly: 36,
    tx: 26,
    ty: 31,
    cost: 30000,
    demand: 9
  },
  zone_delta: {
    id: 'zone_delta',
    nameKey: 'Commercial Avenue',
    shortKey: 'CAV',
    blurbKey: 'High-street dining avenue. Sensitive ETAs, large satisfaction swings.',
    likes: ['Artisan Roastery', 'Classic Kitchen'],
    lx: 78,
    ly: 22,
    tx: 74,
    ty: 31,
    cost: 45000,
    demand: 7
  },
  zone_epsilon: {
    id: 'zone_epsilon',
    nameKey: 'Innovation Park Basin',
    shortKey: 'IPB',
    blurbKey: 'Cloud kitchen cluster and midnight campaign rushes.',
    likes: ['Continental Mix', 'Street Food'],
    lx: 52,
    ly: 12,
    tx: 74,
    ty: 11,
    cost: 40000,
    demand: 10,
    minDay: 6
  },
  zone_zeta: {
    id: 'zone_zeta',
    nameKey: 'Heritage Quarter',
    shortKey: 'HQT',
    blurbKey: 'Traditional diners and quick breakfast combos. High turnover.',
    likes: ['Traditional Breakfast', 'Regional Classic'],
    lx: 28,
    ly: 14,
    tx: 26,
    ty: 11,
    cost: 20000,
    demand: 6
  }
};

export const ZONE_IDS = Object.keys(GENERIC_ZONES);

export const CENTRAL_HUB = { lx: 50, ly: 72, tx: 50, ty: 90 };

export const GENERIC_RIVAL_PINS = {
  zesto: {
    id: 'zesto',
    defaultName: 'Aggregator Alpha',
    code: 'ALPHA',
    lx: 38,
    ly: 34,
    tx: 28,
    ty: 51,
    blurb: 'Major rival platform. Heavy discount campaigns.'
  },
  swish: {
    id: 'swish',
    defaultName: 'Aggregator Beta',
    code: 'BETA',
    lx: 62,
    ly: 38,
    tx: 72,
    ty: 51,
    blurb: 'Fast courier competitor. Free delivery promotions.'
  }
};

// Calculate normalized distances from hub to zones
ZONE_IDS.forEach((id) => {
  const f = GENERIC_ZONES[id];
  f.dist = Math.hypot(f.lx - CENTRAL_HUB.lx, f.ly - CENTRAL_HUB.ly) / 100;
});

// Partner Kitchens (Generic Brand Templates)
export const GENERIC_KITCHENS: KitchenConfig[] = [
  {
    id: 'biryani',
    nameKey: 'Kitchen Alpha (Biryani Express)',
    cuisineKey: 'Regional Classic',
    blurbKey: 'Slow prep, premium basket value, universal demand.',
    prep: 16,
    cap: 6,
    quality: 84,
    cost: 0,
    start: true,
    dishes: ['Spiced Rice Platter', 'Claypot Roast Specialty', 'Executive Meal Combo']
  },
  {
    id: 'bowl',
    nameKey: 'Kitchen Beta (Protein Bowls)',
    cuisineKey: 'Healthy Bowls',
    blurbKey: 'High velocity balanced meals. Corporate favorite.',
    prep: 10,
    cap: 7,
    quality: 74,
    cost: 18000,
    dishes: ['Protein Grain Bowl', 'Fresh Greens Plate', 'Oat Meal Wrap']
  },
  {
    id: 'dose',
    nameKey: 'Kitchen Gamma (Morning Express)',
    cuisineKey: 'Traditional Breakfast',
    blurbKey: 'Consistent preparation quality with picky breakfast users.',
    prep: 11,
    cap: 8,
    quality: 88,
    cost: 22000,
    dishes: ['Crispy Crepe Plate', 'Steamed Rice Cakes', 'Savory Lentil Bowl']
  },
  {
    id: 'shawarma',
    nameKey: 'Kitchen Delta (Street Grill Co)',
    cuisineKey: 'Street Food',
    blurbKey: 'Speedy execution and affordable price points for apartments.',
    prep: 9,
    cap: 8,
    quality: 73,
    cost: 14000,
    dishes: ['Grilled Protein Roll', 'Loaded Fries Box', 'Pita Mezze Wrap']
  },
  {
    id: 'pasta',
    nameKey: 'Kitchen Epsilon (Urban Trattoria)',
    cuisineKey: 'European Bistro',
    blurbKey: 'Compact artisan kitchen. Strong dinner margin.',
    prep: 14,
    cap: 5,
    quality: 76,
    cost: 18000,
    minDay: 2,
    dishes: ['Rustic Penne Bowl', 'Basil Pesto Linguine', 'Garlic Sourdough']
  },
  {
    id: 'cafe',
    nameKey: 'Kitchen Zeta (Roast & Toast Lab)',
    cuisineKey: 'Artisan Roastery',
    blurbKey: 'Specialty coffee and quick bites. Rapid bag dispatch.',
    prep: 8,
    cap: 6,
    quality: 77,
    cost: 15000,
    minDay: 2,
    dishes: ['Brewed Cold Brew', 'Artisan Toast Box', 'Brioche Melt']
  },
  {
    id: 'thali',
    nameKey: 'Kitchen Eta (Grand Feast Hall)',
    cuisineKey: 'Classic Kitchen',
    blurbKey: 'Multi-course family packs with large order baskets.',
    prep: 15,
    cap: 7,
    quality: 80,
    cost: 24000,
    minDay: 3,
    dishes: ['Executive Thali Feast', 'Rich Gravy Curry', 'Butter Naan Basket']
  },
  {
    id: 'night',
    nameKey: 'Kitchen Theta (Midnight Cloud Kitchen)',
    cuisineKey: 'Continental Mix',
    blurbKey: 'Unlocks late-night dispatch and midnight sales campaigns.',
    prep: 12,
    cap: 9,
    quality: 70,
    cost: 28000,
    minDay: 6,
    dishes: ['Wok Tossed Rice', 'Crispy Wings Basket', 'Late Night Noodle Box']
  }
];

export const GENERIC_KITCHEN_JOINS: Record<string, KitchenJoinReq> = {
  bowl: { orders: 80 },
  shawarma: { orders: 200, zone: ['zone_beta'] },
  dose: { orders: 330, nps: 52 },
  pasta: { orders: 460, zone: ['zone_beta', 'zone_delta'] },
  cafe: { orders: 600, zone: ['zone_delta'] },
  thali: { orders: 780, nps: 55 },
  night: { orders: 1000, day: 6 }
};

// Generic Upgrades Table
export const GENERIC_UPGRADES: UpgradeConfig[] = [
  {
    id: 'group',
    name: 'Unified Group Orders',
    tiers: [
      { cost: 35000, minDay: 1, blurb: 'Office clusters share a single cart. Lunch demand +22%, rival attrition reduced.' },
      { cost: 55000, minDay: 5, blurb: 'Community-wide bulk ordering. Lunch demand +35%.' },
      { cost: 85000, minDay: 12, blurb: 'Metro-wide multi-order grouping. Lunch demand +50%.' }
    ]
  },
  {
    id: 'eta',
    name: 'Precision ETA Engine',
    tiers: [
      { cost: 22000, minDay: 1, blurb: 'Orders remain in dispatch queue longer before timing out.' },
      { cost: 30000, minDay: 4, blurb: 'Optimized queue tolerance. Cancellations reduce customer rating 30% less.' },
      { cost: 48000, minDay: 10, blurb: 'Telemetry live dispatching. Cancellations penalized 50% less.' }
    ]
  },
  {
    id: 'fridge',
    name: 'Express Cross-Sell Basket',
    tiers: [
      { cost: 28000, minDay: 2, blurb: 'Quick side adds at checkout. Average order value +12%.' },
      { cost: 40000, minDay: 6, blurb: 'Beverage pairings added. Average order value +22%.' },
      { cost: 65000, minDay: 12, blurb: 'Snacks & desserts integrated. Average order value +32%.' }
    ]
  },
  {
    id: 'rain',
    name: 'All-Weather Protection Kit',
    tiers: [
      { cost: 18000, minDay: 1, blurb: 'Waterproof gear for couriers. Rain delay penalties reduced to 40%.' },
      { cost: 26000, minDay: 4, blurb: 'Covered transfer bays. Rain delay penalties reduced to 15%.' }
    ]
  },
  {
    id: 'pantry2',
    name: 'Micro-Fulfillment Buffer',
    tiers: [
      { cost: 32000, minDay: 3, blurb: '+3 concurrent order slots at all partner counters.' },
      { cost: 48000, minDay: 7, blurb: '+6 concurrent order slots at all partner counters.' },
      { cost: 72000, minDay: 12, blurb: '+9 concurrent order slots at all partner counters.' }
    ]
  },
  {
    id: 'ebike',
    name: 'Eco Electric Courier Fleet',
    tiers: [
      { cost: 38000, minDay: 3, blurb: 'Dispatch rides complete 2 min faster. Courier payout cost reduced.' },
      { cost: 55000, minDay: 8, blurb: 'Dispatch rides complete 4 min faster. Further operating cost efficiency.' },
      { cost: 80000, minDay: 14, blurb: 'Dispatch rides complete 6 min faster.' }
    ]
  },
  {
    id: 'roster',
    name: 'Automated Shift Roster',
    tiers: [
      { cost: 24000, minDay: 2, blurb: 'Idle couriers recover fatigue automatically during off-peak intervals.' },
      { cost: 36000, minDay: 6, blurb: 'Enhanced ergonomic rest rotation.' }
    ]
  },
  {
    id: 'plus',
    name: 'Enterprise VIP Membership',
    tiers: [
      { cost: 30000, minDay: 2, blurb: 'Subscribed users generate recurring daily revenue and steady baseline orders.' },
      { cost: 45000, minDay: 6, blurb: 'Accelerated membership adoption and loyalty retention.' },
      { cost: 70000, minDay: 12, blurb: 'Max tier expansion supporting up to 700 recurring members.' }
    ]
  },
  {
    id: 'ads',
    name: 'Sponsored Vendor Showcase',
    tiers: [
      { cost: 25000, minDay: 3, blurb: 'Generates ad revenue per delivered order. Minor rating trade-off.' },
      { cost: 40000, minDay: 7, blurb: 'Higher sponsor yield with moderate user rating impact.' },
      { cost: 60000, minDay: 12, blurb: 'Premium featured placement monetization.' }
    ]
  },
  {
    id: 'nightshift',
    name: 'Late-Night Dispatch Shift',
    tiers: [
      { cost: 40000, minDay: 6, blurb: 'Extends operating window past 20:00 through 23:00 for night campaigns.' }
    ]
  }
];

export const UPGRADE_RUNNING_COSTS: Record<string, number[]> = {
  group: [300, 500, 800],
  eta: [200, 300, 500],
  fridge: [250, 350, 500],
  rain: [100, 150],
  pantry2: [600, 900, 1300],
  ebike: [350, 550, 800],
  roster: [400, 600],
  plus: [500, 800, 1200],
  ads: [300, 500, 800],
  nightshift: [900]
};

// Apply running costs
GENERIC_UPGRADES.forEach((u) => {
  u.tiers.forEach((t, i) => {
    t.run = (UPGRADE_RUNNING_COSTS[u.id] || [])[i] || 0;
  });
});

export const GENERIC_TEAM: Record<string, TeamRoleConfig> = {
  recruiter: {
    name: 'Talent Acquisition Lead',
    sal: 1100,
    cost: 5000,
    max: 2,
    blurb: 'Reduces courier signing bonuses by 25% each.'
  },
  support: {
    name: 'Dispatch Support Agent',
    sal: 800,
    cost: 3500,
    max: 10,
    blurb: 'Resolves delay tickets and user inquiries. Prevents rating penalties.'
  },
  ops: {
    name: 'Fleet Operations Manager',
    sal: 1500,
    cost: 7000,
    max: 6,
    blurb: 'Oversees 9 couriers each. Prevents courier fatigue and fleet disaffection.'
  },
  acct: {
    name: 'Vendor Account Partner',
    sal: 1300,
    cost: 6000,
    max: 4,
    blurb: 'Maintains partner kitchen relations. Accelerates onboarding of new restaurants.'
  }
};

export const GENERIC_CITY_TAGS = [
  { id: 'cricket', name: 'Metro Stadium Match Night', w: 2, note: 'Evening orders surge, highest in Commercial and Residential sectors.' },
  { id: 'salary', name: 'Monthly Payroll Day', w: 0.8, note: 'Order volume and basket sizes increase across all districts.' },
  { id: 'bandh', name: 'Civic Transit Disruption', w: 0.8, note: 'Road transit slowed, demand softens, couriers experience fatigue.' },
  { id: 'exam', name: 'University Study Week', w: 1, note: 'Night ordering increases across residential and student clusters.' },
  { id: 'festeve', name: 'Annual Holiday Eve', w: 1.2, note: 'Pre-holiday midday lunch rush jumps.' },
  { id: 'heat', name: 'Summer High Temperature', w: 1, note: 'Cold beverage orders increase; couriers require fatigue pacing.' },
  { id: 'metro', name: 'Urban Rail Maintenance', w: 0.8, note: 'Commuters order to home offices; route times expand.' },
  { id: 'hackathon', name: 'Corporate Tech Sprint', w: 1, note: 'Innovation park orders spike if district is unlocked.' }
];

export const GENERIC_FOUNDERS = {
  ops: {
    name: 'Logistics Operations Lead',
    note: 'Couriers trust your system design. Reduced fleet operational friction.',
    rep: { riders: 3 },
    nps: 0,
    share: 0,
    cash: 0
  },
  growth: {
    name: 'Growth & Strategy Specialist',
    note: 'Starts with heightened initial market share and higher competitive pressure.',
    rep: { rivals: 2 },
    nps: 0,
    share: 0.03,
    cash: 0
  },
  product: {
    name: 'Product & UX Architect',
    note: 'Starts with higher customer satisfaction baseline and trust rating.',
    rep: { users: 3 },
    nps: 4,
    share: 0,
    cash: 0
  },
  capital: {
    name: 'Seed Capital Partner',
    note: 'Secures ₹40,000 investor backing upfront. Closer board oversight.',
    rep: {},
    nps: 0,
    share: 0,
    cash: 40000
  }
};
