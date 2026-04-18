import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('faction_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Basic JWT expiry check
        const payload = JSON.parse(atob(parsed.token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setAuth(parsed);
        } else {
          localStorage.removeItem('faction_auth');
        }
      } catch {
        localStorage.removeItem('faction_auth');
      }
    }
    setLoading(false);
  }, []);

  function login(data) {
    localStorage.setItem('faction_auth', JSON.stringify(data));
    setAuth(data);
  }

  function logout() {
    localStorage.removeItem('faction_auth');
    setAuth(null);
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
