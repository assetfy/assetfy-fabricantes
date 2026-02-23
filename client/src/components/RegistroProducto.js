import React, { useState, useEffect, useRef } from 'react';
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

    // Company registration states
    const [esEmpresa, setEsEmpresa] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkIds, setBulkIds] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const fileInputRef = useRef(null);

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

    const handleEsEmpresaChange = (e) => {
        setEsEmpresa(e.target.checked);
        if (!e.target.checked) {
            setShowBulkModal(false);
            setBulkIds([]);
        }
    };

    const handleSubmit = async (e, createUser = false) => {
        e.preventDefault();
        setLoading(true);

        // Validate CUIL/CUIT is required when creating user
        if (createUser && !formData.cuil) {
            showError(`El ${esEmpresa ? 'CUIT' : 'CUIL'} es requerido para crear un usuario de bienes.`);
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

    const handleDownloadTemplate = () => {
        const csvContent = 'idInventario\n';
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'plantilla_registro_masivo.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setBulkIds([]);
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
            // Skip header row if present
            const ids = lines.filter(line => line.toLowerCase() !== 'idinventario');
            setBulkIds(ids);
        };
        reader.readAsText(file);
    };

    const handleBulkRegister = async () => {
        if (!bulkIds.length) return;

        if (!formData.nombreCompleto || !formData.correoElectronico || !formData.cuil || !formData.telefono) {
            showError('Complete todos los campos del formulario antes de hacer un registro masivo.');
            return;
        }

        setBulkLoading(true);
        try {
            const response = await api.post('/public/registro-masivo', {
                idsInventario: bulkIds,
                razonSocial: formData.nombreCompleto,
                correoElectronico: formData.correoElectronico,
                cuit: formData.cuil,
                telefono: formData.telefono
            });

            if (response.data.success) {
                const { data } = response.data;
                let msg = response.data.message;
                if (data.yaRegistrados.length > 0) msg += ` (${data.yaRegistrados.length} ya estaban registrados)`;
                if (data.noEncontrados.length > 0) msg += ` (${data.noEncontrados.length} no encontrados)`;
                showSuccess(msg);
                setShowBulkModal(false);
                setBulkIds([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Error en el registro masivo.';
            showError(errorMessage);
        } finally {
            setBulkLoading(false);
        }
    };

    const nombreLabel = esEmpresa ? 'Razón Social' : 'Nombre Completo';
    const cuilLabel = esEmpresa ? 'CUIT' : 'CUIL';
    const nombrePlaceholder = esEmpresa ? 'Ingrese la razón social de la empresa' : 'Ingrese su nombre completo';
    const cuilPlaceholder = esEmpresa ? 'Ingrese el CUIT (11 dígitos)' : 'Ingrese su CUIL (11 dígitos)';

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

            <div className="form-group form-group-checkbox">
                <label>
                    <input
                        type="checkbox"
                        checked={esEmpresa}
                        onChange={handleEsEmpresaChange}
                    />
                    Registrar a nombre de empresa
                </label>
            </div>
            
            <form onSubmit={handleSubmit}>
                {!esEmpresa && (
                    <div className="form-group">
                        <label htmlFor="idInventario">ID de Inventario *</label>
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
                        <small className="field-help">
                            Encuentre este código en la etiqueta de su producto
                        </small>
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="nombreCompleto">{nombreLabel} *</label>
                    <input
                        type="text"
                        id="nombreCompleto"
                        name="nombreCompleto"
                        value={formData.nombreCompleto}
                        onChange={handleChange}
                        placeholder={nombrePlaceholder}
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
                    <label htmlFor="cuil">{cuilLabel}</label>
                    <input
                        type="text"
                        id="cuil"
                        name="cuil"
                        value={formData.cuil}
                        onChange={handleChange}
                        placeholder={cuilPlaceholder}
                        maxLength="13"
                    />
                    <small className="field-help">
                        Ingrese {esEmpresa ? 'el CUIT' : 'su CUIL'} sin guiones (ej: 20123456789).{!esEmpresa && ' Requerido para crear usuario de bienes.'}
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

                {esEmpresa && (
                    <div className="form-group">
                        <button
                            type="button"
                            className="bulk-register-btn"
                            onClick={() => setShowBulkModal(true)}
                        >
                            📋 Registro masivo de bienes
                        </button>
                    </div>
                )}

                <div className="button-group">
                    <button type="button" onClick={(e) => handleSubmit(e, false)} disabled={loading} className="secondary-button">
                        {loading ? 'Registrando...' : 'Registrar'}
                    </button>
                    {!esEmpresa && (
                        <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={loading}>
                            {loading ? 'Registrando...' : 'Registrar y Crear Usuario de Bienes'}
                        </button>
                    )}
                </div>
            </form>

            {/* Bulk Registration Modal */}
            {showBulkModal && (
                <div className="bulk-modal-overlay" onClick={() => setShowBulkModal(false)}>
                    <div className="bulk-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="bulk-modal-header">
                            <h3>Registro masivo de bienes</h3>
                            <button className="modal-close" onClick={() => setShowBulkModal(false)}>×</button>
                        </div>
                        <div className="bulk-modal-body">
                            <p>Descargue la plantilla de ejemplo, complete los IDs de inventario (uno por fila) y luego súbala aquí para registrar todos los productos a nombre de la empresa.</p>
                            <button type="button" onClick={handleDownloadTemplate} className="template-button">
                                ⬇ Descargar plantilla de ejemplo
                            </button>
                            <div className="form-group" style={{ marginTop: '1.25rem' }}>
                                <label>Seleccionar archivo CSV *</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={handleFileChange}
                                    style={{ display: 'block', marginTop: '0.5rem' }}
                                />
                            </div>
                            {bulkIds.length > 0 && (
                                <div className="bulk-preview">
                                    <p>Va a registrar <strong>{bulkIds.length}</strong> producto/s</p>
                                </div>
                            )}
                        </div>
                        <div className="bulk-modal-footer">
                            <button type="button" onClick={() => setShowBulkModal(false)} className="cancel-btn">
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleBulkRegister}
                                disabled={bulkLoading || bulkIds.length === 0}
                                className="submit-btn"
                            >
                                {bulkLoading ? 'Registrando...' : 'Confirmar registro masivo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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