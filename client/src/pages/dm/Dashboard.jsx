import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import TierBadge from '../../components/TierBadge';
import ReputationBar from '../../components/ReputationBar';

export default function DMDashboard() {
  const [factions, setFactions] = useState([]);
  const [campaignToken, setCampaignToken] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [fRes, tRes, pRes] = await Promise.all([
        api.get('/factions'),
        api.get('/auth/campaign-token'),
        api.get('/events/pending-count'),
      ]);
      setFactions(fRes.data);
      setCampaignToken(tRes.data.token);
      setPendingCount(pRes.data.count);
      setLoading(false);
    }
    load();
  }, []);

  const tableUrl = campaignToken
    ? `${window.location.origin}/view/${campaignToken}`
    : '';

  if (loading) return <div className="spinner">Loading…</div>;

  return (
    <div>
      <div className="page-header flex space-between wrap gap-md">
        <div>
          <h1>Campaign Dashboard</h1>
          <p>Overview of all faction standings</p>
        </div>
        <div className="flex gap-sm wrap" style={{ alignItems: 'flex-end' }}>
          {pendingCount > 0 && (
            <Link to="/dm/pending" className="btn btn-danger btn-sm">
              ⚠ {pendingCount} Pending
            </Link>
          )}
          <Link to="/dm/factions" className="btn btn-secondary btn-sm">Manage Factions</Link>
        </div>
      </div>

      {tableUrl && (
        <div className="card mb-2" style={{ borderLeft: '4px solid var(--gold)' }}>
          <div className="card-body" style={{ padding: '0.85rem 1.2rem' }}>
            <p className="text-xs text-muted" style={{ marginBottom: '0.2rem', fontFamily: 'var(--font-head)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Table View URL (share this for read-only display)
            </p>
            <code style={{ fontSize: '0.82rem', color: 'var(--gold-dark)', wordBreak: 'break-all' }}>
              {tableUrl}
            </code>
          </div>
        </div>
      )}

      {factions.length === 0 ? (
        <div className="empty-state">
          No factions yet. <Link to="/dm/factions">Add your first faction →</Link>
        </div>
      ) : (
        <div className="grid-auto">
          {factions.map((f) => (
            <div key={f.id} className="faction-card" style={{ borderLeftColor: f.color }}>
              <div className="faction-card-header">
                <span className="faction-card-name">{f.name}</span>
                <TierBadge score={f.party_score} />
              </div>
              <div className="faction-card-body">
                <div className="section-title" style={{ marginBottom: '0.4rem' }}>Party Score</div>
                <ReputationBar score={f.party_score} />

                {f.character_scores?.length > 0 && (
                  <>
                    <div className="section-title" style={{ marginTop: '0.75rem', marginBottom: '0.4rem' }}>
                      Characters
                    </div>
                    {f.character_scores.map((cs) => (
                      <div key={cs.character_id} className="char-score-row">
                        <span className="char-score-name">{cs.character_name}</span>
                        <div style={{ flex: 1 }}>
                          <ReputationBar score={cs.score} showScore={false} />
                        </div>
                        <TierBadge score={cs.score} />
                        <span style={{
                          fontFamily: 'var(--font-head)',
                          fontSize: '0.8rem',
                          minWidth: '2.5rem',
                          textAlign: 'right',
                        }}>
                          {cs.score > 0 ? '+' : ''}{cs.score}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
