import React from 'react';
import { GameState, WhiteLabelConfig } from '../types/game';
import { 
  GENERIC_ZONES, 
  ZONE_IDS, 
  GENERIC_KITCHENS, 
  GENERIC_KITCHEN_JOINS,
  GENERIC_UPGRADES,
  GENERIC_TEAM,
  GENERIC_CITY_TAGS 
} from '../data/whiteLabelDefaults';
import { formatCurrency, formatMoneyShort, formatLabel } from '../utils/textFormatter';
import { sfx } from '../utils/audio';

interface PanelContentProps {
  state: GameState;
  whiteLabel: WhiteLabelConfig;
  tab: string;
  onUnlockZone: (id: string) => void;
  onDeepenZone: (id: string) => void;
  onHireRider: () => void;
  onHireTeam: (role: string) => void;
  onFireTeam: (role: string) => void;
  onBuyUpgrade: (id: string) => void;
  onPrepayLoan: (id: string) => void;
  onTakeLoan: (amount: number, term: number) => void;
  onWageChange: (wage: number) => void;
  onCommChange: (comm: number) => void;
  onPromoChange: (promo: number) => void;
  onTogglePeak: () => void;
}

export const PanelContent: React.FC<PanelContentProps> = ({
  state,
  whiteLabel,
  tab,
  onUnlockZone,
  onDeepenZone,
  onHireRider,
  onHireTeam,
  onFireTeam,
  onBuyUpgrade,
  onPrepayLoan,
  onTakeLoan,
  onWageChange,
  onCommChange,
  onPromoChange,
  onTogglePeak
}) => {
  const fairWage = 900 + 40 * Math.floor((state.day - 1) / 5);
  const riderCost = Math.round((8000 + state.riders.length * 500) * (1 - 0.25 * state.team.recruiter) / 100) * 100;

  const deepenCost = (id: string) => {
    const f = GENERIC_ZONES[id];
    const d = state.floors[id]?.depth || 0;
    return Math.round((12000 + f.cost * 0.4) * (1 + d * 0.8) / 500) * 500;
  };

  const getTeamNeed = () => {
    const orders = state.lastOrders || state.stats.orders || 0;
    return {
      support: Math.max(0, Math.ceil((orders - 40) / 60)),
      ops: Math.max(0, Math.ceil(state.riders.length / 9) - 1),
      acct: Math.floor((Object.keys(state.kitchens).filter(k => state.kitchens[k].on).length - 1) / 3)
    };
  };

  const calculateOverheads = (orders: number) => {
    const live = ZONE_IDS.filter(id => state.floors[id]?.unlocked);
    const depth = live.reduce((a, id) => a + (state.floors[id]?.depth || 0), 0);
    let run = 0;
    GENERIC_UPGRADES.forEach(u => {
      const curLv = state.upgrades[u.id] || 0;
      for (let i = 0; i < curLv; i++) run += u.tiers[i].run || 0;
    });
    let team = 0;
    Object.keys(GENERIC_TEAM).forEach(k => {
      team += GENERIC_TEAM[k].sal * (state.team[k as keyof typeof state.team] || 0);
    });
    const total = 350 * live.length + 250 * depth + (500 + Math.round(1.1 * orders)) + run + team;
    return {
      rent: 350 * live.length + 250 * depth,
      tech: 500 + Math.round(1.1 * orders),
      run,
      team,
      total
    };
  };

  const creditLimit = Math.round((60000 + state.you * 300000 + Math.max(0, state.nps - 40) * 1500) / 5000) * 5000;
  const outstandingLoans = state.loans.reduce((a, l) => a + l.left, 0);
  const availableCredit = Math.max(0, creditLimit - outstandingLoans);

  const teamNeed = getTeamNeed();
  const oh = calculateOverheads(state.lastOrders || state.stats.orders || 0);

  // Tab 1: Districts (Floors)
  if (tab === 'floors') {
    return (
      <div className="space-y-3 pb-6">
        <p className="text-xs text-[#a39c88] leading-relaxed">
          Expand coverage across the metropolitan district. Deepening a live district increases localized order volume by 18% per level.
        </p>

        <div className="space-y-2">
          {ZONE_IDS.map(id => {
            const f = GENERIC_ZONES[id];
            const st = state.floors[id];
            const isUnlocked = st?.unlocked;
            const isMax = isUnlocked && st.depth >= 3;
            const dCost = deepenCost(id);
            const canAffordUnlock = state.cash >= f.cost;
            const canAffordDeep = state.cash >= dCost;
            const dayLocked = f.minDay && state.day < f.minDay;

            return (
              <div 
                key={id}
                className="border border-[#f3eee0]/15 bg-[#12140e]/60 rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-semibold text-[#f3eee0] truncate">
                      {f.nameKey}
                    </h4>
                    {isUnlocked && (
                      <span className="text-[10px] font-mono text-[#d4b429] bg-[#d4b429]/15 px-1.5 py-0.2 rounded">
                        Depth {st.depth}/3
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#7a7464] mt-0.5">{f.blurbKey}</p>
                  <p className="text-[11px] text-[#a39c88] mt-1">
                    Prefers: <span className="text-[#f3eee0]/80">{f.likes.join(', ')}</span>
                  </p>
                </div>

                <div className="flex-shrink-0">
                  {!isUnlocked ? (
                    <button
                      disabled={!canAffordUnlock || Boolean(dayLocked)}
                      onClick={() => { sfx.click(); onUnlockZone(id); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        !canAffordUnlock || dayLocked
                          ? 'bg-[#24281c] text-[#7a7464] cursor-not-allowed opacity-60'
                          : 'bg-[#d4b429] text-[#12140e] hover:brightness-105 active:scale-95'
                      }`}
                    >
                      {dayLocked ? `Day ${f.minDay}` : `Unlock ${formatCurrency(f.cost, whiteLabel)}`}
                    </button>
                  ) : isMax ? (
                    <span className="text-xs font-mono font-medium text-[#6f8f62] bg-[#6f8f62]/10 px-2 py-1 rounded">
                      Max Level
                    </span>
                  ) : (
                    <button
                      disabled={!canAffordDeep}
                      onClick={() => { sfx.click(); onDeepenZone(id); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        !canAffordDeep
                          ? 'bg-[#24281c] text-[#7a7464] cursor-not-allowed opacity-60'
                          : 'bg-[#1a1d14] text-[#f3eee0] border border-[#f3eee0]/20 hover:border-[#d4b429]'
                      }`}
                    >
                      Deepen {formatCurrency(dCost, whiteLabel)}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#7a7464] mb-1.5">
            Operations Audit Log
          </div>
          <div className="bg-[#12140e]/80 border border-[#f3eee0]/10 rounded-xl p-2.5 font-mono text-[11px] text-[#a39c88] space-y-1 max-h-36 overflow-y-auto">
            {state.log.slice(0, 10).map((l, idx) => (
              <div key={idx} className="leading-snug">
                <span className="text-[#d4b429] mr-2">{l.t}</span>
                <span className="text-[#f3eee0]/90">{formatLabel(l.text, whiteLabel)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Tab 2: Partner Kitchens (Menu)
  if (tab === 'menu') {
    const signed = GENERIC_KITCHENS.filter(k => state.kitchens[k.id]?.on);
    const pending = GENERIC_KITCHENS.filter(k => !state.kitchens[k.id]?.on);

    return (
      <div className="space-y-3 pb-6">
        <p className="text-xs text-[#a39c88] leading-relaxed">
          Restaurants join {whiteLabel.appName} as overall volume grows. Cumulative dispatched orders, high customer satisfaction, and reasonable commission attract premium partners.
        </p>

        {/* Active Partners */}
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#d4b429] mb-1.5">
            Active Partner Restaurants ({signed.length})
          </div>
          <div className="space-y-2">
            {signed.map(k => {
              const ks = state.kitchens[k.id];
              const isLowMood = ks?.sat < 40;

              return (
                <div 
                  key={k.id}
                  className="border border-[#f3eee0]/15 bg-[#12140e]/60 rounded-xl p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-[#f3eee0]">
                        {k.nameKey}
                      </h4>
                      <span className="text-[11px] text-[#a39c88]">
                        Cuisine: {k.cuisineKey} · Quality {k.quality}% · {k.prep}m avg prep
                      </span>
                    </div>
                    <span className="text-xs font-mono font-medium text-[#6f8f62] bg-[#6f8f62]/10 px-2 py-0.5 rounded">
                      Partner
                    </span>
                  </div>

                  <p className="text-xs text-[#7a7464]">{k.blurbKey}</p>

                  {/* Partner Satisfaction Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-[#a39c88] mb-1">
                      <span>Vendor Mood Rating</span>
                      <span className={isLowMood ? 'text-[#c45c4a] font-bold' : 'text-[#6f8f62]'}>
                        {Math.round(ks?.sat || 70)}/100 {isLowMood && '· At risk of leaving'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#24281c] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${isLowMood ? 'bg-[#c45c4a]' : 'bg-[#6f8f62]'}`}
                        style={{ width: `${Math.min(100, Math.max(0, ks?.sat || 70))}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Onboarding Pipeline */}
        {pending.length > 0 && (
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#7a7464] mb-1.5">
              Prospective Vendor Pipeline
            </div>
            <div className="space-y-2">
              {pending.map(k => {
                const req = GENERIC_KITCHEN_JOINS[k.id];
                const needOrders = req ? Math.round(req.orders * (1 - 0.1 * Math.min(3, state.team.acct))) : 100;
                const pct = Math.min(100, Math.round((state.served / needOrders) * 100));

                return (
                  <div 
                    key={k.id}
                    className="border border-[#f3eee0]/10 bg-[#12140e]/40 rounded-xl p-3 flex flex-col gap-1.5 opacity-85"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-[#f3eee0]">
                        {k.nameKey}
                      </h4>
                      <span className="text-[10px] font-mono text-[#a39c88]">
                        Requires {needOrders} orders ({state.served} served)
                      </span>
                    </div>
                    <p className="text-xs text-[#7a7464]">{k.blurbKey}</p>
                    <div className="h-1 w-full bg-[#24281c] rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full bg-[#d4b429]/70 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Tab 3: Courier Team & Staff (Fleet)
  if (tab === 'fleet') {
    return (
      <div className="space-y-3 pb-6">
        {/* Daily Overheads Card */}
        <div className="border border-[#f3eee0]/15 bg-[#12140e]/75 rounded-xl p-3">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#7a7464] mb-2">
            Daily Corporate Overheads
          </div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between text-[#a39c88]">
              <span>Hub & District Real Estate</span>
              <span className="text-[#f3eee0]">{formatCurrency(oh.rent, whiteLabel)}</span>
            </div>
            <div className="flex justify-between text-[#a39c88]">
              <span>Cloud Server & Telemetry</span>
              <span className="text-[#f3eee0]">{formatCurrency(oh.tech, whiteLabel)}</span>
            </div>
            <div className="flex justify-between text-[#a39c88]">
              <span>Active Upgrade Maintenance</span>
              <span className="text-[#f3eee0]">{formatCurrency(oh.run, whiteLabel)}</span>
            </div>
            <div className="flex justify-between text-[#a39c88]">
              <span>Management Staff Salaries</span>
              <span className="text-[#f3eee0]">{formatCurrency(oh.team, whiteLabel)}</span>
            </div>
            <div className="border-t border-[#f3eee0]/10 pt-1.5 flex justify-between font-bold text-sm text-[#d4b429]">
              <span>Estimated Daily Burn</span>
              <span>{formatCurrency(oh.total, whiteLabel)}</span>
            </div>
          </div>
        </div>

        {/* Management Staff Roles */}
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#d4b429] mb-1.5">
            Management & Operations Staff
          </div>
          <div className="space-y-2">
            {Object.entries(GENERIC_TEAM).map(([roleKey, role]) => {
              const current = state.team[roleKey as keyof typeof state.team] || 0;
              const need = teamNeed[roleKey as keyof typeof teamNeed];
              const isShort = need !== undefined && current < need;

              return (
                <div 
                  key={roleKey}
                  className="border border-[#f3eee0]/15 bg-[#12140e]/60 rounded-xl p-2.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-[#f3eee0]">
                        {role.name}
                      </h4>
                      <span className="text-[10px] font-mono text-[#a39c88]">
                        {current}/{role.max} ({formatCurrency(role.sal, whiteLabel)}/day)
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7a7464] mt-0.5">{role.blurb}</p>
                    {need !== undefined && (
                      <span className={`text-[10px] font-mono font-medium ${isShort ? 'text-[#c45c4a]' : 'text-[#6f8f62]'}`}>
                        {isShort ? `Short: recommended ${need}` : `Staffed (need ${need})`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      disabled={current >= role.max || state.cash < role.cost}
                      onClick={() => { sfx.click(); onHireTeam(roleKey); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        current >= role.max || state.cash < role.cost
                          ? 'bg-[#24281c] text-[#7a7464] cursor-not-allowed opacity-60'
                          : 'bg-[#d4b429] text-[#12140e] hover:brightness-105 active:scale-95'
                      }`}
                    >
                      Hire {formatCurrency(role.cost, whiteLabel)}
                    </button>
                    {current > 0 && (
                      <button
                        onClick={() => { sfx.click(); onFireTeam(roleKey); }}
                        className="px-2 py-1 rounded-lg text-xs text-[#a39c88] hover:text-[#c45c4a] border border-[#f3eee0]/10 hover:border-[#c45c4a]"
                        title="Dismiss Staff"
                      >
                        Let Go
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Courier Wage Slider & Recruiting */}
        <div className="border border-[#f3eee0]/15 bg-[#12140e]/75 rounded-xl p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#f3eee0]">Courier Daily Base Wage</span>
            <span className="font-mono font-bold text-sm text-[#d4b429]">{formatCurrency(state.wage, whiteLabel)}</span>
          </div>

          <input 
            type="range"
            min={600}
            max={1800}
            step={50}
            value={state.wage}
            onChange={(e) => onWageChange(Number(e.target.value))}
            className="w-full accent-[#d4b429] cursor-pointer"
          />

          <div className="flex justify-between text-[10px] font-mono text-[#a39c88]">
            <span>Baseline: {formatCurrency(fairWage, whiteLabel)}</span>
            <span>{state.wage >= fairWage + 200 ? 'High Morale (+6/day)' : state.wage < fairWage - 150 ? 'Disaffection (-10/day)' : 'Normal Retention'}</span>
          </div>

          <button
            disabled={state.riders.length >= 30 || state.cash < riderCost}
            onClick={() => { sfx.click(); onHireRider(); }}
            className={`w-full py-2 rounded-xl text-xs font-bold transition-all mt-2 ${
              state.riders.length >= 30 || state.cash < riderCost
                ? 'bg-[#24281c] text-[#7a7464] cursor-not-allowed opacity-60'
                : 'bg-[#d4b429] text-[#12140e] hover:brightness-105 active:scale-95'
            }`}
          >
            Sign Additional Courier · {formatCurrency(riderCost, whiteLabel)} ({state.riders.length}/30)
          </button>
        </div>

        {/* Courier Roster Grid */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#7a7464]">
            Active Couriers ({state.riders.length})
          </div>
          <div className="grid grid-cols-2 gap-2">
            {state.riders.map(r => {
              const isResting = r.morale < 22;
              const isBusy = r.busyUntil > state.minute;

              return (
                <div 
                  key={r.id}
                  className="border border-[#f3eee0]/10 bg-[#12140e]/60 rounded-lg p-2 text-xs flex justify-between items-center"
                >
                  <div className="truncate">
                    <div className="font-medium text-[#f3eee0] truncate">{r.name}</div>
                    <div className="text-[10px] text-[#7a7464]">
                      {isResting ? 'Resting' : isBusy ? 'On Dispatch' : 'Idle at Hub'}
                    </div>
                  </div>
                  <span className={`font-mono font-bold text-xs ${
                    r.morale < 35 ? 'text-[#c45c4a]' : r.morale >= 70 ? 'text-[#6f8f62]' : 'text-[#d4b429]'
                  }`}>
                    {Math.round(r.morale)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Tab 4: Strategy, Economics & Credit (Plan)
  if (tab === 'plan') {
    const promoLift = Math.round(0.35 * (1 - Math.exp(-state.promo / 6000)) * 100);

    return (
      <div className="space-y-3 pb-6">
        {/* Today's Conditions */}
        <div className="border border-[#f3eee0]/15 bg-[#12140e]/75 rounded-xl p-3">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#7a7464] mb-1">
            Current Shift Outlook
          </div>
          <h4 className="text-sm font-bold text-[#f3eee0]">
            Weather: {state.today.weather.toUpperCase()} · {state.today.tag ? GENERIC_CITY_TAGS.find(t => t.id === state.today.tag)?.name : 'Normal City Conditions'}
          </h4>
          <p className="text-xs text-[#a39c88] mt-1">
            {state.today.tag ? GENERIC_CITY_TAGS.find(t => t.id === state.today.tag)?.note : 'No severe metropolitan disruptions reported.'}
          </p>
        </div>

        {/* Commission Slider */}
        <div className="border border-[#f3eee0]/15 bg-[#12140e]/75 rounded-xl p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#f3eee0]">Platform Take Rate (Commission)</span>
            <span className="font-mono font-bold text-sm text-[#d4b429]">{Math.round(state.comm * 100)}%</span>
          </div>

          <input 
            type="range"
            min={18}
            max={38}
            step={1}
            value={Math.round(state.comm * 100)}
            onChange={(e) => onCommChange(Number(e.target.value) / 100)}
            className="w-full accent-[#d4b429] cursor-pointer"
          />

          <p className="text-[11px] text-[#7a7464]">
            28% is the neutral benchmark. Above 32% earns more per drop but causes vendor disaffection. Below 24% keeps restaurants highly loyal.
          </p>
        </div>

        {/* Marketing / Coupon Budget */}
        <div className="border border-[#f3eee0]/15 bg-[#12140e]/75 rounded-xl p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#f3eee0]">Daily Customer Acquisition Promo</span>
            <span className="font-mono font-bold text-sm text-[#d4b429]">{formatCurrency(state.promo, whiteLabel)} (+{promoLift}%)</span>
          </div>

          <input 
            type="range"
            min={0}
            max={10000}
            step={500}
            value={state.promo}
            onChange={(e) => onPromoChange(Number(e.target.value))}
            className="w-full accent-[#d4b429] cursor-pointer"
          />

          <p className="text-[11px] text-[#7a7464]">
            Charged at end of day. Lifts customer order acquisition and pulls market share from rival platforms.
          </p>
        </div>

        {/* Peak Surge Toggle */}
        <div className="border border-[#f3eee0]/15 bg-[#12140e]/75 rounded-xl p-3 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-[#f3eee0]">Peak Hour Surge Pricing</h4>
            <p className="text-[11px] text-[#7a7464] mt-0.5">
              +15% order revenue during rush and rain; -6% demand volume and minor customer rating impact.
            </p>
          </div>
          <button
            onClick={() => { sfx.click(); onTogglePeak(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              state.peak 
                ? 'bg-[#d4b429] text-[#12140e]' 
                : 'bg-[#24281c] text-[#a39c88] border border-[#f3eee0]/15'
            }`}
          >
            {state.peak ? 'ACTIVE' : 'DISABLED'}
          </button>
        </div>

        {/* Finance & Credit Facility */}
        <div className="border border-[#f3eee0]/15 bg-[#12140e]/75 rounded-xl p-3 space-y-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#d4b429]">
            Working Capital Credit Facility
          </div>
          <p className="text-xs text-[#a39c88]">
            Credit line: <b className="text-[#f3eee0]">{formatCurrency(creditLimit, whiteLabel)}</b> · Available: <b className="text-[#6f8f62]">{formatCurrency(availableCredit, whiteLabel)}</b>. Daily EMIs automatically serviced at midnight. Prepay anytime without penalty.
          </p>

          {/* Active Loans */}
          {state.loans.map(l => (
            <div key={l.id} className="border border-[#f3eee0]/10 bg-[#1a1d14] p-2 rounded-lg flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-[#f3eee0]">{l.type} ({l.id})</span>
                <div className="text-[10px] text-[#a39c88]">
                  Balance: {formatCurrency(l.left, whiteLabel)} · EMI: {formatCurrency(l.emi, whiteLabel)}/day · {l.term - l.days} days left
                </div>
              </div>
              <button
                onClick={() => { sfx.click(); onPrepayLoan(l.id); }}
                className="px-2 py-1 rounded bg-[#24281c] hover:bg-[#2e3324] text-[#d4b429] text-[11px] font-medium"
              >
                Prepay
              </button>
            </div>
          ))}

          {state.loans.length > 1 && (
            <button
              onClick={() => { sfx.click(); onPrepayLoan('all'); }}
              className="text-xs text-[#d4b429] hover:underline block pt-1"
            >
              Prepay All Outstanding Loans
            </button>
          )}

          {/* Borrow New Facility Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[25000, 50000, 100000].map(amt => {
              const term = amt === 25000 ? 10 : amt === 50000 ? 20 : 30;
              const canDraw = availableCredit >= amt && state.loans.length < 3 && state.day >= 2;

              return (
                <button
                  key={amt}
                  disabled={!canDraw}
                  onClick={() => { sfx.click(); onTakeLoan(amt, term); }}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    !canDraw 
                      ? 'border-[#f3eee0]/10 bg-[#12140e] text-[#7a7464] cursor-not-allowed opacity-50' 
                      : 'border-[#f3eee0]/20 bg-[#1a1d14] hover:border-[#d4b429] text-[#f3eee0]'
                  }`}
                >
                  <div className="font-bold text-xs">{formatMoneyShort(amt, whiteLabel)}</div>
                  <div className="text-[10px] text-[#a39c88]">{term}d Term</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Tab 5: News & Reputation (News)
  if (tab === 'news') {
    return (
      <div className="space-y-3 pb-6">
        {/* Stakeholder Reputation Meters */}
        <div className="border border-[#f3eee0]/15 bg-[#12140e]/75 rounded-xl p-3 space-y-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#d4b429] mb-1">
            Stakeholder Reputation Index
          </div>
          {Object.entries(state.rep).map(([k, val]) => (
            <div key={k} className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="capitalize text-[#a39c88]">{k === 'rivals' ? 'Rival Competitive Tension' : `${k} Trust`}</span>
                <span className={val > 0 ? 'text-[#6f8f62] font-bold' : val < 0 ? 'text-[#c45c4a] font-bold' : 'text-[#a39c88]'}>
                  {val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1)}
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#24281c] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    k === 'rivals' 
                      ? 'bg-[#c45c4a]' 
                      : val >= 0 
                      ? 'bg-[#6f8f62]' 
                      : 'bg-[#c45c4a]'
                  }`}
                  style={{ width: `${Math.round(((val + 10) / 20) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Narrative Chapter Arcs */}
        {Object.keys(state.arcs).length > 0 && (
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#7a7464] mb-1.5">
              Active Narrative Milestones
            </div>
            <div className="space-y-2">
              {Object.entries(state.arcs).map(([arcId, data]) => (
                <div key={arcId} className="border border-[#f3eee0]/15 bg-[#12140e]/60 rounded-xl p-2.5">
                  <div className="flex justify-between items-center text-xs font-bold text-[#b79ce0]">
                    <span className="capitalize">{arcId} Arc</span>
                    <span>Chapter {data.ch}</span>
                  </div>
                  <p className="text-xs text-[#f3eee0]/90 mt-1">{data.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Intelligence Feed */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#7a7464]">
            Dispatches & Intelligence Wire
          </div>
          <div className="space-y-1.5">
            {state.feed.slice(0, 30).map((item, idx) => (
              <div 
                key={idx}
                className="border-b border-[#f3eee0]/10 pb-2 text-xs flex items-start gap-2"
              >
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                  item.kind === 'rival' ? 'bg-[#c45c4a]/20 text-[#e58a78]' :
                  item.kind === 'city' ? 'bg-[#7fb7c9]/20 text-[#7fb7c9]' :
                  item.kind === 'story' ? 'bg-[#b79ce0]/20 text-[#b79ce0]' :
                  'bg-[#6f8f62]/20 text-[#9bbd8c]'
                }`}>
                  {item.kind}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[#f3eee0]/90 leading-snug">{formatLabel(item.text, whiteLabel)}</p>
                  <span className="text-[10px] text-[#7a7464] font-mono">{item.t} · Day {item.d}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Tab 6: Shop & Upgrades (Shop)
  return (
    <div className="space-y-3 pb-6">
      <p className="text-xs text-[#a39c88] leading-relaxed">
        Invest capital in operational technologies and fleet infrastructure. Upgrades have ongoing daily running costs.
      </p>

      <div className="space-y-2">
        {GENERIC_UPGRADES.map(u => {
          const curLv = state.upgrades[u.id] || 0;
          const maxLv = u.tiers.length;
          const isMax = curLv >= maxLv;
          const nextTier = !isMax ? u.tiers[curLv] : null;
          const canAfford = nextTier && state.cash >= nextTier.cost;
          const dayLocked = nextTier && nextTier.minDay && state.day < nextTier.minDay;

          return (
            <div 
              key={u.id}
              className="border border-[#f3eee0]/15 bg-[#12140e]/60 rounded-xl p-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-semibold text-[#f3eee0]">
                    {u.name}
                  </h4>
                  {maxLv > 1 && (
                    <span className="text-[10px] font-mono text-[#d4b429] bg-[#d4b429]/15 px-1.5 py-0.2 rounded">
                      {curLv}/{maxLv}
                    </span>
                  )}
                </div>

                {curLv > 0 && (
                  <p className="text-xs text-[#6f8f62] mt-0.5">
                    Active: {u.tiers[curLv - 1].blurb}
                  </p>
                )}

                {!isMax && nextTier && (
                  <p className="text-xs text-[#a39c88] mt-0.5">
                    {curLv > 0 ? 'Next: ' : ''}{nextTier.blurb}
                    {nextTier.run ? ` · Run ${formatCurrency(nextTier.run, whiteLabel)}/day` : ''}
                  </p>
                )}
              </div>

              <div className="flex-shrink-0">
                {isMax ? (
                  <span className="text-xs font-mono font-medium text-[#6f8f62] bg-[#6f8f62]/10 px-2.5 py-1 rounded">
                    Maxed
                  </span>
                ) : (
                  <button
                    disabled={!canAfford || Boolean(dayLocked)}
                    onClick={() => { sfx.click(); onBuyUpgrade(u.id); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      !canAfford || dayLocked
                        ? 'bg-[#24281c] text-[#7a7464] cursor-not-allowed opacity-60'
                        : 'bg-[#d4b429] text-[#12140e] hover:brightness-105 active:scale-95'
                    }`}
                  >
                    {dayLocked ? `Day ${nextTier?.minDay}` : `Ship ${formatCurrency(nextTier?.cost || 0, whiteLabel)}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
