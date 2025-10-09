import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import ConfirmDialog from './ConfirmDialog';
import Pagination from './Pagination';
import getAuthenticatedUrl from '../utils/getAuthenticatedUrl';

const ProductList = ({ refreshTrigger, onEdit, onView }) => {
    const [productos, setProductos] = useState([]);
    const [allProductos, setAllProductos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('todos');
    const [viewMode, setViewMode] = useState('lista'); // 'lista' or 'imagen'
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemId: null, itemName: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const { showSuccess, showError } = useNotification();

    useEffect(() => {
        const fetchProductos = async () => {
            try {
                const res = await api.get(`/apoderado/productos?search=${searchTerm}&estado=${estadoFilter === 'todos' ? '' : estadoFilter}`);
                if (res && res.data) {
                    setAllProductos(res.data);
                } else {
                    console.error('Respuesta del servidor inválida para productos');
                    setAllProductos([]);
                }
            } catch (err) {
                console.error('Error al obtener los productos:', err);
            }
        };

        fetchProductos();
    }, [refreshTrigger, searchTerm, estadoFilter]);

    // Update productos when allProductos, page, or page size changes
    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setProductos(allProductos.slice(startIndex, endIndex));
    }, [allProductos, currentPage, itemsPerPage]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, estadoFilter]);

    const handleEditClick = (producto) => {
        if (onEdit) {
            onEdit(producto);
        }
    };

    const handleViewClick = (producto) => {
        if (onView) {
            onView(producto);
        }
    };

    const handleDeleteClick = async (producto) => {
        setConfirmDialog({ 
            isOpen: true, 
            itemId: producto._id, 
            itemName: producto.modelo 
        });
    };

    const handleConfirmDelete = async () => {
        const itemId = confirmDialog.itemId;
        const itemName = confirmDialog.itemName;
        setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
        
        try {
            await api.delete(`/apoderado/productos/${itemId}`);
            const updatedProducts = allProductos.filter(producto => producto._id !== itemId);
            setAllProductos(updatedProducts);
            showSuccess(`Producto "${itemName}" eliminado exitosamente`);
            
            // Adjust current page if needed
            const totalPages = Math.ceil(updatedProducts.length / itemsPerPage);
            if (currentPage > totalPages && totalPages > 0) {
                setCurrentPage(totalPages);
            }
        } catch (err) {
            console.error('Error al eliminar el producto:', err);
            if (err.response && err.response.status === 400) {
                showError('No se puede eliminar por referencias');
            } else {
                showError('No se pudo eliminar el producto');
            }
        }
    };

    const handleCancelDelete = () => {
        setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    if (allProductos.length === 0 && !searchTerm) {
        return (
            <div className="list-container">
                <h3>Lista de Productos</h3>
                <p>No tienes productos registrados aún.</p>
            </div>
        );
    }

    return (
        <div className="list-container">
            <h3>Lista de Productos</h3>
            <div className="search-filter-container">
                <input
                    type="text"
                    placeholder="Buscar por ID, modelo, descripción o marca..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    value={estadoFilter}
                    onChange={(e) => setEstadoFilter(e.target.value)}
                >
                    <option value="todos">Todos los estados</option>
                    <option value="Activo">Activo</option>
                    <option value="Descontinuado">Descontinuado</option>
                </select>
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
                            <th>ID Producto</th>
                            <th>Modelo</th>
                       
                         
                            <th>Fabricante</th>
                            <th>Marca</th>
                            <th>Estado</th>
                            <th>Manuales</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.map(producto => (
                            <tr key={producto._id}>
                                <td>
                                    {producto.imagenPrincipal && producto.imagenPrincipal.url ? (
                                        <img 
                                            src={getAuthenticatedUrl(producto.imagenPrincipal.url)} 
                                            alt={producto.modelo}
                                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        'Sin imagen'
                                    )}
                                </td>
                                <td>{producto.idProducto || 'N/A'}</td>
                                <td>{producto.modelo}</td>
                          
                              
                                <td>{producto.fabricante ? producto.fabricante.razonSocial : 'N/A'}</td>
                                <td>{producto.marca ? producto.marca.nombre : 'N/A'}</td>
                                <td>{producto.estado || 'Activo'}</td>
                                <td>
                                    {producto.manuales && producto.manuales.length > 0 ? (
                                        <div>
                                            {producto.manuales.map((manual, index) => (
                                                <div key={index}>
                                                    <a href={getAuthenticatedUrl(manual.url)} target="_blank" rel="noopener noreferrer">
                                                        {manual.originalName}
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        'Sin manuales'
                                    )}
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button 
                                            className="action-btn view-btn" 
                                            onClick={() => handleViewClick(producto)}
                                            title="Ver detalles"
                                        >
                                            👁️
                                        </button>
                                        <button 
                                            className="action-btn edit-btn" 
                                            onClick={() => handleEditClick(producto)}
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            className="action-btn delete-btn" 
                                            onClick={() => handleDeleteClick(producto)}
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
                    {productos.map(producto => (
                        <div key={producto._id} className="product-card">
                            <div className="product-image-container">
                                {producto.imagenPrincipal && producto.imagenPrincipal.url ? (
                                    <img 
                                        src={getAuthenticatedUrl(producto.imagenPrincipal.url)} 
                                        alt={producto.modelo}
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
                                            console.error('Error loading product image:', {
                                                originalUrl: producto.imagenPrincipal.url,
                                                authenticatedUrl: getAuthenticatedUrl(producto.imagenPrincipal.url),
                                                producto: producto.modelo
                                            });
                                            e.target.style.display = 'none';
                                            const placeholder = e.target.parentNode.querySelector('.product-image-placeholder');
                                            if (placeholder) {
                                                placeholder.style.display = 'flex';
                                            }
                                        }}
                                    />
                                ) : null}
                                <div className="product-image-placeholder" style={{ display: producto.imagenPrincipal && producto.imagenPrincipal.url ? 'none' : 'flex' }}>
                                    <span>📷</span>
                                </div>
                            </div>
                            <div className="product-info">
                                <h4>{producto.modelo}</h4>
                                <p>{producto.marca ? producto.marca.nombre : 'N/A'}</p>
                                <div className="product-actions">
                                    <button 
                                        className="action-btn view-btn" 
                                        onClick={() => handleViewClick(producto)}
                                        title="Ver detalles"
                                    >
                                        👁️
                                    </button>
                                    <button 
                                        className="action-btn edit-btn" 
                                        onClick={() => handleEditClick(producto)}
                                        title="Editar"
                                    >
                                        ✏️
                                    </button>
                                    <button 
                                        className="action-btn delete-btn" 
                                        onClick={() => handleDeleteClick(producto)}
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
                totalItems={allProductos.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
            />
            
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Confirmar eliminación"
                message={`¿Estás seguro de que quieres eliminar el producto "${confirmDialog.itemName}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </div>
    );
};

export default ProductList;