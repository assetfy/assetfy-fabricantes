import React, { useState, useEffect } from 'react';
import { useNotification } from './NotificationProvider';
import ConfirmDialog from './ConfirmDialog';
import Pagination from './Pagination';

// Extended mock data for testing pagination
const mockProductos = [];
for (let i = 1; i <= 127; i++) {
    mockProductos.push({
        _id: `${i}`,
        idProducto: `PROD${String(i).padStart(3, '0')}`,
        modelo: `Producto Modelo ${i}`,
        descripcion: `Descripción detallada del producto ${i}`,
        fabricante: { 
            _id: Math.ceil(i / 30).toString(), 
            razonSocial: `Fabricante ${Math.ceil(i / 30)} S.A.` 
        },
        marca: { 
            _id: Math.ceil(i / 15).toString(), 
            nombre: `Marca ${Math.ceil(i / 15)}` 
        },
        estado: i % 10 === 0 ? 'Descontinuado' : 'Activo',
        manuales: i % 5 === 0 ? [
            { _id: `m${i}`, originalName: `manual_${i}.pdf`, url: '#' }
        ] : [],
        imagenPrincipal: i % 7 === 0 ? {
            url: `https://via.placeholder.com/300x200?text=Producto+${i}`
        } : null
    });
}

const DemoProductList = ({ refreshTrigger, onEdit, onView }) => {
    const [productos, setProductos] = useState([]);
    const [allProductos, setAllProductos] = useState(mockProductos);
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('todos');
    const [viewMode, setViewMode] = useState('lista');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemId: null, itemName: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const { showSuccess } = useNotification();

    // Filter and paginate data
    useEffect(() => {
        let filteredProducts = allProductos;

        // Apply search filter
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(producto =>
                producto.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply status filter
        if (estadoFilter !== 'todos') {
            filteredProducts = filteredProducts.filter(producto => producto.estado === estadoFilter);
        }

        // Apply pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setProductos(filteredProducts.slice(startIndex, endIndex));
    }, [allProductos, searchTerm, estadoFilter, currentPage, itemsPerPage]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, estadoFilter]);

    const handleEditClick = (producto) => {
        if (onEdit) {
            onEdit(producto);
        } else {
            showSuccess(`Editando producto: ${producto.modelo}`);
        }
    };

    const handleViewClick = (producto) => {
        if (onView) {
            onView(producto);
        } else {
            showSuccess(`Viendo producto: ${producto.modelo}`);
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
        
        const updatedProducts = allProductos.filter(producto => producto._id !== itemId);
        setAllProductos(updatedProducts);
        showSuccess(`Producto "${itemName}" eliminado exitosamente`);
        
        // Adjust current page if needed
        const totalPages = Math.ceil(updatedProducts.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
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

    // Get filtered count for pagination
    const getFilteredCount = () => {
        let filteredProducts = allProductos;

        if (searchTerm) {
            filteredProducts = filteredProducts.filter(producto =>
                producto.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (estadoFilter !== 'todos') {
            filteredProducts = filteredProducts.filter(producto => producto.estado === estadoFilter);
        }

        return filteredProducts.length;
    };

    return (
        <div className="list-container">
            <h3>Lista de Productos (Demo con {allProductos.length} productos)</h3>
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
                            <th>Descripción</th>
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
                                            src={producto.imagenPrincipal.url} 
                                            alt={producto.modelo}
                                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        'Sin imagen'
                                    )}
                                </td>
                                <td>{producto.idProducto || 'N/A'}</td>
                                <td>{producto.modelo}</td>
                                <td>{producto.descripcion}</td>
                                <td>{producto.fabricante ? producto.fabricante.razonSocial : 'N/A'}</td>
                                <td>{producto.marca ? producto.marca.nombre : 'N/A'}</td>
                                <td>{producto.estado || 'Activo'}</td>
                                <td>
                                    {producto.manuales && producto.manuales.length > 0 ? (
                                        <div>
                                            {producto.manuales.map((manual, index) => (
                                                <div key={index}>
                                                    <a href={manual.url} target="_blank" rel="noopener noreferrer">
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
                                        src={producto.imagenPrincipal.url} 
                                        alt={producto.modelo}
                                        className="product-image"
                                    />
                                ) : (
                                    <div className="product-image-placeholder">
                                        <span>📷</span>
                                    </div>
                                )}
                            </div>
                            <div className="product-info">
                                <h4>{producto.modelo}</h4>
                                <p>{producto.marca ? producto.marca.nombre : 'N/A'}</p>
                                <p style={{fontSize: '0.8rem', color: '#666'}}>{producto.descripcion}</p>
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
                totalItems={getFilteredCount()}
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

export default DemoProductList;