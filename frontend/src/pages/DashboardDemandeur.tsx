import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardDemandeur: React.FC = () => {
  const { token } = useAuth();
  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDemandes = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/demandes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDemandes(response.data.demandes);
      } catch (error) {
        console.error('Erreur récupération demandes :', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDemandes();
  }, [token]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Mes Demandes</h1>
      {loading ? (
        <p>Chargement...</p>
      ) : demandes.length === 0 ? (
        <p>Aucune demande pour l'instant</p>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Statut</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {demandes.map((demande) => (
              <tr key={demande.id} className="text-center">
                <td className="p-2 border">{demande.typeCasier}</td>
                <td className="p-2 border">
                  {demande.statut}
                  {demande.statut === 'INFORMATIONS_MANQUANTES' && demande.commentaireAgent && (
                    <p className="text-sm text-yellow-700 italic mt-1">
                      Commentaire agent : {demande.commentaireAgent}
                    </p>
                  )}
                </td>
                <td className="p-2 border">{new Date(demande.createdAt).toLocaleDateString()}</td>
                <td className="p-2 border space-y-2 flex flex-col items-center">
                  {/* Compléter si statut = INFORMATIONS_MANQUANTES */}
                  {demande.statut === 'INFORMATIONS_MANQUANTES' && (
                    <button
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                      onClick={() => navigate(`/demande/complement/${demande.id}`)}
                    >
                      Compléter
                    </button>
                  )}

                  {/* Télécharger le bulletin si statut = TERMINEE */}
                  {demande.statut === 'TERMINEE' && (
                    <a
                      href={`${process.env.REACT_APP_API_URL}/demandes/${demande.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Télécharger le casier
                    </a>
                  )}

                  {/* Voir les documents */}
                  {demande.documents?.map((doc: any) => (
                    <a
                      key={doc.id}
                      href={`${process.env.REACT_APP_API_URL}/demandes/${demande.id}/documents/${doc.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline text-sm block"
                    >
                      {doc.nom}
                    </a>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DashboardDemandeur;
