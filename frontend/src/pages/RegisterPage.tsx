import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'DEMANDEUR',
    securityQuestion: '',
    securityAnswer: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form);
      navigate('/'); // Redirection selon rôle gérée dans HomePage
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">Inscription</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="text-red-600 text-center">{error}</div>}
        
        <div>
          <label htmlFor="fullName" className="block mb-2 font-semibold text-gray-700">Nom complet</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div>
          <label htmlFor="email" className="block mb-2 font-semibold text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div>
          <label htmlFor="password" className="block mb-2 font-semibold text-gray-700">Mot de passe</label>
          <input
            type="password"
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div>
          <label htmlFor="role" className="block mb-2 font-semibold text-gray-700">Rôle</label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
            disabled={loading}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="DEMANDEUR">Demandeur</option>
            <option value="AGENT">Agent</option>
            <option value="SUPERVISEUR">Superviseur</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div>
          <label htmlFor="securityQuestion" className="block mb-2 font-semibold text-gray-700">Question de sécurité</label>
          <input
            type="text"
            id="securityQuestion"
            name="securityQuestion"
            value={form.securityQuestion}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="Ex: Nom de votre premier animal ?"
          />
        </div>

        <div>
          <label htmlFor="securityAnswer" className="block mb-2 font-semibold text-gray-700">Réponse de sécurité</label>
          <input
            type="text"
            id="securityAnswer"
            name="securityAnswer"
            value={form.securityAnswer}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-md font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Inscription en cours...' : 'S\'inscrire'}
        </button>
      </form>
      <p className="mt-6 text-center">
        Déjà un compte ?{' '}
        <Link to="/login" className="text-green-600 underline hover:text-green-700">
          Connectez-vous
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
