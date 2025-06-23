// frontend/src/pages/HomePage.tsx
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Rediriger les utilisateurs connectés vers leur dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'DEMANDEUR':
          navigate('/dashboard');
          break;
        case 'AGENT':
        case 'SUPERVISEUR':
        case 'ADMIN':
          navigate('/agent');
          break;
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Page pour utilisateurs non connectés
  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto">
        {/* Section Hero */}
        <div className="text-center py-16 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
            Demande de Casier Judiciaire
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Obtenez votre casier judiciaire en ligne de manière simple, rapide et sécurisée. 
            Service officiel de la République Gabonaise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/demande" 
              className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
            >
              Faire une demande
            </Link>
            <Link 
              to="/suivi" 
              className="px-8 py-4 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-lg font-semibold"
            >
              Suivre une demande
            </Link>
          </div>
        </div>

        {/* Types de casiers */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Types de casiers judiciaires
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-blue-600 mb-3">Bulletin N°1</h3>
              <p className="text-gray-600 mb-4">
                Réservé aux autorités judiciaires. Contient toutes les condamnations.
              </p>
              <div className="text-sm text-gray-500">
                <span className="font-semibold">Usage :</span> Justice uniquement
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
              <h3 className="text-xl font-bold text-orange-600 mb-3">Bulletin N°2</h3>
              <p className="text-gray-600 mb-4">
                Pour certaines administrations. Contient les condamnations principales.
              </p>
              <div className="text-sm text-gray-500">
                <span className="font-semibold">Usage :</span> Fonction publique, professions réglementées
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
              <h3 className="text-xl font-bold text-green-600 mb-3">Bulletin N°3</h3>
              <p className="text-gray-600 mb-4">
                Pour l'intéressé lui-même. Ne mentionne que certaines condamnations.
              </p>
              <div className="text-sm text-gray-500">
                <span className="font-semibold">Usage :</span> Emploi, permis de conduire, visa
              </div>
            </div>
          </div>
        </div>

        {/* Processus */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Comment ça marche
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="font-semibold mb-2">Remplir le formulaire</h3>
              <p className="text-gray-600 text-sm">Fournissez vos informations personnelles et uploadez les documents requis</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-semibold mb-2">Traitement</h3>
              <p className="text-gray-600 text-sm">Votre demande est vérifiée et traitée par nos agents</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-semibold mb-2">Validation</h3>
              <p className="text-gray-600 text-sm">Un superviseur valide votre casier judiciaire</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">4</span>
              </div>
              <h3 className="font-semibold mb-2">Récupération</h3>
              <p className="text-gray-600 text-sm">Téléchargez en ligne ou récupérez sur place</p>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="bg-green-600 text-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Prêt à commencer ?</h2>
          <p className="text-green-100 mb-6">
            Créez un compte pour suivre vos demandes ou faites une demande directement
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="px-6 py-3 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              Créer un compte
            </Link>
            <Link 
              to="/demande" 
              className="px-6 py-3 border-2 border-white text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Demande sans compte
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Cette partie ne devrait pas être atteinte car l'utilisateur connecté est redirigé
  return (
    <div className="text-center py-16">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Redirection en cours...</p>
    </div>
  );
};

export default HomePage;