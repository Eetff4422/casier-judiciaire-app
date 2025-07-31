import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ComplementDemande: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [demande, setDemande] = useState<any>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchDemande = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/demandes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDemande(response.data.demande);
      } catch (err) {
        setError("Erreur lors de la récupération de la demande.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDemande();
  }, [id, token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
  if (!documents.length) return;

  const formData = new FormData();
  documents.forEach(doc => {
    formData.append('documents', doc);
    formData.append(`typeDocument_${doc.name}`, 'JUSTIFICATIF');
  });

  try {
    await axios.post(
      `${process.env.REACT_APP_API_URL}/demandes/${id}/documents`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    setSuccess('Documents ajoutés avec succès.');
    setDocuments([]);
    setError(null);
  } catch (err) {
    setError("Erreur lors de l'envoi des documents.");
    setSuccess(null);
  }
};


  if (loading) return <div className="p-4">Chargement...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!demande) return <div className="p-4">Demande introuvable</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Complément de Demande</h1>

      <div className="mb-4">
        <p><strong>Type de casier:</strong> {demande.typeCasier}</p>
        <p><strong>Statut:</strong> {demande.statut}</p>
        <p><strong>Commentaire de l’agent :</strong></p>
        <div className="border p-3 bg-gray-50 text-gray-700 rounded">
          {demande.commentaire || 'Aucun commentaire fourni.'}
        </div>
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2">Ajouter des documents :</label>
        <input type="file" multiple onChange={handleFileChange} />
      </div>

      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Envoyer les documents
      </button>

      {success && <p className="text-green-600 mt-4">{success}</p>}
      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
};

export default ComplementDemande;
