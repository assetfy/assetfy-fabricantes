import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import logo from '../logo.png';
import { useNotification } from './NotificationProvider';

const ActivateAccount = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { showSuccess, showError } = useNotification();
    const [loading, setLoading] = useState(true);
    const [correoElectronico, setCorreoElectronico] = useState('');
    const [formData, setFormData] = useState({
        correoElectronico: '',
        contrasena: ''
    });

    useEffect(() => {
        // Validate token
        api.get(`/auth/activate/${token}`)
            .then(res => {
                setCorreoElectronico(res.data.correoElectronico);
                setFormData(prev => ({ ...prev, correoElectronico: res.data.correoElectronico }));
                setLoading(false);
                showSuccess(res.data.msg);
            })
            .catch(err => {
                console.error('Error validating token:', err);
                showError(err.response?.data?.msg || 'Token de activación inválido o expirado');
                setLoading(false);
                setTimeout(() => navigate('/login'), 3000);
            });
    }, [token, navigate, showSuccess, showError]);

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
            
            showSuccess('¡Cuenta activada exitosamente! Bienvenido.');
            
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

            window.location.reload();

        } catch (err) {
            console.error('Error de inicio de sesión:', err);
            if (err.response) {
                showError(err.response.data || 'Error de inicio de sesión');
            } else {
                showError('No se pudo conectar al servidor. Por favor, verifica tu conexión y que el servidor esté activo.');
            }
        }
    };

    if (loading) {
        return (
            <div className="container">
                <div className="logo-container">
                    <img src={logo} alt="Logo de la aplicación" className="app-logo" />
                </div>
                <h2>Validando token de activación...</h2>
            </div>
        );
    }

    if (!correoElectronico) {
        return (
            <div className="container">
                <div className="logo-container">
                    <img src={logo} alt="Logo de la aplicación" className="app-logo" />
                </div>
                <h2>Token Inválido</h2>
                <p>El token de activación es inválido o ha expirado.</p>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="logo-container">
                <img src={logo} alt="Logo de la aplicación" className="app-logo" />
            </div>
            <h2>Activar Cuenta</h2>
            <p>Inicia sesión con tus credenciales para activar tu cuenta</p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Correo Electrónico</label>
                    <input
                        type="email"
                        name="correoElectronico"
                        value={formData.correoElectronico}
                        onChange={handleChange}
                        required
                        readOnly
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
                        placeholder="Ingresa tu contraseña provisional"
                    />
                </div>
                <button type="submit">Activar Cuenta e Iniciar Sesión</button>
            </form>
        </div>
    );
};

export default ActivateAccount;
