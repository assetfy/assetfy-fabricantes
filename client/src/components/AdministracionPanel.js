import React, { useState, useEffect } from 'react';
import ExportacionDatos from './ExportacionDatos';
import ImportacionDatos from './ImportacionDatos';
import UbicacionList from './UbicacionList';
import UbicacionForm from './UbicacionForm';
import UbicacionEditForm from './UbicacionEditForm';
import MarcaList from './MarcaList';
import MarcaForm from './MarcaForm';
import MarcaEditForm from './MarcaEditForm';
import Modal from './Modal';
import Tabs from './Tabs';
import api from '../api';
import { useNotification } from './NotificationProvider';

const AdministracionPanel = ({ fabricantes = [], allMarcas = [], onRefresh }) => {
    const [showCreateUbicacionModal, setShowCreateUbicacionModal] = useState(false);
    const [editingUbicacion, setEditingUbicacion] = useState(null);
    const [showCreateMarcaModal, setShowCreateMarcaModal] = useState(false);
    const [editingMarca, setEditingMarca] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Branding state
    const [brandingFabricantes, setBrandingFabricantes] = useState([]);
    const [selectedFabricanteId, setSelectedFabricanteId] = useState(null);
    const [branding, setBranding] = useState({ portalColor: '#1a73e8', portalLogo: null, slug: '', razonSocial: '' });
    const [brandingLoading, setBrandingLoading] = useState(true);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [savingColor, setSavingColor] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const { showSuccess, showError } = useNotification();

    useEffect(() => {
        api.get('/apoderado/branding')
            .then(res => {
                const list = res.data.fabricantes || [];
                setBrandingFabricantes(list);
                if (list.length > 0 && list[0]._id) {
                    setSelectedFabricanteId(list[0]._id);
                    setBranding(list[0]);
                }
            })
            .catch(() => {})
            .finally(() => setBrandingLoading(false));
    }, []);

    const handleFabricanteSelect = (e) => {
        const id = e.target.value;
        setSelectedFabricanteId(id);
        const fab = brandingFabricantes.find(f => f._id === id);
        if (fab) {
            setBranding(fab);
            setLogoFile(null);
            setLogoPreview(null);
        }
    };

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
        if (onRefresh) {
            onRefresh();
        }
    };

    const handleEditUbicacion = (ubicacion) => {
        setEditingUbicacion(ubicacion);
    };

    const handleCancelEditUbicacion = () => {
        setEditingUbicacion(null);
    };

    const handleUbicacionAdded = () => {
        setShowCreateUbicacionModal(false);
        handleRefresh();
    };

    const handleUbicacionUpdated = () => {
        setEditingUbicacion(null);
        handleRefresh();
    };

    const handleEditMarca = (marca) => {
        setEditingMarca(marca);
    };

    const handleCancelEditMarca = () => {
        setEditingMarca(null);
    };

    const handleMarcaAdded = () => {
        setShowCreateMarcaModal(false);
        handleRefresh();
    };

    const handleMarcaUpdated = () => {
        setEditingMarca(null);
        handleRefresh();
    };

    const handleColorChange = (e) => {
        setBranding(prev => ({ ...prev, portalColor: e.target.value }));
    };

    const handleSaveColor = async () => {
        setSavingColor(true);
        try {
            const res = await api.put('/apoderado/branding', { portalColor: branding.portalColor, fabricanteId: selectedFabricanteId });
            const updatedColor = res.data.portalColor;
            setBranding(prev => ({ ...prev, portalColor: updatedColor }));
            setBrandingFabricantes(prev => prev.map(f =>
                f._id === selectedFabricanteId ? { ...f, portalColor: updatedColor } : f
            ));
            showSuccess('Color del portal actualizado');
        } catch (err) {
            showError('Error al guardar el color');
        } finally {
            setSavingColor(false);
        }
    };

    const handleLogoFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleUploadLogo = async () => {
        if (!logoFile) return;
        setUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append('logo', logoFile);
            const url = selectedFabricanteId
                ? `/apoderado/branding/logo?fabricanteId=${selectedFabricanteId}`
                : '/apoderado/branding/logo';
            const res = await api.post(url, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const updatedLogo = res.data.portalLogo;
            setBranding(prev => ({ ...prev, portalLogo: updatedLogo }));
            setBrandingFabricantes(prev => prev.map(f =>
                f._id === selectedFabricanteId ? { ...f, portalLogo: updatedLogo } : f
            ));
            setLogoFile(null);
            setLogoPreview(null);
            showSuccess('Logo del portal subido exitosamente');
        } catch (err) {
            showError('Error al subir el logo: ' + (err.response?.data || err.message));
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleDeleteLogo = async () => {
        if (!window.confirm('¿Eliminar el logo del portal?')) return;
        try {
            const url = selectedFabricanteId
                ? `/apoderado/branding/logo?fabricanteId=${selectedFabricanteId}`
                : '/apoderado/branding/logo';
            await api.delete(url);
            setBranding(prev => ({ ...prev, portalLogo: null }));
            setBrandingFabricantes(prev => prev.map(f =>
                f._id === selectedFabricanteId ? { ...f, portalLogo: null } : f
            ));
            showSuccess('Logo del portal eliminado');
        } catch (err) {
            showError('Error al eliminar el logo');
        }
    };

    const portalUrl = branding.slug ? `${window.location.origin}/${branding.slug}` : null;

    const handleCopyPortalLink = async () => {
        if (!portalUrl) return;
        try {
            await navigator.clipboard.writeText(portalUrl);
            showSuccess('Link del portal copiado: ' + portalUrl);
        } catch (err) {
            showError('Error al copiar. URL: ' + portalUrl);
        }
    };

    const brandingTab = (
        <div>
            <h3>Portal de Registro - Personalización</h3>
            <p>Configure el logo y el color del portal de registro público de su fabricante.</p>

            {brandingLoading ? (
                <p>Cargando...</p>
            ) : (
                <div style={{ maxWidth: '500px' }}>
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label>Fabricante</label>
                        <select
                            value={selectedFabricanteId || brandingFabricantes[0]?._id || ''}
                            onChange={handleFabricanteSelect}
                            disabled={brandingFabricantes.length <= 1}
                            style={{ width: '100%', opacity: brandingFabricantes.length <= 1 ? 0.6 : 1 }}
                        >
                            {brandingFabricantes.map(f => (
                                <option key={f._id} value={f._id}>{f.razonSocial}</option>
                            ))}
                        </select>
                    </div>

                    {portalUrl && (
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label>URL del portal de registro</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    value={portalUrl}
                                    readOnly
                                    style={{ flex: 1, backgroundColor: '#f5f5f5', cursor: 'pointer' }}
                                    onClick={handleCopyPortalLink}
                                    title="Clic para copiar"
                                />
                                <button className="create-button" onClick={handleCopyPortalLink} title="Copiar URL">
                                    Copiar
                                </button>
                                <button
                                    className="create-button"
                                    onClick={() => window.open(portalUrl, '_blank', 'noopener,noreferrer')}
                                    title="Abrir portal en nueva pestaña"
                                >
                                    Abrir portal
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label>Color del portal</label>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input
                                type="color"
                                value={branding.portalColor}
                                onChange={handleColorChange}
                                style={{ width: '48px', height: '36px', cursor: 'pointer', border: 'none', padding: 0 }}
                            />
                            <input
                                type="text"
                                value={branding.portalColor}
                                onChange={handleColorChange}
                                placeholder="#1a73e8"
                                maxLength="7"
                                style={{ width: '120px' }}
                            />
                            <button
                                className="create-button"
                                onClick={handleSaveColor}
                                disabled={savingColor}
                            >
                                {savingColor ? 'Guardando...' : 'Guardar color'}
                            </button>
                        </div>
                        <div style={{
                            marginTop: '8px',
                            padding: '12px',
                            backgroundColor: branding.portalColor,
                            borderRadius: '4px',
                            color: '#fff',
                            textAlign: 'center',
                            fontSize: '13px'
                        }}>
                            Vista previa del color del portal
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label>Logo del portal</label>
                        {branding.portalLogo?.url && (
                            <div style={{ marginBottom: '12px' }}>
                                <img
                                    src={branding.portalLogo.url}
                                    alt="Logo del portal"
                                    style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain', display: 'block', marginBottom: '8px' }}
                                />
                                <button
                                    className="delete-button"
                                    onClick={handleDeleteLogo}
                                    style={{ fontSize: '12px' }}
                                >
                                    Eliminar logo
                                </button>
                            </div>
                        )}
                        {logoPreview && (
                            <div style={{ marginBottom: '8px' }}>
                                <img
                                    src={logoPreview}
                                    alt="Preview"
                                    style={{ maxHeight: '60px', maxWidth: '160px', objectFit: 'contain', display: 'block' }}
                                />
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/gif"
                                onChange={handleLogoFileChange}
                                style={{ flex: 1 }}
                            />
                            {logoFile && (
                                <button
                                    className="create-button"
                                    onClick={handleUploadLogo}
                                    disabled={uploadingLogo}
                                >
                                    {uploadingLogo ? 'Subiendo...' : 'Subir logo'}
                                </button>
                            )}
                        </div>
                        <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                            Formatos: JPG, PNG, GIF. Máximo 2MB.
                        </small>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="administracion-panel">
            <h3>Administración</h3>
            <p>Gestiona la importación y exportación de datos de tu sistema.</p>
            
            <Tabs
                defaultTab={0}
                tabs={[
                    {
                        label: "Exportación de Datos",
                        content: <ExportacionDatos />
                    },
                    {
                        label: "Importación de Datos", 
                        content: <ImportacionDatos />
                    },
                    {
                        label: "Ubicaciones / Depósitos",
                        content: (
                            <>
                                <div className="list-container">
                                    <div className="section-header">
                                        <h3>Gestión de Ubicaciones / Depósitos</h3>
                                        <button 
                                            className="create-button"
                                            onClick={() => setShowCreateUbicacionModal(true)}
                                        >
                                            Crear Ubicación / Depósito
                                        </button>
                                    </div>
                                </div>
                                <UbicacionList 
                                    refreshTrigger={refreshKey} 
                                    onEdit={handleEditUbicacion} 
                                />
                            </>
                        )
                    },
                    {
                        label: "Marcas",
                        content: (
                            <>
                                <div className="list-container">
                                    <div className="section-header">
                                        <h3>Gestión de Marcas</h3>
                                        <button 
                                            className="create-button"
                                            onClick={() => setShowCreateMarcaModal(true)}
                                        >
                                            Crear Marca
                                        </button>
                                    </div>
                                </div>
                                <MarcaList 
                                    refreshTrigger={refreshKey} 
                                    onEdit={handleEditMarca} 
                                />
                            </>
                        )
                    },
                    {
                        label: "Portal de Registro",
                        content: brandingTab
                    }
                ]}
            />

            {/* Modals */}
            <Modal 
                isOpen={showCreateUbicacionModal} 
                onClose={() => setShowCreateUbicacionModal(false)}
                title="Crear Nueva Ubicación / Depósito"
            >
                <UbicacionForm 
                    onUbicacionAdded={handleUbicacionAdded}
                    fabricantes={fabricantes}
                />
            </Modal>

            <Modal 
                isOpen={!!editingUbicacion} 
                onClose={handleCancelEditUbicacion}
                title="Editar Ubicación / Depósito"
            >
                {editingUbicacion && (
                    <UbicacionEditForm 
                        ubicacion={editingUbicacion}
                        fabricantes={fabricantes}
                        onUbicacionUpdated={handleUbicacionUpdated}
                        onCancel={handleCancelEditUbicacion}
                    />
                )}
            </Modal>

            <Modal 
                isOpen={showCreateMarcaModal} 
                onClose={() => setShowCreateMarcaModal(false)}
                title="Crear Nueva Marca"
            >
                <MarcaForm 
                    onMarcaAdded={handleMarcaAdded}
                    fabricantes={fabricantes}
                />
            </Modal>

            <Modal 
                isOpen={!!editingMarca} 
                onClose={handleCancelEditMarca}
                title="Editar Marca"
            >
                {editingMarca && (
                    <MarcaEditForm
                        marca={editingMarca}
                        fabricantes={fabricantes}
                        onEditFinished={handleMarcaUpdated}
                        onCancelEdit={handleCancelEditMarca}
                    />
                )}
            </Modal>
        </div>
    );
};

export default AdministracionPanel;