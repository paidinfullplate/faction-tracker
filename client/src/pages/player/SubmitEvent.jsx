import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

export default function SubmitEvent() {
  const navigate = useNavigate();
  const [factions, setFactions] = useState([]);
  const [factionId, setFactionId] = useState('');
  const [description, setDescription] = useState('');
  const [delta, setDelta] = useState('5');
  const [sessionNumber, setSessionNumber] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/factions').then(({ data }) => {
      setFactions(data);
      if (data.length > 0) setFactionId(String(data[0].id));
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!description.trim()) { setError('Description is required'); return; }
    if (!factionId) { setError('Please select a faction'); return; }

    setSaving(true);
    try {
      await api.post('/events', {
        faction_id: parseInt(factionId),
        score_delta: parseInt(delta),
        description: description.trim(),
        session_number: sessionNumber ? parseInt(sessionNumber) : null,
        event_date: eventDate || null,
      });
      setSuccess('Event submitted! Your DM will review it soon.');
      setDescription('');
      setDelta('5');
      setSessionNumber('');
      setEventDate('');
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Submit Reputation Event</h1>
        <p>Propose a reputation change for your DM to review</p>
      </div>

      <div className="card" style={{ maxWidth: '560px' }}>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Faction</label>
              <select value={factionId} onChange={(e) => setFactionId(e.target.value)} required>
                {factions.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>What happened?</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                placeholder="Describe the interaction or event that should affect your reputation…"
              />
            </div>

            <div className="form-group">
              <label>Proposed Score Change</label>
              <input
                type="number"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                required
                min={-100}
                max={100}
              />
              <small className="text-muted text-xs">
                Positive = reputation gain, negative = reputation loss. Your DM may adjust this.
              </small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Session Number (optional)</label>
                <input
                  type="number"
                  value={sessionNumber}
                  onChange={(e) => setSessionNumber(e.target.value)}
                  placeholder="4"
                  min={1}
                />
              </div>
              <div className="form-group">
                <label>Event Date (optional)</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="form-error">{error}</p>}
            {success && (
              <p style={{ color: 'var(--tier-friendly)', fontStyle: 'italic', margin: '0.5rem 0' }}>
                {success}
              </p>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/player')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Submitting…' : 'Submit for Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
