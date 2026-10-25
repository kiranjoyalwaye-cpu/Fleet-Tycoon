import React from 'react';
import { Difficulty, CampaignLength, FounderType, WhiteLabelConfig } from '../types/game';
import { GENERIC_FOUNDERS } from '../data/whiteLabelDefaults';
import { formatCurrency } from '../utils/textFormatter';
import { sfx } from '../utils/audio';

interface TitleScreenProps {
  whiteLabel: WhiteLabelConfig;
  difficulty: Difficulty;
  campaignLength: CampaignLength;
  founder: FounderType;
  hasSavedGame: boolean;
  onSelectDiff: (d: Difficulty) => void;
  onSelectLength: (l: CampaignLength) => void;
  onSelectFounder: (f: FounderType) => void;
  onStartNew: () => void;
  onContinue: () => void;
  onOpenWhiteLabel: () => void;
  onOpenLeaderboard: () => void;
  onOpenReport: () => void;
  onOpenOta: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  whiteLabel,
  difficulty,
  campaignLength,
  founder,
  hasSavedGame,
  onSelectDiff,
  onSelectLength,
  onSelectFounder,
  onStartNew,
  onContinue,
  onOpenWhiteLabel,
  onOpenLeaderboard,
  onOpenReport,
  onOpenOta
}) => {
  const lengths: { len: CampaignLength; label: string; note: string; targetShare: number; targetCash: number }[] = [
    { len: 14, label: 'Sprint', note: '14 days. The classic run.', targetShare: 31, targetCash: 20000 },
    { len: 30, label: 'Season', note: '30 days. Weather, events, rival moves.', targetShare: 32, targetCash: 50000 },
    { len: 45, label: 'Marathon', note: '45 days. Consolidate and hold the city.', targetShare: 35, targetCash: 80000 }
  ];

  const diffs: { id: Difficulty; label: string; note: string; cash: number }[] = [
    { id: 'easy', label: 'Relaxed', note: 'More cash, softer rivals', cash: 120000 },
    { id: 'normal', label: 'Standard', note: 'The intended run', cash: 85000 },
    { id: 'hard', label: "Board's cut", note: 'Less cash, harsher rivals', cash: 60000 }
  ];

  const currentLengthObj = lengths.find(l => l.len === campaignLength) || lengths[0];

  return (
    <div id="title" className="screen">
      <div className="inner">
        <p className="kicker">
          {whiteLabel.enterpriseLabel} · {whiteLabel.metroName}
        </p>
        <h1>{whiteLabel.appName}</h1>
        <p className="lede">
          You run {whiteLabel.appName}, a young food delivery fleet in {whiteLabel.metroName}. Take on rival aggregators zone by zone, survive Mega Sale, and win the city.
        </p>

        <ul className="bullets">
          <li id="goalBullet">
            Goal: after {campaignLength} days, pass the launch review — NPS 55+, {formatCurrency(currentLengthObj.targetCash, whiteLabel)} cash, {currentLengthObj.targetShare}%+ city share.
          </li>
          <li>12:30 is the boss fight, every day.</li>
          <li>Open zones, hire couriers, calibrate cut rates. Kitchen partners join as you grow.</li>
        </ul>

        {/* Founder Radiogroup */}
        <div className="diffs" id="founders" role="radiogroup" aria-label="Founder">
          {Object.entries(GENERIC_FOUNDERS).map(([key, f]) => {
            const isSelected = founder === key;
            return (
              <button
                key={key}
                type="button"
                className={isSelected ? 'on' : ''}
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  sfx.click();
                  onSelectFounder(key as FounderType);
                }}
              >
                <b>{f.name}</b>
                <small>{f.note}</small>
              </button>
            );
          })}
        </div>

        {/* Campaign Length Radiogroup */}
        <div className="diffs" id="lens" role="radiogroup" aria-label="Campaign length">
          {lengths.map(l => {
            const isSelected = campaignLength === l.len;
            return (
              <button
                key={l.len}
                type="button"
                className={isSelected ? 'on' : ''}
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  sfx.click();
                  onSelectLength(l.len);
                }}
              >
                <b>{l.label} ({l.len}d)</b>
                <small>{l.note}</small>
              </button>
            );
          })}
        </div>

        {/* Difficulty Radiogroup */}
        <div className="diffs" id="diffs" role="radiogroup" aria-label="Difficulty">
          {diffs.map(d => {
            const isSelected = difficulty === d.id;
            return (
              <button
                key={d.id}
                type="button"
                className={isSelected ? 'on' : ''}
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  sfx.click();
                  onSelectDiff(d.id);
                }}
              >
                <b>{d.label}</b>
                <small>{d.note}</small>
              </button>
            );
          })}
        </div>

        {/* Action Row */}
        <div className="row">
          {hasSavedGame && (
            <button
              className="btn btn-primary"
              id="btnContinue"
              onClick={() => {
                sfx.click();
                onContinue();
              }}
            >
              Continue shift
            </button>
          )}

          <button
            className="btn btn-primary"
            id="btnNew"
            onClick={() => {
              sfx.click();
              onStartNew();
            }}
          >
            New {campaignLength}-day run
          </button>

          <button
            className="btn btn-secondary"
            id="btnLeaderboard"
            onClick={() => {
              sfx.click();
              onOpenLeaderboard();
            }}
          >
            Leaderboard
          </button>

          <button
            className="btn btn-secondary"
            id="btnReport"
            onClick={() => {
              sfx.click();
              onOpenReport();
            }}
          >
            Monthly Report
          </button>

          <button
            className="btn btn-secondary"
            id="btnOta"
            onClick={() => {
              sfx.click();
              onOpenOta();
            }}
          >
            System & OTA
          </button>

          <button
            className="btn btn-ghost"
            onClick={() => {
              sfx.click();
              onOpenWhiteLabel();
            }}
          >
            White-Label
          </button>
        </div>
      </div>
    </div>
  );
};
