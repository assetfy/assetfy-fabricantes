import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import logo from '../logo.png';
// login-bg.svg is imported as a JS module so webpack resolves and hashes the asset
// path correctly in every environment (dev, production build, Express-served build).
// This is more reliable than the CSS url('./login-bg.svg') approach which depends on
// the CSS loader configuration.  If you want to switch to an alternative image format
// (e.g. PNG or WebP for better browser compatibility) replace this import with the
// new file and update the filename accordingly (e.g. '../login-bg.png').
// Key parameters to check if the image fails to load:
//   - File: client/src/login-bg.svg  (source asset processed by webpack)
//   - CSS rule: .login-page::before { background-image: var(--login-bg-image) } in index.css
//   - Inline style: style={{ '--login-bg-image': `url(${loginBg})` }} on .login-page div
//   - Alternative: if SVG rendering is broken, swap to login-bg.png (convert with any
//     image editor) and change the import below.
import loginBg from '../login-bg.svg';
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
            
            // Determine which panel to navigate to based on roles.
            // If the user has access to multiple panels and 'apoderado' is one of them,
            // default to the Fabricantes panel (apoderado). This covers users who have
            // both admin+apoderado or apoderado+other roles.
            // Only go to /admin when the user has admin but NOT apoderado.
            const roles = res.data.roles || [];
            const primaryRole = res.data.rol;

            const hasApoderado = roles.includes('apoderado') || primaryRole === 'apoderado';
            const hasAdmin = roles.includes('admin') || primaryRole === 'admin';
            const hasUsuario = roles.includes('usuario_bienes') || primaryRole === 'usuario_bienes';

            if (hasApoderado) {
                // Apoderado (Fabricantes) is the default panel for any user who has it,
                // including users who also have admin access.
                navigate('/apoderado');
            } else if (hasAdmin) {
                navigate('/admin');
            } else if (hasUsuario) {
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
        <div className="login-page" style={{ '--login-bg-image': `url(${loginBg})` }}>
            <div className="login-card">
                <div className="login-logo-container">
                    <img src={logo} alt="Logo de la aplicación" className="login-logo" />
                </div>
                <h2 className="login-title">Iniciar Sesión</h2>
                <p className="login-subtitle">
                    Coloca tu usuario y contraseña para entrar a tu panel de <span className="login-brand">AssetFy</span>.
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Correo electrónico</label>
                        <div className="login-input-wrapper">
                            <span className="login-input-icon">&#9993;</span>
                            <input
                                type="email"
                                name="correoElectronico"
                                value={formData.correoElectronico}
                                onChange={handleChange}
                                placeholder="correo@ejemplo.com"
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <div className="login-input-wrapper">
                            <span className="login-input-icon">&#128274;</span>
                            <input
                                type="password"
                                name="contrasena"
                                value={formData.contrasena}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="login-submit-btn">INICIAR SESIÓN →</button>
                </form>
            </div>
        </div>
    );
};

export default Login;