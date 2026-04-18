import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function NavBar() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (auth?.role !== 'dm') return;
    let cancelled = false;

    async function fetchCount() {
      try {
        const { data } = await api.get('/events/pending-count');
        if (!cancelled) setPendingCount(data.count);
      } catch {
        // ignore
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [auth]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <span className="navbar-brand">⚔ Faction Tracker</span>

      <div className="navbar-links">
        {auth?.role === 'dm' && (
          <>
            <NavLink to="/dm" end>Dashboard</NavLink>
            <NavLink to="/dm/factions">Factions</NavLink>
            <NavLink to="/dm/characters">Characters</NavLink>
            <NavLink to="/dm/pending">
              Pending
              {pendingCount > 0 && (
                <span className="pending-badge">{pendingCount}</span>
              )}
            </NavLink>
            <NavLink to="/dm/events">Event Log</NavLink>
          </>
        )}

        {auth?.role === 'player' && (
          <>
            <NavLink to="/player" end>My Reputation</NavLink>
            <NavLink to="/player/submit">Submit Event</NavLink>
            <NavLink to="/player/history">My History</NavLink>
          </>
        )}
      </div>

      <div className="navbar-right">
        {auth?.role === 'player' && (
          <span className="navbar-user">{auth.characterName}</span>
        )}
        {auth?.role === 'dm' && (
          <span className="navbar-user">Dungeon Master</span>
        )}
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
