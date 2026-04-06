import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { PlasmicRootProvider, PlasmicComponent } from '@plasmicapp/loader-react';

// Forzamos la extensión .js para que el bundler no se pierda
import { PLASMIC } from './plasmic-init.js'; 
import { PlasmicCanvasHost } from '@plasmicapp/loader-react';



// Tus componentes actuales
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import ApoderadoPanel from './components/ApoderadoPanel';
import UsuarioPanel from './components/UsuarioPanel';
import DemoAdminPanel from './components/DemoAdminPanel';
import DemoApoderadoPanel from './components/DemoApoderadoPanel';
import DemoPage from './components/DemoPage';
import DemoMetricasPage from './components/DemoMetricasPage';
import RegistroProducto from './components/RegistroProducto';
import RegistroFabricante from './components/RegistroFabricante';
import SolicitudRepresentacionForm from './components/SolicitudRepresentacionForm';
import ActivateAccount from './components/ActivateAccount';
import { NotificationProvider } from './components/NotificationProvider';
import TourProvider from './components/TourProvider';


// --- COMPONENTE MANEJADOR DE PLASMIC (JS PURO) ---
function PlasmicHandler() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await PLASMIC.maybeFetchComponentData(location.pathname);
        if (isMounted) {
          setPageData(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error cargando Plasmic:", error);
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [location.pathname]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando...</div>;
  
  if (!pageData) return <Navigate to="/login" />;

  return <PlasmicComponent component={location.pathname} />;
}

function App() {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');
  const rolesStr = localStorage.getItem('roles');

  let roles = [];
  try {
    roles = rolesStr ? JSON.parse(rolesStr) : [];
  } catch (e) {
    roles = [];
  }
  if (roles.length === 0 && rol) roles = [rol];

  const isAuthenticated = !!(token && (roles.length > 0 || rol));
  const hasAnyRole = (requiredRoles) => requiredRoles.some(r => roles.includes(r));

  return (
    <PlasmicRootProvider loader={PLASMIC}>
      <NotificationProvider>
        <Router>
          <TourProvider>
            <div className="App">
              <Routes>
                {/* Rutas Públicas */}
                <Route path="/login" element={<Login />} />
                <Route path="/activate/:token" element={<ActivateAccount />} />
                <Route path="/registro" element={<RegistroProducto />} />
                <Route path="/demo" element={<DemoPage />} />
                <Route path="/demo/metricas" element={<DemoMetricasPage />} />
                <Route path="/demo/admin/*" element={<DemoAdminPanel />} />
                <Route path="/demo/apoderado/*" element={<DemoApoderadoPanel />} />

                {/* Home Logic */}


                <Route path="/" element={
                  isAuthenticated && (hasAnyRole(['apoderado']) || rol === 'apoderado') ? (
                    <Navigate to="/apoderado" />
                  ) : isAuthenticated && (hasAnyRole(['admin']) || rol === 'admin') ? (
                    <Navigate to="/admin" />
                  ) : isAuthenticated && (hasAnyRole(['usuario_bienes']) || rol === 'usuario_bienes') ? (
                    <Navigate to="/usuario" />
                  ) : (
                    <PlasmicHandler /> 
                  )
                } />

                {/* Rutas Protegidas */}
                <Route path="/admin" element={
                  isAuthenticated && (hasAnyRole(['admin']) || rol === 'admin')
                    ? <AdminPanel />
                    : <Navigate to="/login" />
                } />
                <Route path="/apoderado/*" element={<ApoderadoPanel />} />
                <Route path="/usuario" element={
                  isAuthenticated && (hasAnyRole(['usuario_bienes']) || rol === 'usuario_bienes')
                    ? <UsuarioPanel />
                    : <Navigate to="/login" />
                } />

                {/* Portales Branded */}
                <Route path="/:slug/representacion" element={<SolicitudRepresentacionForm />} />
                <Route path="/:slug" element={<RegistroFabricante />} />

                {/* Plasmic Studio Host */}
                <Route path="/plasmic-host" element={<PlasmicCanvasHost />} />

                {/* Catch-all para Plasmic */}
                <Route path="*" element={<PlasmicHandler />} />
              </Routes>
            </div>
          </TourProvider>
        </Router>
      </NotificationProvider>
    </PlasmicRootProvider>
  );
}

export default App;