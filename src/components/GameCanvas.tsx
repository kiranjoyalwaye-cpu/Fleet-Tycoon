import React from 'react';
import { GameState, WhiteLabelConfig } from '../types/game';
import { GENERIC_ZONES, ZONE_IDS, CENTRAL_HUB, GENERIC_RIVAL_PINS } from '../data/whiteLabelDefaults';
import { formatCurrency, formatLabel } from '../utils/textFormatter';

interface GameCanvasProps {
  state: GameState;
  whiteLabel: WhiteLabelConfig;
  tallLayout: boolean;
  pops: { id: string; amount: number }[];
  onPinClick: (zoneId: string) => void;
  onUnlockClick: (zoneId: string) => void;
  onHubClick: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  state,
  whiteLabel,
  tallLayout,
  pops,
  onPinClick,
  onUnlockClick,
  onHubClick
}) => {
  const getPos = (o: { lx: number; ly: number; tx: number; ty: number }) => {
    return tallLayout ? [o.tx, o.ty] : [o.lx, o.ly];
  };

  const [hx, hy] = getPos({
    lx: CENTRAL_HUB.lx,
    ly: CENTRAL_HUB.ly,
    tx: CENTRAL_HUB.tx,
    ty: CENTRAL_HUB.ty
  });

  const idleCount = state.riders.filter(r => r.morale >= 22 && r.busyUntil <= state.minute).length;
  const activeKitchenCount = Object.keys(state.kitchens).filter(k => state.kitchens[k].on && !state.kitchens[k].out).length;
  const firstFeed = state.feed[0];

  return (
    <section className="board" id="board">
      {/* Status Bar */}
      <div className="status" id="status">
        <span className="dot" style={{ background: '#6f8f62' }} />
        <span><b>{state.orders.length} orders</b> ({idleCount} riders free)</span>
      </div>

      {/* SVG Vector Route Network */}
      <svg className="roads" viewBox="0 0 100 100" preserveAspectRatio="none">
        <ellipse
          cx={tallLayout ? 50 : 42}
          cy={tallLayout ? 61 : 52}
          rx={tallLayout ? 14 : 9}
          ry={tallLayout ? 3.2 : 6}
          className="lake"
        />

        {ZONE_IDS.map((id) => {
          const f = GENERIC_ZONES[id];
          const [x, y] = getPos(f);
          const isUnlocked = state.floors[id]?.unlocked;
          const hasActiveOrders = state.orders.some(o => o.floorId === id);

          return (
            <line
              key={id}
              x1={hx}
              y1={hy}
              x2={x}
              y2={y}
              vectorEffect="non-scaling-stroke"
              className={hasActiveOrders ? 'live' : isUnlocked ? '' : 'off'}
            />
          );
        })}
      </svg>

      {/* Pins Layer */}
      <div className="pins" id="pins">
        {/* Competitor / Rival Pins */}
        {Object.entries(GENERIC_RIVAL_PINS).map(([key, rp]) => {
          const [rx, ry] = getPos(rp);
          const share = key === 'zesto' ? state.rw.zesto : state.rw.swish;
          const sharePct = Math.round((1 - state.you) * (share / (state.rw.zesto + state.rw.swish + state.rw.others)) * 100);
          const isAlpha = key === 'zesto';

          return (
            <div
              key={key}
              style={{ left: `${rx}%`, top: `${ry}%` }}
              className={`pin rival ${key}`}
            >
              <div className="top">
                <span className="ico">{rp.code}</span>
                <h3>{isAlpha ? whiteLabel.rivalAlphaName : whiteLabel.rivalBetaName}</h3>
              </div>
              <p>{rp.blurb}</p>
              <div className="meta">
                <span>{sharePct}% share</span>
                <span>RIVAL</span>
              </div>
            </div>
          );
        })}

        {/* Central Dispatch Hub Pin */}
        <div
          onClick={onHubClick}
          style={{ left: `${hx}%`, top: `${hy}%`, cursor: 'pointer' }}
          className="pin hq"
        >
          <div className="top">
            <span className="ico">HUB</span>
            <h3>{whiteLabel.hubName}</h3>
          </div>
          <p>Central kitchen and rider hub</p>
          <div className="meta">
            <span>{activeKitchenCount} kitchens</span>
            <span className="dot" style={{ background: '#6f8f62' }} />
          </div>
        </div>

        {/* Zone Pins (White-Labeled Districts) */}
        {ZONE_IDS.map((id) => {
          const f = GENERIC_ZONES[id];
          const st = state.floors[id];
          const [x, y] = getPos(f);
          const activeOrders = state.orders.filter(o => o.floorId === id);
          const isLocked = !st?.unlocked;
          const dayLocked = f.minDay && state.day < f.minDay;
          const canAfford = isLocked && !dayLocked && state.cash >= f.cost;

          return (
            <button
              key={id}
              onClick={() => {
                if (isLocked) onUnlockClick(id);
                else onPinClick(id);
              }}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                boxShadow: st?.unlocked && st.heat > 0.05 ? `0 0 ${8 + st.heat * 18}px rgba(212,180,41,0.6)` : undefined
              }}
              className={`pin ${isLocked ? 'locked' : ''} ${canAfford ? 'canafford' : ''}`}
            >
              <div className="top">
                <span className="ico">{f.shortKey}</span>
                <h3>{f.nameKey}</h3>
              </div>
              <p>{f.blurbKey}</p>
              <div className="meta">
                <span>
                  {isLocked
                    ? dayLocked
                      ? `Day ${f.minDay}`
                      : formatCurrency(f.cost, whiteLabel)
                    : `${activeOrders.length} orders${st.depth ? ` · L${st.depth}` : ''}`
                  }
                </span>
                <span>
                  {isLocked ? (
                    <span style={{ color: 'var(--dim)', fontSize: '0.85em' }}>LOCKED</span>
                  ) : (
                    <span className="dot" />
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Couriers / Scooters in Transit */}
      {state.orders.map((o) => {
        const dest = GENERIC_ZONES[o.floorId];
        if (!dest) return null;
        const [dx, dy] = getPos(dest);
        let progress = 0;
        if (o.status === 'ride') {
          progress = Math.max(0, Math.min(1, (state.minute - o.pickAt) / Math.max(1, o.dropAt - o.pickAt)));
        }

        const curX = hx + (dx - hx) * progress;
        const curY = hy + (dy - hy) * progress;

        return (
          <i
            key={o.id}
            className="scoot"
            style={{ left: `${curX}%`, top: `${curY}%` }}
          />
        );
      })}

      {/* Floating Revenue Pops */}
      <div className="pops" id="pops">
        {pops.map((p) => (
          <span key={p.id} className="pop">
            +{formatCurrency(p.amount, whiteLabel)}
          </span>
        ))}
      </div>

      {/* Live News Ticker */}
      <div className="ticker" id="ticker">
        {firstFeed ? (
          <>
            <b className={`k-${firstFeed.kind}`}>{firstFeed.kind}</b>
            <span>{formatLabel(firstFeed.text, whiteLabel)}</span>
          </>
        ) : (
          <span>{whiteLabel.metroName} grid live. Shift running.</span>
        )}
      </div>

      {/* Real-time Order Toasts */}
      <div id="toasts" aria-live="polite">
        {state.toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone}`}>
            {t.text}
          </div>
        ))}
      </div>
    </section>
  );
};
