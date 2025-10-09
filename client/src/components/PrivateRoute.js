// src/components/PrivateRoute.js

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('rol');
  const rolesStr = localStorage.getItem('roles');
  
  // Parse roles array if available
  let userRoles = [];
  try {
    userRoles = rolesStr ? JSON.parse(rolesStr) : [];
  } catch (e) {
    userRoles = [];
  }
  
  // If no roles array, fallback to single rol
  if (userRoles.length === 0 && userRole) {
    userRoles = [userRole];
  }
  
  // Check if user has any of the allowed roles
  const hasPermission = allowedRoles.some(role => userRoles.includes(role));

  // Si no hay token o el rol del usuario no está permitido, redirigimos
  if (!token || !hasPermission) {
    return <Navigate to="/" replace />;
  }

  // Si todo es correcto, permitimos el acceso a la ruta
  return <Outlet />;
};

export default PrivateRoute;