import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import ActivateAccount from './components/ActivateAccount';
import { NotificationProvider } from './components/NotificationProvider';

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

  const isAuthenticated = token && (roles.length > 0 || rol);
  const hasAnyRole = (requiredRoles) => requiredRoles.some(r => roles.includes(r));

  return (
    <NotificationProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/activate/:token" element={<ActivateAccount />} />
            <Route path="/registro" element={<RegistroProducto />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/demo/metricas" element={<DemoMetricasPage />} />
            <Route path="/demo/admin/*" element={<DemoAdminPanel />} />
            <Route path="/demo/apoderado/*" element={<DemoApoderadoPanel />} />

            {/* Protected routes - explicit top-level paths so React Router v6 ranks them
                higher (static > dynamic) than the /:slug branded portal route below.
                IMPORTANT: any new protected top-level route must be added here to avoid
                being captured by the /:slug route. */}
            <Route path="/" element={
              isAuthenticated && (hasAnyRole(['admin']) || rol === 'admin') ? (
                <Navigate to="/admin" />
              ) : isAuthenticated && (hasAnyRole(['apoderado']) || rol === 'apoderado') ? (
                <Navigate to="/apoderado" />
              ) : isAuthenticated && (hasAnyRole(['usuario_bienes']) || rol === 'usuario_bienes') ? (
                <Navigate to="/usuario" />
              ) : (
                <Navigate to="/login" />
              )
            } />
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

            {/* Fabricante branded registration portals - must come after explicit protected paths */}
            <Route path="/:slug" element={<RegistroFabricante />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;