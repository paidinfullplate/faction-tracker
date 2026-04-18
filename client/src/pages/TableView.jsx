import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import TierBadge from '../components/TierBadge';
import ReputationBar from '../components/ReputationBar';

export default function TableView() {
  const { token } = useParams();
  const [factions, setFactions] = useState([]);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  async function load() {
    try {
      const { data } = await axios.get(`/api/factions/public/${token}`);
      setFactions(data);
      setLastRefresh(new Date());
      setError('');
    } catch {
      setError('Invalid or expired table view link.');
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [token]);

  if (error) {
    return (
      <div className="table-view" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2 style={{ color: '#c0392b', fontFamily: 'var(--font-head)' }}>{error}</h2>
      </div>
    );
  }

  return (
    <div className="table-view">
      <div className="table-view-header">
        <h1>Faction Standing</h1>
        <p className="text-muted text-sm">
          Auto-refreshes every 60 seconds · Last updated {lastRefresh.toLocaleTimeString()}
        </p>
      </div>

      <div className="grid-auto">
        {factions.map((f) => (
          <div
            key={f.id}
            className="faction-card"
            style={{ borderLeftColor: f.color }}
          >
            <div className="faction-card-header">
              <span className="faction-card-name">{f.name}</span>
              <TierBadge score={f.party_score} />
            </div>
            <div className="faction-card-body">
              {f.description && (
                <p className="text-sm italic text-muted mb-1">{f.description}</p>
              )}
              <ReputationBar score={f.party_score} />
            </div>
          </div>
        ))}
      </div>

      {factions.length === 0 && (
        <div className="empty-state">No factions have been added yet.</div>
      )}
    </div>
  );
}
