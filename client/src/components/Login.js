import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import logo from '../logo.png';
import { useNotification } from './NotificationProvider';

const Login = () => {
    const [formData, setFormData] = useState({
        correoElectronico: '',
        contrasena: ''
    });
    const navigate = useNavigate();
    const { showError } = useNotification();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', formData);
            
            // Verificar que la respuesta y los datos existan
            if (!res || !res.data || !res.data.token) {
                throw new Error('Respuesta del servidor inválida');
            }
            
            localStorage.setItem('token', res.data.token);
            
            // Store both roles array and primary rol for backward compatibility
            if (res.data.roles && Array.isArray(res.data.roles)) {
                localStorage.setItem('roles', JSON.stringify(res.data.roles));
            }
            if (res.data.rol) {
                localStorage.setItem('rol', res.data.rol);
            }
            
            // Determine which panel to navigate to based on roles priority
            // Priority: admin (1) > apoderado (2) > usuario_bienes (3)
            const roles = res.data.roles || [];
            const primaryRole = res.data.rol;
            
            if (roles.includes('admin') || primaryRole === 'admin') {
                navigate('/admin');
            } else if (roles.includes('apoderado') || primaryRole === 'apoderado') {
                navigate('/apoderado');
            } else if (roles.includes('usuario_bienes') || primaryRole === 'usuario_bienes') {
                navigate('/usuario');
            } else {
                navigate('/apoderado'); // Default fallback
            }

            // Recarga la página para asegurar que el rol se actualice en App.js
            window.location.reload();

        } catch (err) {
            console.error('Error de inicio de sesión:', err);
            // Manejar errores donde la respuesta no tiene el objeto 'response'
            if (err.response) {
                showError(err.response.data || 'Error de inicio de sesión');
            } else {
                showError('No se pudo conectar al servidor. Por favor, verifica tu conexión y que el servidor esté activo.');
            }
        }
    };

    return (
        <div className="container">
            <div className="logo-container">
                <img src={logo} alt="Logo de la aplicación" className="app-logo" />
            </div>
            <h2>Iniciar Sesión</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Correo Electrónico</label>
                    <input
                        type="email"
                        name="correoElectronico"
                        value={formData.correoElectronico}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Contraseña</label>
                    <input
                        type="password"
                        name="contrasena"
                        value={formData.contrasena}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit">Iniciar Sesión</button>
            </form>
        </div>
    );
};

export default Login;