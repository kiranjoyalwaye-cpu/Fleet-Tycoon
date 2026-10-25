import React, { useState } from 'react';
import { WhiteLabelConfig } from '../types/game';
import { DEFAULT_WHITE_LABEL } from '../data/whiteLabelDefaults';
import { sfx } from '../utils/audio';

interface WhiteLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WhiteLabelConfig;
  onUpdateConfig: (cfg: WhiteLabelConfig) => void;
}

export const WhiteLabelModal: React.FC<WhiteLabelModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig
}) => {
  const [form, setForm] = useState<WhiteLabelConfig>(config);

  if (!isOpen) return null;

  const handleSave = () => {
    sfx.click();
    onUpdateConfig(form);
    onClose();
  };

  const handleReset = () => {
    sfx.click();
    setForm(DEFAULT_WHITE_LABEL);
  };

  return (
    <div className="modal show" id="modalWhiteLabel">
      <div className="sheet" style={{ maxWidth: '34rem' }}>
        <p className="kicker">White-Label Customization</p>
        <h2>Brand Identity & Placeholders</h2>
        <p>Replace UI titles, currencies, and partner naming with generic placeholder labels.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
          <div>
            <label className="rng">App Title</label>
            <input
              type="text"
              value={form.appName}
              onChange={(e) => setForm({ ...form, appName: e.target.value })}
              style={{
                width: '100%',
                background: 'var(--wash)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '0.4rem 0.6rem',
                color: 'var(--paper)',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div>
            <label className="rng">Enterprise Tagline</label>
            <input
              type="text"
              value={form.enterpriseLabel}
              onChange={(e) => setForm({ ...form, enterpriseLabel: e.target.value })}
              style={{
                width: '100%',
                background: 'var(--wash)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '0.4rem 0.6rem',
                color: 'var(--paper)',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div>
            <label className="rng">Metropolitan Region</label>
            <input
              type="text"
              value={form.metroName}
              onChange={(e) => setForm({ ...form, metroName: e.target.value })}
              style={{
                width: '100%',
                background: 'var(--wash)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '0.4rem 0.6rem',
                color: 'var(--paper)',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label className="rng">Competitor A</label>
              <input
                type="text"
                value={form.rivalAlphaName}
                onChange={(e) => setForm({ ...form, rivalAlphaName: e.target.value })}
                style={{
                  width: '100%',
                  background: 'var(--wash)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '0.4rem 0.6rem',
                  color: 'var(--paper)',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <div>
              <label className="rng">Competitor B</label>
              <input
                type="text"
                value={form.rivalBetaName}
                onChange={(e) => setForm({ ...form, rivalBetaName: e.target.value })}
                style={{
                  width: '100%',
                  background: 'var(--wash)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '0.4rem 0.6rem',
                  color: 'var(--paper)',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.2rem' }}>
          <button
            className="btn btn-ghost"
            style={{ flex: 1 }}
            onClick={handleReset}
          >
            Reset Defaults
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleSave}
          >
            Save Brand Settings
          </button>
        </div>
      </div>
    </div>
  );
};
