import React, { useState, useEffect } from 'react';
import { GameState, WhiteLabelConfig } from '../types/game';
import { api, MonthlyReportData } from '../services/api';
import { formatCurrency } from '../utils/textFormatter';
import { sfx } from '../utils/audio';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  whiteLabel: WhiteLabelConfig;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  isOpen,
  onClose,
  state,
  whiteLabel
}) => {
  const [report, setReport] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const st = state.stats;
      api.generateMonthlyReport({
        totalShifts: state.day,
        ordersServed: state.served || (st.orders - st.cancel),
        gmv: st.gmv,
        netProfit: st.rev + st.ads + st.fee - st.cuts - st.refunds - st.wages - st.promo,
        avgNps: state.nps,
        avgSharePct: Math.round(state.you * 100)
      }).then(res => {
        if (res.success && res.report) {
          setReport(res.report);
        }
        setLoading(false);
      });
    }
  }, [isOpen, state]);

  if (!isOpen) return null;

  return (
    <div className="modal show" id="modalMonthlyReport">
      <div className="sheet" style={{ maxWidth: '36rem' }}>
        <p className="kicker">Privacy-Preserving Audit</p>
        <h2>Monthly Fleet Summary</h2>
        <p>Zero-knowledge aggregated report with local differential privacy. No customer identities or addresses are stored.</p>

        {loading || !report ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Compiling operational telemetry...</div>
        ) : (
          <>
            <div className="grid2">
              <dl className="stat">
                <dt>Campaign Days Active</dt>
                <dd>{report.anonymizedMetrics.totalShiftsRecorded} days</dd>
              </dl>
              <dl className="stat">
                <dt>Total Network Deliveries</dt>
                <dd className="pos">{report.anonymizedMetrics.totalOrdersDispatched.toLocaleString()}</dd>
              </dl>
              <dl className="stat">
                <dt>Cumulative GMV</dt>
                <dd>{formatCurrency(report.anonymizedMetrics.grossMerchandiseVolume, whiteLabel)}</dd>
              </dl>
              <dl className="stat">
                <dt>Platform Net Revenue</dt>
                <dd className="pos">{formatCurrency(report.anonymizedMetrics.netOperatingSurplus, whiteLabel)}</dd>
              </dl>
              <dl className="stat">
                <dt>Delivery Reliability</dt>
                <dd className="pos">{report.anonymizedMetrics.deliveryReliabilityRate}</dd>
              </dl>
              <dl className="stat">
                <dt>Average Customer Rating</dt>
                <dd className="pos">★ {report.anonymizedMetrics.privacyProtectedNps.toFixed(1)} NPS</dd>
              </dl>
            </div>

            <div className="card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem', marginTop: '0.8rem' }}>
              <h4>Fleet Operational Efficiency</h4>
              <p>Differential Privacy Score: <b>{report.privacyStandard}</b></p>
              <p>Protected Market Share: <b>{report.anonymizedMetrics.privacyProtectedMarketShare}%</b></p>
              <p>Eco Offset Rating: <b>{report.anonymizedMetrics.carbonOffsetScore}</b></p>
            </div>

            <div className="note" style={{ marginTop: '0.8rem' }}>
              <b>Privacy Guarantees:</b>
              <ul className="plain" style={{ marginTop: '0.3rem' }}>
                {report.privacyGuarantees.map((g, idx) => (
                  <li key={idx}>{g}</li>
                ))}
              </ul>
            </div>
          </>
        )}

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
