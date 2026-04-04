import React, { useState, useEffect } from 'react';
import ImportacionDatos from './ImportacionDatos';
import UbicacionList from './UbicacionList';
import UbicacionForm from './UbicacionForm';
import UbicacionEditForm from './UbicacionEditForm';
import MarcaList from './MarcaList';
import MarcaForm from './MarcaForm';
import MarcaEditForm from './MarcaEditForm';
import WarrantyList from './WarrantyList';
import WarrantyManagerForm from './WarrantyManagerForm';
import WarrantyDetails from './WarrantyDetails';
import ChecklistConfigList from './ChecklistConfigList';
import ChecklistConfigForm from './ChecklistConfigForm';
import ChecklistConfigEditForm from './ChecklistConfigEditForm';
import Modal from './Modal';
import Tabs from './Tabs';
import api from '../api';
import { useNotification } from './NotificationProvider';

const AdministracionPanel = ({ fabricantes = [], allMarcas = [], garantias = [], onRefresh }) => {
    const [showCreateUbicacionModal, setShowCreateUbicacionModal] = useState(false);
    const [editingUbicacion, setEditingUbicacion] = useState(null);
    const [showCreateMarcaModal, setShowCreateMarcaModal] = useState(false);
    const [editingMarca, setEditingMarca] = useState(null);
    const [showCreateGarantiaModal, setShowCreateGarantiaModal] = useState(false);
    const [showEditGarantiaModal, setShowEditGarantiaModal] = useState(false);
    const [showViewGarantiaModal, setShowViewGarantiaModal] = useState(false);
    const [selectedGarantia, setSelectedGarantia] = useState(null);
    const [showCreateChecklistItemModal, setShowCreateChecklistItemModal] = useState(false);
    const [editingChecklistItem, setEditingChecklistItem] = useState(null);
    const [editingChecklistFabricanteId, setEditingChecklistFabricanteId] = useState(null);
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

    // Configuración general state
    const [configFabricantes, setConfigFabricantes] = useState([]);
    const [selectedConfigFabricanteId, setSelectedConfigFabricanteId] = useState(null);
    const [stockBajoUmbral, setStockBajoUmbral] = useState(3);
    const [rangoNuevos, setRangoNuevos] = useState('ultimo_mes');
    const [configLoading, setConfigLoading] = useState(true);
    const [umbralGarantiaPorVencer, setUmbralGarantiaPorVencer] = useState('1_mes');
    const [savingConfig, setSavingConfig] = useState(false);

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

    useEffect(() => {
        api.get('/apoderado/configuracion')
            .then(res => {
                const list = res.data.fabricantes || [];
                setConfigFabricantes(list);
                if (list.length > 0) {
                    setSelectedConfigFabricanteId(list[0]._id);
                    setStockBajoUmbral(list[0].stockBajoUmbral != null ? list[0].stockBajoUmbral : 3);
                    setRangoNuevos(list[0].rangoNuevos || 'ultimo_mes');
                    setUmbralGarantiaPorVencer(list[0].umbralGarantiaPorVencer || '1_mes');
                }
            })
            .catch(() => {})
            .finally(() => setConfigLoading(false));
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

    // Checklist config handlers
    const handleEditChecklistItem = (item, fabricanteId) => {
        setEditingChecklistItem(item);
        setEditingChecklistFabricanteId(fabricanteId);
    };

    const handleCancelEditChecklistItem = () => {
        setEditingChecklistItem(null);
        setEditingChecklistFabricanteId(null);
    };

    const handleChecklistItemAdded = () => {
        setShowCreateChecklistItemModal(false);
        handleRefresh();
    };

    const handleChecklistItemUpdated = () => {
        setEditingChecklistItem(null);
        setEditingChecklistFabricanteId(null);
        handleRefresh();
    };

    // Warranty handlers
    const handleEditGarantia = (garantia) => {
        setSelectedGarantia(garantia);
        setShowEditGarantiaModal(true);
    };

    const handleViewGarantia = (garantia) => {
        setSelectedGarantia(garantia);
        setShowViewGarantiaModal(true);
    };

    const handleDeleteGarantia = async (garantia) => {
        if (window.confirm(`¿Está seguro de que desea eliminar la garantía "${garantia.nombre}"?`)) {
            try {
                await api.delete(`/apoderado/garantias/${garantia._id}`);
                handleRefresh();
            } catch (err) {
                console.error('Error al eliminar garantía:', err);
                alert('Error al eliminar la garantía');
            }
        }
    };

    const handleCancelEditGarantia = () => {
        setShowEditGarantiaModal(false);
        setSelectedGarantia(null);
    };

    const handleCancelViewGarantia = () => {
        setShowViewGarantiaModal(false);
        setSelectedGarantia(null);
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

    const handleConfigFabricanteSelect = (e) => {
        const id = e.target.value;
        setSelectedConfigFabricanteId(id);
        const fab = configFabricantes.find(f => f._id === id);
        if (fab) {
            setStockBajoUmbral(fab.stockBajoUmbral != null ? fab.stockBajoUmbral : 3);
            setRangoNuevos(fab.rangoNuevos || 'ultimo_mes');
            setUmbralGarantiaPorVencer(fab.umbralGarantiaPorVencer || '1_mes');
        }
    };

    const handleSaveConfig = async () => {
        setSavingConfig(true);
        try {
            const res = await api.put('/apoderado/configuracion', {
                fabricanteId: selectedConfigFabricanteId,
                stockBajoUmbral,
                rangoNuevos,
                umbralGarantiaPorVencer
            });
            const updatedUmbral = res.data.stockBajoUmbral;
            const updatedRango = res.data.rangoNuevos;
            const updatedUmbralGarantia = res.data.umbralGarantiaPorVencer;
            setConfigFabricantes(prev => prev.map(f =>
                f._id === selectedConfigFabricanteId ? { ...f, stockBajoUmbral: updatedUmbral, rangoNuevos: updatedRango, umbralGarantiaPorVencer: updatedUmbralGarantia } : f
            ));
            showSuccess('Configuración guardada');
        } catch (err) {
            showError('Error al guardar la configuración');
        } finally {
            setSavingConfig(false);
        }
    };

    const configuracionTab = (
        <div>
            <h3>Configuración general</h3>
            <p>Configure los parámetros generales de su fabricante.</p>

            {configLoading ? (
                <p>Cargando...</p>
            ) : (
                <div style={{ maxWidth: '500px' }}>
                    {configFabricantes.length > 1 && (
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label>Fabricante</label>
                            <select
                                value={selectedConfigFabricanteId || ''}
                                onChange={handleConfigFabricanteSelect}
                                style={{ width: '100%' }}
                            >
                                {configFabricantes.map(f => (
                                    <option key={f._id} value={f._id}>{f.razonSocial}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label>Stock bajo — umbral mínimo</label>
                        <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 8px 0' }}>
                            Se considera stock bajo cuando la cantidad de unidades en inventario es menor o igual a este número. Los contadores del dashboard mostrarán los productos y repuestos con stock bajo basándose en este valor.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input
                                type="number"
                                min="0"
                                value={stockBajoUmbral}
                                onChange={e => setStockBajoUmbral(Number(e.target.value))}
                                style={{ width: '100px' }}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label>Rango de nuevos clientes / productos registrados</label>
                        <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 8px 0' }}>
                            Se considera "nuevo" a un cliente o producto registrado dentro del período seleccionado. El dashboard mostrará los contadores de nuevos clientes y nuevos productos registrados en base a este rango.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <select
                                value={rangoNuevos}
                                onChange={e => setRangoNuevos(e.target.value)}
                                style={{ width: '250px' }}
                            >
                                <option value="ultima_semana">Última semana</option>
                                <option value="ultimas_2_semanas">Últimas 2 semanas</option>
                                <option value="ultimo_mes">Último mes</option>
                                <option value="ultimos_2_meses">Últimos 2 meses</option>
                                <option value="ultimos_3_meses">Últimos 3 meses</option>
                                <option value="ultimos_6_meses">Últimos 6 meses</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label>Umbral de garantías por vencer</label>
                        <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 8px 0' }}>
                            Considerar garantías por vencer cuando falten menos de este período para la fecha de vencimiento. Las alertas y contadores del panel de notificaciones se calcularán en base a este valor.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <select
                                value={umbralGarantiaPorVencer}
                                onChange={e => setUmbralGarantiaPorVencer(e.target.value)}
                                style={{ width: '250px' }}
                            >
                                <option value="2_semanas">2 semanas</option>
                                <option value="3_semanas">3 semanas</option>
                                <option value="1_mes">1 mes</option>
                                <option value="2_meses">2 meses</option>
                                <option value="3_meses">3 meses</option>
                            </select>
                        </div>
                    </div>

                    <button
                        className="create-button"
                        onClick={handleSaveConfig}
                        disabled={savingConfig}
                    >
                        {savingConfig ? 'Guardando...' : 'Guardar configuración'}
                    </button>
                </div>
            )}
        </div>
    );

    const portalUrl = branding.slug ? `${window.location.origin}/${branding.slug}` : null;
    const portalRepresentacionUrl = branding.slug ? `${window.location.origin}/${branding.slug}/representacion` : null;

    const handleCopyRepresentacionLink = async () => {
        if (!portalRepresentacionUrl) return;
        try {
            await navigator.clipboard.writeText(portalRepresentacionUrl);
            showSuccess('Link del portal de representación copiado: ' + portalRepresentacionUrl);
        } catch (err) {
            showError('Error al copiar. URL: ' + portalRepresentacionUrl);
        }
    };

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

                    {portalRepresentacionUrl && (
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label>URL del portal de solicitud de representación</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    value={portalRepresentacionUrl}
                                    readOnly
                                    style={{ flex: 1, backgroundColor: '#f5f5f5', cursor: 'pointer' }}
                                    onClick={handleCopyRepresentacionLink}
                                    title="Clic para copiar"
                                />
                                <button className="create-button" onClick={handleCopyRepresentacionLink} title="Copiar URL">
                                    Copiar
                                </button>
                                <button
                                    className="create-button"
                                    onClick={() => window.open(portalRepresentacionUrl, '_blank', 'noopener,noreferrer')}
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
                        label: "Configuración general",
                        content: configuracionTab
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
                                            +
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
                                            +
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
                        label: "Tipos de Garantías",
                        content: (
                            <>
                                <div className="list-container">
                                    <div className="section-header">
                                        <h3>Tipos de Garantías</h3>
                                        <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '13px' }}>
                                            Configure los tipos de garantías disponibles para asignar a los productos.
                                        </p>
                                        <button 
                                            className="create-button"
                                            onClick={() => setShowCreateGarantiaModal(true)}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                <WarrantyList 
                                    garantias={garantias}
                                    onEdit={handleEditGarantia}
                                    onDelete={handleDeleteGarantia}
                                    onView={handleViewGarantia}
                                />
                            </>
                        )
                    },
                    {
                        label: "Portal de Registro",
                        content: brandingTab
                    },
                    {
                        label: "Checklist Representantes",
                        content: (
                            <>
                                <div className="list-container">
                                    <div className="section-header">
                                        <h3>Checklist Representantes</h3>
                                        <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '13px' }}>
                                            Configure los items del checklist que se mostrarán al crear o editar un representante.
                                        </p>
                                        <button
                                            className="create-button"
                                            onClick={() => setShowCreateChecklistItemModal(true)}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                <ChecklistConfigList
                                    refreshTrigger={refreshKey}
                                    onEdit={handleEditChecklistItem}
                                />
                            </>
                        )
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

            {/* Warranty type modals */}
            <Modal 
                isOpen={showCreateGarantiaModal} 
                onClose={() => setShowCreateGarantiaModal(false)}
                title="Crear Tipo de Garantía"
            >
                <WarrantyManagerForm
                    fabricantes={fabricantes}
                    marcas={allMarcas}
                    onSubmit={async (formData) => {
                        try {
                            await api.post('/apoderado/garantias/add', formData);
                            setShowCreateGarantiaModal(false);
                            handleRefresh();
                        } catch (err) {
                            console.error('Error al crear garantía:', err);
                            alert('Error al crear la garantía');
                        }
                    }}
                    onCancel={() => setShowCreateGarantiaModal(false)}
                    isEditing={false}
                />
            </Modal>

            <Modal 
                isOpen={showEditGarantiaModal} 
                onClose={handleCancelEditGarantia}
                title="Editar Tipo de Garantía"
            >
                {selectedGarantia && (
                    <WarrantyManagerForm
                        garantia={selectedGarantia}
                        fabricantes={fabricantes}
                        marcas={allMarcas}
                        onSubmit={async (formData) => {
                            try {
                                await api.put(`/apoderado/garantias/${selectedGarantia._id}`, formData);
                                setShowEditGarantiaModal(false);
                                setSelectedGarantia(null);
                                handleRefresh();
                            } catch (err) {
                                console.error('Error al actualizar garantía:', err);
                                alert('Error al actualizar la garantía');
                            }
                        }}
                        onCancel={handleCancelEditGarantia}
                        isEditing={true}
                    />
                )}
            </Modal>

            <Modal 
                isOpen={showViewGarantiaModal} 
                onClose={handleCancelViewGarantia}
                title={selectedGarantia ? `Detalles de Garantía: ${selectedGarantia.nombre}` : "Ver Garantía"}
                size="large"
            >
                {selectedGarantia && (
                    <WarrantyDetails
                        garantia={selectedGarantia}
                        onClose={handleCancelViewGarantia}
                    />
                )}
            </Modal>

            {/* Checklist config modals */}
            <Modal
                isOpen={showCreateChecklistItemModal}
                onClose={() => setShowCreateChecklistItemModal(false)}
                title="Crear Item de Checklist"
            >
                <ChecklistConfigForm
                    onItemAdded={handleChecklistItemAdded}
                    fabricantes={fabricantes}
                />
            </Modal>

            <Modal
                isOpen={!!editingChecklistItem}
                onClose={handleCancelEditChecklistItem}
                title="Editar Item de Checklist"
            >
                {editingChecklistItem && (
                    <ChecklistConfigEditForm
                        item={editingChecklistItem}
                        fabricanteId={editingChecklistFabricanteId}
                        onEditFinished={handleChecklistItemUpdated}
                        onCancelEdit={handleCancelEditChecklistItem}
                    />
                )}
            </Modal>
        </div>
    );
};

export default AdministracionPanel;