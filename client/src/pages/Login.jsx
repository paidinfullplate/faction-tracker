import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Login() {
  const [tab, setTab] = useState('player');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [characters, setCharacters] = useState([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/auth/characters').then(({ data }) => {
      setCharacters(data);
      if (data.length > 0) setName(data[0].name);
    }).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = tab === 'dm'
        ? { type: 'dm', password }
        : { type: 'player', name, password };
      const { data } = await api.post('/auth/login', payload);
      login(data);
      navigate(data.role === 'dm' ? '/dm' : '/player');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-box-header">
          <h1>Faction & Reputation</h1>
          <p>Track your standing across the realm</p>
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab ${tab === 'player' ? 'active' : ''}`}
            onClick={() => { setTab('player'); setError(''); }}
            type="button"
          >
            Player
          </button>
          <button
            className={`login-tab ${tab === 'dm' ? 'active' : ''}`}
            onClick={() => { setTab('dm'); setError(''); }}
            type="button"
          >
            Dungeon Master
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {tab === 'player' && (
            <div className="form-group">
              <label>Character</label>
              <select
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              >
                {characters.length === 0 && <option value="">No active characters</option>}
                {characters.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="btn btn-primary w-full" type="submit" disabled={loading}
            style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
            {loading ? 'Signing in…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
