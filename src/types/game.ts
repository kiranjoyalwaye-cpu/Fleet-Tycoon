export type Difficulty = 'easy' | 'normal' | 'hard';
export type CampaignLength = 14 | 30 | 45;
export type FounderType = 'ops' | 'growth' | 'product' | 'capital';
export type WeatherType = 'clear' | 'drizzle' | 'storm';
export type DayPhase = 'lunch' | 'evening' | 'night' | 'closed';

export interface WhiteLabelConfig {
  appName: string;
  appShortTag: string;
  metroName: string;
  currencySymbol: string;
  rivalAlphaName: string;
  rivalBetaName: string;
  rivalOthersName: string;
  hubName: string;
  regulatorName: string;
  enterpriseLabel: string;
}

export interface ZoneConfig {
  id: string;
  nameKey: string;
  shortKey: string;
  blurbKey: string;
  likes: string[];
  lx: number;
  ly: number;
  tx: number;
  ty: number;
  cost: number;
  demand: number;
  minDay?: number;
  start?: boolean;
  dist?: number;
}

export interface KitchenConfig {
  id: string;
  nameKey: string;
  cuisineKey: string;
  blurbKey: string;
  prep: number;
  cap: number;
  quality: number;
  cost: number;
  start?: boolean;
  minDay?: number;
  dishes: string[];
}

export interface KitchenJoinReq {
  orders: number;
  nps?: number;
  day?: number;
  zone?: string[];
}

export interface UpgradeTier {
  cost: number;
  minDay: number;
  blurb: string;
  run?: number;
}

export interface UpgradeConfig {
  id: string;
  name: string;
  tiers: UpgradeTier[];
}

export interface TeamRoleConfig {
  name: string;
  sal: number;
  cost: number;
  max: number;
  blurb: string;
}

export interface Rider {
  id: string;
  name: string;
  morale: number;
  busyUntil: number;
}

export interface Order {
  id: string;
  floorId: string;
  kit: string;
  value: number;
  placedAt: number;
  readyAt: number;
  ride: number;
  pickAt: number;
  dropAt: number;
  status: 'prep' | 'ride' | 'done' | 'cancel';
  riderId: string | null;
  label: string;
}

export interface DayForecast {
  dow: number;
  weather: WeatherType;
  tag: string | null;
}

export interface Loan {
  id: string;
  type: string;
  P: number;
  left: number;
  rate: number;
  term: number;
  emi: number;
  days: number;
  paid: number;
}

export interface GameStats {
  emi: number;
  interest: number;
  over: {
    rent: number;
    tech: number;
    run: number;
    team: number;
    legal?: number;
    total: number;
  } | null;
  peakN: number;
  orders: number;
  cancel: number;
  gmv: number;
  rev: number;
  wages: number;
  promo: number;
  fee: number;
  ads: number;
  cuts: number;
  refunds: number;
}

export interface FeedItem {
  d: number;
  t: string;
  kind: 'rival' | 'city' | 'market' | 'acme' | 'story';
  text: string;
}

export interface GameEventChoice {
  id: string;
  label: string;
  hint: string;
  cost?: number;
  fx: () => void;
}

export interface GameEvent {
  id: string;
  title: string;
  body: string | (() => string);
  choices: GameEventChoice[];
  w?: number;
  minDay?: number;
  cd?: number;
  when?: 'lunch' | 'evening' | 'any';
  script?: boolean;
  follow?: boolean;
  milestone?: boolean;
  story?: boolean;
  once?: boolean;
  req?: () => boolean;
}

export interface GameState {
  version: number;
  diff: Difficulty;
  days: CampaignLength;
  day: number;
  minute: number;
  cash: number;
  nps: number;
  you: number;
  rw: {
    zesto: number;
    swish: number;
    others: number;
  };
  wage: number;
  comm: number;
  promo: number;
  peak: boolean;
  members: number;
  seed: number;
  rng: number;
  floors: Record<string, { unlocked: boolean; heat: number; depth: number }>;
  kitchens: Record<string, { on: boolean; sat: number; low: number; out: number; left?: number }>;
  upgrades: Record<string, number>;
  riders: Rider[];
  hireCount: number;
  orders: Order[];
  toasts: { id: string; text: string; tone: 'info' | 'ok' | 'bad' }[];
  log: { t: string; text: string }[];
  stats: GameStats;
  mods: Record<string, number>;
  team: { recruiter: number; support: number; ops: number; acct: number };
  rep: { riders: number; partners: number; users: number; rivals: number };
  arcs: Record<string, { ch: number; note: string; d: number }>;
  track: Record<string, number>;
  founder: string;
  feed: FeedItem[];
  feedN: number;
  feedRead: number;
  lastOrders: number;
  snap: { you: number; zesto: number; swish: number; others: number } | null;
  seen: string[];
  lastSeen: Record<string, number>;
  queue: { id: string; minute: number }[];
  later: { id: string; day: number }[];
  flags: Record<string, any>;
  news: string[];
  today: DayForecast;
  forecast: DayForecast | null;
  fireK: string | null;
  event: GameEvent | null;
  dayOver: boolean;
  gameOver: 'won' | 'lost' | null;
  endReason: string;
  debt: number;
  loans: Loan[];
  loanN: number;
  served: number;
}
