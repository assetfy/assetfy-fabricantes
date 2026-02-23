import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Navigate } from 'react-router-dom';
import api from '../api';
import logo from '../logo.png';
import { useNotification } from './NotificationProvider';

const RegistroFabricante = () => {
    const { slug } = useParams();
    const location = useLocation();
    const { showError, showSuccess } = useNotification();

    const [branding, setBranding] = useState(null);
    const [brandingLoading, setBrandingLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

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

    // Fetch fabricante branding
    useEffect(() => {
        let cancelled = false;
        const fetchBranding = async () => {
            try {
                const res = await api.get(`/public/fabricante/${slug}`);
                if (cancelled) return;
                if (res.data.success) {
                    setBranding(res.data.fabricante);
                } else {
                    setNotFound(true);
                }
            } catch (err) {
                if (!cancelled) setNotFound(true);
            } finally {
                if (!cancelled) setBrandingLoading(false);
            }
        };
        fetchBranding();
        return () => { cancelled = true; };
    }, [slug]);

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
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e, createUser = false) => {
        e.preventDefault();
        setLoading(true);

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

    if (brandingLoading) {
        return <p style={{ textAlign: 'center', marginTop: '40px' }}>Cargando...</p>;
    }

    if (notFound) {
        return <Navigate to="/registro" replace />;
    }

    const primaryColor = branding?.portalColor || '#1a73e8';
    const logoUrl = branding?.portalLogo?.url || null;
    const fabricanteName = branding?.razonSocial || '';

    const brandingStyles = {
        container: {
            '--primary-color': primaryColor,
            '--primary-dark': primaryColor,
        },
        header: {
            backgroundColor: primaryColor,
            padding: '20px',
            textAlign: 'center',
            marginBottom: '0',
        },
        headerLogo: {
            maxHeight: '80px',
            maxWidth: '200px',
            objectFit: 'contain',
        },
        headerText: {
            color: '#ffffff',
            margin: '8px 0 0',
            fontSize: '14px',
            opacity: 0.9,
        },
        primaryButton: {
            backgroundColor: primaryColor,
            borderColor: primaryColor,
        },
    };

    if (registered && registrationData) {
        return (
            <div className="container">
                <div style={brandingStyles.header}>
                    <img
                        src={logoUrl || logo}
                        alt={`Logo ${fabricanteName}`}
                        style={brandingStyles.headerLogo}
                    />
                    {fabricanteName && (
                        <p style={brandingStyles.headerText}>{fabricanteName}</p>
                    )}
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
                    <button
                        onClick={handleNewRegistration}
                        className="btn-primary"
                        style={brandingStyles.primaryButton}
                    >
                        Registrar Otro Producto
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div style={brandingStyles.header}>
                <img
                    src={logoUrl || logo}
                    alt={`Logo ${fabricanteName}`}
                    style={brandingStyles.headerLogo}
                />
                {fabricanteName && (
                    <p style={brandingStyles.headerText}>{fabricanteName}</p>
                )}
            </div>
            <h2>Registro de Producto</h2>
            <p className="form-description">
                Complete el siguiente formulario para registrar su producto.
                {formData.idInventario ?
                    ' El ID de inventario ha sido detectado automáticamente desde el código QR.' :
                    ' Necesitará el ID de inventario que se encuentra en su producto.'
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
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e, false)}
                        disabled={loading}
                        className="secondary-button"
                    >
                        {loading ? 'Registrando...' : 'Registrar'}
                    </button>
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e, true)}
                        disabled={loading}
                        style={brandingStyles.primaryButton}
                    >
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

export default RegistroFabricante;
