import React from 'react';
import { GameState, WhiteLabelConfig, GameEvent } from '../types/game';
import { formatCurrency, formatLabel } from '../utils/textFormatter';
import { sfx } from '../utils/audio';

// -------------------------------------------------------------
// 1. Briefing Modal (Day 1 Intro)
// -------------------------------------------------------------
export const BriefingModal: React.FC<{
  isOpen: boolean;
  onDismiss: () => void;
  state: GameState;
  whiteLabel: WhiteLabelConfig;
  goalTarget: { share: number; cash: number };
}> = ({ isOpen, onDismiss, state, whiteLabel, goalTarget }) => {
  if (!isOpen) return null;

  return (
    <div className="modal show" id="modalBrief">
      <div className="sheet">
        <p className="kicker">Day 1 briefing</p>
        <h2>{whiteLabel.appName} is live in Bellandur.</h2>
        <ol id="briefList">
          <li>
            <b>Goal:</b> after {state.days} days, pass the launch review — NPS 55+, {formatCurrency(goalTarget.cash, whiteLabel)} cash, {Math.round(goalTarget.share * 100)}%+ city share.
          </li>
          <li>
            <b>The rivals:</b> {whiteLabel.rivalAlphaName} and {whiteLabel.rivalBetaName} own the city right now. Every drop you deliver pulls share from them; cancels give it back.
          </li>
          <li>
            <b>The rhythm:</b> 12:30 is the boss fight, every single day. Weekdays, rain, and match nights change how the city orders.
          </li>
          <li>
            <b>Growth:</b> Open new zones, hire couriers, and set your cut rate. Kitchen partners join as you serve more orders.
          </li>
        </ol>
        <button
          className="btn btn-primary btn-block"
          onClick={() => {
            sfx.click();
            onDismiss();
          }}
        >
          Open the city map
        </button>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. Event Decision Modal
// -------------------------------------------------------------
export const EventModal: React.FC<{
  isOpen: boolean;
  event: GameEvent | null;
  state: GameState;
  whiteLabel: WhiteLabelConfig;
  onSelectChoice: (choiceId: string) => void;
}> = ({ isOpen, event, state, whiteLabel, onSelectChoice }) => {
  if (!isOpen || !event) return null;

  const eventBody = typeof event.body === 'function' ? event.body() : event.body;

  return (
    <div className="modal show" id="modalEvent">
      <div className="sheet" id="eventSheet">
        <p className="kicker">Day {state.day} incident</p>
        <h2>{formatLabel(event.title, whiteLabel)}</h2>
        <p>{formatLabel(eventBody, whiteLabel)}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {event.choices.map((c, idx) => {
            const cannotAfford = c.cost && state.cash < c.cost;

            return (
              <button
                key={c.id}
                disabled={Boolean(cannotAfford)}
                onClick={() => {
                  sfx.click();
                  onSelectChoice(c.id);
                }}
                className={`btn btn-secondary btn-col btn-block ${cannotAfford ? 'cant' : ''}`}
              >
                <div>
                  <b>{idx + 1}. {formatLabel(c.label, whiteLabel)}</b>
                  {c.cost ? (
                    <span style={{ float: 'right', color: 'var(--mustard)', fontWeight: 'bold' }}>
                      {formatCurrency(c.cost, whiteLabel)}
                    </span>
                  ) : null}
                </div>
                <small>{formatLabel(c.hint, whiteLabel)}</small>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. Day Summary Modal (Shift Report)
// -------------------------------------------------------------
export const DaySummaryModal: React.FC<{
  isOpen: boolean;
  state: GameState;
  whiteLabel: WhiteLabelConfig;
  onOpenNextDay: () => void;
  onSpendFirst: () => void;
  dayNet: number;
  nextMoveText: string;
}> = ({ isOpen, state, whiteLabel, onOpenNextDay, onSpendFirst, dayNet, nextMoveText }) => {
  if (!isOpen) return null;

  const st = state.stats;
  const isLastDay = state.day >= state.days;

  return (
    <div className="modal show" id="modalDay">
      <div className="sheet" id="daySheet">
        <p className="kicker">Day {state.day} closed</p>
        <h2>Daily report</h2>

        <div className="grid2">
          <dl className="stat">
            <dt>Delivered orders</dt>
            <dd className="pos">{st.orders - st.cancel} ({st.cancel} cancelled)</dd>
          </dl>
          <dl className="stat">
            <dt>Net day margin</dt>
            <dd className={dayNet >= 0 ? 'pos' : 'neg'}>{formatCurrency(dayNet, whiteLabel)}</dd>
          </dl>
          <dl className="stat">
            <dt>Gross order value</dt>
            <dd>{formatCurrency(st.gmv, whiteLabel)}</dd>
          </dl>
          <dl className="stat">
            <dt>Courier payouts</dt>
            <dd className="neg">{formatCurrency(st.wages, whiteLabel)}</dd>
          </dl>
          <dl className="stat">
            <dt>Current rating</dt>
            <dd className="pos">★ {state.nps.toFixed(0)}</dd>
          </dl>
          <dl className="stat">
            <dt>City order share</dt>
            <dd>{Math.round(state.you * 100)}%</dd>
          </dl>
        </div>

        {st.over && (
          <p className="note">
            Overheads: {formatCurrency(st.over.total, whiteLabel)} (Hubs {formatCurrency(st.over.rent, whiteLabel)}, Cloud {formatCurrency(st.over.tech, whiteLabel)}, Upgrades {formatCurrency(st.over.run, whiteLabel)}, Team {formatCurrency(st.over.team, whiteLabel)}).
          </p>
        )}

        <p className="note">
          <b>Next:</b> <span dangerouslySetInnerHTML={{ __html: formatLabel(nextMoveText, whiteLabel) }} />
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1rem' }}>
          <button
            className="btn btn-primary btn-block"
            onClick={() => {
              sfx.click();
              onOpenNextDay();
            }}
          >
            {isLastDay ? 'Proceed to launch review' : `Open Day ${state.day + 1}`}
          </button>
          {!isLastDay && (
            <button
              className="btn btn-ghost btn-block"
              onClick={() => {
                sfx.click();
                onSpendFirst();
              }}
            >
              Rebalance fleet & upgrades first
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 4. Campaign Complete / Game Over Modal
// -------------------------------------------------------------
export const GameOverModal: React.FC<{
  isOpen: boolean;
  state: GameState;
  whiteLabel: WhiteLabelConfig;
  onRestart: () => void;
  onOpenLeaderboard: () => void;
  score: number;
  ratingGrade: string;
  isWon: boolean;
}> = ({ isOpen, state, whiteLabel, onRestart, onOpenLeaderboard, score, ratingGrade, isWon }) => {
  if (!isOpen) return null;

  return (
    <div className="modal show" id="modalEnd">
      <div className="sheet" id="endSheet">
        <p className="kicker">Campaign completed</p>
        <h2>{isWon ? 'Launch review: PASSED' : 'Launch review: FAILED'}</h2>
        
        <div className="rating">{ratingGrade}</div>
        <p>Enterprise performance score: <b>{score.toLocaleString()} pts</b></p>

        <div className="grid2">
          <dl className="stat">
            <dt>Final Cash</dt>
            <dd className="pos">{formatCurrency(state.cash, whiteLabel)}</dd>
          </dl>
          <dl className="stat">
            <dt>Final NPS</dt>
            <dd className={state.nps >= 55 ? 'pos' : 'neg'}>★ {state.nps.toFixed(0)}</dd>
          </dl>
          <dl className="stat">
            <dt>City Order Share</dt>
            <dd className="pos">{Math.round(state.you * 100)}%</dd>
          </dl>
          <dl className="stat">
            <dt>Total Delivered</dt>
            <dd>{state.stats.orders - state.stats.cancel}</dd>
          </dl>
        </div>

        <p className="note">
          {isWon 
            ? 'The board has approved series-A expansion across secondary metropolitan zones.' 
            : 'The board concluded that unit economics and NPS failed to achieve self-sustaining traction.'}
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.2rem' }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => {
              sfx.click();
              onOpenLeaderboard();
            }}
          >
            Leaderboard
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={() => {
              sfx.click();
              onRestart();
            }}
          >
            Start New Run
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 5. Goal & Controls Modal (Mission ?)
// -------------------------------------------------------------
export const MissionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  whiteLabel: WhiteLabelConfig;
  goalTarget: { share: number; cash: number };
}> = ({ isOpen, onClose, state, whiteLabel, goalTarget }) => {
  if (!isOpen) return null;

  return (
    <div className="modal show" id="modalMission">
      <div className="sheet" id="missionSheet">
        <p className="kicker">Goal & controls</p>
        <h2>Run operations</h2>

        <h3>Target Criteria</h3>
        <ul className="plain">
          <li><b>Pass review:</b> {state.days} days, NPS 55+, {formatCurrency(goalTarget.cash, whiteLabel)} cash, {Math.round(goalTarget.share * 100)}%+ city share.</li>
          <li><b>Every day at 12:30:</b> The lunch rush crush. Have idle couriers and high-prep partner kitchens ready.</li>
          <li><b>Rider morale:</b> If daily wages drop below expectations or rain hits without ponchos, couriers log off.</li>
        </ul>

        <h3>Keyboard Shortcuts</h3>
        <div className="keys">
          <span><kbd>Space</kbd></span><span>Pause / resume</span>
          <span><kbd>Z</kbd> <kbd>X</kbd> <kbd>C</kbd> <kbd>V</kbd></span><span>Speed: ½x, 1x, 2x, 4x</span>
          <span><kbd>R</kbd></span><span>Rush (fast-forward to peak)</span>
          <span><kbd>1</kbd>–<kbd>6</kbd></span><span>Switch side tabs</span>
          <span><kbd>M</kbd></span><span>Open this goal sheet</span>
        </div>

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: '1.2rem' }}
          onClick={() => {
            sfx.click();
            onClose();
          }}
        >
          Return to city map
        </button>
      </div>
    </div>
  );
};
