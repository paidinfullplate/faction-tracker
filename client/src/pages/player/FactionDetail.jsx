import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import TierBadge from '../../components/TierBadge';
import ReputationBar from '../../components/ReputationBar';
import { formatDelta } from '../../utils/tiers';

export default function FactionDetail() {
  const { id } = useParams();
  const { auth } = useAuth();
  const [faction, setFaction] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [charScore, setCharScore] = useState(null);

  useEffect(() => {
    async function load() {
      const [fRes, scoresRes, eventsRes] = await Promise.all([
        api.get(`/factions/${id}`),
        api.get('/factions'),
        api.get('/events', { params: { faction_id: id, limit: 50 } }),
      ]);
      setFaction(fRes.data);
      const me = scoresRes.data.find((f) => f.id === parseInt(id));
      setCharScore(me?.character_score ?? 0);
      setEvents(eventsRes.data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="spinner">Loading…</div>;
  if (!faction) return <div className="empty-state">Faction not found.</div>;

  return (
    <div>
      <div className="page-header flex space-between wrap gap-md">
        <div>
          <h1 style={{ borderLeft: `5px solid ${faction.color}`, paddingLeft: '0.75rem' }}>
            {faction.name}
          </h1>
          {faction.description && (
            <p className="italic text-muted mt-1">{faction.description}</p>
          )}
        </div>
        <Link to="/player/submit" className="btn btn-primary btn-sm">
          Submit Event
        </Link>
      </div>

      <div className="score-pair mb-2" style={{ maxWidth: '560px' }}>
        <div className="score-block">
          <div className="score-block-label">My Reputation</div>
          <TierBadge score={charScore} />
          <ReputationBar score={charScore} />
        </div>
        <div className="score-block">
          <div className="score-block-label">Party Reputation</div>
          <TierBadge score={faction.party_score} />
          <ReputationBar score={faction.party_score} />
        </div>
      </div>

      {faction.npcs?.length > 0 && (
        <div className="section mb-2">
          <div className="section-title">Known NPCs</div>
          <div className="card">
            <div className="card-body">
              {faction.npcs.map((npc) => (
                <div key={npc.id} className="npc-item">
                  <div>
                    <div className="npc-name">{npc.name}</div>
                    <div className="npc-description">{npc.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-title">My Score History with {faction.name}</div>
        {events.length === 0 ? (
          <div className="empty-state">No events recorded yet.</div>
        ) : (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Delta</th>
                  <th>Session</th>
                  <th>Status</th>
                  <th>DM Note</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => {
                  const d = e.score_delta;
                  return (
                    <tr key={e.id}>
                      <td className="text-xs text-muted">{new Date(e.created_at).toLocaleDateString()}</td>
                      <td className="text-sm" style={{ maxWidth: '260px' }}>{e.description}</td>
                      <td>
                        <span className={d > 0 ? 'delta-positive' : d < 0 ? 'delta-negative' : 'delta-zero'}>
                          {formatDelta(d)}
                        </span>
                      </td>
                      <td className="text-sm text-muted">{e.session_number || '—'}</td>
                      <td><span className={`status-badge status-${e.status}`}>{e.status}</span></td>
                      <td className="text-sm text-muted italic">{e.dm_note || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-2">
        <Link to="/player" className="btn btn-ghost btn-sm">← Back to My Reputation</Link>
      </div>
    </div>
  );
}
