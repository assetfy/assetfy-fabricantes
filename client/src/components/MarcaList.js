import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import ConfirmDialog from './ConfirmDialog';
import Pagination from './Pagination';
import getAuthenticatedUrl from '../utils/getAuthenticatedUrl';

const MarcaList = ({ refreshTrigger, onEdit }) => {
    const [marcas, setMarcas] = useState([]);
    const [allMarcas, setAllMarcas] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('todos');
    const [viewMode, setViewMode] = useState('lista'); // 'lista' or 'imagen'
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemId: null, itemName: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const { showSuccess, showError } = useNotification();

    useEffect(() => {
        const fetchMarcas = async () => {
            try {
                const res = await api.get('/apoderado/marcas');
                if (res && res.data) {
                    setAllMarcas(res.data);
                    setMarcas(res.data);
                } else {
                    console.error('Respuesta del servidor inválida para marcas');
                    setAllMarcas([]);
                    setMarcas([]);
                }
            } catch (err) {
                console.error('Error al obtener las marcas:', err);
            }
        };
        fetchMarcas();
    }, [refreshTrigger]);

    useEffect(() => {
        let filteredMarcas = allMarcas;

        // Filter by search term
        if (searchTerm) {
            filteredMarcas = filteredMarcas.filter(marca =>
                marca.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                marca.fabricante.razonSocial.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by estado
        if (estadoFilter !== 'todos') {
            filteredMarcas = filteredMarcas.filter(marca => (marca.estado || 'Activa') === estadoFilter);
        }

        // Apply pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setMarcas(filteredMarcas.slice(startIndex, endIndex));
    }, [allMarcas, searchTerm, estadoFilter, currentPage, itemsPerPage]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, estadoFilter]);

    const handleEditClick = (marca) => {
        if (onEdit) {
            onEdit(marca);
        }
    };

    const handleDeleteClick = async (marca) => {
        setConfirmDialog({ 
            isOpen: true, 
            itemId: marca._id, 
            itemName: marca.nombre 
        });
    };

    const handleConfirmDelete = async () => {
        const itemId = confirmDialog.itemId;
        const itemName = confirmDialog.itemName;
        setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
        
        try {
            await api.delete(`/apoderado/marcas/${itemId}`);
            const updatedMarcas = allMarcas.filter(marca => marca._id !== itemId);
            setAllMarcas(updatedMarcas);
            showSuccess(`Marca "${itemName}" eliminada exitosamente`);
            
            // Adjust current page if needed
            const totalPages = Math.ceil(updatedMarcas.length / itemsPerPage);
            if (currentPage > totalPages && totalPages > 0) {
                setCurrentPage(totalPages);
            }
        } catch (err) {
            console.error('Error al eliminar la marca:', err);
            if (err.response && err.response.status === 400) {
                showError('No se puede eliminar por referencias');
            } else {
                showError('No se pudo eliminar la marca');
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

    // Get filtered marcas count for pagination
    const getFilteredMarcasCount = () => {
        let filteredMarcas = allMarcas;

        if (searchTerm) {
            filteredMarcas = filteredMarcas.filter(marca =>
                marca.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                marca.fabricante.razonSocial.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (estadoFilter !== 'todos') {
            filteredMarcas = filteredMarcas.filter(marca => (marca.estado || 'Activa') === estadoFilter);
        }

        return filteredMarcas.length;
    };

    if (allMarcas.length === 0) {
        return (
            <div className="list-container">
                <h3>Lista de Marcas</h3>
                <p>No tienes marcas registradas aún.</p>
            </div>
        );
    }

    return (
        <div className="list-container">
            <h3>Lista de Marcas</h3>
            <div className="search-filter-container">
                <input
                    type="text"
                    placeholder="Buscar por nombre de marca o fabricante..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    value={estadoFilter}
                    onChange={(e) => setEstadoFilter(e.target.value)}
                >
                    <option value="todos">Todos los estados</option>
                    <option value="Activa">Activa</option>
                    <option value="Desactivada">Desactivada</option>
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
                            <th>Nombre</th>
                            <th>Fabricante</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {marcas.map(marca => (
                            <tr key={marca._id}>
                                <td>{marca.nombre}</td>
                                <td>{marca.fabricante.razonSocial}</td>
                                <td>{marca.estado || 'Activa'}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button 
                                            className="action-btn edit-btn" 
                                            onClick={() => handleEditClick(marca)}
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            className="action-btn delete-btn" 
                                            onClick={() => handleDeleteClick(marca)}
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
                <div className="marcas-grid">
                    {marcas.map(marca => (
                        <div key={marca._id} className="marca-card">
                            <div className="marca-image-container">
                                {marca.logo && marca.logo.url ? (
                                    <img 
                                        src={getAuthenticatedUrl(marca.logo.url)} 
                                        alt={marca.nombre}
                                        className="marca-image"
                                        style={{ display: 'block' }}
                                        onLoad={(e) => {
                                            // Image loaded successfully, ensure placeholder is hidden
                                            e.target.style.display = 'block';
                                            const placeholder = e.target.parentNode.querySelector('.marca-image-placeholder');
                                            if (placeholder) {
                                                placeholder.style.display = 'none';
                                            }
                                        }}
                                        onError={(e) => {
                                            console.error('Error loading marca logo:', {
                                                originalUrl: marca.logo.url,
                                                authenticatedUrl: getAuthenticatedUrl(marca.logo.url),
                                                marca: marca.nombre
                                            });
                                            e.target.style.display = 'none';
                                            const placeholder = e.target.parentNode.querySelector('.marca-image-placeholder');
                                            if (placeholder) {
                                                placeholder.style.display = 'flex';
                                            }
                                        }}
                                    />
                                ) : null}
                                <div className="marca-image-placeholder" style={{ display: marca.logo && marca.logo.url ? 'none' : 'flex' }}>
                                    <span>🏷️</span>
                                </div>
                            </div>
                            <div className="marca-info">
                                <h4>{marca.nombre}</h4>
                                <p>{marca.fabricante.razonSocial}</p>
                                <p className="estado">{marca.estado || 'Activa'}</p>
                                <div className="marca-actions">
                                    <button 
                                        className="action-btn edit-btn" 
                                        onClick={() => handleEditClick(marca)}
                                        title="Editar"
                                    >
                                        ✏️
                                    </button>
                                    <button 
                                        className="action-btn delete-btn" 
                                        onClick={() => handleDeleteClick(marca)}
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
                totalItems={getFilteredMarcasCount()}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
            />
            
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Confirmar eliminación"
                message={`¿Estás seguro de que quieres eliminar la marca "${confirmDialog.itemName}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </div>
    );
};

export default MarcaList;