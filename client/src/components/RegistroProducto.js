import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import logo from '../logo.png';
import { useNotification } from './NotificationProvider';

const RegistroProducto = () => {
    const location = useLocation();
    const [formData, setFormData] = useState({
        idInventario: '',
        nombreCompleto: '',
        correoElectronico: '',
        cuil: '',
        telefono: ''
    });
    const [loading, setLoading] = useState(false);
    const [registered, setRegistered] = useState(false);
    const [registrationData, setRegistrationData] = useState(null);
    const { showError, showSuccess } = useNotification();

    // Pre-populate inventory ID from URL parameters
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const idInventario = urlParams.get('idInventario');
        if (idInventario) {
            setFormData(prevData => ({
                ...prevData,
                idInventario: idInventario.trim().toUpperCase()
            }));
        }
    }, [location.search]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e, createUser = false) => {
        e.preventDefault();
        setLoading(true);

        // Validate CUIL is required when creating user
        if (createUser && !formData.cuil) {
            showError('El CUIL es requerido para crear un usuario de bienes.');
            setLoading(false);
            return;
        }

        try {
            const endpoint = createUser ? '/public/registro-con-usuario' : '/public/registro';
            const response = await api.post(endpoint, formData);
            
            if (response.data.success) {
                showSuccess(response.data.message);
                setRegistered(true);
                setRegistrationData(response.data.data);
                // Clear form
                setFormData({
                    idInventario: '',
                    nombreCompleto: '',
                    correoElectronico: '',
                    cuil: '',
                    telefono: ''
                });
            }
        } catch (err) {
            console.error('Error al registrar producto:', err);
            const errorMessage = err.response?.data?.message || 'Error al registrar el producto. Por favor, inténtelo de nuevo.';
            showError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleNewRegistration = () => {
        setRegistered(false);
        setRegistrationData(null);
    };

    if (registered && registrationData) {
        return (
            <div className="container">
                <div className="logo-container">
                    <img src={logo} alt="Logo de la aplicación" className="app-logo" />
                </div>
                <div className="success-message">
                    <h2>¡Producto Registrado Exitosamente!</h2>
                    <div className="registration-details">
                        <p><strong>ID de Inventario:</strong> {registrationData.idInventario}</p>
                        <p><strong>Número de Serie:</strong> {registrationData.numeroSerie}</p>
                        <p><strong>Fecha de Registro:</strong> {new Date(registrationData.fechaRegistro).toLocaleString()}</p>
                    </div>
                    <p className="success-text">
                        Su producto ha sido registrado correctamente. Conserve esta información para futuras referencias.
                    </p>
                    <button onClick={handleNewRegistration} className="btn-primary">
                        Registrar Otro Producto
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="logo-container">
                <img src={logo} alt="Logo de la aplicación" className="app-logo" />
            </div>
            <h2>Registro de Producto</h2>
            <p className="form-description">
                Complete el siguiente formulario para registrar su producto. 
                {formData.idInventario ? 
                    'El ID de inventario ha sido detectado automáticamente desde el código QR.' :
                    'Necesitará el ID de inventario que se encuentra en su producto.'
                }
            </p>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="idInventario">ID de Inventario *</label>
                    <input
                        type="text"
                        id="idInventario"
                        name="idInventario"
                        value={formData.idInventario}
                        onChange={handleChange}
                        placeholder="Ingrese el ID de inventario de su producto"
                        required
                        maxLength="8"
                        style={{ textTransform: 'uppercase' }}
                    />
                    <small className="field-help">
                        Encuentre este código en la etiqueta de su producto
                    </small>
                </div>

                <div className="form-group">
                    <label htmlFor="nombreCompleto">Nombre Completo *</label>
                    <input
                        type="text"
                        id="nombreCompleto"
                        name="nombreCompleto"
                        value={formData.nombreCompleto}
                        onChange={handleChange}
                        placeholder="Ingrese su nombre completo"
                        required
                        maxLength="100"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="correoElectronico">Correo Electrónico *</label>
                    <input
                        type="email"
                        id="correoElectronico"
                        name="correoElectronico"
                        value={formData.correoElectronico}
                        onChange={handleChange}
                        placeholder="ejemplo@correo.com"
                        required
                        maxLength="100"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="cuil">CUIL</label>
                    <input
                        type="text"
                        id="cuil"
                        name="cuil"
                        value={formData.cuil}
                        onChange={handleChange}
                        placeholder="Ingrese su CUIL (11 dígitos)"
                        maxLength="13"
                    />
                    <small className="field-help">
                        Ingrese su CUIL sin guiones (ej: 20123456789). Requerido para crear usuario de bienes.
                    </small>
                </div>

                <div className="form-group">
                    <label htmlFor="telefono">Teléfono *</label>
                    <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="Ingrese su número de teléfono"
                        required
                        maxLength="20"
                    />
                </div>

                <div className="button-group">
                    <button type="button" onClick={(e) => handleSubmit(e, false)} disabled={loading} className="secondary-button">
                        {loading ? 'Registrando...' : 'Registrar'}
                    </button>
                    <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={loading}>
                        {loading ? 'Registrando...' : 'Registrar y Crear Usuario de Bienes'}
                    </button>
                </div>
            </form>

            <div className="form-footer">
                <p>
                    <small>
                        * Campos obligatorios. Si tiene problemas para encontrar el ID de inventario 
                        o el producto no se encuentra, contacte al fabricante.
                    </small>
                </p>
            </div>
        </div>
    );
};

export default RegistroProducto;