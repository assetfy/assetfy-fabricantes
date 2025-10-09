import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import ConfirmDialog from './ConfirmDialog';
import Pagination from './Pagination';
import getAuthenticatedUrl from '../utils/getAuthenticatedUrl';

const PiezaList = ({ refreshTrigger, onEdit, onView }) => {
    const [piezas, setPiezas] = useState([]);
    const [allPiezas, setAllPiezas] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('lista'); // 'lista' or 'imagen'
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemId: null, itemName: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const { showSuccess, showError } = useNotification();

    useEffect(() => {
        const fetchPiezas = async () => {
            try {
                const res = await api.get(`/apoderado/piezas?search=${searchTerm}`);
                if (res && res.data) {
                    setAllPiezas(res.data);
                } else {
                    console.error('Respuesta del servidor inválida para piezas');
                    setAllPiezas([]);
                }
            } catch (err) {
                console.error('Error al obtener las piezas:', err);
            }
        };

        fetchPiezas();
    }, [refreshTrigger, searchTerm]);

    // Update piezas when allPiezas, page, or page size changes
    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setPiezas(allPiezas.slice(startIndex, endIndex));
    }, [allPiezas, currentPage, itemsPerPage]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleEditClick = (pieza) => {
        if (onEdit) {
            onEdit(pieza);
        }
    };

    const handleViewClick = (pieza) => {
        if (onView) {
            onView(pieza);
        }
    };

    const handleDeleteClick = async (pieza) => {
        setConfirmDialog({ 
            isOpen: true, 
            itemId: pieza._id, 
            itemName: pieza.nombre 
        });
    };

    const handleConfirmDelete = async () => {
        const itemId = confirmDialog.itemId;
        const itemName = confirmDialog.itemName;
        setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
        
        try {
            await api.delete(`/apoderado/piezas/${itemId}`);
            const updatedPiezas = allPiezas.filter(pieza => pieza._id !== itemId);
            setAllPiezas(updatedPiezas);
            showSuccess(`Pieza "${itemName}" eliminada exitosamente`);
            
            // Adjust current page if needed
            const totalPages = Math.ceil(updatedPiezas.length / itemsPerPage);
            if (currentPage > totalPages && totalPages > 0) {
                setCurrentPage(totalPages);
            }
        } catch (err) {
            console.error('Error al eliminar pieza:', err);
            if (err.response?.data) {
                showError(err.response.data);
            } else {
                showError('Error al eliminar la pieza');
            }
        }
    };

    const handleCancelDelete = () => {
        setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    if (allPiezas.length === 0 && !searchTerm) {
        return (
            <div className="list-container">
                <h3>Lista de Piezas</h3>
                <p>No tienes piezas registradas aún.</p>
            </div>
        );
    }

    return (
        <div className="list-container">
            <h3>Lista de Piezas</h3>
            <div className="search-filter-container">
                <input
                    type="text"
                    placeholder="Buscar por ID pieza, nombre o producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="view-toggle">
                    <label>Vista:</label>
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                    >
                        <option value="lista">Lista</option>
                        <option value="imagen">Imagen</option>
                    </select>
                </div>
            </div>
            
            {viewMode === 'lista' ? (
                <table>
                    <thead>
                        <tr>
                            <th>Imagen</th>
                            <th>ID Pieza</th>
                            <th>Nombre</th>
                            <th>Productos Asociados</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {piezas.map(pieza => (
                            <tr key={pieza._id}>
                                <td>
                                    {pieza.imagen && pieza.imagen.url ? (
                                        <img 
                                            src={getAuthenticatedUrl(pieza.imagen.url)} 
                                            alt={pieza.nombre}
                                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        'Sin imagen'
                                    )}
                                </td>
                                <td>{pieza.idPieza || 'N/A'}</td>
                                <td>{pieza.nombre}</td>
                                <td>
                                    {pieza.productos && pieza.productos.length > 0 ? (
                                        <div>
                                            {pieza.productos.map((producto, index) => (
                                                <div key={index}>
                                                    {producto.modelo} ({producto.marca?.nombre || 'N/A'})
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        'Sin productos asociados'
                                    )}
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button 
                                            className="action-btn view-btn" 
                                            onClick={() => handleViewClick(pieza)}
                                            title="Ver detalles"
                                        >
                                            👁️
                                        </button>
                                        <button 
                                            className="action-btn edit-btn" 
                                            onClick={() => handleEditClick(pieza)}
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            className="action-btn delete-btn" 
                                            onClick={() => handleDeleteClick(pieza)}
                                            title="Eliminar"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="products-grid">
                    {piezas.map(pieza => (
                        <div key={pieza._id} className="product-card">
                            <div className="product-image-container">
                                {pieza.imagen && pieza.imagen.url ? (
                                    <img 
                                        src={getAuthenticatedUrl(pieza.imagen.url)} 
                                        alt={pieza.nombre}
                                        className="product-image"
                                        style={{ display: 'block' }}
                                        onLoad={(e) => {
                                            // Image loaded successfully, ensure placeholder is hidden
                                            e.target.style.display = 'block';
                                            const placeholder = e.target.parentNode.querySelector('.product-image-placeholder');
                                            if (placeholder) {
                                                placeholder.style.display = 'none';
                                            }
                                        }}
                                        onError={(e) => {
                                            console.error('Error loading pieza image:', {
                                                originalUrl: pieza.imagen.url,
                                                authenticatedUrl: getAuthenticatedUrl(pieza.imagen.url),
                                                pieza: pieza.nombre
                                            });
                                            e.target.style.display = 'none';
                                            const placeholder = e.target.parentNode.querySelector('.product-image-placeholder');
                                            if (placeholder) {
                                                placeholder.style.display = 'flex';
                                            }
                                        }}
                                    />
                                ) : null}
                                <div className="product-image-placeholder" style={{ display: pieza.imagen && pieza.imagen.url ? 'none' : 'flex' }}>
                                    <span>📷</span>
                                </div>
                            </div>
                            <div className="product-info">
                                <h4>{pieza.nombre}</h4>
                                <p><strong>ID:</strong> {pieza.idPieza || 'N/A'}</p>
                                <p><strong>Productos:</strong> {pieza.productos?.length || 0}</p>
                                <div className="product-actions">
                                    <button 
                                        className="action-btn view-btn" 
                                        onClick={() => handleViewClick(pieza)}
                                        title="Ver detalles"
                                    >
                                        👁️
                                    </button>
                                    <button 
                                        className="action-btn edit-btn" 
                                        onClick={() => handleEditClick(pieza)}
                                        title="Editar"
                                    >
                                        ✏️
                                    </button>
                                    <button 
                                        className="action-btn delete-btn" 
                                        onClick={() => handleDeleteClick(pieza)}
                                        title="Eliminar"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Pagination
                currentPage={currentPage}
                totalItems={allPiezas.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
            />
            
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Confirmar eliminación"
                message={`¿Estás seguro de que quieres eliminar la pieza "${confirmDialog.itemName}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </div>
    );
};

export default PiezaList;
