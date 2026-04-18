import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { formatDate, formatDelta } from '../../utils/tiers';

export default function EventLog() {
  const [events, setEvents] = useState([]);
  const [factions, setFactions] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterFaction, setFilterFaction] = useState('');
  const [filterChar, setFilterChar] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  async function load() {
    const params = {};
    if (filterFaction) params.faction_id = filterFaction;
    if (filterChar) params.character_id = filterChar;
    if (filterStatus) params.status = filterStatus;

    const [eRes, fRes, cRes] = await Promise.all([
      api.get('/events', { params: { ...params, limit: 200 } }),
      api.get('/factions'),
      api.get('/characters'),
    ]);
    setEvents(eRes.data);
    setFactions(fRes.data);
    setCharacters(cRes.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterFaction, filterChar, filterStatus]);

  if (loading) return <div className="spinner">Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Event Log</h1>
        <p>Full history of all reputation events across the campaign</p>
      </div>

      <div className="filters-bar">
        <div className="form-group">
          <label>Faction</label>
          <select value={filterFaction} onChange={(e) => setFilterFaction(e.target.value)}>
            <option value="">All Factions</option>
            {factions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Character</label>
          <select value={filterChar} onChange={(e) => setFilterChar(e.target.value)}>
            <option value="">All Characters</option>
            {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Faction</th>
              <th>Character</th>
              <th>Delta</th>
              <th>Description</th>
              <th>Session</th>
              <th>Status</th>
              <th>DM Note</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr><td colSpan={8} className="empty-state">No events found.</td></tr>
            ) : events.map((e) => {
              const d = e.score_delta;
              return (
                <tr key={e.id}>
                  <td className="text-xs text-muted">{new Date(e.created_at).toLocaleDateString()}</td>
                  <td style={{ fontFamily: 'var(--font-head)', fontSize: '0.85rem' }}>{e.faction_name}</td>
                  <td className="text-sm">{e.character_name || <span className="text-muted italic">Party</span>}</td>
                  <td>
                    <span className={d > 0 ? 'delta-positive' : d < 0 ? 'delta-negative' : 'delta-zero'}>
                      {formatDelta(d)}
                    </span>
                  </td>
                  <td className="text-sm" style={{ maxWidth: '280px' }}>{e.description}</td>
                  <td className="text-sm text-muted">{e.session_number || '—'}</td>
                  <td><span className={`status-badge status-${e.status}`}>{e.status}</span></td>
                  <td className="text-sm text-muted italic">{e.dm_note || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
