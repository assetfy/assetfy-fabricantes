import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import logo from '../logo.png';
import { useNotification } from './NotificationProvider';

const SolicitudRepresentacionForm = () => {
    const { slug } = useParams();
    const { showError, showSuccess } = useNotification();

    const [branding, setBranding] = useState(null);
    const [brandingLoading, setBrandingLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [formData, setFormData] = useState({
        razonSocial: '',
        nombre: '',
        cuit: '',
        correo: '',
        telefono: '',
        direccion: '',
        provincia: '',
        mensaje: ''
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/public/solicitud-representacion', {
                ...formData,
                slug
            });

            if (response.data.success) {
                showSuccess(response.data.message);
                setSubmitted(true);
            }
        } catch (err) {
            console.error('Error al enviar solicitud:', err);
            const errorMessage = err.response?.data?.message || 'Error al enviar la solicitud. Por favor, inténtelo de nuevo.';
            showError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (brandingLoading) {
        return <div className="container"><p>Cargando...</p></div>;
    }

    if (notFound) {
        return (
            <div className="container">
                <h2>Portal no encontrado</h2>
                <p>El portal de este fabricante no existe o está deshabilitado.</p>
            </div>
        );
    }

    const fabricanteName = branding?.razonSocial || '';
    const primaryColor = branding?.portalColor || '#1a73e8';
    const logoUrl = branding?.portalLogo?.url || null;

    const brandingStyles = {
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

    if (submitted) {
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
                    <h2>Solicitud Enviada</h2>
                    <p className="success-text">
                        Su solicitud de representación ha sido enviada exitosamente. El fabricante revisará su solicitud y se pondrá en contacto con usted.
                    </p>
                    <button
                        onClick={() => { setSubmitted(false); setFormData({ razonSocial: '', nombre: '', cuit: '', correo: '', telefono: '', direccion: '', provincia: '', mensaje: '' }); }}
                        className="btn-primary"
                        style={brandingStyles.primaryButton}
                    >
                        Enviar otra solicitud
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
            <h2>Solicitud de Representación</h2>
            <p className="form-description">
                Complete el siguiente formulario para solicitar ser representante oficial de {fabricanteName || 'este fabricante'}.
            </p>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="razonSocial">Razón Social *</label>
                    <input
                        type="text"
                        id="razonSocial"
                        name="razonSocial"
                        value={formData.razonSocial}
                        onChange={handleChange}
                        required
                        placeholder="Nombre de la empresa"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="nombre">Nombre del Contacto *</label>
                    <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        placeholder="Nombre y apellido"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="cuit">CUIT *</label>
                    <input
                        type="text"
                        id="cuit"
                        name="cuit"
                        value={formData.cuit}
                        onChange={handleChange}
                        required
                        placeholder="XX-XXXXXXXX-X"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="correo">Correo Electrónico *</label>
                    <input
                        type="email"
                        id="correo"
                        name="correo"
                        value={formData.correo}
                        onChange={handleChange}
                        required
                        placeholder="correo@ejemplo.com"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="telefono">Teléfono *</label>
                    <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        required
                        placeholder="+54 11 1234-5678"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="direccion">Dirección</label>
                    <input
                        type="text"
                        id="direccion"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleChange}
                        placeholder="Dirección de la empresa"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="provincia">Provincia</label>
                    <select
                        id="provincia"
                        name="provincia"
                        value={formData.provincia}
                        onChange={handleChange}
                    >
                        <option value="">Seleccione una provincia</option>
                        <option value="Buenos Aires">Buenos Aires</option>
                        <option value="CABA">CABA</option>
                        <option value="Catamarca">Catamarca</option>
                        <option value="Chaco">Chaco</option>
                        <option value="Chubut">Chubut</option>
                        <option value="Córdoba">Córdoba</option>
                        <option value="Corrientes">Corrientes</option>
                        <option value="Entre Ríos">Entre Ríos</option>
                        <option value="Formosa">Formosa</option>
                        <option value="Jujuy">Jujuy</option>
                        <option value="La Pampa">La Pampa</option>
                        <option value="La Rioja">La Rioja</option>
                        <option value="Mendoza">Mendoza</option>
                        <option value="Misiones">Misiones</option>
                        <option value="Neuquén">Neuquén</option>
                        <option value="Río Negro">Río Negro</option>
                        <option value="Salta">Salta</option>
                        <option value="San Juan">San Juan</option>
                        <option value="San Luis">San Luis</option>
                        <option value="Santa Cruz">Santa Cruz</option>
                        <option value="Santa Fe">Santa Fe</option>
                        <option value="Santiago del Estero">Santiago del Estero</option>
                        <option value="Tierra del Fuego">Tierra del Fuego</option>
                        <option value="Tucumán">Tucumán</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="mensaje">Mensaje (opcional)</label>
                    <textarea
                        id="mensaje"
                        name="mensaje"
                        value={formData.mensaje}
                        onChange={handleChange}
                        placeholder="Cuéntenos por qué desea ser representante de este fabricante..."
                        rows="4"
                        style={{ width: '100%', resize: 'vertical' }}
                    />
                </div>

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                    style={brandingStyles.primaryButton}
                >
                    {loading ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
            </form>
        </div>
    );
};

export default SolicitudRepresentacionForm;
