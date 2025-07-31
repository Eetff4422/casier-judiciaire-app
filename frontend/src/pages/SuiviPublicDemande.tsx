import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface Demande {
  nom: string;
  prenom: string;
  statut: string;
  createdAt: string;
}

const SuiviPublicDemande: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [demande, setDemande] = useState<Demande | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    const fetchDemande = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/public-demande/suivi/${code}`);
        setDemande(res.data);
      } catch (err) {
        setErreur('❌ Demande introuvable ou lien expiré.');
      } finally {
        setLoading(false);
      }
    };

    if (code) fetchDemande();
  }, [code]);

  if (loading) return <p className="text-center mt-10">Chargement en cours...</p>;
  if (erreur) return <p className="text-center mt-10 text-red-600">{erreur}</p>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-center">Suivi de votre demande</h2>
      <p><strong>Nom :</strong> {demande?.nom}</p>
      <p><strong>Prénom :</strong> {demande?.prenom}</p>
      <p><strong>Statut :</strong> {demande?.statut}</p>
<p>
  <strong>Date de soumission :</strong>{' '}
  {demande?.createdAt ? new Date(demande.createdAt).toLocaleString() : 'Non disponible'}
</p>
      <div className="mt-6 text-sm text-gray-500">
        Vous recevrez une notification dès que votre demande sera traitée.
      </div>
    </div>
  );
};

export default SuiviPublicDemande;
