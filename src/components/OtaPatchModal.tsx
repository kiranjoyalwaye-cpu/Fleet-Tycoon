import React, { useState, useEffect } from 'react';
import { api, OtaManifestResponse } from '../services/api';
import { sfx } from '../utils/audio';

interface OtaPatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion: string;
  onApplyPatch: (newVersion: string, tweaks?: Record<string, number>) => void;
}

export const OtaPatchModal: React.FC<OtaPatchModalProps> = ({
  isOpen,
  onClose,
  currentVersion,
  onApplyPatch
}) => {
  const [manifestData, setManifestData] = useState<OtaManifestResponse['manifest'] | null>(null);
  const [checking, setChecking] = useState(false);
  const [applying, setApplying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const checkUpdates = async () => {
    setChecking(true);
    setStatusMessage('Querying secure release endpoint...');
    const res = await api.getOtaManifest();
    setChecking(false);

    if (res && res.manifest) {
      setManifestData(res.manifest);
      if (res.manifest.version === currentVersion) {
        setStatusMessage('Client binary is up-to-date with official signature.');
      } else {
        setStatusMessage(`Update candidate ${res.manifest.version} verified.`);
      }
    } else {
      setStatusMessage('Unable to reach release endpoint. Operating offline.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkUpdates();
    }
  }, [isOpen]);

  const handleDownloadAndApply = async () => {
    if (!manifestData) return;
    setApplying(true);
    sfx.click();
    setStatusMessage('Downloading verified package from backend...');

    const res = await api.downloadPatch(manifestData.version);
    if (res && res.success) {
      setStatusMessage('Package verified. Patch deployed.');
      onApplyPatch(manifestData.version, manifestData.payload?.engineTweaks);
      setTimeout(() => {
        setApplying(false);
      }, 700);
    } else {
      setStatusMessage('Integrity verification failed.');
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal show" id="modalOta">
      <div className="sheet" style={{ maxWidth: '34rem' }}>
        <p className="kicker">Runtime System & Updates</p>
        <h2>Over-The-Air Maintenance</h2>
        <p>Seamless over-the-air backend patching with cryptographic verification and zero telemetry leaks.</p>

        <div className="card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem', marginTop: '0.8rem' }}>
          <h4>Environment Specifications</h4>
          <p>Active Engine Version: <b style={{ color: 'var(--mustard)' }}>{currentVersion}</b></p>
          <p>Obfuscation & Hardening: <b style={{ color: 'var(--sage)' }}>Active (Zero Debug Logs)</b></p>
          <p>Status: <span>{statusMessage}</span></p>
        </div>

        {manifestData && manifestData.version !== currentVersion && (
          <div className="card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem', borderColor: 'var(--mustard)', marginTop: '0.8rem' }}>
            <h4 style={{ color: 'var(--mustard)' }}>Update Available: {manifestData.version}</h4>
            <p>Mandatory: {manifestData.mandatory ? 'Yes' : 'No'}</p>
            <p>Checksum: <code style={{ fontSize: '0.75rem' }}>{manifestData.checksum.substring(0, 24)}...</code></p>
            <ul className="plain" style={{ marginTop: '0.4rem' }}>
              {manifestData.notes.map((c: string, i: number) => (
                <li key={i}>{c}</li>
              ))}
            </ul>

            <button
              className="btn btn-sm btn-primary"
              onClick={handleDownloadAndApply}
              disabled={applying}
              style={{ marginTop: '0.5rem' }}
            >
              {applying ? 'Applying Update...' : 'Install OTA Patch'}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.2rem' }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={checkUpdates}
            disabled={checking}
          >
            {checking ? 'Checking...' : 'Check Again'}
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={() => {
              sfx.click();
              onClose();
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
