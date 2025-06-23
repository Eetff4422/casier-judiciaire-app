// frontend/src/pages/TraitementDemande.tsx
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TraitementDemande: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [demande, setDemande] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentaire, setCommentaire] = useState('');

  useEffect(() => {
    const fetchDemande = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/demandes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDemande(res.data.demande);
      } catch (error) {
        console.error('Erreur chargement demande:', error);
        setDemande(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDemande();
    }
  }, [id, token]);

  const handleUpdateStatut = async (statut: 'TERMINEE' | 'REJETEE' | 'INFORMATIONS_MANQUANTES') => {
    try {
      const res = await axios.patch(`${process.env.REACT_APP_API_URL}/demandes/${id}/statut`, 
        { statut, commentaire },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Statut changé : ${res.data.message}`);
      navigate('/agent'); // retour dashboard
    } catch (error) {
      alert('Erreur lors de la mise à jour du statut.');
      console.error('Erreur API:', error);
    }
  };

  if (loading) return <p className="p-4">Chargement...</p>;
  if (!demande) return <p className="p-4 text-red-600">Demande introuvable ou non autorisée.</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Traitement de la demande</h2>

      <div className="mb-4 p-4 border rounded">
        <p><strong>Nom :</strong> {demande.demandeur?.fullName}</p>
        <p><strong>Email :</strong> {demande.demandeur?.email}</p>
        <p><strong>Type :</strong> {demande.typeCasier}</p>
        <p><strong>Mode de réception :</strong> {demande.modeReception}</p>
        <p><strong>Canal notification :</strong> {demande.canalNotification}</p>
        <p><strong>Statut actuel :</strong> {demande.statut}</p>
      </div>

      {/* Bloc affichage documents */}
      {demande.documents?.length > 0 && (
        <div className="mb-4 p-4 border rounded">
          <h3 className="font-semibold mb-2">Documents joints :</h3>
          <ul className="list-disc list-inside space-y-1">
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

      <div className="mb-4">
        <label className="block mb-1 font-medium">Commentaire (optionnel sauf pour Rejet / Demande info) :</label>
        <textarea
          className="w-full border p-2 rounded"
          rows={4}
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
        />
      </div>

      <div className="flex gap-4">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={() => handleUpdateStatut('TERMINEE')}
        >
          Valider
        </button>
        <button
          className="bg-yellow-500 text-white px-4 py-2 rounded"
          onClick={() => {
            if (commentaire.length < 5) {
              alert('Ajoute un commentaire plus explicite pour cette option.');
              return;
            }
            handleUpdateStatut('INFORMATIONS_MANQUANTES');
          }}
        >
          Demander infos
        </button>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded"
          onClick={() => {
            if (commentaire.length < 5) {
              alert('Ajoute un commentaire pour rejeter la demande.');
              return;
            }
            handleUpdateStatut('REJETEE');
          }}
        >
          Rejeter
        </button>
      </div>
    </div>
  );
};

export default TraitementDemande;
