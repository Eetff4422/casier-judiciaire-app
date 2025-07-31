import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div style={{ overflowX: 'hidden' }}>
      {/* Barre de navigation plein écran */}
      <header style={{ width: '100%', backgroundColor: '#6E8BBE' }}>
  <div
    style={{
      maxWidth: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
    }}
  >
    {/* Bloc gauche : logo + barre verticale */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <img src="/blason-gabon.jpg" alt="Blason du Gabon" style={{ width: 60 }} />
      <div style={{ width: '1px', height: '30px', backgroundColor: '#999' }} />
    </div>

    {/* Bloc central : liens espacés */}
    <div style={{ display: 'flex', gap: '20rem', justifyContent: 'center' }}>
      <Link to="/" style={{ fontSize: '1.1rem', color: '#000000' }}>Accueil</Link>
      <Link to="/aide" style={{ fontSize: '1.1rem', color: '#000000' }}>Aide</Link>
    </div>

    {/* Bloc droit : barre + bouton */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: '1px', height: '30px', backgroundColor: '#999' }} />
      <Link to="/login" role="button">Se connecter</Link>
    </div>
  </div>
</header>


      {/* Contenu central avec PicoCSS */}
      <main className="container" style={{ textAlign: 'center', marginTop: '2rem' }}>
        <h2>CASIER JUDICIAIRE NATIONAL</h2>
        <h3>Le site officiel de demande d’extrait de casier judiciaire</h3>

        <p>
          Le ministère de la justice a mis en place ce portail de e-service afin de
          digitaliser le processus de demande casier judiciaire.
        </p>
        <p>
          Cette initiative a pour but de faciliter la démarche pour l’obtention d’un
          casier judiciaire et de réduire le temps de traitement des demandes.
        </p>

        {/* Bloc Casier Judiciaire */}
        <section
          style={{
            backgroundColor: '#f0f0f0',
            padding: '2rem',
            marginTop: '2rem',
            borderRadius: '8px',
            maxWidth: '400px',
            marginInline: 'auto',
          }}
        >
          <h3 style={{ marginBottom: '0.2rem' }}>Casier Judiciaire</h3>
          <p style={{ marginTop: '0', fontStyle: 'italic' }}>(Bulletin n°3)</p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginTop: '1.5rem',
            }}
          >
            <Link to="/demande-sans-compte" role="button">
              Faire une demande
            </Link>
            <Link to="/suivi" role="button" className="secondary">
              Suivre une demande
            </Link>
          </div>
        </section>
      </main>

      {/* Footer plein écran */}
      <footer style={{ width: '100%', backgroundColor: '#6E8BBE', padding: '1rem 0', marginTop: '3rem' }}>
        <p style={{ textAlign: 'center' }}>
          <small>Pied de page</small>
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
