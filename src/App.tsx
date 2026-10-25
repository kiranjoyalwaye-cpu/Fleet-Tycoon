import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GameState, 
  Difficulty, 
  CampaignLength, 
  FounderType, 
  WhiteLabelConfig, 
  GameEvent,
  GameStats,
  Rider,
  Order,
  DayForecast
} from './types/game';
import { 
  DEFAULT_WHITE_LABEL, 
  GENERIC_ZONES, 
  ZONE_IDS, 
  CENTRAL_HUB, 
  GENERIC_KITCHENS, 
  GENERIC_KITCHEN_JOINS,
  GENERIC_UPGRADES,
  GENERIC_CITY_TAGS,
  GENERIC_FOUNDERS,
  GENERIC_TEAM
} from './data/whiteLabelDefaults';
import { formatCurrency, formatMoneyShort, formatLabel, formatClock } from './utils/textFormatter';
import { sfx } from './utils/audio';
import { enforceZeroDebugLogging, verifyOtaPatch } from './security/encryption';
import { api } from './services/api';

import { TitleScreen } from './components/TitleScreen';
import { HudHeader } from './components/HudHeader';
import { GameCanvas } from './components/GameCanvas';
import { PanelContent } from './components/PanelContent';
import { 
  BriefingModal, 
  EventModal, 
  DaySummaryModal, 
  GameOverModal, 
  MissionModal 
} from './components/GameModals';
import { LeaderboardModal } from './components/LeaderboardModal';
import { MonthlyReportModal } from './components/MonthlyReportModal';
import { OtaPatchModal } from './components/OtaPatchModal';
import { WhiteLabelModal } from './components/WhiteLabelModal';

// Constants
const LUNCH_START = 11 * 60 + 30;
const LUNCH_END = 14 * 60 + 30;
const LATE_START = 17 * 60 + 30;
const LATE_END = 19 * 60 + 30;
const NIGHT_START = 20 * 60;
const NIGHT_END = 23 * 60;
const STEP = 0.2;
const SAVE_KEY = 'fleet_tycoon_android_save_v2';
const WHITE_LABEL_KEY = 'fleet_tycoon_whitelabel_config';

const COURIER_NAMES = [
  'Courier-01', 'Courier-02', 'Courier-03', 'Courier-04', 'Courier-05',
  'Courier-06', 'Courier-07', 'Courier-08', 'Courier-09', 'Courier-10',
  'Courier-11', 'Courier-12', 'Courier-13', 'Courier-14', 'Courier-15',
  'Courier-16', 'Courier-17', 'Courier-18', 'Courier-19', 'Courier-20'
];

export default function App() {
  // Enforce zero debug logging on boot
  useEffect(() => {
    enforceZeroDebugLogging();
  }, []);

  // White-Label Configuration State
  const [whiteLabel, setWhiteLabel] = useState<WhiteLabelConfig>(() => {
    try {
      const stored = localStorage.getItem(WHITE_LABEL_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_WHITE_LABEL;
  });

  const [inGame, setInGame] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [speed, setSpeed] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>('floors');
  const [folded, setFolded] = useState(false);
  const [tallLayout, setTallLayout] = useState(false);
  const [revenuePops, setRevenuePops] = useState<{ id: string; amount: number }[]>([]);

  // Modals state
  const [showBriefing, setShowBriefing] = useState(false);
  const [showMission, setShowMission] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [showOtaPatch, setShowOtaPatch] = useState(false);
  const [showWhiteLabel, setShowWhiteLabel] = useState(false);

  // Title Screen Selections
  const [selectedDiff, setSelectedDiff] = useState<Difficulty>('normal');
  const [selectedLen, setSelectedLen] = useState<CampaignLength>(14);
  const [selectedFounder, setSelectedFounder] = useState<FounderType>('ops');
  const [hasSavedGame, setHasSavedGame] = useState(false);

  // OTA Versioning State
  const [otaVersion, setOtaVersion] = useState<string>('2.5.4');
  const [runtimeTweaks, setRuntimeTweaks] = useState<Record<string, number>>({});

  // Check for saved game on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        setHasSavedGame(true);
      }
    } catch {}
  }, []);

  // Save white-label config updates
  const handleUpdateWhiteLabel = (newConfig: WhiteLabelConfig) => {
    setWhiteLabel(newConfig);
    try {
      localStorage.setItem(WHITE_LABEL_KEY, JSON.stringify(newConfig));
    } catch {}
  };

  // Helper for goal targets
  const getGoalTarget = useCallback(() => {
    const days = gameState ? gameState.days : selectedLen;
    const baseShare = days === 14 ? 0.31 : days === 30 ? 0.32 : 0.35;
    const baseCash = days === 14 ? 20000 : days === 30 ? 50000 : 80000;
    const baseProfit = days === 14 ? 150000 : days === 30 ? 300000 : 500000;
    const baseLovedNps = days === 14 ? 78 : days === 30 ? 84 : 88;

    return {
      share: baseShare + (gameState?.flags?.board ? 0.03 : 0),
      cash: baseCash,
      profit: baseProfit,
      lovedNps: baseLovedNps
    };
  }, [gameState, selectedLen]);

  // Pseudo-random generator with seed
  const nextRng = (s: number) => {
    const next = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return { val: next / 4294967296, seed: next };
  };

  // Create initial game state
  const createNewGame = (diff: Difficulty, len: CampaignLength, fndKey: FounderType): GameState => {
    const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    const initialCash = diff === 'easy' ? 120000 : diff === 'normal' ? 85000 : 60000;
    const initialShare = diff === 'easy' ? 0.16 : diff === 'normal' ? 0.12 : 0.09;

    const floorsState: Record<string, { unlocked: boolean; heat: number; depth: number }> = {};
    ZONE_IDS.forEach(id => {
      floorsState[id] = { unlocked: Boolean(GENERIC_ZONES[id].start), heat: 0, depth: 0 };
    });

    const kitchensState: Record<string, { on: boolean; sat: number; low: number; out: number }> = {};
    GENERIC_KITCHENS.forEach(k => {
      kitchensState[k.id] = { on: Boolean(k.start), sat: 75, low: 0, out: 0 };
    });

    const founderData = GENERIC_FOUNDERS[fndKey];

    const ridersList: Rider[] = COURIER_NAMES.slice(0, 3).map((name, i) => ({
      id: `r-${i + 1}`,
      name,
      morale: 75,
      busyUntil: 0
    }));

    return {
      version: 2,
      diff,
      days: len,
      day: 1,
      minute: LUNCH_START,
      cash: initialCash + founderData.cash,
      nps: 52 + founderData.nps,
      you: initialShare + founderData.share,
      rw: { zesto: 0.38, swish: 0.34, others: 0.28 },
      wage: 900,
      comm: 0.28,
      promo: 0,
      peak: false,
      members: 0,
      seed,
      rng: seed,
      floors: floorsState,
      kitchens: kitchensState,
      upgrades: {},
      riders: ridersList,
      hireCount: 3,
      orders: [],
      toasts: [],
      log: [{ t: 'D1 11:30', text: `Platform initialized under ${founderData.name}. All systems operational.` }],
      stats: {
        emi: 0,
        interest: 0,
        over: null,
        peakN: 0,
        orders: 0,
        cancel: 0,
        gmv: 0,
        rev: 0,
        wages: 0,
        promo: 0,
        fee: 0,
        ads: 0,
        cuts: 0,
        refunds: 0
      },
      mods: { rain: 0, rivalDay: 0, surge: 0, lift: 0, allhands: 0, glove: 0, bbd: 0, slow: 0, fest: 0, war: 0, power: 0, ipl: 0, bags: 0, metro: 0, hack: 0, exam: 0, cod: 0, heat: 0 },
      team: { recruiter: 0, support: 0, ops: 0, acct: 0 },
      rep: { 
        riders: (founderData.rep as any)?.riders || 0, 
        partners: 0, 
        users: (founderData.rep as any)?.users || 0, 
        rivals: (founderData.rep as any)?.rivals || 0 
      },
      arcs: {},
      track: { lowWage: 0, highComm: 0, peak: 0, promo: 0, ads: 0, cancelBad: 0, debt: 0 },
      founder: fndKey,
      feed: [{ d: 1, t: '11:30', kind: 'city', text: 'District dispatch hub open. Lunch orders incoming.' }],
      feedN: 1,
      feedRead: 0,
      lastOrders: 0,
      snap: null,
      seen: [],
      lastSeen: {},
      queue: [],
      later: [],
      flags: {},
      news: [],
      today: { dow: 0, weather: 'clear', tag: null },
      forecast: { dow: 1, weather: 'clear', tag: null },
      fireK: null,
      event: null,
      dayOver: false,
      gameOver: null,
      endReason: '',
      debt: 0,
      loans: [],
      loanN: 0,
      served: 0
    };
  };

  const handleStartNewGame = () => {
    sfx.click();
    const newG = createNewGame(selectedDiff, selectedLen, selectedFounder);
    setGameState(newG);
    setInGame(true);
    setShowBriefing(true);
    setSpeed(0);
    setActiveTab('floors');
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(newG));
    } catch {}
  };

  const handleContinueGame = () => {
    try {
      const stored = localStorage.getItem(SAVE_KEY);
      if (stored) {
        const loaded: GameState = JSON.parse(stored);
        setGameState(loaded);
        setInGame(true);
        setSpeed(0);
        setShowBriefing(false);
        setActiveTab('floors');
        sfx.ok();
      }
    } catch {
      handleStartNewGame();
    }
  };

  // Responsive Board Layout detection
  useEffect(() => {
    const checkLayout = () => {
      setTallLayout(window.innerWidth < 768 || (window.innerHeight > window.innerWidth * 1.05));
    };
    checkLayout();
    window.addEventListener('resize', checkLayout);
    return () => window.removeEventListener('resize', checkLayout);
  }, []);

  // Compute Next Move Guidance
  const getNextMove = useCallback(() => {
    if (!gameState) return { text: '', tab: 'floors', label: '' };
    if (gameState.dayOver) {
      return {
        text: 'Day closed. Review expenditures and rebalance upgrades before opening next shift.',
        tab: 'shop',
        label: 'Upgrades'
      };
    }

    const g = getGoalTarget();
    const idleCouriers = gameState.riders.filter(r => r.morale >= 22 && r.busyUntil <= gameState.minute).length;
    const activeOrders = gameState.orders.length;

    if (activeOrders >= 3 && idleCouriers === 0) {
      return {
        text: 'Zero idle couriers with orders in queue. Sign an additional courier immediately.',
        tab: 'fleet',
        label: 'Hire'
      };
    }

    if (gameState.cash < 8000 && gameState.day >= 2 && gameState.loans.length < 3) {
      return {
        text: 'Cash reserves are low. Draw a working capital credit line to maintain liquidity.',
        tab: 'plan',
        label: 'Credit'
      };
    }

    if (gameState.you < g.share && !gameState.upgrades.group && gameState.cash >= 35000) {
      return {
        text: 'Competitors hold the majority of volume. Ship Unified Group Orders in Upgrades.',
        tab: 'shop',
        label: 'Shop'
      };
    }

    if (gameState.nps < 55 && !gameState.upgrades.eta && gameState.cash >= 22000) {
      return {
        text: `Customer satisfaction is ${gameState.nps.toFixed(0)}/100. Deploy Precision ETA Engine.`,
        tab: 'shop',
        label: 'Shop'
      };
    }

    return {
      text: `On track. Maintain customer rating above 55 and expand market share toward ${Math.round(g.share * 100)}%.`,
      tab: 'floors',
      label: 'Districts'
    };
  }, [gameState, getGoalTarget]);

  // Main Simulation Tick Loop
  const simTick = useCallback(() => {
    setGameState(prev => {
      if (!prev || prev.gameOver || prev.dayOver || prev.event || showBriefing || showMission) {
        return prev;
      }

      let nextMinute = prev.minute + 1;
      let nextCash = prev.cash;
      let nextNps = prev.nps;
      let nextYou = prev.you;
      let nextServed = prev.served;
      let orders = [...prev.orders];
      let riders = prev.riders.map(r => ({ ...r }));
      let floors = { ...prev.floors };
      let stats = { ...prev.stats };
      let newPops: { id: string; amount: number }[] = [];
      let nextSeed = prev.seed;

      // Handling Shift Phases
      if (nextMinute === LUNCH_END) {
        nextMinute = LATE_START;
      }

      const hasNightOrders = prev.upgrades.nightshift || prev.kitchens.night?.on;
      const shiftEnd = hasNightOrders ? NIGHT_END : LATE_END;

      if (nextMinute >= shiftEnd) {
        // Day Close Settlement
        const wages = riders.length * prev.wage;
        nextCash -= wages;
        nextCash -= prev.promo;
        stats.wages = wages;
        stats.promo = prev.promo;

        // Morale recovery & decay
        riders.forEach(r => {
          r.busyUntil = 0;
          r.morale = Math.max(5, Math.min(100, r.morale + (prev.wage >= 1100 ? 6 : prev.wage < 750 ? -10 : 1)));
        });

        // NPS decay towards neutral
        if (nextNps > 60) nextNps -= (nextNps - 60) * 0.05;

        // Auto persist
        const dayClosedState: GameState = {
          ...prev,
          dayOver: true,
          minute: shiftEnd,
          cash: nextCash,
          nps: Math.max(0, Math.min(100, nextNps)),
          riders,
          stats
        };

        try {
          localStorage.setItem(SAVE_KEY, JSON.stringify(dayClosedState));
        } catch {}

        return dayClosedState;
      }

      // Order Generation across live districts
      ZONE_IDS.forEach(zId => {
        const f = GENERIC_ZONES[zId];
        const st = floors[zId];
        if (!st?.unlocked) return;

        const isLunch = nextMinute < LUNCH_END;
        let demandWeight = (f.demand / 55) * (isLunch ? 1.4 : 0.9);
        if (runtimeTweaks.groupDemandBonus && prev.upgrades.group) {
          demandWeight *= runtimeTweaks.groupDemandBonus;
        }

        const rng1 = nextRng(nextSeed);
        nextSeed = rng1.seed;

        if (rng1.val < Math.min(0.65, demandWeight)) {
          // Select available kitchen
          const liveKits = GENERIC_KITCHENS.filter(k => prev.kitchens[k.id]?.on && !prev.kitchens[k.id]?.out);
          if (liveKits.length > 0) {
            const rng2 = nextRng(nextSeed);
            nextSeed = rng2.seed;
            const kit = liveKits[Math.floor(rng2.val * liveKits.length)];

            const prepTime = kit.prep + Math.floor(rng1.val * 4);
            const rideTime = Math.max(4, Math.round(6 + (f.dist || 0.4) * 12));
            const value = Math.round(180 + rng2.val * 320 + kit.quality * 1.2);

            orders.unshift({
              id: `ord-${prev.day}-${nextMinute}-${stats.orders}`,
              floorId: zId,
              kit: kit.id,
              value,
              placedAt: nextMinute,
              readyAt: nextMinute + prepTime,
              ride: rideTime,
              pickAt: nextMinute + prepTime,
              dropAt: nextMinute + prepTime + rideTime,
              status: 'prep',
              riderId: null,
              label: kit.dishes[Math.floor(rng1.val * kit.dishes.length)]
            });

            stats.orders += 1;
            floors[zId] = { ...st, heat: Math.min(1, st.heat + 0.05) };
          }
        }
      });

      // Order Progress & Dispatch Allocation
      const idleRidersList = riders.filter(r => r.morale >= 22 && r.busyUntil <= nextMinute);

      orders.forEach(o => {
        if (o.status === 'prep' && !o.riderId && nextMinute >= o.readyAt - 2) {
          const courier = idleRidersList.pop();
          if (courier) {
            o.riderId = courier.id;
            o.pickAt = Math.max(o.readyAt, nextMinute);
            o.dropAt = o.pickAt + o.ride;
            courier.busyUntil = o.dropAt + 1;
          } else if (nextMinute - o.readyAt > 12) {
            o.status = 'cancel';
            stats.cancel += 1;
            const refund = Math.round(o.value * 0.1);
            nextCash -= refund;
            stats.refunds += refund;
            nextNps = Math.max(0, nextNps - 0.4);
            nextYou = Math.max(0.03, nextYou - 0.001);
          }
        }

        if (o.status === 'prep' && o.riderId && nextMinute >= o.pickAt) {
          o.status = 'ride';
        }

        if (o.status === 'ride' && nextMinute >= o.dropAt) {
          o.status = 'done';
          nextServed += 1;
          const orderGmv = o.value;
          const takeRevenue = Math.round(orderGmv * prev.comm);
          const courierCut = Math.max(20, Math.round(30 + (GENERIC_ZONES[o.floorId]?.dist || 0.4) * 35));

          nextCash += (takeRevenue - courierCut);
          stats.gmv += orderGmv;
          stats.rev += takeRevenue;
          stats.cuts += courierCut;
          nextNps = Math.min(100, nextNps + 0.15);
          nextYou = Math.min(0.6, nextYou + 0.0015);

          newPops.unshift({ id: o.id, amount: orderGmv });
          sfx.cash();
        }
      });

      // Filter active orders
      const remainingOrders = orders.filter(o => o.status === 'prep' || o.status === 'ride');

      if (newPops.length > 0) {
        setRevenuePops(prevPops => [...newPops, ...prevPops].slice(0, 4));
      }

      return {
        ...prev,
        minute: nextMinute,
        cash: nextCash,
        nps: nextNps,
        you: nextYou,
        served: nextServed,
        orders: remainingOrders,
        riders,
        floors,
        stats,
        seed: nextSeed
      };
    });
  }, [showBriefing, showMission, runtimeTweaks]);

  // RequestAnimationFrame Simulation Runner
  const lastTimeRef = useRef<number>(performance.now());
  const accRef = useRef<number>(0);

  useEffect(() => {
    let animId: number;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      if (inGame && speed > 0 && gameState && !gameState.dayOver && !gameState.gameOver && !gameState.event) {
        accRef.current += dt * speed;
        while (accRef.current >= STEP) {
          accRef.current -= STEP;
          simTick();
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [inGame, speed, gameState, simTick]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!inGame || !gameState) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      const k = e.key.toLowerCase();
      if (k === ' ') {
        e.preventDefault();
        setSpeed(prev => (prev === 0 ? 1 : 0));
        sfx.click();
      } else if (k === 'z') {
        setSpeed(0.5);
        sfx.click();
      } else if (k === 'x') {
        setSpeed(1);
        sfx.click();
      } else if (k === 'c') {
        setSpeed(2);
        sfx.click();
      } else if (k === 'v') {
        setSpeed(4);
        sfx.click();
      } else if (k === 'r') {
        handleSkipRush();
      } else if (k === 'm') {
        setShowMission(prev => !prev);
        sfx.click();
      } else if (['1', '2', '3', '4', '5', '6'].includes(k)) {
        const tabs = ['floors', 'menu', 'fleet', 'plan', 'news', 'shop'];
        setActiveTab(tabs[Number(k) - 1]);
        sfx.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inGame, gameState]);

  // Fast forward to next peak rush
  const handleSkipRush = () => {
    if (!gameState || gameState.dayOver || gameState.gameOver) return;
    sfx.click();

    let target = gameState.minute;
    if (gameState.minute < 12 * 60 + 20) target = 12 * 60 + 20;
    else if (gameState.minute < LATE_START) target = LATE_START;
    else if (gameState.minute < 18 * 60 + 20) target = 18 * 60 + 20;
    else return;

    setGameState(prev => prev ? ({ ...prev, minute: target }) : null);
    setSpeed(2);
  };

  // Next Day Transition
  const handleNextDay = () => {
    if (!gameState || !gameState.dayOver || gameState.gameOver) return;
    sfx.ok();

    const nextD = gameState.day + 1;
    if (nextD > gameState.days) {
      // Review Evaluation
      const target = getGoalTarget();
      const isWon = gameState.nps >= 55 && gameState.cash >= target.cash && gameState.you >= target.share;

      setGameState(prev => prev ? ({
        ...prev,
        gameOver: isWon ? 'won' : 'lost',
        endReason: isWon
          ? 'Metropolitan launch approved by review board with high operating margin and strong customer NPS.'
          : 'Failed to meet commercial review board thresholds for retention, liquidity, or market share.'
      }) : null);
      return;
    }

    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        day: nextD,
        minute: LUNCH_START,
        dayOver: false,
        orders: [],
        toasts: [{ id: `toast-day-${nextD}`, text: `Day ${nextD} shift started`, tone: 'info' }],
        stats: {
          emi: 0,
          interest: 0,
          over: null,
          peakN: 0,
          orders: 0,
          cancel: 0,
          gmv: 0,
          rev: 0,
          wages: 0,
          promo: 0,
          fee: 0,
          ads: 0,
          cuts: 0,
          refunds: 0
        }
      };
    });

    setSpeed(1);
  };

  // Operations actions
  const handleUnlockZone = (zoneId: string) => {
    const cost = GENERIC_ZONES[zoneId]?.cost || 0;
    setGameState(prev => {
      if (!prev || prev.cash < cost) return prev;
      return {
        ...prev,
        cash: prev.cash - cost,
        floors: {
          ...prev.floors,
          [zoneId]: { unlocked: true, heat: 0, depth: 0 }
        },
        log: [{ t: `D${prev.day} ${formatClock(prev.minute)}`, text: `Expanded operations into ${GENERIC_ZONES[zoneId].nameKey}.` }, ...prev.log]
      };
    });
  };

  const handleDeepenZone = (zoneId: string) => {
    const f = GENERIC_ZONES[zoneId];
    const curDepth = gameState?.floors[zoneId]?.depth || 0;
    const cost = Math.round((12000 + f.cost * 0.4) * (1 + curDepth * 0.8) / 500) * 500;

    setGameState(prev => {
      if (!prev || prev.cash < cost) return prev;
      return {
        ...prev,
        cash: prev.cash - cost,
        floors: {
          ...prev.floors,
          [zoneId]: { ...prev.floors[zoneId], depth: curDepth + 1 }
        },
        log: [{ t: `D${prev.day} ${formatClock(prev.minute)}`, text: `Deepened ${f.nameKey} network to Level ${curDepth + 1}.` }, ...prev.log]
      };
    });
  };

  const handleHireRider = () => {
    const cost = Math.round((8000 + (gameState?.riders.length || 0) * 500) * (1 - 0.25 * (gameState?.team.recruiter || 0)) / 100) * 100;
    setGameState(prev => {
      if (!prev || prev.cash < cost || prev.riders.length >= 30) return prev;
      const count = prev.hireCount + 1;
      const newRider: Rider = {
        id: `r-${count}`,
        name: `Courier-${String(count).padStart(2, '0')}`,
        morale: 72,
        busyUntil: 0
      };
      return {
        ...prev,
        cash: prev.cash - cost,
        hireCount: count,
        riders: [...prev.riders, newRider],
        log: [{ t: `D${prev.day} ${formatClock(prev.minute)}`, text: `Signed ${newRider.name} to courier dispatch roster.` }, ...prev.log]
      };
    });
  };

  const handleHireTeam = (role: string) => {
    const rConfig = GENERIC_TEAM[role];
    if (!rConfig) return;
    setGameState(prev => {
      if (!prev || prev.cash < rConfig.cost) return prev;
      const current = prev.team[role as keyof typeof prev.team] || 0;
      if (current >= rConfig.max) return prev;
      return {
        ...prev,
        cash: prev.cash - rConfig.cost,
        team: { ...prev.team, [role]: current + 1 },
        log: [{ t: `D${prev.day} ${formatClock(prev.minute)}`, text: `Hired a ${rConfig.name}. Daily salary ${formatCurrency(rConfig.sal, whiteLabel)}.` }, ...prev.log]
      };
    });
  };

  const handleFireTeam = (role: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      const current = prev.team[role as keyof typeof prev.team] || 0;
      if (current <= 0) return prev;
      return {
        ...prev,
        team: { ...prev.team, [role]: current - 1 }
      };
    });
  };

  const handleBuyUpgrade = (upgradeId: string) => {
    const uConfig = GENERIC_UPGRADES.find(u => u.id === upgradeId);
    if (!uConfig || !gameState) return;
    const curLv = gameState.upgrades[upgradeId] || 0;
    const nextTier = uConfig.tiers[curLv];
    if (!nextTier || gameState.cash < nextTier.cost) return;

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        cash: prev.cash - nextTier.cost,
        upgrades: { ...prev.upgrades, [upgradeId]: curLv + 1 },
        log: [{ t: `D${prev.day} ${formatClock(prev.minute)}`, text: `Deployed operational upgrade: ${uConfig.name} L${curLv + 1}.` }, ...prev.log]
      };
    });
  };

  const handleTakeLoan = (amount: number, term: number) => {
    const fee = Math.round(amount * 0.015);
    const rate = 0.0075;
    const emi = Math.round(amount * rate / (1 - Math.pow(1 + rate, -term)));

    setGameState(prev => {
      if (!prev) return prev;
      const newLoan = {
        id: `L-${prev.loanN + 1}`,
        type: 'Working Capital Facility',
        P: amount,
        left: amount,
        rate,
        term,
        emi,
        days: 0,
        paid: 0
      };
      return {
        ...prev,
        cash: prev.cash + amount - fee,
        debt: prev.debt + amount,
        loanN: prev.loanN + 1,
        loans: [...prev.loans, newLoan],
        log: [{ t: `D${prev.day} ${formatClock(prev.minute)}`, text: `Drawn ${formatCurrency(amount, whiteLabel)} credit line. EMI ${formatCurrency(emi, whiteLabel)}/day.` }, ...prev.log]
      };
    });
  };

  const handlePrepayLoan = (loanId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      let leftCash = prev.cash;
      let newLoans = [...prev.loans];

      if (loanId === 'all') {
        newLoans.forEach(l => {
          const pay = Math.min(l.left, Math.max(0, leftCash - 5000));
          l.left -= pay;
          leftCash -= pay;
        });
      } else {
        const found = newLoans.find(l => l.id === loanId);
        if (found) {
          const pay = Math.min(found.left, Math.max(0, leftCash - 5000));
          found.left -= pay;
          leftCash -= pay;
        }
      }

      newLoans = newLoans.filter(l => l.left > 1);
      const newDebt = newLoans.reduce((a, l) => a + l.left, 0);

      return {
        ...prev,
        cash: leftCash,
        debt: newDebt,
        loans: newLoans
      };
    });
  };

  // Hot apply OTA patch
  const handleApplyOtaPatch = (newVersion: string, tweaks?: Record<string, number>) => {
    setOtaVersion(newVersion);
    if (tweaks) {
      setRuntimeTweaks(prev => ({ ...prev, ...tweaks }));
    }
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        log: [{ t: `D${prev.day} ${formatClock(prev.minute)}`, text: `Over-the-air hotfix ${newVersion} verified & applied to active runtime.` }, ...prev.log]
      };
    });
  };

  const nextMove = getNextMove();
  const goalTarget = getGoalTarget();
  const calculateScore = () => {
    if (!gameState) return 0;
    const netCashVal = gameState.cash - (gameState.debt || 0);
    return Math.round((netCashVal / goalTarget.profit) * 120 + gameState.nps * 2 + gameState.you * 350 + (gameState.gameOver === 'won' ? 100 : 0));
  };
  const getRatingGrade = (sc: number) => {
    if (sc >= 330) return 'S';
    if (sc >= 250) return 'A';
    if (sc >= 180) return 'B';
    if (sc >= 110) return 'C';
    return 'D';
  };

  const handleEventChoice = (choiceId: string) => {
    if (!gameState || !gameState.event) return;
    const choice = gameState.event.choices.find(c => c.id === choiceId);
    if (!choice) return;
    if (choice.cost && gameState.cash < choice.cost) return;

    setGameState(prev => {
      if (!prev) return prev;
      const nextCash = prev.cash - (choice.cost || 0);

      if (choice.fx) {
        try {
          choice.fx();
        } catch {}
      }

      return {
        ...prev,
        cash: nextCash,
        event: null,
        log: [{ t: `D${prev.day} ${formatClock(prev.minute)}`, text: `Decision: ${choice.label}` }, ...prev.log]
      };
    });
  };

  return (
    <>
      {!inGame || !gameState ? (
        <TitleScreen
          whiteLabel={whiteLabel}
          difficulty={selectedDiff}
          campaignLength={selectedLen}
          founder={selectedFounder}
          hasSavedGame={hasSavedGame}
          onSelectDiff={setSelectedDiff}
          onSelectLength={setSelectedLen}
          onSelectFounder={setSelectedFounder}
          onStartNew={handleStartNewGame}
          onContinue={handleContinueGame}
          onOpenWhiteLabel={() => setShowWhiteLabel(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenReport={() => setShowMonthlyReport(true)}
          onOpenOta={() => setShowOtaPatch(true)}
        />
      ) : (
        <div id="app" className="show">
          {/* Main HUD Header Bar */}
          <HudHeader
            state={gameState}
            whiteLabel={whiteLabel}
            speed={speed}
            onSpeedChange={setSpeed}
            onTogglePause={() => setSpeed(s => (s === 0 ? 1 : 0))}
            onSkipRush={handleSkipRush}
            onOpenNextDay={handleNextDay}
            onOpenMission={() => setShowMission(true)}
            onTabJump={t => {
              setActiveTab(t);
              if (folded) setFolded(false);
            }}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onOpenReport={() => setShowMonthlyReport(true)}
            onOpenOta={() => setShowOtaPatch(true)}
            nextMoveText={nextMove.text}
            nextMoveTab={nextMove.tab}
            nextMoveLabel={nextMove.label}
            goalTarget={goalTarget}
          />

          {/* Main Layout Area: Game Board + Tabbed Management Panel */}
          <div className="layout">
            {/* Board */}
            <GameCanvas
              state={gameState}
              whiteLabel={whiteLabel}
              tallLayout={tallLayout}
              pops={revenuePops}
              onPinClick={() => {
                setActiveTab('floors');
                if (folded) setFolded(false);
              }}
              onUnlockClick={id => handleUnlockZone(id)}
              onHubClick={() => {
                setActiveTab('menu');
                if (folded) setFolded(false);
              }}
            />

            {/* Management Controls Panel */}
            <aside className={`panel ${folded ? 'fold' : ''}`} id="panel">
              {/* Tab Selector Navigation */}
              <div className="tabs" role="tablist">
                {[
                  { id: 'floors', label: 'Zones' },
                  { id: 'menu', label: 'Partners' },
                  { id: 'fleet', label: 'Team' },
                  { id: 'plan', label: 'Plan' },
                  { id: 'news', label: 'News' },
                  { id: 'shop', label: 'Shop' }
                ].map(t => (
                  <button
                    key={t.id}
                    role="tab"
                    className={activeTab === t.id ? 'on' : ''}
                    onClick={() => {
                      sfx.click();
                      setActiveTab(t.id);
                      if (folded) setFolded(false);
                    }}
                  >
                    <span>{t.label}</span>
                    <i className="badge" />
                  </button>
                ))}
                <button
                  className="fold-btn"
                  data-act="fold"
                  id="btnFold"
                  aria-label="Collapse panel"
                  onClick={() => {
                    sfx.click();
                    setFolded(!folded);
                  }}
                >
                  {folded ? '▴' : '▾'}
                </button>
              </div>

              {/* Tab Content Panel Body */}
              <div className="pane" id="pane">
                <PanelContent
                  state={gameState}
                  whiteLabel={whiteLabel}
                  tab={activeTab}
                  onUnlockZone={handleUnlockZone}
                  onDeepenZone={handleDeepenZone}
                  onHireRider={handleHireRider}
                  onHireTeam={handleHireTeam}
                  onFireTeam={handleFireTeam}
                  onBuyUpgrade={handleBuyUpgrade}
                  onPrepayLoan={handlePrepayLoan}
                  onTakeLoan={handleTakeLoan}
                  onWageChange={w => setGameState(g => (g ? { ...g, wage: w } : null))}
                  onCommChange={c => setGameState(g => (g ? { ...g, comm: c } : null))}
                  onPromoChange={p => setGameState(g => (g ? { ...g, promo: p } : null))}
                  onTogglePeak={() => setGameState(g => (g ? { ...g, peak: !g.peak } : null))}
                />
              </div>
            </aside>
          </div>

          {/* Dialog Modals */}
          <BriefingModal
            isOpen={showBriefing}
            onDismiss={() => {
              setShowBriefing(false);
              setSpeed(1);
            }}
            state={gameState}
            whiteLabel={whiteLabel}
            goalTarget={goalTarget}
          />

          <MissionModal
            isOpen={showMission}
            onClose={() => setShowMission(false)}
            state={gameState}
            whiteLabel={whiteLabel}
            goalTarget={goalTarget}
          />

          <EventModal
            isOpen={Boolean(gameState.event)}
            event={gameState.event}
            state={gameState}
            whiteLabel={whiteLabel}
            onSelectChoice={handleEventChoice}
          />

          <DaySummaryModal
            isOpen={Boolean(gameState.dayOver) && !gameState.gameOver}
            state={gameState}
            whiteLabel={whiteLabel}
            onOpenNextDay={handleNextDay}
            onSpendFirst={() => {
              setActiveTab('shop');
              if (folded) setFolded(false);
            }}
            dayNet={
              gameState.stats.rev +
              gameState.stats.ads +
              gameState.stats.fee -
              gameState.stats.cuts -
              gameState.stats.refunds -
              gameState.stats.wages -
              gameState.stats.promo
            }
            nextMoveText={nextMove.text}
          />

          <GameOverModal
            isOpen={Boolean(gameState.gameOver)}
            state={gameState}
            whiteLabel={whiteLabel}
            onRestart={() => {
              try {
                localStorage.removeItem(SAVE_KEY);
              } catch {}
              setInGame(false);
              setGameState(null);
            }}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            score={calculateScore()}
            ratingGrade={getRatingGrade(calculateScore())}
            isWon={
              gameState.nps >= 55 &&
              gameState.cash >= goalTarget.cash &&
              gameState.you >= goalTarget.share
            }
          />
        </div>
      )}

      {/* Global Application Modals (Accessible from Title or HUD) */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        whiteLabel={whiteLabel}
        currentScore={gameState ? calculateScore() : undefined}
        currentRating={gameState ? getRatingGrade(calculateScore()) : undefined}
        currentCash={gameState?.cash}
        currentNps={gameState?.nps}
        currentShare={gameState?.you}
        currentDays={gameState?.days}
        currentDiff={gameState?.diff}
      />

      <MonthlyReportModal
        isOpen={showMonthlyReport}
        onClose={() => setShowMonthlyReport(false)}
        state={gameState || createNewGame('normal', 14, 'ops')}
        whiteLabel={whiteLabel}
      />

      <OtaPatchModal
        isOpen={showOtaPatch}
        onClose={() => setShowOtaPatch(false)}
        currentVersion={otaVersion}
        onApplyPatch={handleApplyOtaPatch}
      />

      <WhiteLabelModal
        isOpen={showWhiteLabel}
        onClose={() => setShowWhiteLabel(false)}
        config={whiteLabel}
        onUpdateConfig={handleUpdateWhiteLabel}
      />
    </>
  );
}
