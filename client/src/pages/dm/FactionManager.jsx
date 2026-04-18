import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import TierBadge from '../../components/TierBadge';
import ReputationBar from '../../components/ReputationBar';

/* ── Modals ──────────────────────────────────────────────────────── */

function FactionModal({ faction, onClose, onSaved }) {
  const isEdit = !!faction;
  const [name, setName] = useState(faction?.name || '');
  const [description, setDescription] = useState(faction?.description || '');
  const [color, setColor] = useState(faction?.color || '#4a6fa5');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/factions/${faction.id}`, { name, description, color });
      } else {
        await api.post('/factions', { name, description, color });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Faction' : 'New Faction'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Faction Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="The Merchant Guild" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of this faction…" rows={3} />
            </div>
            <div className="form-group">
              <label>Accent Color</label>
              <div className="flex gap-sm flex-center">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                  style={{ width: '48px', height: '38px', padding: '2px', cursor: 'pointer' }} />
                <input type="text" value={color} onChange={(e) => setColor(e.target.value)}
                  pattern="^#[0-9a-fA-F]{6}$" placeholder="#4a6fa5" style={{ flex: 1 }} />
              </div>
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function PartyScoreModal({ faction, onClose, onSaved }) {
  const [score, setScore] = useState(String(faction.party_score));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post(`/factions/${faction.id}/party-score`, { score: parseInt(score), note });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Set Party Score — {faction.name}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New Party Score (–100 to 100)</label>
              <input type="number" value={score} onChange={(e) => setScore(e.target.value)}
                min={-100} max={100} required />
            </div>
            <div className="form-group">
              <label>Note (logged as event)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Session 4: defended the gate…" />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Set Score'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function CharScoreModal({ faction, characters, onClose, onSaved }) {
  const [charId, setCharId] = useState(characters[0]?.id || '');
  const [delta, setDelta] = useState('0');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!note.trim()) { setError('Note is required'); return; }
    setError('');
    setSaving(true);
    try {
      await api.post(`/factions/${faction.id}/character-score/${charId}`, {
        delta: parseInt(delta), note
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Adjust Character Score — {faction.name}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Character</label>
              <select value={charId} onChange={(e) => setCharId(e.target.value)} required>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.player_name})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Score Adjustment (positive or negative)</label>
              <input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Required Note</label>
              <input value={note} onChange={(e) => setNote(e.target.value)}
                required placeholder="Reason for adjustment…" />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Apply'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function NPCModal({ factionId, npc, onClose, onSaved }) {
  const isEdit = !!npc;
  const [name, setName] = useState(npc?.name || '');
  const [description, setDescription] = useState(npc?.description || '');
  const [notes, setNotes] = useState(npc?.notes || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/npcs/${npc.id}`, { name, description, notes });
      } else {
        await api.post('/npcs', { faction_id: factionId, name, description, notes });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit NPC' : 'New NPC'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>NPC Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Captain Varek" />
            </div>
            <div className="form-group">
              <label>Description (visible to players)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="A grizzled veteran…" rows={2} />
            </div>
            <div className="form-group">
              <label>DM Notes (private)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Secrets, motivations, hooks…" rows={3} />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Expanded faction panel ──────────────────────────────────────── */

function FactionPanel({ faction, characters, onRefresh, onEdit, onDelete }) {
  const [npcs, setNpcs] = useState([]);
  const [npcModal, setNpcModal] = useState(null);
  const [partyModal, setPartyModal] = useState(false);
  const [charModal, setCharModal] = useState(false);

  useEffect(() => {
    api.get(`/factions/${faction.id}`).then(({ data }) => setNpcs(data.npcs || []));
  }, [faction.id]);

  async function deleteNpc(id) {
    if (!confirm('Delete this NPC?')) return;
    await api.delete(`/npcs/${id}`);
    setNpcs((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="card mt-1" style={{ borderTop: `3px solid ${faction.color}` }}>
      <div className="card-header">
        <div className="flex gap-sm flex-center wrap">
          <h3 style={{ fontFamily: 'var(--font-head)' }}>{faction.name}</h3>
          <TierBadge score={faction.party_score} />
        </div>
        <div className="flex gap-sm">
          <button className="btn btn-secondary btn-sm" onClick={() => setPartyModal(true)}>
            Set Party Score
          </button>
          {characters.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={() => setCharModal(true)}>
              Adjust Character
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={onEdit}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={onDelete}>Delete</button>
        </div>
      </div>

      <div className="card-body">
        <div className="grid-2">
          <div>
            <div className="section-title">Party Reputation</div>
            <ReputationBar score={faction.party_score} />
            {faction.description && (
              <p className="text-sm italic text-muted mt-1">{faction.description}</p>
            )}

            {faction.character_scores?.length > 0 && (
              <>
                <div className="section-title mt-2">Character Scores</div>
                {faction.character_scores.map((cs) => (
                  <div key={cs.character_id} className="char-score-row mt-1">
                    <span className="char-score-name">{cs.character_name}</span>
                    <div style={{ flex: 1 }}><ReputationBar score={cs.score} showScore={false} /></div>
                    <TierBadge score={cs.score} />
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: '0.8rem', minWidth: '2.5rem', textAlign: 'right' }}>
                      {cs.score > 0 ? '+' : ''}{cs.score}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>

          <div>
            <div className="flex space-between flex-center mb-1">
              <div className="section-title" style={{ marginBottom: 0 }}>NPCs</div>
              <button className="btn btn-secondary btn-sm" onClick={() => setNpcModal('new')}>
                + Add NPC
              </button>
            </div>
            {npcs.length === 0 ? (
              <p className="text-muted text-sm italic">No NPCs added yet.</p>
            ) : npcs.map((npc) => (
              <div key={npc.id} className="npc-item">
                <div>
                  <div className="npc-name">{npc.name}</div>
                  <div className="npc-description">{npc.description}</div>
                  {npc.notes && (
                    <div className="text-xs text-muted mt-1">
                      <strong>Notes:</strong> {npc.notes}
                    </div>
                  )}
                </div>
                <div className="flex gap-sm">
                  <button className="btn btn-ghost btn-sm" onClick={() => setNpcModal(npc)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteNpc(npc.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {partyModal && (
        <PartyScoreModal faction={faction} onClose={() => setPartyModal(false)} onSaved={onRefresh} />
      )}
      {charModal && characters.length > 0 && (
        <CharScoreModal faction={faction} characters={characters} onClose={() => setCharModal(false)} onSaved={onRefresh} />
      )}
      {npcModal && (
        <NPCModal
          factionId={faction.id}
          npc={npcModal === 'new' ? null : npcModal}
          onClose={() => setNpcModal(null)}
          onSaved={() => {
            api.get(`/factions/${faction.id}`).then(({ data }) => setNpcs(data.npcs || []));
          }}
        />
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */

export default function FactionManager() {
  const [factions, setFactions] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [expanded, setExpanded] = useState(null);

  async function load() {
    const [fRes, cRes] = await Promise.all([
      api.get('/factions'),
      api.get('/characters'),
    ]);
    setFactions(fRes.data);
    setCharacters(cRes.data.filter((c) => c.active));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function deleteFaction(id) {
    if (!confirm('Delete this faction and all its data?')) return;
    await api.delete(`/factions/${id}`);
    if (expanded === id) setExpanded(null);
    load();
  }

  if (loading) return <div className="spinner">Loading…</div>;

  return (
    <div>
      <div className="page-header flex space-between wrap gap-md">
        <div>
          <h1>Faction Management</h1>
          <p>Create and manage factions, scores, and NPCs</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>+ New Faction</button>
      </div>

      {factions.length === 0 ? (
        <div className="empty-state">No factions yet. Create your first one!</div>
      ) : (
        <div>
          {factions.map((f) => (
            <div key={f.id}>
              <div
                className="faction-card"
                style={{ borderLeftColor: f.color, marginBottom: expanded === f.id ? 0 : '1rem', cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === f.id ? null : f.id)}
              >
                <div className="faction-card-header">
                  <div className="flex gap-sm flex-center">
                    <span className="faction-card-name">{f.name}</span>
                    <TierBadge score={f.party_score} />
                    <span className="text-muted text-xs">
                      Party: {f.party_score > 0 ? '+' : ''}{f.party_score}
                    </span>
                  </div>
                  <span className="text-muted text-sm">
                    {expanded === f.id ? '▲ collapse' : '▼ expand'}
                  </span>
                </div>
              </div>

              {expanded === f.id && (
                <FactionPanel
                  faction={f}
                  characters={characters}
                  onRefresh={load}
                  onEdit={() => setModal(f)}
                  onDelete={() => deleteFaction(f.id)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <FactionModal
          faction={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
