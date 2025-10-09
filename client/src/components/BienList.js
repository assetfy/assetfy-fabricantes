import React, { useState, useEffect } from 'react';
import ConfirmDialog from './ConfirmDialog';
import Pagination from './Pagination';
import getAuthenticatedUrl from '../utils/getAuthenticatedUrl';

const BienList = ({ bienes: bienesFromProps, refreshTrigger, onView, onEdit, onDelete }) => {
    const [bienes, setBienes] = useState([]);
    const [allBienes, setAllBienes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [tipoFilter, setTipoFilter] = useState('todos');
    const [viewMode, setViewMode] = useState('lista'); // 'lista' or 'imagen'
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemId: null, itemName: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    useEffect(() => {
        if (bienesFromProps) {
            // Filter by search and tipo
            const filtered = bienesFromProps.filter(bien => {
                const matchesSearch = searchTerm === '' || 
                    bien.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (bien.datosProducto?.modelo && bien.datosProducto.modelo.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (bien.datosProducto?.numeroSerie && bien.datosProducto.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()));
                
                const matchesTipo = tipoFilter === 'todos' || bien.tipo === tipoFilter;
                
                return matchesSearch && matchesTipo;
            });
            setAllBienes(filtered);
        }
    }, [bienesFromProps, searchTerm, tipoFilter]);

    // Update bienes when allBienes, page, or page size changes
    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setBienes(allBienes.slice(startIndex, endIndex));
    }, [allBienes, currentPage, itemsPerPage]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, tipoFilter]);

    const handleViewClick = (bien) => {
        if (onView) {
            onView(bien);
        }
    };

    const handleEditClick = (bien) => {
        if (onEdit) {
            onEdit(bien);
        }
    };

    const handleDeleteClick = async (bien) => {
        setConfirmDialog({ 
            isOpen: true, 
            itemId: bien._id, 
            itemName: bien.nombre 
        });
    };

    const handleConfirmDelete = async () => {
        const itemId = confirmDialog.itemId;
        setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
        
        const bien = allBienes.find(b => b._id === itemId);
        if (bien && onDelete) {
            onDelete(bien);
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

    const getImageUrl = (bien) => {
        if (bien.tipo === 'creado' && bien.imagen && bien.imagen.url) {
            return getAuthenticatedUrl(bien.imagen.url);
        } else if (bien.tipo === 'registrado' && bien.datosProducto?.imagenPrincipal?.url) {
            return getAuthenticatedUrl(bien.datosProducto.imagenPrincipal.url);
        }
        return null;
    };

    if (allBienes.length === 0 && !searchTerm && tipoFilter === 'todos') {
        return (
            <div className="list-container">
                <h3>Lista de Bienes</h3>
                <p>No tienes bienes registrados aún.</p>
            </div>
        );
    }

    return (
        <div className="list-container">
            <h3>Lista de Bienes</h3>
            <div className="search-filter-container">
                <input
                    type="text"
                    placeholder="Buscar por nombre, modelo o número de serie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    value={tipoFilter}
                    onChange={(e) => setTipoFilter(e.target.value)}
                >
                    <option value="todos">Todos los tipos</option>
                    <option value="creado">Creados</option>
                    <option value="registrado">Registrados</option>
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
                            <th>Nombre</th>
                            <th>Tipo</th>
                            <th>Modelo/Descripción</th>
                            <th>Fabricante</th>
                            <th>Fecha Registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bienes.map(bien => (
                            <tr key={bien._id}>
                                <td>
                                    {getImageUrl(bien) ? (
                                        <img 
                                            src={getImageUrl(bien)} 
                                            alt={bien.nombre}
                                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        'Sin imagen'
                                    )}
                                </td>
                                <td>{bien.nombre}</td>
                                <td>
                                    <span className={`badge badge-${bien.tipo}`}>
                                        {bien.tipo === 'creado' ? 'Creado' : 'Registrado'}
                                    </span>
                                </td>
                                <td>
                                    {bien.tipo === 'registrado' && bien.datosProducto ? 
                                        `${bien.datosProducto.modelo || 'N/A'}${bien.datosProducto.numeroSerie ? ` (SN: ${bien.datosProducto.numeroSerie})` : ''}` : 
                                        (bien.comentarios || 'N/A')
                                    }
                                </td>
                                <td>
                                    {bien.tipo === 'registrado' && bien.datosProducto?.fabricante?.razonSocial ? 
                                        bien.datosProducto.fabricante.razonSocial : 
                                        'N/A'
                                    }
                                </td>
                                <td>
                                    {bien.tipo === 'registrado' && bien.fechaRegistro ? 
                                        new Date(bien.fechaRegistro).toLocaleDateString() : 
                                        'N/A'
                                    }
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button 
                                            className="action-btn view-btn" 
                                            onClick={() => handleViewClick(bien)}
                                            title="Ver detalles"
                                        >
                                            👁️
                                        </button>
                                        <button 
                                            className="action-btn edit-btn" 
                                            onClick={() => handleEditClick(bien)}
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            className="action-btn delete-btn" 
                                            onClick={() => handleDeleteClick(bien)}
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
                    {bienes.map(bien => (
                        <div key={bien._id} className="product-card">
                            <div className="product-image-container">
                                {getImageUrl(bien) ? (
                                    <img 
                                        src={getImageUrl(bien)} 
                                        alt={bien.nombre}
                                        className="product-image"
                                    />
                                ) : (
                                    <div className="product-image-placeholder">
                                        Sin imagen
                                    </div>
                                )}
                            </div>
                            <div className="product-info">
                                <h4>{bien.nombre}</h4>
                                <p className="product-tipo">
                                    <span className={`badge badge-${bien.tipo}`}>
                                        {bien.tipo === 'creado' ? 'Creado' : 'Registrado'}
                                    </span>
                                </p>
                                {bien.tipo === 'registrado' && bien.datosProducto && (
                                    <>
                                        <p><strong>Modelo:</strong> {bien.datosProducto.modelo || 'N/A'}</p>
                                        <p><strong>Fabricante:</strong> {bien.datosProducto.fabricante?.razonSocial || 'N/A'}</p>
                                        {bien.datosProducto.numeroSerie && (
                                            <p><strong>Serie:</strong> {bien.datosProducto.numeroSerie}</p>
                                        )}
                                    </>
                                )}
                                <div className="product-actions">
                                    <button 
                                        className="action-btn view-btn" 
                                        onClick={() => handleViewClick(bien)}
                                        title="Ver detalles"
                                    >
                                        👁️ Ver
                                    </button>
                                    <button 
                                        className="action-btn edit-btn" 
                                        onClick={() => handleEditClick(bien)}
                                        title="Editar"
                                    >
                                        ✏️ Editar
                                    </button>
                                    <button 
                                        className="action-btn delete-btn" 
                                        onClick={() => handleDeleteClick(bien)}
                                        title="Eliminar"
                                    >
                                        🗑️ Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Pagination 
                currentPage={currentPage}
                totalItems={allBienes.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
            />

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                itemName={confirmDialog.itemName}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </div>
    );
};

export default BienList;
