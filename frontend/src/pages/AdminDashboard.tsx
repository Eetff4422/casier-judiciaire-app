import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'DEMANDEUR' | 'AGENT' | 'SUPERVISEUR' | 'ADMIN';
  statut: 'ACTIF' | 'SUSPENDU';
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const [usersGrouped, setUsersGrouped] = useState<Record<string, User[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN') return;
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsersGrouped(data);
    } catch (err) {
      setError("Erreur lors du chargement des utilisateurs.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await fetch(`${API_URL}/admin/users/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      fetchUsers();
    } catch (err) {
      alert("Échec du changement de statut.");
    }
  };

  const handleChangeRole = async (id: string, newRole: string) => {
    try {
      await fetch(`${API_URL}/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newRole }),
      });
      fetchUsers();
    } catch (err) {
      alert("Échec de la modification du rôle.");
    }
  };

  const roles: User['role'][] = ['DEMANDEUR', 'AGENT', 'SUPERVISEUR', 'ADMIN'];

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-green-700">Tableau de bord Administrateur</h1>

      {loading && <p className="text-center text-gray-500">Chargement des utilisateurs...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {!loading && roles.map((role) => (
        <div key={role} className="mb-8">
          <h2 className="text-xl font-semibold mb-2">{role}s</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded shadow-md">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="border px-3 py-2">Nom</th>
                  <th className="border px-3 py-2">Email</th>
                  <th className="border px-3 py-2">Statut</th>
                  <th className="border px-3 py-2">Rôle</th>
                  <th className="border px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(usersGrouped[role] || []).map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">{u.fullName}</td>
                    <td className="border px-3 py-2">{u.email}</td>
                    <td className="border px-3 py-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${u.statut === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.statut}
                      </span>
                    </td>
                    <td className="border px-3 py-2">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        className="border rounded px-2 py-1"
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border px-3 py-2">
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className={`px-3 py-1 text-sm rounded text-white font-semibold ${
                          u.statut === 'ACTIF'
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-green-500 hover:bg-green-600'
                        }`}
                      >
                        {u.statut === 'ACTIF' ? 'Suspendre' : 'Réactiver'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminDashboard;
