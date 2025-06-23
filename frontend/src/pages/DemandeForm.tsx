// frontend/src/components/DemandeForm.tsx
import axios from 'axios';
import React, { useState } from 'react';

const DemandeForm: React.FC = () => {
  const [typeCasier, setTypeCasier] = useState('B3');
  const [modeReception, setModeReception] = useState('EN_LIGNE');
  const [canalNotification, setCanalNotification] = useState('EMAIL');
  const [documents, setDocuments] = useState<FileList | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!documents || documents.length === 0) {
      return setError('Veuillez ajouter au moins un document.');
    }

    const formData = new FormData();
    formData.append('typeCasier', typeCasier);
    formData.append('modeReception', modeReception);
    formData.append('canalNotification', canalNotification);

    Array.from(documents).forEach((file) => {
      formData.append('documents', file);
      formData.append(`typeDocument_${file.name}`, 'JUSTIFICATIF');
    });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/demandes`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setMessage('Demande envoyée avec succès.');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la soumission.');
      setMessage(null);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">Demande de Casier Judiciaire</h1>

      {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
      {message && <p className="text-green-600 mb-4 text-center">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-semibold">Type de casier</label>
          <select
            value={typeCasier}
            onChange={(e) => setTypeCasier(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="B1">Bulletin n°1</option>
            <option value="B2">Bulletin n°2</option>
            <option value="B3">Bulletin n°3</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold">Mode de réception</label>
          <select
            value={modeReception}
            onChange={(e) => setModeReception(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="EN_LIGNE">En ligne</option>
            <option value="SUR_PLACE">Sur place</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold">Canal de notification</label>
          <select
            value={canalNotification}
            onChange={(e) => setCanalNotification(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="EMAIL">Email</option>
            <option value="SMS">SMS</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold">Documents (CNI, photo...)</label>
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => setDocuments(e.target.files)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Soumettre la demande
        </button>
      </form>
    </div>
  );
};

export default DemandeForm;
