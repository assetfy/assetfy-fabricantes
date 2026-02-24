import React, { useState, useEffect, useRef } from 'react';
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
    const [esEmpresa, setEsEmpresa] = useState(false);
    const [createUser, setCreateUser] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkIds, setBulkIds] = useState([]);
    const [bulkFile, setBulkFile] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const bulkFileRef = useRef(null);

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

    const handleSubmit = async (e) => {
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

    const handleDownloadTemplate = () => {
        const csvContent = 'ID_Inventario\nABC123\n';
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_registro_masivo.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleBulkFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) { setBulkIds([]); setBulkFile(null); return; }
        setBulkFile(file);
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target.result;
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            const dataLines = lines[0] && lines[0].toLowerCase() === 'id_inventario'
                ? lines.slice(1)
                : lines;
            const ids = dataLines.map(l => l.split(',')[0].trim().toUpperCase()).filter(Boolean);
            setBulkIds(ids);
        };
        reader.readAsText(file);
    };

    const handleBulkSubmit = async () => {
        if (!formData.nombreCompleto || !formData.correoElectronico || !formData.telefono) {
            showError('Complete los campos del formulario principal antes de continuar.');
            return;
        }
        if (bulkIds.length === 0) {
            showError('No se encontraron IDs en el archivo.');
            return;
        }
        setBulkLoading(true);
        try {
            const response = await api.post('/public/registro-masivo', {
                nombreCompleto: formData.nombreCompleto,
                correoElectronico: formData.correoElectronico,
                cuil: formData.cuil,
                telefono: formData.telefono,
                ids: bulkIds,
                createUser
            });
            if (response.data.success) {
                showSuccess(response.data.message);
                handleCloseBulkModal();
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al realizar el registro masivo.';
            showError(msg);
        } finally {
            setBulkLoading(false);
        }
    };

    const handleCloseBulkModal = () => {
        setShowBulkModal(false);
        setBulkIds([]);
        setBulkFile(null);
        if (bulkFileRef.current) bulkFileRef.current.value = '';
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

            <div className="form-group form-group-checkbox" style={{ marginBottom: '1.2rem' }}>
                <label>
                    <input
                        type="checkbox"
                        id="esEmpresa"
                        checked={esEmpresa}
                        onChange={(e) => setEsEmpresa(e.target.checked)}
                    />
                    Registrar a nombre de empresa
                </label>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="idInventario">ID de Inventario{esEmpresa ? '' : ' *'}</label>
                    <input
                        type="text"
                        id="idInventario"
                        name="idInventario"
                        value={formData.idInventario}
                        onChange={handleChange}
                        placeholder="Ingrese el ID de inventario de su producto"
                        required={!esEmpresa}
                        maxLength="8"
                        style={{ textTransform: 'uppercase' }}
                    />
                    {esEmpresa ? (
                        <small className="field-help">
                            Si quiere hacer un registro masivo, deje este campo en blanco, complete toda la información y luego siga con el botón Registro masivo de bienes.
                        </small>
                    ) : (
                        <small className="field-help">
                            Encuentre este código en la etiqueta de su producto
                        </small>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="nombreCompleto">{esEmpresa ? 'Razón Social' : 'Nombre Completo'} *</label>
                    <input
                        type="text"
                        id="nombreCompleto"
                        name="nombreCompleto"
                        value={formData.nombreCompleto}
                        onChange={handleChange}
                        placeholder={esEmpresa ? 'Ingrese la razón social de la empresa' : 'Ingrese su nombre completo'}
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
                    <label htmlFor="cuil">{esEmpresa ? 'CUIT' : 'CUIL'}</label>
                    <input
                        type="text"
                        id="cuil"
                        name="cuil"
                        value={formData.cuil}
                        onChange={handleChange}
                        placeholder={esEmpresa ? 'Ingrese el CUIT de la empresa (11 dígitos)' : 'Ingrese su CUIL (11 dígitos)'}
                        maxLength="13"
                    />
                    <small className="field-help">
                        {esEmpresa
                            ? 'Ingrese el CUIT sin guiones (ej: 30123456789).'
                            : 'Ingrese su CUIL sin guiones (ej: 20123456789). Requerido para crear usuario de bienes.'}
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
                    <div className="create-user-toggle">
                        <span>Registrar y Crear usuario</span>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={createUser}
                                onChange={(e) => setCreateUser(e.target.checked)}
                            />
                            <span className="toggle-slider-track"></span>
                        </label>
                    </div>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        style={brandingStyles.primaryButton}
                    >
                        {loading ? 'Registrando...' : 'Registrar'}
                    </button>
                    {esEmpresa && (
                        <button
                            type="button"
                            onClick={() => setShowBulkModal(true)}
                            className="secondary-button"
                        >
                            Registro masivo de bienes
                        </button>
                    )}
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

            {showBulkModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '12px', padding: '2rem',
                        width: '100%', maxWidth: '560px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Registro masivo de bienes</h3>
                            <button onClick={handleCloseBulkModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <p style={{ color: '#555', marginBottom: '1rem' }}>
                            Suba un archivo CSV con una columna de IDs de inventario para registrar múltiples productos a nombre de la empresa.
                        </p>
                        <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className="secondary-button"
                            style={{ marginBottom: '1rem', width: '100%' }}
                        >
                            Descargar plantilla de ejemplo
                        </button>
                        <div className="form-group">
                            <label>Seleccionar archivo CSV</label>
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                ref={bulkFileRef}
                                onChange={handleBulkFileChange}
                                style={{ width: '100%' }}
                            />
                        </div>
                        {bulkIds.length > 0 && (
                            <p style={{ color: '#1a73e8', fontWeight: 'bold', margin: '0.5rem 0 0.5rem' }}>
                                Va a registrar {bulkIds.length} producto/s
                            </p>
                        )}
                        {createUser && (
                            <p className="create-user-mode-note">
                                ⚡ Se creará un usuario de bienes para los productos registrados.
                            </p>
                        )}
                        {bulkFile && bulkIds.length === 0 && (
                            <p style={{ color: '#e53935', margin: '0.5rem 0 1rem' }}>
                                No se encontraron IDs válidos en el archivo.
                            </p>
                        )}
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={handleCloseBulkModal}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleBulkSubmit}
                                disabled={bulkLoading || bulkIds.length === 0}
                                style={brandingStyles.primaryButton}
                            >
                                {bulkLoading ? 'Registrando...' : 'Confirmar registro'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistroFabricante;
