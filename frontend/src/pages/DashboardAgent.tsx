import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardAgent: React.FC = () => {
  const { token } = useAuth();
  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssigned = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/demandes/assigned`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDemandes(response.data.demandes);
      } catch (error) {
        console.error('Erreur chargement demandes assignées:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssigned();
  }, [token]);

  const handleTraiter = (id: string) => {
    navigate(`/agent/traitement/${id}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Demandes assignées</h1>

      {loading ? (
        <p>Chargement...</p>
      ) : demandes.length === 0 ? (
        <p>Aucune demande assignée pour l'instant</p>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Nom du demandeur</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Statut</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {demandes.map((demande) => (
              <tr key={demande.id} className="text-center">
                <td className="p-2 border">{demande.demandeur.fullName}</td>
                <td className="p-2 border">{demande.demandeur.email}</td>
                <td className="p-2 border">{demande.typeCasier}</td>
                <td className="p-2 border">{demande.statut}</td>
                <td className="p-2 border">{new Date(demande.createdAt).toLocaleDateString()}</td>
                <td className="p-2 border space-x-2">
                  <button
                    onClick={() => handleTraiter(demande.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Traiter
                  </button>
                  {demande.statut === 'INFORMATIONS_MANQUANTES' && (
                    <button
                      className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                    >
                      Relancer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DashboardAgent;
