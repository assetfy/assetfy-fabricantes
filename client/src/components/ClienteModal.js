import React, { useState } from 'react';
import api from '../api';

const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-AR', {
        year: 'numeric', month: '2-digit', day: '2-digit'
    });
};

const getWarrantyStatus = (vencimiento) => {
    if (!vencimiento) return null;
    const now = new Date();
    const venc = new Date(vencimiento);
    const diffDays = Math.ceil((venc - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Vencida', color: '#dc3545' };
    if (diffDays <= 30) return { label: `Vence en ${diffDays}d`, color: '#ffc107' };
    return { label: 'Vigente', color: '#28a745' };
};

const ClienteModal = ({ isOpen, onClose, cliente, mode, onSaved, onOpenInventarioItem }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [editing, setEditing] = useState(mode === 'edit');
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        nombreCompleto: cliente?.nombreCompleto || '',
        telefono: cliente?.telefono || '',
        cuil: cliente?.cuil || '',
        direccion: cliente?.direccion || '',
        provincia: cliente?.provincia || ''
    });

    if (!isOpen || !cliente) return null;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.put(`/apoderado/clientes/${encodeURIComponent(cliente.email)}`, formData);
            setEditing(false);
            if (onSaved) onSaved();
        } catch (err) {
            console.error('Error al guardar cliente:', err);
            alert('Error al guardar los cambios del cliente.');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenInventario = (producto) => {
        if (onOpenInventarioItem && producto.inventarioId) {
            onOpenInventarioItem(producto.inventarioId);
        }
    };

    const tabs = [
        { label: 'Datos del Cliente' },
        { label: `Productos Registrados (${cliente.productos?.length || 0})` }
    ];

    return (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal-content" style={{ maxWidth: '720px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{cliente.nombreCompleto || cliente.email}</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {/* Tabs */}
                    <div className="tabs-container">
                        <div className="tabs-header">
                            {tabs.map((tab, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className={`tab-button ${activeTab === index ? 'active' : ''}`}
                                    onClick={() => setActiveTab(index)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="tabs-content">
                            {activeTab === 0 && (
                                <div className="cliente-datos-tab">
                                    {editing ? (
                                        <div className="cliente-edit-form">
                                            <div className="form-group">
                                                <label>Nombre Completo</label>
                                                <input
                                                    type="text"
                                                    value={formData.nombreCompleto}
                                                    onChange={(e) => handleChange('nombreCompleto', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Email</label>
                                                <input
                                                    type="email"
                                                    value={cliente.email}
                                                    disabled
                                                    style={{ backgroundColor: '#f5f5f5', color: '#888' }}
                                                />
                                                <small style={{ color: '#888' }}>El email no puede ser modificado</small>
                                            </div>
                                            <div className="form-group">
                                                <label>Teléfono</label>
                                                <input
                                                    type="text"
                                                    value={formData.telefono}
                                                    onChange={(e) => handleChange('telefono', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>CUIL</label>
                                                <input
                                                    type="text"
                                                    value={formData.cuil}
                                                    onChange={(e) => handleChange('cuil', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Dirección</label>
                                                <input
                                                    type="text"
                                                    value={formData.direccion}
                                                    onChange={(e) => handleChange('direccion', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Provincia</label>
                                                <input
                                                    type="text"
                                                    value={formData.provincia}
                                                    onChange={(e) => handleChange('provincia', e.target.value)}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                                <button
                                                    className="submit-button"
                                                    onClick={handleSave}
                                                    disabled={saving}
                                                >
                                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                                </button>
                                                <button
                                                    className="cancel-button"
                                                    onClick={() => {
                                                        setEditing(false);
                                                        setFormData({
                                                            nombreCompleto: cliente.nombreCompleto || '',
                                                            telefono: cliente.telefono || '',
                                                            cuil: cliente.cuil || '',
                                                            direccion: cliente.direccion || '',
                                                            provincia: cliente.provincia || ''
                                                        });
                                                    }}
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="cliente-view-data">
                                            <div className="inventario-view-grid">
                                                <div className="inventario-view-field">
                                                    <span className="inventario-view-label">Nombre Completo</span>
                                                    <span className="inventario-view-value">{cliente.nombreCompleto || '—'}</span>
                                                </div>
                                                <div className="inventario-view-field">
                                                    <span className="inventario-view-label">Email</span>
                                                    <span className="inventario-view-value">{cliente.email}</span>
                                                </div>
                                                <div className="inventario-view-field">
                                                    <span className="inventario-view-label">Teléfono</span>
                                                    <span className="inventario-view-value">{cliente.telefono || '—'}</span>
                                                </div>
                                                <div className="inventario-view-field">
                                                    <span className="inventario-view-label">CUIL</span>
                                                    <span className="inventario-view-value">{cliente.cuil || '—'}</span>
                                                </div>
                                                <div className="inventario-view-field">
                                                    <span className="inventario-view-label">Dirección</span>
                                                    <span className="inventario-view-value">{cliente.direccion || '—'}</span>
                                                </div>
                                                <div className="inventario-view-field">
                                                    <span className="inventario-view-label">Provincia</span>
                                                    <span className="inventario-view-value">{cliente.provincia || '—'}</span>
                                                </div>
                                                <div className="inventario-view-field">
                                                    <span className="inventario-view-label">Productos Registrados</span>
                                                    <span className="inventario-view-value">{cliente.productos?.length || 0}</span>
                                                </div>
                                                <div className="inventario-view-field">
                                                    <span className="inventario-view-label">Primer Registro</span>
                                                    <span className="inventario-view-value">{formatDate(cliente.primerRegistro)}</span>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: '16px' }}>
                                                <button
                                                    className="submit-button"
                                                    onClick={() => setEditing(true)}
                                                >
                                                    Editar Datos
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 1 && (
                                <div className="cliente-productos-tab">
                                    {(!cliente.productos || cliente.productos.length === 0) ? (
                                        <div className="no-results">
                                            Este cliente no tiene productos registrados.
                                        </div>
                                    ) : (
                                        <div className="warranty-table-wrapper">
                                            <table className="warranty-table">
                                                <thead>
                                                    <tr>
                                                        <th>ID Inventario</th>
                                                        <th>N° Serie</th>
                                                        <th>Producto</th>
                                                        <th>Garantía</th>
                                                        <th>Vencimiento</th>
                                                        <th>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {cliente.productos.map((prod, idx) => {
                                                        const warrantyStatus = getWarrantyStatus(prod.garantiaVencimiento);
                                                        return (
                                                            <tr key={idx}>
                                                                <td>
                                                                    <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                                                        {prod.idInventario || '—'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                                                        {prod.numeroSerie || '—'}
                                                                    </span>
                                                                </td>
                                                                <td>{prod.productoNombre}</td>
                                                                <td>{prod.garantiaNombre || '—'}</td>
                                                                <td>
                                                                    {prod.garantiaVencimiento ? (
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <span>{formatDate(prod.garantiaVencimiento)}</span>
                                                                            {warrantyStatus && (
                                                                                <span style={{
                                                                                    display: 'inline-block',
                                                                                    padding: '2px 6px',
                                                                                    borderRadius: '8px',
                                                                                    backgroundColor: warrantyStatus.color,
                                                                                    color: '#fff',
                                                                                    fontSize: '10px',
                                                                                    fontWeight: 600
                                                                                }}>
                                                                                    {warrantyStatus.label}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ) : '—'}
                                                                </td>
                                                                <td className="actions-cell">
                                                                    <button
                                                                        className="action-btn view-btn"
                                                                        onClick={() => handleOpenInventario(prod)}
                                                                        title="Ver item de inventario"
                                                                    >
                                                                        🔗
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClienteModal;
