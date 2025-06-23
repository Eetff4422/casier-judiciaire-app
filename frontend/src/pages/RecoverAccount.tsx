// frontend/src/pages/RecoverAccount.tsx
import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RecoverAccount: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_URL}/auth/recover`, {
        email,
        securityAnswer,
        newPassword,
      });

      setSuccess(response.data.message || 'Mot de passe réinitialisé.');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la récupération');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-semibold text-center mb-6">Récupération de compte</h2>
      <form onSubmit={handleRecover} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Adresse email</label>
          <input
            type="email"
            className="w-full mt-1 p-2 border rounded"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Réponse à la question de sécurité</label>
          <input
            type="text"
            className="w-full mt-1 p-2 border rounded"
            value={securityAnswer}
            onChange={e => setSecurityAnswer(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Nouveau mot de passe</label>
          <input
            type="password"
            className="w-full mt-1 p-2 border rounded"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          Réinitialiser le mot de passe
        </button>
      </form>
    </div>
  );
};

export default RecoverAccount;
