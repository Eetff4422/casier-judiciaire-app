import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-green-700' : '';
  };

  // Si non authentifié ou user null
  if (!isAuthenticated || !user) return null;

  const getDashboardLink = () => {
    switch (user.role) {
      case 'DEMANDEUR':
        return '/dashboard';
      case 'AGENT':
      case 'SUPERVISEUR':
      case 'ADMIN':
        return '/agent';
      default:
        return '/';
    }
  };

  return (
    <nav className="bg-green-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">CJ</span>
            </div>
            <span className="text-xl font-bold">Casier Judiciaire</span>
          </Link>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to={getDashboardLink()}
              className={`px-3 py-2 rounded-md hover:bg-green-700 transition-colors ${isActive(getDashboardLink())}`}
            >
              {user.role === 'DEMANDEUR' ? 'Mes demandes' : 'Dashboard'}
            </Link>

            {user.role === 'DEMANDEUR' && (
              <Link
                to="/demande"
                className={`px-3 py-2 rounded-md hover:bg-green-700 transition-colors ${isActive('/demande')}`}
              >
                Nouvelle demande
              </Link>
            )}

            {['AGENT', 'SUPERVISEUR', 'DEMANDEUR'].includes(user.role) && (
              <Link
                to="/messagerie"
                className={`px-3 py-2 rounded-md hover:bg-green-700 transition-colors ${isActive('/messagerie')}`}
              >
                Messagerie
              </Link>
            )}

            <Link
              to="/aide"
              className={`px-3 py-2 rounded-md hover:bg-green-700 transition-colors ${isActive('/aide')}`}
            >
              Aide
            </Link>

            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="block font-medium">{user.fullName}</span>
                <span className="text-green-200 capitalize">{user.role.toLowerCase()}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>

          {/* Bouton menu mobile */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Menu Mobile */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-green-500">
            <div className="space-y-2">
              <div className="px-3 py-2 border-b border-green-500 mb-2">
                <div className="font-medium">{user.fullName}</div>
                <div className="text-green-200 text-sm capitalize">{user.role.toLowerCase()}</div>
              </div>
              <Link to={getDashboardLink()} className="block px-3 py-2 rounded-md hover:bg-green-700">
                {user.role === 'DEMANDEUR' ? 'Mes demandes' : 'Dashboard'}
              </Link>
              {user.role === 'DEMANDEUR' && (
                <Link to="/demande" className="block px-3 py-2 rounded-md hover:bg-green-700">Nouvelle demande</Link>
              )}
              {user.role !== 'DEMANDEUR' && (
                <Link to="/messagerie" className="block px-3 py-2 rounded-md hover:bg-green-700">Messagerie</Link>
              )}
              <Link to="/aide" className="block px-3 py-2 rounded-md hover:bg-green-700">Aide</Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 bg-red-600 rounded-md hover:bg-red-700 mt-2"
              >
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
