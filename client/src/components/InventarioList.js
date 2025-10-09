import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import ConfirmDialog from './ConfirmDialog';
import QRPreviewModal from './QRPreviewModal';
import BulkQRPreviewModal from './BulkQRPreviewModal';
import Pagination from './Pagination';

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
    
    // Format as short date
    const formatted = expDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    });
    
    return isExpired ? `${formatted} (Exp.)` : formatted;
};


const InventarioList = ({ refreshTrigger, onEdit, onView }) => {
    const [inventario, setInventario] = useState([]);
    const [allInventario, setAllInventario] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('todos');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemId: null });
    const [qrPreviewModal, setQrPreviewModal] = useState({ isOpen: false, item: null });
    const [bulkQRModal, setBulkQRModal] = useState({ isOpen: false, items: [] });
    const [selectedItems, setSelectedItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const { showSuccess, showError } = useNotification();

    const handlePrintQR = (item) => {
        setQrPreviewModal({ isOpen: true, item });
    };

    const handleCloseQRPreview = () => {
        setQrPreviewModal({ isOpen: false, item: null });
    };

    const handleBulkPrintQR = () => {
        const itemsToProcess = allInventario.filter(item => selectedItems.includes(item._id));
        setBulkQRModal({ isOpen: true, items: itemsToProcess });
    };

    const handleCloseBulkQR = () => {
        setBulkQRModal({ isOpen: false, items: [] });
    };

    const handleSelectItem = (itemId) => {
        setSelectedItems(prev => {
            if (prev.includes(itemId)) {
                return prev.filter(id => id !== itemId);
            } else {
                return [...prev, itemId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedItems.length === inventario.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(inventario.map(item => item._id));
        }
    };

    useEffect(() => {
        const fetchInventario = async () => {
            try {
                const res = await api.get(`/apoderado/inventario?search=${searchTerm}&estado=${estadoFilter}`);
                if (res && res.data) {
                    setAllInventario(res.data);
                } else {
                    console.error('Respuesta del servidor inválida para inventario');
                    setAllInventario([]);
                }
            } catch (err) {
                console.error('Error al obtener el inventario:', err);
            }
        };
        fetchInventario();
    }, [refreshTrigger, searchTerm, estadoFilter]);

    // Update inventario when allInventario, page, or page size changes
    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setInventario(allInventario.slice(startIndex, endIndex));
    }, [allInventario, currentPage, itemsPerPage]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, estadoFilter]);

    const handleEditClick = (item) => {
        if (onEdit) {
            onEdit(item);
        }
    };

    const handleViewClick = (item) => {
        if (onView) {
            onView(item);
        }
    };

    const handleDeleteClick = async (itemId) => {
        setConfirmDialog({ isOpen: true, itemId });
    };

    const handleConfirmDelete = async () => {
        const itemId = confirmDialog.itemId;
        setConfirmDialog({ isOpen: false, itemId: null });
        
        try {
            await api.delete(`/apoderado/inventario/${itemId}`);
            const updatedInventario = allInventario.filter(item => item._id !== itemId);
            setAllInventario(updatedInventario);
            showSuccess('Artículo eliminado exitosamente');
            
            // Adjust current page if needed
            const totalPages = Math.ceil(updatedInventario.length / itemsPerPage);
            if (currentPage > totalPages && totalPages > 0) {
                setCurrentPage(totalPages);
            }
        } catch (err) {
            console.error('Error al eliminar el artículo:', err);
            showError('No se pudo eliminar el artículo');
        }
    };

    const handleCancelDelete = () => {
        setConfirmDialog({ isOpen: false, itemId: null });
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    if (inventario.length === 0 && !searchTerm && estadoFilter === 'todos') {
        return (
            <div className="list-container">
                <h3>Lista de Inventario</h3>
                <p>No tienes artículos en inventario.</p>
            </div>
        );
    }

    return (
        <div className="list-container">
            <h3>Lista de Inventario</h3>
            <div className="search-filter-container">
                <input
                    type="text"
                    placeholder="Buscar por ID inventario, producto, serie o comprador..."
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
            
            {/* Bulk Actions Menu */}
            {selectedItems.length > 0 && (
                <div className="bulk-actions-menu">
                    <span className="bulk-actions-count">
                        {selectedItems.length} artículo{selectedItems.length > 1 ? 's' : ''} seleccionado{selectedItems.length > 1 ? 's' : ''}
                    </span>
                    <button 
                        className="bulk-action-btn"
                        onClick={handleBulkPrintQR}
                        title="Imprimir QR de artículos seleccionados"
                    >
                        📱 Imprimir QR
                    </button>
                    <button 
                        className="bulk-action-btn bulk-action-cancel"
                        onClick={() => setSelectedItems([])}
                        title="Cancelar selección"
                    >
                        ✕ Cancelar
                    </button>
                </div>
            )}
            
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
                        <th>Producto/Pieza</th>
                        <th>Estado</th>
            
                        <th>Expira</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {inventario.map(item => (
                        <tr key={item._id}>
                            <td>
                                <input 
                                    type="checkbox"
                                    checked={selectedItems.includes(item._id)}
                                    onChange={() => handleSelectItem(item._id)}
                                />
                            </td>
                            <td>{item.idInventario}</td>
                            <td>{item.numeroSerie}</td>
                            <td>{item.producto ? item.producto.modelo : (item.pieza ? `${item.pieza.nombre} (${item.pieza.idPieza})` : 'N/A')}</td>
                            <td>{item.estado}</td>
          
                            <td className={item.garantia?.fechaExpiracion && new Date(item.garantia.fechaExpiracion) < new Date() ? 'warranty-expired' : ''}>
                                {formatWarrantyExpiration(item)}
                            </td>
                            <td>
                                <div className="action-buttons">
                                    <button 
                                        className="action-btn view-btn" 
                                        onClick={() => handleViewClick(item)}
                                        title="Ver detalles"
                                    >
                                        👁️
                                    </button>
                                    <button 
                                        className="action-btn edit-btn" 
                                        onClick={() => handleEditClick(item)}
                                        title="Editar"
                                    >
                                        ✏️
                                    </button>
                                    <button 
                                        className="action-btn delete-btn" 
                                        onClick={() => handleDeleteClick(item._id)}
                                        title="Eliminar"
                                    >
                                        🗑️
                                    </button>
                                    <button 
                                        className="action-btn qr-btn" 
                                        onClick={() => handlePrintQR(item)}
                                        title="Generar código QR"
                                    >
                                        📱
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <Pagination
                currentPage={currentPage}
                totalItems={allInventario.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
            />
            
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Confirmar eliminación"
                message="¿Estás seguro de que quieres eliminar este artículo del inventario? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
            
            <QRPreviewModal
                isOpen={qrPreviewModal.isOpen}
                onClose={handleCloseQRPreview}
                item={qrPreviewModal.item}
            />
            
            <BulkQRPreviewModal
                isOpen={bulkQRModal.isOpen}
                onClose={handleCloseBulkQR}
                items={bulkQRModal.items}
            />
        </div>
    );
};
export default InventarioList;