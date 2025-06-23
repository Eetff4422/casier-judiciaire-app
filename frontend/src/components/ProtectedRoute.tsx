import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

// Fonction de redirection personnalisée selon le rôle
const getRedirectPath = (role: string): string => {
  switch (role) {
    case 'DEMANDEUR':
      return '/dashboard';
    case 'AGENT':
      return '/agent';
    case 'SUPERVISEUR':
      return '/superviseur';
    case 'ADMIN':
      return '/admin';
    default:
      return '/';
  }
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="text-center mt-8 text-gray-500">Chargement en cours...</div>;
  }

  // Non authentifié → vers /login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Authentifié mais rôle non autorisé → vers son dashboard
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getRedirectPath(user.role)} replace />;
  }

  // Accès autorisé
  return <>{children}</>;
};

export default ProtectedRoute;
