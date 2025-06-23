// frontend/src/App.tsx
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import AidePage from './pages/AidePage';
import BoiteMessagerie from './pages/BoiteMessagerie';
import ComplementDemande from './pages/ComplementDemande';
import DashboardAgent from './pages/DashboardAgent';
import DashboardDemandeur from './pages/DashboardDemandeur';
import DetailDemande from './pages/DemandeDetails';
import DemandeForm from './pages/DemandeForm';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RecoverAccount from './pages/RecoverAccount';
import RegisterPage from './pages/RegisterPage';
import SuiviDemande from './pages/SuiviDemande';
import SuperviseurDashboard from './pages/SuperviseurDashboard';
import TraitementDemande from './pages/TraitementDemandes';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              {/* Pages publiques */}
              <Route path="/" element={<HomePage />} />
              <Route path="/demande" element={<DemandeForm />} />
              <Route path="/suivi" element={<SuiviDemande />} />
              <Route path="/aide" element={<AidePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Pages protégées - Demandeurs */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['DEMANDEUR']}>
                    <DashboardDemandeur />
                  </ProtectedRoute>
                }
              />

              {/* Pages protégées - Agents/Superviseurs/Admins */}
              <Route
                path="/agent"
                element={
                  <ProtectedRoute allowedRoles={['AGENT', 'ADMIN']}>
                    <DashboardAgent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agent/traitement/:id"
                element={
                  <ProtectedRoute allowedRoles={['AGENT']}>
                    <TraitementDemande />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superviseur"
                element={
                  <ProtectedRoute allowedRoles={['SUPERVISEUR', 'ADMIN']}>
                    <SuperviseurDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messagerie"
                element={
                  <ProtectedRoute allowedRoles={['DEMANDEUR', 'AGENT', 'SUPERVISEUR', 'ADMIN']}>
                    <BoiteMessagerie />
                  </ProtectedRoute>
                }
              />
              <Route path="/recover" element={<RecoverAccount />} />
              <Route
                path="/demande/complement/:id"
                element={
                  <ProtectedRoute allowedRoles={['DEMANDEUR']}>
                    <ComplementDemande />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demande/:id"
                element={
                  <ProtectedRoute allowedRoles={['SUPERVISEUR', 'ADMIN']}>
                    <DetailDemande />
                  </ProtectedRoute>
                }
              />

              {/* Route par défaut */}
              <Route path="*" element={<div className="text-center text-red-600 mt-8">Page non trouvée</div>} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
