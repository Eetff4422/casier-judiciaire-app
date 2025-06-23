// frontend/src/pages/DetailDemande.tsx
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DetailDemande: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [demande, setDemande] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDemande = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/demandes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDemande(res.data.demande);
      } catch (err) {
        console.error("Erreur récupération :", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDemande();
  }, [id, token]);

  if (loading) return <p className="p-4">Chargement...</p>;
  if (!demande) return <p className="p-4 text-red-600">Demande non trouvée.</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Détails de la demande</h2>
      <div className="border rounded p-4 space-y-2">
        <p><strong>Demandeur :</strong> {demande.demandeur.fullName} ({demande.demandeur.email})</p>
        <p><strong>Type de casier :</strong> {demande.typeCasier}</p>
        <p><strong>Statut :</strong> {demande.statut}</p>
        <p><strong>Mode de réception :</strong> {demande.modeReception}</p>
        <p><strong>Canal de notification :</strong> {demande.canalNotification}</p>
        {demande.commentaire && (
          <p className="text-sm text-gray-700"><strong>Commentaire de l’agent :</strong> {demande.commentaire}</p>
        )}
        <div>
          <strong>Pièces jointes :</strong>
          {demande.documents && demande.documents.length > 0 ? (
            <ul className="list-disc ml-6">
              {demande.documents.map((doc: any) => (
                <li key={doc.id}>
                  <a
                    href={`${process.env.REACT_APP_API_URL}/uploads/${doc.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {doc.originalname}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>Aucune pièce jointe.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailDemande;
