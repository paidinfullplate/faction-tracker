import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import TableView from './pages/TableView';
import NavBar from './components/NavBar';

// DM pages
import DMDashboard from './pages/dm/Dashboard';
import FactionManager from './pages/dm/FactionManager';
import CharacterManager from './pages/dm/CharacterManager';
import PendingQueue from './pages/dm/PendingQueue';
import EventLog from './pages/dm/EventLog';

// Player pages
import MyReputation from './pages/player/MyReputation';
import SubmitEvent from './pages/player/SubmitEvent';
import MyHistory from './pages/player/MyHistory';
import FactionDetail from './pages/player/FactionDetail';

function ProtectedRoute({ children, role }) {
  const { auth, loading } = useAuth();
  if (loading) return <div className="spinner">Loading…</div>;
  if (!auth) return <Navigate to="/login" replace />;
  if (role && auth.role !== role) {
    return <Navigate to={auth.role === 'dm' ? '/dm' : '/player'} replace />;
  }
  return children;
}

export default function App() {
  const { auth, loading } = useAuth();

  if (loading) return <div className="spinner">Loading…</div>;

  return (
    <div className="app-shell">
      <Routes>
        {/* Public */}
        <Route path="/login" element={
          auth ? <Navigate to={auth.role === 'dm' ? '/dm' : '/player'} replace /> : <Login />
        } />
        <Route path="/view/:token" element={<TableView />} />

        {/* DM routes */}
        <Route path="/dm" element={
          <ProtectedRoute role="dm">
            <NavBar /><div className="main-content"><DMDashboard /></div>
          </ProtectedRoute>
        } />
        <Route path="/dm/factions" element={
          <ProtectedRoute role="dm">
            <NavBar /><div className="main-content"><FactionManager /></div>
          </ProtectedRoute>
        } />
        <Route path="/dm/characters" element={
          <ProtectedRoute role="dm">
            <NavBar /><div className="main-content"><CharacterManager /></div>
          </ProtectedRoute>
        } />
        <Route path="/dm/pending" element={
          <ProtectedRoute role="dm">
            <NavBar /><div className="main-content"><PendingQueue /></div>
          </ProtectedRoute>
        } />
        <Route path="/dm/events" element={
          <ProtectedRoute role="dm">
            <NavBar /><div className="main-content"><EventLog /></div>
          </ProtectedRoute>
        } />

        {/* Player routes */}
        <Route path="/player" element={
          <ProtectedRoute role="player">
            <NavBar /><div className="main-content"><MyReputation /></div>
          </ProtectedRoute>
        } />
        <Route path="/player/submit" element={
          <ProtectedRoute role="player">
            <NavBar /><div className="main-content"><SubmitEvent /></div>
          </ProtectedRoute>
        } />
        <Route path="/player/history" element={
          <ProtectedRoute role="player">
            <NavBar /><div className="main-content"><MyHistory /></div>
          </ProtectedRoute>
        } />
        <Route path="/player/faction/:id" element={
          <ProtectedRoute role="player">
            <NavBar /><div className="main-content"><FactionDetail /></div>
          </ProtectedRoute>
        } />

        {/* Default redirect */}
        <Route path="/" element={
          auth
            ? <Navigate to={auth.role === 'dm' ? '/dm' : '/player'} replace />
            : <Navigate to="/login" replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
