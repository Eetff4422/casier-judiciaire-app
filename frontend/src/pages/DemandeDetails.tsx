import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DemandeDetails: React.FC = () => {
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
      } catch (error) {
        console.error('Erreur chargement détails:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDemande();
  }, [id, token]);

  if (loading) return <p className="p-4">Chargement...</p>;
  if (!demande) return <p className="p-4 text-red-600">Demande introuvable.</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Détails de la demande</h2>

      <div className="mb-4 p-4 border rounded">
        <p><strong>Nom :</strong> {demande.demandeur?.fullName}</p>
        <p><strong>Email :</strong> {demande.demandeur?.email}</p>
        <p><strong>Type :</strong> {demande.typeCasier}</p>
        <p><strong>Statut :</strong> {demande.statut}</p>
        <p><strong>Mode de réception :</strong> {demande.modeReception}</p>
        <p><strong>Canal notification :</strong> {demande.canalNotification}</p>
        <p><strong>Commentaire :</strong> {demande.commentaire || '—'}</p>
      </div>

      {demande.documents?.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Documents joints</h3>
          <ul className="list-disc ml-6">
            {demande.documents.map((doc: any) => (
              <li key={doc.id}>
                <a
                  href={`${process.env.REACT_APP_API_URL}/demandes/${demande.id}/documents/${doc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {doc.nom}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DemandeDetails;
