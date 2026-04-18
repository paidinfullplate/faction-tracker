import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import TierBadge from '../../components/TierBadge';
import ReputationBar from '../../components/ReputationBar';

export default function MyReputation() {
  const { auth } = useAuth();
  const [factions, setFactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/factions').then(({ data }) => {
      setFactions(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="spinner">Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <h1>My Reputation</h1>
        <p>Standing with all known factions — {auth.characterName}</p>
      </div>

      {factions.length === 0 ? (
        <div className="empty-state">No factions have been added to the campaign yet.</div>
      ) : (
        <div className="grid-auto">
          {factions.map((f) => (
            <Link
              key={f.id}
              to={`/player/faction/${f.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="faction-card" style={{ borderLeftColor: f.color }}>
                <div className="faction-card-header">
                  <span className="faction-card-name">{f.name}</span>
                </div>
                <div className="faction-card-body">
                  <div className="score-pair">
                    <div className="score-block">
                      <div className="score-block-label">My Score</div>
                      <TierBadge score={f.character_score} />
                      <ReputationBar score={f.character_score} />
                    </div>
                    <div className="score-block">
                      <div className="score-block-label">Party Score</div>
                      <TierBadge score={f.party_score} />
                      <ReputationBar score={f.party_score} />
                    </div>
                  </div>
                  <p className="text-xs text-muted mt-1" style={{ textAlign: 'right' }}>
                    Tap to view details →
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
