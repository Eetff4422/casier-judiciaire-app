import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      if (loggedUser.statut === 'SUSPENDU') {
        setError('Votre compte est suspendu. Contactez un administrateur.');
        setLoading(false);
        return;
      }
      navigate(getRedirectPath(loggedUser.role));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">Connexion</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="text-red-600 text-center">{error}</div>}
        <div>
          <label htmlFor="email" className="block mb-2 font-semibold text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="password" className="block mb-2 font-semibold text-gray-700">Mot de passe</label>
          <input
            type="password"
            id="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-md font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
        <p className="text-sm text-center mt-4">
          <Link to="/recover" className="text-blue-600 hover:underline">
            Mot de passe oublié ?
          </Link>
        </p>
      </form>
      <p className="mt-6 text-center">
        Pas encore de compte ?{' '}
        <Link to="/register" className="text-green-600 underline hover:text-green-700">
          Inscrivez-vous
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
