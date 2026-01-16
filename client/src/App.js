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
import ActivateAccount from './components/ActivateAccount';
import { NotificationProvider } from './components/NotificationProvider';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/activate/:token" element={<ActivateAccount />} />
            <Route path="/registro" element={<RegistroProducto />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/demo/metricas" element={<DemoMetricasPage />} />
            <Route path="/demo/admin/*" element={<DemoAdminPanel />} />
            <Route path="/demo/apoderado/*" element={<DemoApoderadoPanel />} />
            <Route path="*" element={<ProtectedRoutes />} />
          </Routes>
        </div>
      </Router>
    </NotificationProvider>
  );
}

const ProtectedRoutes = () => {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');
    const rolesStr = localStorage.getItem('roles');
    
    // Parse roles array if available
    let roles = [];
    try {
        roles = rolesStr ? JSON.parse(rolesStr) : [];
    } catch (e) {
        roles = [];
    }
    
    // If no roles array, fallback to single rol
    if (roles.length === 0 && rol) {
        roles = [rol];
    }
    
    // Basic validation: both token and roles must exist
    const isAuthenticated = token && (roles.length > 0 || rol);
    
    // Helper to check if user has any of the specified roles
    const hasAnyRole = (requiredRoles) => {
        return requiredRoles.some(r => roles.includes(r));
    };

    return (
        <>
            <Routes>
                {/* Redirigir la ruta raíz a la vista adecuada */}
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

                {/* Rutas protegidas por rol */}
                <Route path="/admin" element={isAuthenticated && (hasAnyRole(['admin']) || rol === 'admin') ? <AdminPanel /> : <Navigate to="/login" />} />
                <Route path="/apoderado/*" element={<ApoderadoPanel />} />
                <Route path="/usuario" element={isAuthenticated && (hasAnyRole(['usuario_bienes']) || rol === 'usuario_bienes') ? <UsuarioPanel /> : <Navigate to="/login" />} />

                {/* En caso de que se acceda a una ruta protegida sin login */}
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </>
    );
};


export default App;