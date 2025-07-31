import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Demande {
  id: string;
  typeCasier: string;
  statut: string;
  createdAt: string;
  demandeur?: {
    fullName: string;
    email: string;
  };
  nom?: string;
  email?: string;
}

interface Statistiques {
  total: number;
  terminees: number;
  rejetees: number;
  repartition: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const SuperviseurDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const [controleQualite, setControleQualite] = useState<Demande[]>([]);
  const [statistiques, setStatistiques] = useState<Statistiques | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState('');
  const [filterNom, setFilterNom] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  const LIMIT = 10;

  useEffect(() => {
    if (!token || (user?.role !== 'SUPERVISEUR' && user?.role !== 'ADMIN')) {
      navigate('/');
      return;
    }
    fetchControleQualite();
  }, [token, filterStatut, filterNom, dateDebut, dateFin, page]);

  const fetchControleQualite = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      queryParams.append('limit', String(LIMIT));
      if (filterStatut) queryParams.append('statut', filterStatut);
      if (filterNom) queryParams.append('search', filterNom);
      if (dateDebut) queryParams.append('dateDebut', dateDebut);
      if (dateFin) queryParams.append('dateFin', dateFin);

      const res = await fetch(`${API_URL}/superviseur/controle-qualite?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      setControleQualite(data.data.demandes);
      setPagination(data.data.pagination);

      const total = data.data.pagination.total;
      const terminees = data.data.demandes.filter((d: Demande) => d.statut === 'TERMINEE').length;
      const rejetees = data.data.demandes.filter((d: Demande) => d.statut === 'REJETEE').length;
      const repartition = total > 0 ? `${Math.round((terminees / total) * 100)}% / ${Math.round((rejetees / total) * 100)}%` : '0% / 0%';
      setStatistiques({ total, terminees, rejetees, repartition });
    } catch (error) {
      console.error('Erreur contrôle qualité :', error);
    } finally {
      setLoading(false);
    }
  };

  const voirDetails = (id: string) => {
    navigate(`/demande/${id}`);
  };

  const handleReset = () => {
    setPage(1);
    setFilterStatut('');
    setFilterNom('');
    setDateDebut('');
    setDateFin('');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Supervision des casiers</h1>

      {statistiques && (
        <div className="mb-6 border border-gray-300 p-4 rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Répartition des décisions :</h3>
          <p><strong>Total :</strong> {statistiques.total}</p>
          <p><strong>Terminées :</strong> {statistiques.terminees}</p>
          <p><strong>Rejetées :</strong> {statistiques.rejetees}</p>
          <p><strong>Répartition :</strong> {statistiques.repartition}</p>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-2">Contrôle qualité</h2>
      <div className="mb-2 flex gap-2 flex-wrap">
        <button className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded" onClick={() => {
          const today = new Date();
          const past7 = new Date();
          past7.setDate(today.getDate() - 7);
          setDateDebut(past7.toISOString().split('T')[0]);
          setDateFin(today.toISOString().split('T')[0]);
        }}>7 derniers jours</button>

        <button className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded" onClick={() => {
          const today = new Date();
          const past30 = new Date();
          past30.setDate(today.getDate() - 30);
          setDateDebut(past30.toISOString().split('T')[0]);
          setDateFin(today.toISOString().split('T')[0]);
        }}>30 derniers jours</button>

        <button className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded" onClick={() => {
          const today = new Date();
          const trimestreDebut = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
          setDateDebut(trimestreDebut.toISOString().split('T')[0]);
          setDateFin(today.toISOString().split('T')[0]);
        }}>Ce trimestre</button>

        <button className="bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded" onClick={handleReset}>
          Réinitialiser
        </button>
      </div>
      <div className="mb-4">
        <button
          onClick={async () => {
            try {
              const res = await fetch(`${API_URL}/superviseur/export`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'demandes.csv';
              a.click();
              window.URL.revokeObjectURL(url);
            } catch (err) {
              console.error('Erreur export CSV :', err);
            }
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Exporter en CSV
        </button>
      </div>

      <div className="mb-4 flex gap-4 flex-wrap">
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="border px-2 py-1 rounded">
          <option value="">Tous les statuts</option>
          <option value="TERMINEE">Terminée</option>
          <option value="REJETEE">Rejetée</option>
        </select>

        <input type="text" placeholder="Nom ou email du demandeur" value={filterNom} onChange={e => setFilterNom(e.target.value)} className="border px-2 py-1 rounded" />
        <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="border px-2 py-1 rounded" />
        <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="border px-2 py-1 rounded" />
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : controleQualite.length === 0 ? (
        <p>Aucune demande à afficher.</p>
      ) : (
        <>
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Demandeur</th>
                <th className="border px-2 py-1">Type</th>
                <th className="border px-2 py-1">Créée le</th>
                <th className="border px-2 py-1">Statut</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {controleQualite.map((d) => (
                <tr key={d.id}>
                  <td className="border px-2 py-1">
                    {d.demandeur ? (
                      <>
                        {d.demandeur.fullName}<br />
                        <span className="text-xs text-gray-600">{d.demandeur.email}</span>
                      </>
                    ) : (
                      <>
                        {d.nom}<br />
                        <span className="text-xs text-gray-600">{d.email}</span>
                      </>
                    )}
                  </td>
                  <td className="border px-2 py-1">{d.typeCasier}</td>
                  <td className="border px-2 py-1">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="border px-2 py-1">{d.statut}</td>
                  <td className="border px-2 py-1">
                    <button onClick={() => voirDetails(d.id)} className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded">
                      Voir détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="bg-gray-300 px-3 py-1 rounded disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="text-sm">
                Page {pagination.page} / {pagination.totalPages}
              </span>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="bg-gray-300 px-3 py-1 rounded disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SuperviseurDashboard;