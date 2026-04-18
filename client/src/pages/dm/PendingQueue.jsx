import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { formatDate, formatDelta } from '../../utils/tiers';

function PendingCard({ event, onApprove, onReject }) {
  const [overrideDelta, setOverrideDelta] = useState(String(event.score_delta));
  const [dmNote, setDmNote] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [busy, setBusy] = useState(false);

  async function approve() {
    setBusy(true);
    try {
      await onApprove(event.id, parseInt(overrideDelta), dmNote);
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    setBusy(true);
    try {
      await onReject(event.id, rejectNote);
    } finally {
      setBusy(false);
    }
  }

  const delta = parseInt(overrideDelta) || 0;

  return (
    <div className="pending-event-card">
      <div className="pending-event-header">
        <div className="flex gap-sm wrap flex-center">
          <span style={{ fontFamily: 'var(--font-head)', fontSize: '0.9rem' }}>
            {event.faction_name}
          </span>
          {event.character_name && (
            <span className="text-muted text-sm">· {event.character_name}</span>
          )}
          {event.session_number && (
            <span className="text-xs text-muted">Session {event.session_number}</span>
          )}
          {event.event_date && (
            <span className="text-xs text-muted">{formatDate(event.event_date)}</span>
          )}
        </div>
        <span className="text-xs text-muted">
          {new Date(event.created_at).toLocaleString()}
        </span>
      </div>

      <div className="pending-event-body">
        <p style={{ marginBottom: '0.75rem' }}>{event.description}</p>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Score Delta (adjust if needed)</label>
            <input
              type="number"
              value={overrideDelta}
              onChange={(e) => setOverrideDelta(e.target.value)}
              style={{ fontFamily: 'var(--font-head)', fontWeight: 600,
                color: delta > 0 ? 'var(--tier-friendly)' : delta < 0 ? 'var(--tier-hostile)' : 'inherit' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>DM Note (optional)</label>
            <input
              type="text"
              value={dmNote}
              onChange={(e) => setDmNote(e.target.value)}
              placeholder="Great roleplay!"
            />
          </div>
        </div>

        {showReject && (
          <div className="form-group mt-1">
            <label>Rejection Reason</label>
            <input
              type="text"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="This didn't happen in session…"
              autoFocus
            />
          </div>
        )}
      </div>

      <div className="pending-event-actions">
        <button className="btn btn-success btn-sm" onClick={approve} disabled={busy}>
          ✓ Approve {delta !== 0 && `(${formatDelta(delta)})`}
        </button>
        {!showReject ? (
          <button className="btn btn-danger btn-sm" onClick={() => setShowReject(true)} disabled={busy}>
            ✕ Reject
          </button>
        ) : (
          <>
            <button className="btn btn-danger btn-sm" onClick={reject} disabled={busy}>
              Confirm Rejection
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowReject(false)}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PendingQueue() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await api.get('/events', { params: { status: 'pending', limit: 50 } });
    setEvents(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(id, score_delta, dm_note) {
    await api.post(`/events/${id}/approve`, { score_delta, dm_note });
    load();
  }

  async function handleReject(id, dm_note) {
    await api.post(`/events/${id}/reject`, { dm_note });
    load();
  }

  if (loading) return <div className="spinner">Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Pending Events</h1>
        <p>Review and adjudicate player-submitted reputation changes</p>
      </div>

      {events.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '3rem' }}>
          No pending events — all caught up!
        </div>
      ) : (
        <>
          <p className="text-muted text-sm mb-2">{events.length} event{events.length !== 1 ? 's' : ''} awaiting review</p>
          {events.map((e) => (
            <PendingCard
              key={e.id}
              event={e}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </>
      )}
    </div>
  );
}
