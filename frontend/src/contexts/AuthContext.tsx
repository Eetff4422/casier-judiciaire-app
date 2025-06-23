// frontend/src/contexts/AuthContext.tsx
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';


interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'DEMANDEUR' | 'AGENT' | 'SUPERVISEUR' | 'ADMIN';
  statut: 'ACTIF' | 'SUSPENDU';
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role: string;
  securityQuestion: string;
  securityAnswer: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchUserProfile(savedToken);
    } else {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
  const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

  let inactivityTimer: NodeJS.Timeout;

  const resetTimer = () => {
    clearTimeout(inactivityTimer);
    if (token) {
      inactivityTimer = setTimeout(() => {
        alert('Vous avez été déconnecté pour cause d’inactivité.');
        logout();
      }, INACTIVITY_LIMIT);
    }
  };

  const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];
  events.forEach((event) => window.addEventListener(event, resetTimer));

  resetTimer();

  return () => {
    clearTimeout(inactivityTimer);
    events.forEach((event) => window.removeEventListener(event, resetTimer));
  };
}, [token]);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (err) {
      console.error('Erreur de profil :', err);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
  setLoading(true);
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur de connexion');

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('token', data.token);
    return data.user;
  } finally {
    setLoading(false);
  }
};


  const register = async (userData: RegisterData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'inscription");

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
    }finally{
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const value = useMemo(() => ({
  user,
  token,
  login,
  register,
  logout,
  loading,
  isAuthenticated: !!user
}), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
