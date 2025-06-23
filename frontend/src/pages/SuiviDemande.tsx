import React, { useState } from 'react';

const SuiviDemande: React.FC = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      // Appel fictif à l'API pour récupérer le statut
      // const response = await fetch(`${API_URL}/demandes/${trackingNumber}/status`);
      // const data = await response.json();
      // if (response.ok) setStatus(data.status);
      // else throw new Error(data.error || 'Demande introuvable');

      // Simuler un résultat pour l'instant
      await new Promise(r => setTimeout(r, 1000));
      if (trackingNumber === '123456') {
        setStatus('Votre demande est en cours de traitement.');
      } else {
        setError('Numéro de suivi invalide ou demande introuvable.');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération du statut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">Suivi de demande</h1>
      <form onSubmit={handleTrack} className="space-y-6">
        {error && <div className="text-red-600 text-center">{error}</div>}
        {status && <div className="text-green-600 text-center">{status}</div>}
        <div>
          <label htmlFor="trackingNumber" className="block mb-2 font-semibold text-gray-700">Numéro de suivi</label>
          <input
            type="text"
            id="trackingNumber"
            value={trackingNumber}
            onChange={e => setTrackingNumber(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-md font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Recherche...' : 'Suivre la demande'}
        </button>
      </form>
    </div>
  );
};

export default SuiviDemande;
