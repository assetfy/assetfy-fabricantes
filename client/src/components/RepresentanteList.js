import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { useNotification } from './NotificationProvider';
import ConfirmDialog from './ConfirmDialog';
import Pagination from './Pagination';
import SolicitudRepresentacionList from './SolicitudRepresentacionList';

const RepresentanteList = ({ refreshTrigger, onEdit, onAccepted }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeView, setActiveView] = useState(searchParams.get('view') === 'solicitudes' ? 'solicitudes' : 'representantes');
    const initialSolicitudId = searchParams.get('solicitudId') || null;

    const [representantes, setRepresentantes] = useState([]);
    const [allRepresentantes, setAllRepresentantes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('todos');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemId: null, itemName: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const { showSuccess, showError } = useNotification();

    // Counters
    const [contadores, setContadores] = useState({ representantes: 0, solicitudes: 0 });
    const [loadingContadores, setLoadingContadores] = useState(true);

    // Fetch counters
    useEffect(() => {
        const fetchContadores = async () => {
            try {
                const [contadoresRes, repRes] = await Promise.all([
                    api.get('/apoderado/alertas/contadores'),
                    api.get('/apoderado/representantes')
                ]);
                const activeReps = repRes.data ? repRes.data.filter(r => r.estado === 'Activo').length : 0;
                setContadores({
                    representantes: activeReps,
                    solicitudes: contadoresRes.data?.solicitudesRepresentacion || 0
                });
            } catch (err) {
                console.error('Error fetching contadores:', err);
            } finally {
                setLoadingContadores(false);
            }
        };
        fetchContadores();
    }, [refreshTrigger]);

    // Sync activeView with URL params
    useEffect(() => {
        if (searchParams.get('view') === 'solicitudes') {
            setActiveView('solicitudes');
        }
    }, [searchParams]);

    const handleViewChange = (view) => {
        setActiveView(view);
        if (view === 'solicitudes') {
            setSearchParams({ view: 'solicitudes' });
        } else {
            setSearchParams({});
        }
    };

    useEffect(() => {
        const fetchRepresentantes = async () => {
            try {
                const res = await api.get('/apoderado/representantes');
                if (res && res.data) {
                    setAllRepresentantes(res.data);
                    setRepresentantes(res.data);
                } else {
                    console.error('Respuesta del servidor inválida para representantes');
                    setAllRepresentantes([]);
                    setRepresentantes([]);
                }
            } catch (err) {
                console.error('Error al obtener los representantes:', err);
            }
        };
        fetchRepresentantes();
    }, [refreshTrigger]);

    useEffect(() => {
        let filteredRepresentantes = allRepresentantes;

        // Filter by search term
        if (searchTerm) {
            filteredRepresentantes = filteredRepresentantes.filter(representante =>
                representante.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                representante.cuit.includes(searchTerm) ||
                representante.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                representante.telefono.includes(searchTerm)
            );
        }

        // Filter by estado
        if (estadoFilter !== 'todos') {
            filteredRepresentantes = filteredRepresentantes.filter(representante => representante.estado === estadoFilter);
        }

        // Apply pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setRepresentantes(filteredRepresentantes.slice(startIndex, endIndex));
    }, [allRepresentantes, searchTerm, estadoFilter, currentPage, itemsPerPage]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, estadoFilter]);

    const handleEditClick = (representante) => {
        if (onEdit) {
            onEdit(representante);
        }
    };

    const handleDeleteClick = async (representante) => {
        setConfirmDialog({
            isOpen: true,
            itemId: representante._id,
            itemName: representante.nombre
        });
    };

    const handleConfirmDelete = async () => {
        const itemId = confirmDialog.itemId;
        const itemName = confirmDialog.itemName;
        setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });

        try {
            await api.delete(`/apoderado/representantes/${itemId}`);
            const updatedRepresentantes = allRepresentantes.filter(representante => representante._id !== itemId);
            setAllRepresentantes(updatedRepresentantes);
            showSuccess(`Representante "${itemName}" eliminado exitosamente`);

            // Adjust current page if needed
            const totalPages = Math.ceil(updatedRepresentantes.length / itemsPerPage);
            if (currentPage > totalPages && totalPages > 0) {
                setCurrentPage(totalPages);
            }
        } catch (err) {
            console.error('Error al eliminar el representante:', err);
            if (err.response && err.response.status === 400) {
                showError('No se puede eliminar por referencias');
            } else {
                showError('No se pudo eliminar el representante');
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

    // Get filtered representantes count for pagination
    const getFilteredRepresentantesCount = () => {
        let filteredRepresentantes = allRepresentantes;

        if (searchTerm) {
            filteredRepresentantes = filteredRepresentantes.filter(representante =>
                representante.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                representante.cuit.includes(searchTerm) ||
                representante.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                representante.telefono.includes(searchTerm)
            );
        }

        if (estadoFilter !== 'todos') {
            filteredRepresentantes = filteredRepresentantes.filter(representante => representante.estado === estadoFilter);
        }

        return filteredRepresentantes.length;
    };

    const handleSolicitudRefresh = () => {
        // Re-fetch counters when solicitudes change
        api.get('/apoderado/alertas/contadores').then(res => {
            setContadores(prev => ({
                ...prev,
                solicitudes: res.data?.solicitudesRepresentacion || 0
            }));
        }).catch(() => {});
    };

    return (
        <div className="list-container">
            {/* Counter boxes for view switching */}
            <div className="representantes-counters">
                <div
                    className={`representante-counter-box ${activeView === 'representantes' ? 'active' : ''}`}
                    onClick={() => handleViewChange('representantes')}
                >
                    <div className="representante-counter-title">Representantes Oficiales</div>
                    <div className="representante-counter-number" style={{ color: '#3b82f6' }}>
                        {loadingContadores ? '...' : contadores.representantes}
                    </div>
                    <div className="representante-counter-subtitle">Activos</div>
                </div>

                <div
                    className={`representante-counter-box ${activeView === 'solicitudes' ? 'active' : ''}`}
                    onClick={() => handleViewChange('solicitudes')}
                >
                    <div className="representante-counter-title">Solicitudes de Representación</div>
                    <div className="representante-counter-number" style={{ color: '#8b5cf6' }}>
                        {loadingContadores ? '...' : contadores.solicitudes}
                    </div>
                    <div className="representante-counter-subtitle">En evaluación</div>
                </div>
            </div>

            {/* View Content */}
            {activeView === 'solicitudes' ? (
                <SolicitudRepresentacionList
                    onAccepted={onAccepted}
                    initialSolicitudId={initialSolicitudId}
                    onRefresh={handleSolicitudRefresh}
                />
            ) : (
                <>
                    {allRepresentantes.length === 0 ? (
                        <p>No tienes representantes registrados aún.</p>
                    ) : (
                        <>
                            <div className="search-filter-container">
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, CUIT, correo o teléfono..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <select
                                    value={estadoFilter}
                                    onChange={(e) => setEstadoFilter(e.target.value)}
                                >
                                    <option value="todos">Todos los estados</option>
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>CUIT</th>
                                        <th>Nombre</th>
                                        <th>Teléfono</th>
                                        <th>Correo</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {representantes.map(representante => (
                                        <tr key={representante._id}>
                                            <td>{representante.cuit}</td>
                                            <td>{representante.nombre}</td>
                                            <td>{representante.telefono}</td>
                                            <td>{representante.correo}</td>
                                            <td>{representante.estado}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="action-btn edit-btn"
                                                        onClick={() => handleEditClick(representante)}
                                                        title="Editar"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className="action-btn delete-btn"
                                                        onClick={() => handleDeleteClick(representante)}
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

                            <Pagination
                                currentPage={currentPage}
                                totalItems={getFilteredRepresentantesCount()}
                                itemsPerPage={itemsPerPage}
                                onPageChange={handlePageChange}
                                onItemsPerPageChange={handleItemsPerPageChange}
                            />
                        </>
                    )}
                </>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Confirmar eliminación"
                message={`¿Estás seguro de que quieres eliminar el representante "${confirmDialog.itemName}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </div>
    );
};

export default RepresentanteList;
