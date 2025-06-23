import React from 'react';

const AidePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">Aide & FAQ</h1>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Questions fréquentes</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li><strong>Comment faire une demande de casier judiciaire ?</strong>  
            Vous pouvez remplir le formulaire en ligne accessible sur la page "Faire une demande".</li>
          <li><strong>Comment suivre l'état de ma demande ?</strong>  
            Rendez-vous sur la page "Suivi de demande" et entrez votre numéro de suivi.</li>
          <li><strong>Que faire si je rencontre un problème de connexion ?</strong>  
            Vérifiez vos identifiants ou contactez le support via le formulaire de contact.</li>
          <li><strong>Quels documents dois-je fournir ?</strong>  
            Une copie de votre pièce d’identité et un justificatif de domicile sont généralement requis.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-semibold mb-4">Contact</h2>
        <p className="text-gray-700">
          Pour toute autre question ou assistance, veuillez contacter notre support à l’adresse email 
          <a href="mailto:support@casierjudiciaire.gab" className="text-green-600 underline ml-1">support@casierjudiciaire.gab</a>.
        </p>
      </section>
    </div>
  );
};

export default AidePage;
