import React, { useEffect, useState } from 'react';
import api from '../../api/client';

function CharacterModal({ character, onClose, onSaved }) {
  const isEdit = !!character;
  const [name, setName] = useState(character?.name || '');
  const [playerName, setPlayerName] = useState(character?.player_name || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = { name, player_name: playerName };
      if (password) body.password = password;
      if (isEdit) {
        await api.put(`/characters/${character.id}`, body);
      } else {
        if (!password) { setError('Password required for new characters'); setSaving(false); return; }
        await api.post('/characters', { ...body, password });
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
          <h3>{isEdit ? 'Edit Character' : 'New Character'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Character Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Aldric" />
            </div>
            <div className="form-group">
              <label>Player Name</label>
              <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} required placeholder="Alex" />
            </div>
            <div className="form-group">
              <label>{isEdit ? 'New Password (leave blank to keep)' : 'Password'}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? '••••••••' : 'Required'}
                required={!isEdit}
              />
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

export default function CharacterManager() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | character object

  async function load() {
    const { data } = await api.get('/characters');
    setCharacters(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(char) {
    const endpoint = char.active ? 'deactivate' : 'activate';
    await api.patch(`/characters/${char.id}/${endpoint}`);
    load();
  }

  if (loading) return <div className="spinner">Loading…</div>;

  return (
    <div>
      <div className="page-header flex space-between wrap gap-md">
        <div>
          <h1>Characters</h1>
          <p>Manage player character accounts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>+ New Character</button>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Character</th>
              <th>Player</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {characters.length === 0 ? (
              <tr><td colSpan={5} className="empty-state">No characters yet.</td></tr>
            ) : characters.map((c) => (
              <tr key={c.id} style={{ opacity: c.active ? 1 : 0.55 }}>
                <td style={{ fontFamily: 'var(--font-head)' }}>{c.name}</td>
                <td>{c.player_name}</td>
                <td>
                  <span className={`status-badge ${c.active ? 'status-approved' : 'status-rejected'}`}>
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="text-sm text-muted">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
                <td>
                  <div className="flex gap-sm">
                    <button className="btn btn-secondary btn-sm" onClick={() => setModal(c)}>Edit</button>
                    <button
                      className={`btn btn-sm ${c.active ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => toggleActive(c)}
                    >
                      {c.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <CharacterModal
          character={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
