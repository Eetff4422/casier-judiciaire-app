import axios from 'axios';
import React, { useState } from 'react';

const PublicDemandeForm: React.FC = () => {
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    indicatif: '+33',
    telephone: '',
    consentement: false,
    typeCasier: 'B3',
    modeReception: 'EN_LIGNE',
    canalNotification: 'EMAIL',
  });

  const [documents, setDocuments] = useState<FileList | null>(null);
  const [message, setMessage] = useState('');
  const [lienSuivi, setLienSuivi] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLienSuivi('');

    if (!form.consentement) {
      setMessage('❌ Vous devez accepter l’utilisation de vos informations.');
      return;
    }

    if (!documents || documents.length === 0) {
      setMessage('❌ Ajoutez au moins un document.');
      return;
    }

    if (form.telephone.length < 6) {
      setMessage('❌ Numéro de téléphone invalide.');
      return;
    }

    try {
      setLoading(true);
      const numeroComplet = form.indicatif + form.telephone.replace(/\s+/g, '');
      const formData = new FormData();
      formData.append('nom', form.nom);
      formData.append('prenom', form.prenom);
      formData.append('email', form.email);
      formData.append('telephone', numeroComplet);
      formData.append('typeCasier', form.typeCasier);
      formData.append('modeReception', form.modeReception);
      formData.append('canalNotification', form.canalNotification);

      Array.from(documents).forEach((file) => {
        formData.append('documents', file);
        formData.append(`typeDocument_${file.name}`, 'JUSTIFICATIF');
      });

      const res = await axios.post(`${process.env.REACT_APP_API_URL}/public-demande`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage('✅ Demande envoyée avec succès.');
      setLienSuivi(res.data.suiviLink);
      setForm({
        nom: '',
        prenom: '',
        email: '',
        indicatif: '+33',
        telephone: '',
        consentement: false,
        typeCasier: 'B3',
        modeReception: 'EN_LIGNE',
        canalNotification: 'EMAIL',
      });
      setDocuments(null);
    } catch (err) {
      console.error(err);
      setMessage('❌ Une erreur est survenue lors de l’envoi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">Demande de casier sans compte</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          name="nom"
          placeholder="Nom"
          value={form.nom}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        />
        <input
          name="prenom"
          placeholder="Prénom"
          value={form.prenom}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        />

        <div className="flex gap-2">
          <select
            name="indicatif"
            value={form.indicatif}
            onChange={handleChange}
            className="p-2 border rounded w-28"
          >
            <option value="+33">🇫🇷 +33 (France)</option>
            <option value="+241">🇬🇦 +241 (Gabon)</option>
            <option value="+32">🇧🇪 +32 (Belgique)</option>
            <option value="+1">🇺🇸 +1 (USA)</option>
          </select>
          <input
            name="telephone"
            placeholder="Numéro sans indicatif"
            value={form.telephone}
            onChange={handleChange}
            required
            className="p-2 border rounded flex-1"
          />
        </div>

        <select
          name="typeCasier"
          value={form.typeCasier}
          onChange={handleChange}
          className="p-2 border rounded"
        >
          <option value="B3">Bulletin n°3</option>
        </select>

        <select
          name="modeReception"
          value={form.modeReception}
          onChange={handleChange}
          className="p-2 border rounded"
        >
          <option value="EN_LIGNE">En ligne</option>
          <option value="SUR_PLACE">Sur place</option>
        </select>

        <select
          name="canalNotification"
          value={form.canalNotification}
          onChange={handleChange}
          className="p-2 border rounded"
        >
          <option value="EMAIL">Email</option>
          <option value="SMS">SMS</option>
        </select>

        <input
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => setDocuments(e.target.files)}
          className="p-2 border rounded"
        />

        <label className="text-sm flex items-start gap-2">
          <input
            type="checkbox"
            name="consentement"
            checked={form.consentement}
            onChange={handleChange}
          />
          J’autorise l’utilisation de mon email et téléphone pour le suivi de cette demande.
        </label>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
        >
          {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
        </button>
      </form>

      {message && <p className="mt-4 text-center">{message}</p>}
      {lienSuivi && (
        <p className="mt-2 text-center text-sm text-blue-600">
          🔗 <a href={lienSuivi} target="_blank" rel="noopener noreferrer" className="underline">Voir le suivi</a>
        </p>
      )}
    </div>
  );
};

export default PublicDemandeForm;
