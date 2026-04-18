import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { formatDelta, formatDate } from '../../utils/tiers';

export default function MyHistory() {
  const [events, setEvents] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = { limit: 100 };
    if (filterStatus) params.status = filterStatus;
    api.get('/events', { params }).then(({ data }) => {
      setEvents(data);
      setLoading(false);
    });
  }, [filterStatus]);

  if (loading) return <div className="spinner">Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <h1>My Event History</h1>
        <p>Reputation events you have submitted</p>
      </div>

      <div className="filters-bar">
        <div className="form-group">
          <label>Filter by Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Submitted</th>
              <th>Faction</th>
              <th>Description</th>
              <th>Delta</th>
              <th>Session</th>
              <th>Status</th>
              <th>DM Note</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr><td colSpan={7} className="empty-state">No events found.</td></tr>
            ) : events.map((e) => {
              const d = e.score_delta;
              return (
                <tr key={e.id}>
                  <td className="text-xs text-muted">{new Date(e.created_at).toLocaleDateString()}</td>
                  <td style={{ fontFamily: 'var(--font-head)', fontSize: '0.85rem' }}>{e.faction_name}</td>
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
    </div>
  );
}
