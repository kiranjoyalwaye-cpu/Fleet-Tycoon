import React, { useState, useEffect } from 'react';
import { LeaderboardItem, api } from '../services/api';
import { formatCurrency } from '../utils/textFormatter';
import { WhiteLabelConfig } from '../types/game';
import { sfx } from '../utils/audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiteLabel: WhiteLabelConfig;
  currentScore?: number;
  currentRating?: string;
  currentCash?: number;
  currentNps?: number;
  currentShare?: number;
  currentDays?: number;
  currentDiff?: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  whiteLabel,
  currentScore,
  currentRating,
  currentCash,
  currentNps,
  currentShare,
  currentDays = 14,
  currentDiff = 'normal'
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDays, setFilterDays] = useState<number | undefined>(undefined);
  const [filterDiff, setFilterDiff] = useState<string | undefined>(undefined);
  const [callsign, setCallsign] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchRankings = async () => {
    setLoading(true);
    const data = await api.getLeaderboard({ days: filterDays, difficulty: filterDiff });
    setLeaderboard(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchRankings();
      if (!callsign) {
        setCallsign(`Fleet-${Math.floor(100 + Math.random() * 900)}`);
      }
    }
  }, [isOpen, filterDays, filterDiff]);

  const handleSubmitScore = async () => {
    if (currentScore === undefined || submitting || submitted) return;
    setSubmitting(true);
    sfx.click();

    await api.submitScore({
      anonymousCallsign: callsign.trim() || 'Anonymous Runner',
      score: currentScore,
      rating: currentRating || 'C',
      cash: currentCash || 0,
      nps: currentNps || 50,
      sharePct: Math.round((currentShare || 0.25) * 100),
      days: currentDays,
      difficulty: currentDiff
    });

    setSubmitted(true);
    setSubmitting(false);
    fetchRankings();
  };

  if (!isOpen) return null;

  return (
    <div className="modal show" id="modalLeaderboard">
      <div className="sheet" style={{ maxWidth: '38rem' }}>
        <p className="kicker">Global Rankings</p>
        <h2>Metropolitan Leaderboard</h2>
        <p>Verified run completions ranked across network operators worldwide.</p>

        {/* Submit Active Run Section */}
        {currentScore !== undefined && !submitted && (
          <div className="card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4>Current Shift Performance</h4>
                <p>Grade: <b style={{ color: 'var(--mustard)' }}>{currentRating}</b> · Score: <b>{currentScore.toLocaleString()} pts</b></p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <small style={{ color: 'var(--dim)' }}>{currentDays}d · {currentDiff}</small>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                placeholder="Operator Callsign"
                style={{
                  flex: 1,
                  background: 'var(--wash)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '0.4rem 0.6rem',
                  color: 'var(--paper)',
                  fontFamily: 'inherit',
                  fontSize: '0.85rem'
                }}
              />
              <button
                className="btn btn-sm btn-primary"
                onClick={handleSubmitScore}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Post Run'}
              </button>
            </div>
          </div>
        )}

        {submitted && (
          <div className="card" style={{ borderColor: 'var(--sage)' }}>
            <p style={{ color: 'var(--sage)' }}>✓ Your run has been verified and registered on the global board.</p>
          </div>
        )}

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.3rem', margin: '0.8rem 0 0.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${filterDays === undefined ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterDays(undefined)}
          >
            All Runs
          </button>
          <button
            className={`btn btn-sm ${filterDays === 14 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterDays(14)}
          >
            14 Days
          </button>
          <button
            className={`btn btn-sm ${filterDays === 30 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterDays(30)}
          >
            30 Days
          </button>
          <button
            className={`btn btn-sm ${filterDays === 45 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterDays(45)}
          >
            45 Days
          </button>
        </div>

        {/* Rankings Table */}
        <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--line)', borderRadius: '10px' }}>
          {loading ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)' }}>Loading network records...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)', background: 'var(--wash)', color: 'var(--muted)' }}>
                  <th style={{ padding: '0.5rem 0.6rem' }}>#</th>
                  <th style={{ padding: '0.5rem 0.6rem' }}>Operator</th>
                  <th style={{ padding: '0.5rem 0.6rem' }}>Rating</th>
                  <th style={{ padding: '0.5rem 0.6rem' }}>Score</th>
                  <th style={{ padding: '0.5rem 0.6rem' }}>Share</th>
                  <th style={{ padding: '0.5rem 0.6rem' }}>Cash</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid var(--line)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                    }}
                  >
                    <td style={{ padding: '0.4rem 0.6rem', color: idx < 3 ? 'var(--mustard)' : 'var(--muted)', fontWeight: 600 }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '0.4rem 0.6rem', fontWeight: 600, color: 'var(--paper)' }}>
                      {item.anonymousCallsign}
                      <small style={{ display: 'block', color: 'var(--dim)', fontSize: '0.7rem' }}>
                        {item.days}d · {item.difficulty}
                      </small>
                    </td>
                    <td style={{ padding: '0.4rem 0.6rem', color: 'var(--mustard)', fontWeight: 700 }}>
                      {item.rating}
                    </td>
                    <td style={{ padding: '0.4rem 0.6rem', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {item.score.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.4rem 0.6rem', fontVariantNumeric: 'tabular-nums', color: 'var(--muted)' }}>
                      {item.sharePct}%
                    </td>
                    <td style={{ padding: '0.4rem 0.6rem', fontVariantNumeric: 'tabular-nums', color: 'var(--sage)' }}>
                      {formatCurrency(item.cash, whiteLabel)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: '1rem' }}
          onClick={() => {
            sfx.click();
            onClose();
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};
