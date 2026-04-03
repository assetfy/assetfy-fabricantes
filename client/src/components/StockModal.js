import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import ConfirmDialog from './ConfirmDialog';
import QRPreviewModal from './QRPreviewModal';
import BulkQRPreviewModal from './BulkQRPreviewModal';
import Pagination from './Pagination';
import WarrantyInfoReadOnly from './WarrantyInfoReadOnly';
import InventarioItemViewModal from './InventarioItemViewModal';

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
    ubicacion: '',
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
    const [ubicacionFilter, setUbicacionFilter] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemId: null });
    const [qrPreviewModal, setQrPreviewModal] = useState({ isOpen: false, item: null });
    const [bulkQRModal, setBulkQRModal] = useState({ isOpen: false, items: [] });
    const [soldRentedItem, setSoldRentedItem] = useState(null);
    const [viewItemModal, setViewItemModal] = useState({ isOpen: false, item: null });

    // Inline edit state
    const [editingItem, setEditingItem] = useState(null);
    const [editFormData, setEditFormData] = useState(null);
    const [ubicaciones, setUbicaciones] = useState([]);

    // Add stock form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [slots, setSlots] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Remove stock form state
    const [showRemoveForm, setShowRemoveForm] = useState(false);
    const [removeSearchTerm, setRemoveSearchTerm] = useState('');
    const [removeFoundItem, setRemoveFoundItem] = useState(null);
    const [removeSearching, setRemoveSearching] = useState(false);
    const [removeFormData, setRemoveFormData] = useState({
        estado: '',
        representante: '',
        useOtro: false,
        comprador: { nombreCompleto: '', correoElectronico: '', telefono: '', direccion: '', provincia: '' },
        fechaVenta: '',
        fechaInicioAlquiler: '',
        fechaFinAlquiler: '',
    });
    const [removeSubmitting, setRemoveSubmitting] = useState(false);

    // Representantes state (shared by remove form and inline edit)
    const [representantes, setRepresentantes] = useState([]);

    const getItemAtributos = useCallback(() => {
        if (!item) return [];
        return item.atributos || [];
    }, [item]);

    const fetchInventario = useCallback(async () => {
        if (!item || !isOpen) return;
        try {
            const param = itemType === 'producto' ? `productoId=${item._id}` : `piezaId=${item._id}`;
            const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
            const ubicacionParam = ubicacionFilter ? `&ubicacion=${ubicacionFilter}` : '';
            const res = await api.get(`/apoderado/inventario?${param}&estado=stock${searchParam}${ubicacionParam}`);
            setAllInventario(res.data || []);
        } catch (err) {
            console.error('Error al obtener inventario:', err);
        }
    }, [item, itemType, isOpen, ubicacionFilter, searchTerm]);

    const fetchSoldRentedItem = useCallback(async () => {
        if (!item || !isOpen || !searchTerm.trim()) {
            setSoldRentedItem(null);
            return;
        }
        try {
            const param = itemType === 'producto' ? `productoId=${item._id}` : `piezaId=${item._id}`;
            const searchParam = `&search=${encodeURIComponent(searchTerm)}`;
            const res = await api.get(`/apoderado/inventario?${param}${searchParam}`);
            const found = (res.data || []).find(i => i.estado === 'vendido' || i.estado === 'alquilado');
            setSoldRentedItem(found || null);
        } catch (err) {
            console.error('Error al buscar item vendido/alquilado:', err);
        }
    }, [item, itemType, isOpen, searchTerm]);

    const fetchUbicaciones = useCallback(async () => {
        try {
            const res = await api.get('/apoderado/ubicaciones');
            setUbicaciones(res.data || []);
        } catch (err) {
            console.error('Error al obtener ubicaciones:', err);
        }
    }, []);

    const fetchRepresentantes = useCallback(async () => {
        try {
            const res = await api.get('/apoderado/representantes?estado=Activo');
            setRepresentantes(res.data || []);
        } catch (err) {
            console.error('Error al obtener representantes:', err);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchInventario();
            fetchUbicaciones();
            fetchRepresentantes();
            setShowAddForm(false);
            setShowRemoveForm(false);
            setRemoveSearchTerm('');
            setRemoveFoundItem(null);
            setRemoveFormData({
                estado: '',
                representante: '',
                useOtro: false,
                comprador: { nombreCompleto: '', correoElectronico: '', telefono: '', direccion: '', provincia: '' },
                fechaVenta: '',
                fechaInicioAlquiler: '',
                fechaFinAlquiler: '',
            });
            setSlots([emptySlot(getItemAtributos())]);
            setSearchTerm('');
            setUbicacionFilter('');
            setSelectedItems([]);
            setEditingItem(null);
            setSoldRentedItem(null);
        }
    }, [isOpen, item, itemType]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isOpen) fetchInventario();
    }, [fetchInventario, isOpen]);

    useEffect(() => {
        if (isOpen) fetchSoldRentedItem();
    }, [fetchSoldRentedItem, isOpen]);

    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        setInventario(allInventario.slice(startIndex, startIndex + itemsPerPage));
    }, [allInventario, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, ubicacionFilter]);

    // ── Add stock form handlers ──────────────────────────────────────────────

    const handleSlotSerialChange = (index, value) => {
        setSlots(prev => prev.map((s, i) => i === index ? { ...s, numeroSerie: value } : s));
    };

    const handleSlotUbicacionChange = (index, value) => {
        setSlots(prev => prev.map((s, i) => i === index ? { ...s, ubicacion: value } : s));
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
                    ...(slot.ubicacion ? { ubicacion: slot.ubicacion } : {}),
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

    // ── Remove stock form handlers ────────────────────────────────────────────

    const handleRemoveSearch = async () => {
        if (!removeSearchTerm.trim()) return;
        setRemoveSearching(true);
        setRemoveFoundItem(null);
        try {
            const param = itemType === 'producto' ? `productoId=${item._id}` : `piezaId=${item._id}`;
            const searchParam = `&search=${encodeURIComponent(removeSearchTerm)}`;
            const res = await api.get(`/apoderado/inventario?${param}&estado=stock${searchParam}`);
            const found = (res.data || []).find(i =>
                i.idInventario?.toLowerCase() === removeSearchTerm.trim().toLowerCase() ||
                i.numeroSerie?.toLowerCase() === removeSearchTerm.trim().toLowerCase()
            ) || (res.data || [])[0];
            if (found) {
                setRemoveFoundItem(found);
                setRemoveFormData(prev => ({
                    ...prev,
                    estado: '',
                    representante: '',
                    useOtro: false,
                    comprador: { nombreCompleto: '', correoElectronico: '', telefono: '', direccion: '', provincia: '' },
                    fechaVenta: new Date().toISOString().split('T')[0],
                    fechaInicioAlquiler: new Date().toISOString().split('T')[0],
                    fechaFinAlquiler: '',
                }));
            } else {
                showError('No se encontró un artículo en stock con ese ID o número de serie');
            }
        } catch (err) {
            showError('Error al buscar el artículo');
        }
        setRemoveSearching(false);
    };

    const handleRemoveFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'useOtro') {
            setRemoveFormData(prev => ({
                ...prev,
                useOtro: checked,
                representante: checked ? '' : prev.representante,
                comprador: checked ? prev.comprador : { nombreCompleto: '', correoElectronico: '', telefono: '', direccion: '', provincia: '' },
            }));
        } else if (name.startsWith('comprador.')) {
            const field = name.split('.')[1];
            setRemoveFormData(prev => ({ ...prev, comprador: { ...prev.comprador, [field]: value } }));
        } else {
            setRemoveFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmitRemove = async (e) => {
        e.preventDefault();
        if (!removeFoundItem || !removeFormData.estado) return;
        setRemoveSubmitting(true);
        try {
            const payload = {
                numeroSerie: removeFoundItem.numeroSerie,
                estado: removeFormData.estado,
                ...(itemType === 'producto' ? { producto: item._id } : { pieza: item._id }),
                atributos: removeFoundItem.atributos || [],
                ubicacion: removeFoundItem.ubicacion?._id || '',
                representante: !removeFormData.useOtro ? removeFormData.representante || null : null,
                comprador: removeFormData.useOtro ? removeFormData.comprador : {
                    nombreCompleto: '', correoElectronico: '', telefono: '', direccion: '', provincia: ''
                },
                fechaVenta: removeFormData.estado === 'vendido' ? removeFormData.fechaVenta : '',
                fechaInicioAlquiler: removeFormData.estado === 'alquilado' ? removeFormData.fechaInicioAlquiler : '',
                fechaFinAlquiler: removeFormData.estado === 'alquilado' ? removeFormData.fechaFinAlquiler : '',
            };
            await api.put(`/apoderado/inventario/${removeFoundItem._id}`, payload);
            showSuccess(`Artículo marcado como ${removeFormData.estado === 'vendido' ? 'vendido' : 'alquilado'} exitosamente`);
            setShowRemoveForm(false);
            setRemoveFoundItem(null);
            setRemoveSearchTerm('');
            fetchInventario();
        } catch (err) {
            showError('Error al actualizar el artículo: ' + (err.response?.data || 'Error desconocido'));
        }
        setRemoveSubmitting(false);
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
        const hasRepresentante = !!invItem.representante;
        const hasManualComprador = !hasRepresentante && invItem.comprador?.nombreCompleto;
        setEditFormData({
            numeroSerie: invItem.numeroSerie || '',
            estado: invItem.estado || 'stock',
            ubicacion: invItem.ubicacion?._id || '',
            representante: invItem.representante?._id || '',
            useOtro: !!hasManualComprador,
            comprador: {
                nombreCompleto: invItem.comprador?.nombreCompleto || '',
                correoElectronico: invItem.comprador?.correoElectronico || '',
                telefono: invItem.comprador?.telefono || '',
                direccion: invItem.comprador?.direccion || '',
                provincia: invItem.comprador?.provincia || '',
            },
            atributos: invItem.atributos || [],
            fechaVenta: invItem.fechaVenta ? new Date(invItem.fechaVenta).toISOString().split('T')[0] : '',
            fechaInicioAlquiler: invItem.fechaInicioAlquiler ? new Date(invItem.fechaInicioAlquiler).toISOString().split('T')[0] : '',
            fechaFinAlquiler: invItem.fechaFinAlquiler ? new Date(invItem.fechaFinAlquiler).toISOString().split('T')[0] : '',
        });
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'useOtro') {
            setEditFormData(prev => ({
                ...prev,
                useOtro: checked,
                representante: checked ? '' : prev.representante,
                comprador: checked ? prev.comprador : { nombreCompleto: '', correoElectronico: '', telefono: '', direccion: '', provincia: '' },
            }));
        } else if (name.startsWith('comprador.')) {
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
                if (name === 'estado' && (value === 'vendido' || value === 'alquilado')) {
                    // Reset representante/otro when changing to sold/rented
                    if (!prev.representante && !prev.useOtro) {
                        next.representante = '';
                        next.useOtro = false;
                    }
                }
                if (name === 'estado' && value === 'stock') {
                    next.representante = '';
                    next.useOtro = false;
                    next.comprador = { nombreCompleto: '', correoElectronico: '', telefono: '', direccion: '', provincia: '' };
                }
                return next;
            });
        }
    };

    const handleSaveEdit = async (invItem) => {
        try {
            const { useOtro, ...rest } = editFormData;
            const payload = {
                ...rest,
                representante: !useOtro ? editFormData.representante || null : null,
                comprador: useOtro ? editFormData.comprador : { nombreCompleto: '', correoElectronico: '', telefono: '', direccion: '', provincia: '' },
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

                    {/* ── Agregar / Remover Stock Buttons ──────────────────── */}
                    <div className="stock-add-section">
                        {!showAddForm && !showRemoveForm ? (
                            <div className="stock-buttons-row">
                                <button
                                    className="create-button"
                                    onClick={() => {
                                        setShowAddForm(true);
                                        setShowRemoveForm(false);
                                        setSlots([emptySlot(itemAttrs)]);
                                    }}
                                >
                                    +Stock
                                </button>
                                <button
                                    className="remove-stock-button"
                                    onClick={() => {
                                        setShowRemoveForm(true);
                                        setShowAddForm(false);
                                        setRemoveSearchTerm('');
                                        setRemoveFoundItem(null);
                                    }}
                                >
                                    -Stock
                                </button>
                            </div>
                        ) : showAddForm ? (
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
                                            {filteredUbicaciones.length > 0 && (
                                                <div className="form-group">
                                                    <label>Ubicación / Depósito</label>
                                                    <select
                                                        value={slot.ubicacion}
                                                        onChange={(e) => handleSlotUbicacionChange(slotIndex, e.target.value)}
                                                    >
                                                        <option value="">Sin ubicación</option>
                                                        {filteredUbicaciones.map(u => (
                                                            <option key={u._id} value={u._id}>{u.nombre}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
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
                        ) : showRemoveForm ? (
                            <div className="stock-add-form">
                                <h4>Remover Stock de {itemName}</h4>
                                <div className="form-group">
                                    <label>Buscar por ID de Inventario o Número de Serie</label>
                                    <div className="input-with-button">
                                        <input
                                            type="text"
                                            value={removeSearchTerm}
                                            onChange={(e) => setRemoveSearchTerm(e.target.value)}
                                            placeholder="Ingresa ID de inventario o número de serie"
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleRemoveSearch(); } }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveSearch}
                                            className="generate-serial-btn"
                                            disabled={removeSearching}
                                            title="Buscar"
                                        >
                                            🔍
                                        </button>
                                    </div>
                                </div>

                                {removeFoundItem && (
                                    <form onSubmit={handleSubmitRemove}>
                                        <div className="remove-found-item">
                                            <p><strong>Artículo encontrado:</strong> {removeFoundItem.idInventario} — Serie: {removeFoundItem.numeroSerie}</p>
                                        </div>

                                        <div className="form-group">
                                            <label>Estado</label>
                                            <select name="estado" value={removeFormData.estado} onChange={handleRemoveFormChange} required>
                                                <option value="">Seleccionar estado...</option>
                                                <option value="vendido">Vendido</option>
                                                <option value="alquilado">Alquilado</option>
                                            </select>
                                        </div>

                                        {removeFormData.estado && (
                                            <>
                                                {removeFormData.estado === 'vendido' && (
                                                    <div className="form-group">
                                                        <label>Fecha de Venta</label>
                                                        <input type="date" name="fechaVenta" value={removeFormData.fechaVenta} onChange={handleRemoveFormChange} />
                                                    </div>
                                                )}
                                                {removeFormData.estado === 'alquilado' && (
                                                    <>
                                                        <div className="form-group">
                                                            <label>Inicio Alquiler</label>
                                                            <input type="date" name="fechaInicioAlquiler" value={removeFormData.fechaInicioAlquiler} onChange={handleRemoveFormChange} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Fin Alquiler</label>
                                                            <input type="date" name="fechaFinAlquiler" value={removeFormData.fechaFinAlquiler} onChange={handleRemoveFormChange} />
                                                        </div>
                                                    </>
                                                )}

                                                <div className="form-group">
                                                    <label>{removeFormData.estado === 'vendido' ? 'Vendido a' : 'Alquilado a'} (Representante Oficial)</label>
                                                    <select
                                                        name="representante"
                                                        value={removeFormData.representante}
                                                        onChange={handleRemoveFormChange}
                                                        disabled={removeFormData.useOtro}
                                                        style={removeFormData.useOtro ? { backgroundColor: '#e9ecef', cursor: 'not-allowed' } : {}}
                                                    >
                                                        <option value="">Seleccionar representante...</option>
                                                        {representantes.map(r => (
                                                            <option key={r._id} value={r._id}>{r.nombre}{r.razonSocial ? ` (${r.razonSocial})` : ''}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="form-group form-group-checkbox">
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            name="useOtro"
                                                            checked={removeFormData.useOtro}
                                                            onChange={handleRemoveFormChange}
                                                        />
                                                        Otro
                                                    </label>
                                                </div>

                                                {removeFormData.useOtro && (
                                                    <div className="comprador-fields">
                                                        <div className="form-group">
                                                            <label>Nombre Completo</label>
                                                            <input type="text" name="comprador.nombreCompleto" value={removeFormData.comprador.nombreCompleto} onChange={handleRemoveFormChange} required />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Correo Electrónico</label>
                                                            <input type="email" name="comprador.correoElectronico" value={removeFormData.comprador.correoElectronico} onChange={handleRemoveFormChange} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Teléfono</label>
                                                            <input type="tel" name="comprador.telefono" value={removeFormData.comprador.telefono} onChange={handleRemoveFormChange} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Dirección</label>
                                                            <input type="text" name="comprador.direccion" value={removeFormData.comprador.direccion} onChange={handleRemoveFormChange} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Provincia</label>
                                                            <input type="text" name="comprador.provincia" value={removeFormData.comprador.provincia} onChange={handleRemoveFormChange} />
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        <div className="stock-form-actions">
                                            <button type="submit" disabled={removeSubmitting || !removeFormData.estado}>
                                                {removeSubmitting ? 'Guardando...' : 'Confirmar'}
                                            </button>
                                            <button
                                                type="button"
                                                className="cancel-button"
                                                onClick={() => {
                                                    setShowRemoveForm(false);
                                                    setRemoveFoundItem(null);
                                                    setRemoveSearchTerm('');
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {!removeFoundItem && (
                                    <div className="stock-form-actions">
                                        <button
                                            type="button"
                                            className="cancel-button"
                                            onClick={() => {
                                                setShowRemoveForm(false);
                                                setRemoveSearchTerm('');
                                            }}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>

                    {/* ── Inventory List ──────────────────────────────────── */}
                    <div className="stock-list-section">
                        <div className="search-filter-container">
                            <input
                                type="text"
                                placeholder="Buscar por serie o ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <select
                                value={ubicacionFilter}
                                onChange={(e) => setUbicacionFilter(e.target.value)}
                            >
                                <option value="">Todos los depósitos</option>
                                {filteredUbicaciones.map(u => (
                                    <option key={u._id} value={u._id}>{u.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {soldRentedItem && searchTerm.trim() && (
                            <div className="sold-rented-notice">
                                <div>
                                    El item <strong>{soldRentedItem.numeroSerie || soldRentedItem.idInventario}</strong> fue{' '}
                                    <strong>{soldRentedItem.estado === 'vendido' ? 'vendido' : 'alquilado'}</strong> el{' '}
                                    <strong>
                                        {soldRentedItem.estado === 'vendido'
                                            ? (soldRentedItem.fechaVenta ? new Date(soldRentedItem.fechaVenta).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—')
                                            : (soldRentedItem.fechaInicioAlquiler ? new Date(soldRentedItem.fechaInicioAlquiler).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—')}
                                    </strong>
                                </div>
                                <button
                                    className="sold-rented-notice-link"
                                    onClick={() => setViewItemModal({ isOpen: true, item: soldRentedItem })}
                                >
                                    Ver item
                                </button>
                            </div>
                        )}

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

                        {allInventario.length > 0 && (
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
                                                                <>
                                                                    <div className="inline-edit-row">
                                                                        <div className="form-group">
                                                                            <label>{editFormData.estado === 'vendido' ? 'Vendido a' : 'Alquilado a'} (Representante Oficial)</label>
                                                                            <select
                                                                                name="representante"
                                                                                value={editFormData.representante}
                                                                                onChange={handleEditChange}
                                                                                disabled={editFormData.useOtro}
                                                                                style={editFormData.useOtro ? { backgroundColor: '#e9ecef', cursor: 'not-allowed' } : {}}
                                                                            >
                                                                                <option value="">Seleccionar representante...</option>
                                                                                {representantes.map(r => (
                                                                                    <option key={r._id} value={r._id}>{r.nombre}{r.razonSocial ? ` (${r.razonSocial})` : ''}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                        <div className="form-group form-group-checkbox" style={{ alignSelf: 'flex-end', paddingBottom: '8px' }}>
                                                                            <label>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    name="useOtro"
                                                                                    checked={editFormData.useOtro}
                                                                                    onChange={handleEditChange}
                                                                                />
                                                                                Otro
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                    {editFormData.useOtro && (
                                                                        <div className="inline-edit-row">
                                                                            <div className="form-group">
                                                                                <label>Nombre Completo</label>
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
                                                                            <div className="form-group">
                                                                                <label>Dirección</label>
                                                                                <input type="text" name="comprador.direccion" value={editFormData.comprador.direccion} onChange={handleEditChange} />
                                                                            </div>
                                                                            <div className="form-group">
                                                                                <label>Provincia</label>
                                                                                <input type="text" name="comprador.provincia" value={editFormData.comprador.provincia} onChange={handleEditChange} />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </>
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

            <InventarioItemViewModal
                isOpen={viewItemModal.isOpen}
                onClose={() => setViewItemModal({ isOpen: false, item: null })}
                item={viewItemModal.item}
            />
        </div>
    );
};

export default StockModal;
