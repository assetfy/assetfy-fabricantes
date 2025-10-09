import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import ConfirmDialog from './ConfirmDialog';
import Pagination from './Pagination';

const UbicacionList = ({ refreshTrigger, onEdit }) => {
    const [ubicaciones, setUbicaciones] = useState([]);
    const [allUbicaciones, setAllUbicaciones] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, itemId: null, itemName: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const { showSuccess, showError } = useNotification();

    useEffect(() => {
        const fetchUbicaciones = async () => {
            try {
                const res = await api.get('/apoderado/ubicaciones');
                if (res && res.data) {
                    setAllUbicaciones(res.data);
                    setUbicaciones(res.data);
                } else {
                    console.error('Respuesta del servidor inválida para ubicaciones');
                    setAllUbicaciones([]);
                    setUbicaciones([]);
                }
            } catch (err) {
                console.error('Error al obtener las ubicaciones:', err);
            }
        };
        fetchUbicaciones();
    }, [refreshTrigger]);

    useEffect(() => {
        let filteredUbicaciones = allUbicaciones;

        // Filter by search term
        if (searchTerm) {
            filteredUbicaciones = filteredUbicaciones.filter(ubicacion =>
                ubicacion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ubicacion.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ubicacion.telefono.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setUbicaciones(filteredUbicaciones.slice(startIndex, endIndex));
    }, [searchTerm, allUbicaciones, currentPage, itemsPerPage]);

    const handleDelete = async (id) => {
        try {
            await api.delete(`/apoderado/ubicaciones/${id}`);
            setAllUbicaciones(allUbicaciones.filter(u => u._id !== id));
            showSuccess('Ubicación eliminada con éxito!');
            setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
        } catch (err) {
            console.error('Error al eliminar la ubicación:', err);
            showError(err.response?.data || 'Error al eliminar la ubicación.');
            setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
        }
    };

    const openConfirmDialog = (id, name) => {
        setConfirmDialog({ isOpen: true, itemId: id, itemName: name });
    };

    const closeConfirmDialog = () => {
        setConfirmDialog({ isOpen: false, itemId: null, itemName: '' });
    };

    // Get filtered ubicaciones count for pagination
    const getFilteredUbicacionesCount = () => {
        let filteredUbicaciones = allUbicaciones;

        if (searchTerm) {
            filteredUbicaciones = filteredUbicaciones.filter(ubicacion =>
                ubicacion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ubicacion.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ubicacion.telefono.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return filteredUbicaciones.length;
    };

    if (allUbicaciones.length === 0) {
        return (
            <div className="list-container">
                <h3>Lista de Ubicaciones / Depósitos</h3>
                <p>No tienes ubicaciones registradas aún.</p>
            </div>
        );
    }

    return (
        <div className="list-container">
            <h3>Lista de Ubicaciones / Depósitos</h3>
            <div className="search-filter-container">
                <input
                    type="text"
                    placeholder="Buscar por nombre, dirección o teléfono..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="search-input"
                />
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Dirección</th>
                        <th>Teléfono</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {ubicaciones.map(ubicacion => (
                        <tr key={ubicacion._id}>
                            <td>{ubicacion.nombre}</td>
                            <td>{ubicacion.direccion}</td>
                            <td>{ubicacion.telefono}</td>
                            <td>
                                <button 
                                    onClick={() => onEdit(ubicacion)} 
                                    className="action-btn edit-btn"
                                    title="Editar"
                                >
                                    ✏️
                                </button>
                                <button 
                                    onClick={() => openConfirmDialog(ubicacion._id, ubicacion.nombre)} 
                                    className="action-btn delete-btn"
                                    title="Eliminar"
                                >
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Pagination
                currentPage={currentPage}
                totalItems={getFilteredUbicacionesCount()}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
            />

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Confirmar Eliminación"
                message={`¿Estás seguro de que deseas eliminar la ubicación "${confirmDialog.itemName}"?`}
                onConfirm={() => handleDelete(confirmDialog.itemId)}
                onCancel={closeConfirmDialog}
            />
        </div>
    );
};

export default UbicacionList;
