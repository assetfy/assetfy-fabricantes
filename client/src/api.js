// src/api.js
import axios from 'axios';

const api = axios.create({
  // Usar URL relativa para que funcione en cualquier entorno
  // En desarrollo: usa proxy configurado en package.json
  // En producción: usa el mismo dominio donde está desplegado el frontend
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;