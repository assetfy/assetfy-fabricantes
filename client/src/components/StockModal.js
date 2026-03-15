import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import ConfirmDialog from './ConfirmDialog';
import QRPreviewModal from './QRPreviewModal';
import BulkQRPreviewModal from './BulkQRPreviewModal';
import Pagination from './Pagination';
import WarrantyInfoReadOnly from './WarrantyInfoReadOnly';

const formatWarrantyExpiration = (item) => {
    if (!item.garantia || item.garantia.tipoGarantia === 'Sin garantia') {
        return 'Sin garantía';
    }
    if (!item.garantia.fechaExpiracion) {
        return 'No calculada';
    }
    const expDate = new Date(item.garantia.fechaExpiracion);
    const now = new Date();
    const isExpired = expDate < now;
    const formatted = expDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    });
    return isExpired ? `${formatted} (Exp.)` : formatted;
};

const emptySlot = (atributos = []) => ({
    numeroSerie: '',
    atributos: atributos.map(attr => ({
        nombre: attr.nombre,
        valor: attr.tipo === 'predefinido' ? (attr.valor || '') : ''
    }))
});

const StockModal = ({ isOpen, onClose, item, itemType, productos, piezas }) => {
    const { showSuccess, showError } = useNotification();

    // Inventory list state
    const [allInventario, setAllInventario] = useState([]);
    const [inventario, setInventario] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('todos');
    const [selectedItems, setSelectedItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemId: null });
    const [qrPreviewModal, setQrPreviewModal] = useState({ isOpen: false, item: null });
    const [bulkQRModal, setBulkQRModal] = useState({ isOpen: false, items: [] });

    // Inline edit state
    const [editingItem, setEditingItem] = useState(null);
    const [editFormData, setEditFormData] = useState(null);
    const [ubicaciones, setUbicaciones] = useState([]);

    // Add stock form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [slots, setSlots] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const getItemAtributos = useCallback(() => {
        if (!item) return [];
        return item.atributos || [];
    }, [item]);

    const fetchInventario = useCallback(async () => {
        if (!item || !isOpen) return;
        try {
            const param = itemType === 'producto' ? `productoId=${item._id}` : `piezaId=${item._id}`;
            const estadoParam = estadoFilter !== 'todos' ? `&estado=${estadoFilter}` : '';
            const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
            const res = await api.get(`/apoderado/inventario?${param}${estadoParam}${searchParam}`);
            setAllInventario(res.data || []);
        } catch (err) {
            console.error('Error al obtener inventario:', err);
        }
    }, [item, itemType, isOpen, estadoFilter, searchTerm]);

    const fetchUbicaciones = useCallback(async () => {
        try {
            const res = await api.get('/apoderado/ubicaciones');
            setUbicaciones(res.data || []);
        } catch (err) {
            console.error('Error al obtener ubicaciones:', err);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchInventario();
            fetchUbicaciones();
            setShowAddForm(false);
            setSlots([emptySlot(getItemAtributos())]);
            setSearchTerm('');
            setEstadoFilter('todos');
            setSelectedItems([]);
            setEditingItem(null);
        }
    }, [isOpen, item, itemType]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isOpen) fetchInventario();
    }, [fetchInventario, isOpen]);

    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        setInventario(allInventario.slice(startIndex, startIndex + itemsPerPage));
    }, [allInventario, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, estadoFilter]);

    // ── Add stock form handlers ──────────────────────────────────────────────

    const handleSlotSerialChange = (index, value) => {
        setSlots(prev => prev.map((s, i) => i === index ? { ...s, numeroSerie: value } : s));
    };

    const handleSlotAtributoChange = (slotIndex, attrIndex, value) => {
        setSlots(prev => prev.map((s, i) => {
            if (i !== slotIndex) return s;
            const newAttrs = [...s.atributos];
            newAttrs[attrIndex] = { ...newAttrs[attrIndex], valor: value };
            return { ...s, atributos: newAttrs };
        }));
    };

    const handleGenerateSerial = async (index) => {
        try {
            const res = await api.post('/apoderado/inventario/generate-serial');
            handleSlotSerialChange(index, res.data.numeroSerie);
        } catch (err) {
            showError('Error al generar número de serie');
        }
    };

    const handleAddOtro = () => {
        setSlots(prev => [...prev, emptySlot(getItemAtributos())]);
    };

    const handleRemoveSlot = (index) => {
        setSlots(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmitStock = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        let successCount = 0;
        let errorCount = 0;

        for (const slot of slots) {
            if (!slot.numeroSerie.trim()) {
                errorCount++;
                continue;
            }
            try {
                const payload = {
                    numeroSerie: slot.numeroSerie,
                    estado: 'stock',
                    atributos: slot.atributos,
                    ...(itemType === 'producto' ? { producto: item._id, pieza: undefined } : { pieza: item._id, producto: undefined })
                };
                await api.post('/apoderado/inventario/add', payload);
                successCount++;
            } catch (err) {
                errorCount++;
                console.error('Error al agregar stock:', err.response?.data);
            }
        }

        setSubmitting(false);

        if (successCount > 0) {
            showSuccess(`${successCount} artículo${successCount > 1 ? 's' : ''} agregado${successCount > 1 ? 's' : ''} al stock exitosamente`);
        }
        if (errorCount > 0) {
            showError(`${errorCount} artículo${errorCount > 1 ? 's' : ''} no pudieron agregarse`);
        }

        if (successCount > 0) {
            setShowAddForm(false);
            setSlots([emptySlot(getItemAtributos())]);
            fetchInventario();
        }
    };

    // ── List handlers ────────────────────────────────────────────────────────

    const handleSelectItem = (itemId) => {
        setSelectedItems(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const handleSelectAll = () => {
        if (selectedItems.length === inventario.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(inventario.map(i => i._id));
        }
    };

    const handleDeleteClick = (itemId) => {
        setConfirmDialog({ isOpen: true, itemId });
    };

    const handleConfirmDelete = async () => {
        const itemId = confirmDialog.itemId;
        setConfirmDialog({ isOpen: false, itemId: null });
        try {
            await api.delete(`/apoderado/inventario/${itemId}`);
            showSuccess('Artículo eliminado exitosamente');
            fetchInventario();
        } catch (err) {
            showError('No se pudo eliminar el artículo');
        }
    };

    const handleBulkPrintQR = () => {
        const itemsToProcess = allInventario.filter(i => selectedItems.includes(i._id));
        setBulkQRModal({ isOpen: true, items: itemsToProcess });
    };

    // ── Inline edit handlers ─────────────────────────────────────────────────

    const handleStartEdit = (invItem) => {
        setEditingItem(invItem._id);
        setEditFormData({
            numeroSerie: invItem.numeroSerie || '',
            estado: invItem.estado || 'stock',
            ubicacion: invItem.ubicacion?._id || '',
            comprador: {
                nombreCompleto: invItem.comprador?.nombreCompleto || '',
                correoElectronico: invItem.comprador?.correoElectronico || '',
                telefono: invItem.comprador?.telefono || '',
            },
            atributos: invItem.atributos || [],
            fechaVenta: invItem.fechaVenta ? new Date(invItem.fechaVenta).toISOString().split('T')[0] : '',
            fechaInicioAlquiler: invItem.fechaInicioAlquiler ? new Date(invItem.fechaInicioAlquiler).toISOString().split('T')[0] : '',
            fechaFinAlquiler: invItem.fechaFinAlquiler ? new Date(invItem.fechaFinAlquiler).toISOString().split('T')[0] : '',
        });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('comprador.')) {
            const field = name.split('.')[1];
            setEditFormData(prev => ({ ...prev, comprador: { ...prev.comprador, [field]: value } }));
        } else {
            setEditFormData(prev => {
                const next = { ...prev, [name]: value };
                if (name === 'estado' && value === 'vendido' && !prev.fechaVenta) {
                    next.fechaVenta = new Date().toISOString().split('T')[0];
                } else if (name === 'estado' && value !== 'vendido') {
                    next.fechaVenta = '';
                }
                if (name === 'estado' && value !== 'alquilado') {
                    next.fechaInicioAlquiler = '';
                    next.fechaFinAlquiler = '';
                }
                return next;
            });
        }
    };

    const handleSaveEdit = async (invItem) => {
        try {
            const payload = {
                ...editFormData,
                ...(itemType === 'producto' ? { producto: item._id } : { pieza: item._id })
            };
            await api.put(`/apoderado/inventario/${invItem._id}`, payload);
            showSuccess('Artículo actualizado exitosamente');
            setEditingItem(null);
            setEditFormData(null);
            fetchInventario();
        } catch (err) {
            showError('Error al actualizar: ' + (err.response?.data || 'Error desconocido'));
        }
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        setEditFormData(null);
    };

    if (!isOpen || !item) return null;

    const itemAttrs = getItemAtributos();
    const itemName = itemType === 'producto' ? item.modelo : item.nombre;

    const filteredUbicaciones = ubicaciones.filter(u => {
        const itemFabricante = item.fabricante?._id || item.marca?.fabricante?._id;
        if (!itemFabricante) return true;
        return !u.fabricante || u.fabricante._id === itemFabricante;
    });

    return (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal-content stock-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Stock de {itemType === 'producto' ? 'Producto' : 'Pieza'}: {itemName}</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">

                    {/* ── Agregar Stock Form ──────────────────────────────── */}
                    <div className="stock-add-section">
                        {!showAddForm ? (
                            <button
                                className="create-button"
                                onClick={() => {
                                    setShowAddForm(true);
                                    setSlots([emptySlot(itemAttrs)]);
                                }}
                            >
                                + Agregar Stock
                            </button>
                        ) : (
                            <div className="stock-add-form">
                                <h4>Agregar Stock a {itemName}</h4>
                                <form onSubmit={handleSubmitStock}>
                                    {slots.map((slot, slotIndex) => (
                                        <div key={slotIndex} className="stock-slot">
                                            {slots.length > 1 && (
                                                <div className="stock-slot-header">
                                                    <strong>Artículo {slotIndex + 1}</strong>
                                                </div>
                                            )}
                                            <div className="form-group">
                                                <label>Número de Serie</label>
                                                <div className="input-with-button">
                                                    <input
                                                        type="text"
                                                        value={slot.numeroSerie}
                                                        onChange={(e) => handleSlotSerialChange(slotIndex, e.target.value)}
                                                        required
                                                        placeholder="Número de serie"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleGenerateSerial(slotIndex)}
                                                        className="generate-serial-btn"
                                                        title="Autogenerar número de serie"
                                                    >
                                                        +
                                                    </button>
                                                    {slots.length > 1 && (
                                                        <button
                                                            type="button"
                                                            className="action-btn delete-btn"
                                                            onClick={() => handleRemoveSlot(slotIndex)}
                                                            title="Eliminar este artículo"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {slot.atributos.map((attr, attrIndex) => {
                                                const itemAttr = itemAttrs.find(a => a.nombre === attr.nombre);
                                                if (itemAttr?.tipo === 'predefinido') {
                                                    return (
                                                        <div key={attrIndex} className="form-group">
                                                            <label>{attr.nombre}</label>
                                                            <input
                                                                type="text"
                                                                value={attr.valor}
                                                                readOnly
                                                                style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                                                            />
                                                        </div>
                                                    );
                                                } else if (itemAttr?.tipo === 'lista') {
                                                    return (
                                                        <div key={attrIndex} className="form-group">
                                                            <label>{attr.nombre}</label>
                                                            <select
                                                                value={attr.valor}
                                                                onChange={(e) => handleSlotAtributoChange(slotIndex, attrIndex, e.target.value)}
                                                                required
                                                            >
                                                                <option value="">Selecciona {attr.nombre}</option>
                                                                {itemAttr.valores.map((v, vi) => (
                                                                    <option key={vi} value={v}>{v}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div key={attrIndex} className="form-group">
                                                            <label>{attr.nombre}</label>
                                                            <input
                                                                type="text"
                                                                value={attr.valor}
                                                                onChange={(e) => handleSlotAtributoChange(slotIndex, attrIndex, e.target.value)}
                                                                placeholder={`Ingresa ${attr.nombre}`}
                                                                required
                                                            />
                                                        </div>
                                                    );
                                                }
                                            })}
                                        </div>
                                    ))}

                                    <div className="stock-form-actions">
                                        <button
                                            type="button"
                                            className="secondary-button"
                                            onClick={handleAddOtro}
                                        >
                                            + Agregar otro
                                        </button>
                                        <button type="submit" disabled={submitting}>
                                            {submitting ? 'Guardando...' : `Guardar ${slots.length > 1 ? `${slots.length} artículos` : 'artículo'}`}
                                        </button>
                                        <button
                                            type="button"
                                            className="cancel-button"
                                            onClick={() => {
                                                setShowAddForm(false);
                                                setSlots([emptySlot(itemAttrs)]);
                                            }}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* ── Inventory List ──────────────────────────────────── */}
                    <div className="stock-list-section">
                        <div className="search-filter-container">
                            <input
                                type="text"
                                placeholder="Buscar por serie, ID o estado..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <select
                                value={estadoFilter}
                                onChange={(e) => setEstadoFilter(e.target.value)}
                            >
                                <option value="todos">Todos los estados</option>
                                <option value="stock">En Stock</option>
                                <option value="vendido">Vendido</option>
                                <option value="alquilado">Alquilado</option>
                            </select>
                        </div>

                        {selectedItems.length > 0 && (
                            <div className="bulk-actions-menu">
                                <span className="bulk-actions-count">
                                    {selectedItems.length} artículo{selectedItems.length > 1 ? 's' : ''} seleccionado{selectedItems.length > 1 ? 's' : ''}
                                </span>
                                <button className="bulk-action-btn" onClick={handleBulkPrintQR} title="Imprimir QR">
                                    📱 Imprimir QR
                                </button>
                                <button className="bulk-action-btn bulk-action-cancel" onClick={() => setSelectedItems([])}>
                                    ✕ Cancelar
                                </button>
                            </div>
                        )}

                        {allInventario.length === 0 ? (
                            <p style={{ color: '#666', fontStyle: 'italic' }}>
                                No hay artículos de inventario para este {itemType === 'producto' ? 'producto' : 'pieza'}.
                            </p>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>
                                            <input
                                                type="checkbox"
                                                checked={inventario.length > 0 && selectedItems.length === inventario.length}
                                                onChange={handleSelectAll}
                                                title="Seleccionar todos"
                                            />
                                        </th>
                                        <th>ID Inventario</th>
                                        <th>Nro. Serie</th>
                                        <th>Estado</th>
                                        <th>Ubicación / Depósito</th>
                                        <th>Expira</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventario.map(invItem => (
                                        <React.Fragment key={invItem._id}>
                                            <tr>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.includes(invItem._id)}
                                                        onChange={() => handleSelectItem(invItem._id)}
                                                    />
                                                </td>
                                                <td>{invItem.idInventario}</td>
                                                <td>{invItem.numeroSerie}</td>
                                                <td>{invItem.estado}</td>
                                                <td>{invItem.ubicacion?.nombre || '—'}</td>
                                                <td className={invItem.garantia?.fechaExpiracion && new Date(invItem.garantia.fechaExpiracion) < new Date() ? 'warranty-expired' : ''}>
                                                    {formatWarrantyExpiration(invItem)}
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="action-btn edit-btn"
                                                            onClick={() => editingItem === invItem._id ? handleCancelEdit() : handleStartEdit(invItem)}
                                                            title={editingItem === invItem._id ? 'Cancelar edición' : 'Editar'}
                                                        >
                                                            {editingItem === invItem._id ? '✕' : '✏️'}
                                                        </button>
                                                        <button
                                                            className="action-btn delete-btn"
                                                            onClick={() => handleDeleteClick(invItem._id)}
                                                            title="Eliminar"
                                                        >
                                                            🗑️
                                                        </button>
                                                        <button
                                                            className="action-btn qr-btn"
                                                            onClick={() => setQrPreviewModal({ isOpen: true, item: invItem })}
                                                            title="Generar código QR"
                                                        >
                                                            📱
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {editingItem === invItem._id && editFormData && (
                                                <tr>
                                                    <td colSpan={7} style={{ padding: '12px 16px', background: '#f8f9fa', borderTop: '2px solid #dee2e6' }}>
                                                        <div className="inline-edit-form">
                                                            <div className="inline-edit-row">
                                                                <div className="form-group">
                                                                    <label>Número de Serie</label>
                                                                    <input
                                                                        type="text"
                                                                        name="numeroSerie"
                                                                        value={editFormData.numeroSerie}
                                                                        onChange={handleEditChange}
                                                                        required
                                                                    />
                                                                </div>
                                                                <div className="form-group">
                                                                    <label>Estado</label>
                                                                    <select name="estado" value={editFormData.estado} onChange={handleEditChange}>
                                                                        <option value="stock">En Stock</option>
                                                                        <option value="vendido">Vendido</option>
                                                                        <option value="alquilado">Alquilado</option>
                                                                    </select>
                                                                </div>
                                                                <div className="form-group">
                                                                    <label>Ubicación / Depósito</label>
                                                                    <select name="ubicacion" value={editFormData.ubicacion} onChange={handleEditChange}>
                                                                        <option value="">Sin ubicación</option>
                                                                        {filteredUbicaciones.map(u => (
                                                                            <option key={u._id} value={u._id}>{u.nombre}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                {editFormData.estado === 'vendido' && (
                                                                    <div className="form-group">
                                                                        <label>Fecha de Venta</label>
                                                                        <input type="date" name="fechaVenta" value={editFormData.fechaVenta} onChange={handleEditChange} />
                                                                    </div>
                                                                )}
                                                                {editFormData.estado === 'alquilado' && (
                                                                    <>
                                                                        <div className="form-group">
                                                                            <label>Inicio Alquiler</label>
                                                                            <input type="date" name="fechaInicioAlquiler" value={editFormData.fechaInicioAlquiler} onChange={handleEditChange} />
                                                                        </div>
                                                                        <div className="form-group">
                                                                            <label>Fin Alquiler</label>
                                                                            <input type="date" name="fechaFinAlquiler" value={editFormData.fechaFinAlquiler} onChange={handleEditChange} />
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                            {(editFormData.estado === 'vendido' || editFormData.estado === 'alquilado') && (
                                                                <div className="inline-edit-row">
                                                                    <div className="form-group">
                                                                        <label>Nombre Comprador/Inquilino</label>
                                                                        <input type="text" name="comprador.nombreCompleto" value={editFormData.comprador.nombreCompleto} onChange={handleEditChange} />
                                                                    </div>
                                                                    <div className="form-group">
                                                                        <label>Email</label>
                                                                        <input type="email" name="comprador.correoElectronico" value={editFormData.comprador.correoElectronico} onChange={handleEditChange} />
                                                                    </div>
                                                                    <div className="form-group">
                                                                        <label>Teléfono</label>
                                                                        <input type="tel" name="comprador.telefono" value={editFormData.comprador.telefono} onChange={handleEditChange} />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="inline-edit-actions">
                                                                <button type="button" onClick={() => handleSaveEdit(invItem)}>Guardar</button>
                                                                <button type="button" className="cancel-button" onClick={handleCancelEdit}>Cancelar</button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        <Pagination
                            currentPage={currentPage}
                            totalItems={allInventario.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                            onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
                        />
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false, itemId: null })}
                onConfirm={handleConfirmDelete}
                title="Confirmar eliminación"
                message="¿Estás seguro de que quieres eliminar este artículo del inventario? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
            />

            <QRPreviewModal
                isOpen={qrPreviewModal.isOpen}
                onClose={() => setQrPreviewModal({ isOpen: false, item: null })}
                item={qrPreviewModal.item}
            />

            <BulkQRPreviewModal
                isOpen={bulkQRModal.isOpen}
                onClose={() => setBulkQRModal({ isOpen: false, items: [] })}
                items={bulkQRModal.items}
            />
        </div>
    );
};

export default StockModal;
