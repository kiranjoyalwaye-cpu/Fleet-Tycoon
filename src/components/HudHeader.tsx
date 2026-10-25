import React from 'react';
import { GameState, WhiteLabelConfig } from '../types/game';
import { formatCurrency, formatMoneyShort, formatClock } from '../utils/textFormatter';
import { sfx } from '../utils/audio';

interface HudHeaderProps {
  state: GameState;
  whiteLabel: WhiteLabelConfig;
  speed: number;
  onSpeedChange: (spd: number) => void;
  onTogglePause: () => void;
  onSkipRush: () => void;
  onOpenNextDay: () => void;
  onOpenMission: () => void;
  onTabJump: (tabName: string) => void;
  onOpenLeaderboard: () => void;
  onOpenReport: () => void;
  onOpenOta: () => void;
  nextMoveText: string;
  nextMoveTab: string;
  nextMoveLabel: string;
  goalTarget: {
    share: number;
    cash: number;
    profit: number;
    lovedNps: number;
  };
}

export const HudHeader: React.FC<HudHeaderProps> = ({
  state,
  whiteLabel,
  speed,
  onSpeedChange,
  onTogglePause,
  onSkipRush,
  onOpenNextDay,
  onOpenMission,
  onTabJump,
  onOpenLeaderboard,
  onOpenReport,
  onOpenOta,
  nextMoveText,
  nextMoveTab,
  nextMoveLabel,
  goalTarget
}) => {
  const idleCount = state.riders.filter(r => r.morale >= 22 && r.busyUntil <= state.minute).length;
  const netCash = state.cash - (state.debt || 0);
  const cashMet = netCash >= goalTarget.cash;
  const npsMet = state.nps >= 55;
  const shareMet = state.you >= goalTarget.share;

  // Market share ratios
  const rest = 1 - state.you;
  const rwTotal = state.rw.zesto + state.rw.swish + state.rw.others;
  const youPct = Math.round(state.you * 100);
  const zesPct = rwTotal > 0 ? (rest * state.rw.zesto / rwTotal) * 100 : 0;
  const swiPct = rwTotal > 0 ? (rest * state.rw.swish / rwTotal) * 100 : 0;
  const othPct = rwTotal > 0 ? (rest * state.rw.others / rwTotal) * 100 : 0;

  // Day time progress: 11:30 (690) to 23:00 (1380)
  const dayStartMin = 11 * 60 + 30;
  const dayEndMin = 23 * 60;
  const dayProgress = Math.min(100, Math.max(0, ((state.minute - dayStartMin) / (dayEndMin - dayStartMin)) * 100));

  return (
    <>
      <header className="hud">
        <div className="brandbox">
          <p className="brand">{whiteLabel.appName}</p>
          <p className="clock" id="clock">
            Day {state.day}/{state.days} · {formatClock(state.minute)}
          </p>
        </div>

        <div className="chips" id="chips">
          {/* Operating Cash */}
          <div className={`chip ${state.cash < 40000 ? 'warn' : cashMet ? 'met' : ''}`}>
            <span>
              Cash <em>{state.debt ? `Debt ${formatMoneyShort(state.debt, whiteLabel)}` : `Goal ${formatMoneyShort(goalTarget.cash, whiteLabel)}`}</em>
            </span>
            <b>{formatCurrency(state.cash, whiteLabel)}</b>
            <div className="meter">
              <i style={{ width: `${Math.min(100, Math.max(0, (netCash / Math.max(1, goalTarget.cash)) * 100))}%` }} />
            </div>
          </div>

          {/* NPS Satisfaction */}
          <div className={`chip ${state.nps < 45 ? 'warn' : npsMet ? 'met' : ''}`}>
            <span>
              NPS <em>Goal 55+</em>
            </span>
            <b>{Math.round(state.nps)}</b>
            <div className="meter">
              <i style={{ width: `${Math.min(100, Math.max(0, (state.nps / 100) * 100))}%` }} />
              <u style={{ left: '55%' }} />
            </div>
          </div>

          {/* Market Share Stack */}
          <div className={`chip ${shareMet ? 'met' : ''}`}>
            <span>
              City share <em>Goal {Math.round(goalTarget.share * 100)}%</em>
            </span>
            <b>{youPct}%</b>
            <div className="meter stack">
              <i className="you" style={{ width: `${youPct}%` }} />
              <i className="zes" style={{ width: `${zesPct}%` }} />
              <i className="swi" style={{ width: `${swiPct}%` }} />
              <i className="oth" style={{ width: `${othPct}%` }} />
            </div>
          </div>

          {/* Active Fleet */}
          <div className="chip">
            <span>
              Couriers <em>{idleCount} free</em>
            </span>
            <b>{idleCount}/{state.riders.length}</b>
            <div className="meter">
              <i style={{ width: `${state.riders.length > 0 ? (idleCount / state.riders.length) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        <div className="tools">
          <button
            className="btn btn-sm btn-secondary"
            data-act="pause"
            id="btnPause"
            title="Pause / play (Space)"
            onClick={() => {
              sfx.click();
              onTogglePause();
            }}
          >
            {speed === 0 ? 'Play' : 'Pause'}
          </button>

          <button
            className={`btn btn-sm ${speed === 0.5 ? 'btn-primary' : 'btn-secondary'}`}
            data-spd="0.5"
            title="Half speed (Z)"
            onClick={() => {
              sfx.click();
              onSpeedChange(0.5);
            }}
          >
            ½x
          </button>

          <button
            className={`btn btn-sm ${speed === 1 ? 'btn-primary' : 'btn-secondary'}`}
            data-spd="1"
            title="1x (X)"
            onClick={() => {
              sfx.click();
              onSpeedChange(1);
            }}
          >
            1x
          </button>

          <button
            className={`btn btn-sm ${speed === 2 ? 'btn-primary' : 'btn-secondary'}`}
            data-spd="2"
            title="2x (C)"
            onClick={() => {
              sfx.click();
              onSpeedChange(2);
            }}
          >
            2x
          </button>

          <button
            className={`btn btn-sm ${speed === 4 ? 'btn-primary' : 'btn-secondary'}`}
            data-spd="4"
            title="4x (V)"
            onClick={() => {
              sfx.click();
              onSpeedChange(4);
            }}
          >
            4x
          </button>

          <button
            className="btn btn-sm btn-ghost"
            data-act="rush"
            id="btnRush"
            title="Skip to the rush (R)"
            onClick={() => {
              sfx.click();
              onSkipRush();
            }}
          >
            Rush
          </button>

          {state.dayOver && (
            <button
              className="btn btn-sm btn-primary"
              data-act="nextday"
              id="btnNext"
              onClick={() => {
                sfx.click();
                onOpenNextDay();
              }}
            >
              Open next day
            </button>
          )}

          <button
            className="btn btn-sm btn-ghost"
            data-act="mission"
            title="Goal and controls (M)"
            aria-label="Goal and controls"
            onClick={() => {
              sfx.click();
              onOpenMission();
            }}
          >
            ?
          </button>

          {/* Integrated User Features: Leaderboard, Report, OTA */}
          <button
            className="btn btn-sm btn-secondary"
            title="Rankings & Leaderboard"
            onClick={() => {
              sfx.click();
              onOpenLeaderboard();
            }}
          >
            🏆
          </button>

          <button
            className="btn btn-sm btn-secondary"
            title="Monthly Privacy Summary"
            onClick={() => {
              sfx.click();
              onOpenReport();
            }}
          >
            📊
          </button>

          <button
            className="btn btn-sm btn-ghost"
            title="System & OTA Status"
            onClick={() => {
              sfx.click();
              onOpenOta();
            }}
          >
            ⚡
          </button>
        </div>
      </header>

      {/* Action Hint Bar */}
      <button
        className="hint"
        id="hint"
        type="button"
        data-act="hint"
        onClick={() => {
          sfx.click();
          onTabJump(nextMoveTab);
        }}
      >
        <span className="goal" id="goalLine">
          Goal: pass the launch review (NPS 55+, {formatCurrency(goalTarget.cash, whiteLabel)}, {Math.round(goalTarget.share * 100)}%+ share)
        </span>
        <span className="next" id="nextLine">
          <b>Next:</b> {nextMoveText}
        </span>
        <span className="go" id="goLine">
          {nextMoveLabel} ▾
        </span>
        <span className="dayline">
          <i id="dayBar" style={{ width: `${dayProgress}%` }} />
        </span>
      </button>
    </>
  );
};
