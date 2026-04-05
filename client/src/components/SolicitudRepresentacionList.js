import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';
import Modal from './Modal';
import SolicitudRepresentacionDetail from './SolicitudRepresentacionDetail';

const ESTADO_COLORS = {
    'En Evaluación': '#3b82f6',
    'Aceptada': '#22c55e',
    'Rechazada': '#ef4444'
};

const SolicitudRepresentacionList = ({ onAccepted, initialSolicitudId, onRefresh }) => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('todos');
    const deepLinkProcessedRef = useRef(false);

    const fetchSolicitudes = useCallback(async () => {
        try {
            const res = await api.get('/apoderado/solicitudes-representacion', {
                params: { limit: 100 }
            });
            setSolicitudes(res.data.solicitudes || []);
        } catch (err) {
            console.error('Error al cargar solicitudes de representación:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSolicitudes();
    }, [fetchSolicitudes]);

    // Open specific solicitud from deep-link (only once)
    useEffect(() => {
        if (initialSolicitudId && solicitudes.length > 0 && !selectedSolicitud && !deepLinkProcessedRef.current) {
            deepLinkProcessedRef.current = true;
            const found = solicitudes.find(s => s._id === initialSolicitudId);
            if (found) {
                setSelectedSolicitud(found);
            } else {
                // Try fetching individually
                api.get(`/apoderado/solicitudes-representacion/${initialSolicitudId}`)
                    .then(res => setSelectedSolicitud(res.data))
                    .catch(err => console.error('Error fetching solicitud:', err));
            }
        }
    }, [initialSolicitudId, solicitudes, selectedSolicitud]);

    const handleSolicitudUpdated = (updatedSolicitud) => {
        setSolicitudes(prev => prev.map(s => s._id === updatedSolicitud._id ? updatedSolicitud : s));
        setSelectedSolicitud(updatedSolicitud);
        if (onRefresh) onRefresh();
    };

    const handleAccepted = (solicitud) => {
        setSolicitudes(prev => prev.map(s => s._id === solicitud._id ? solicitud : s));
        setSelectedSolicitud(null);
        if (onRefresh) onRefresh();
        if (onAccepted) onAccepted(solicitud);
    };

    const filteredSolicitudes = solicitudes.filter(s => {
        const matchesSearch = !searchTerm ||
            s.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.cuit?.includes(searchTerm) ||
            s.correo?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEstado = estadoFilter === 'todos' || s.estado === estadoFilter;
        return matchesSearch && matchesEstado;
    });

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('es-AR', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
    };

    if (loading) return <p>Cargando solicitudes de representación...</p>;

    return (
        <div className="pedido-garantia-list">
            <div className="list-header">
                <div className="search-filter-container" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <input
                        type="text"
                        placeholder="Buscar por razón social, nombre, CUIT o correo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ flex: 1, minWidth: '200px' }}
                    />
                    <select
                        value={estadoFilter}
                        onChange={(e) => setEstadoFilter(e.target.value)}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="En Evaluación">En Evaluación</option>
                        <option value="Aceptada">Aceptada</option>
                        <option value="Rechazada">Rechazada</option>
                    </select>
                </div>
            </div>

            {filteredSolicitudes.length === 0 ? (
                <div className="no-results">
                    {searchTerm || estadoFilter !== 'todos'
                        ? 'No se encontraron solicitudes que coincidan con los filtros.'
                        : 'No hay solicitudes de representación.'}
                </div>
            ) : (
                <div className="warranty-table-wrapper">
                    <table className="warranty-table">
                        <thead>
                            <tr>
                                <th>Razón Social</th>
                                <th>Nombre</th>
                                <th>CUIT</th>
                                <th>Correo</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th>Mensajes</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSolicitudes.map((solicitud) => (
                                <tr key={solicitud._id}>
                                    <td>{solicitud.razonSocial}</td>
                                    <td>{solicitud.nombre}</td>
                                    <td>{solicitud.cuit}</td>
                                    <td>{solicitud.correo}</td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '3px 10px',
                                            borderRadius: '12px',
                                            backgroundColor: ESTADO_COLORS[solicitud.estado] || '#6c757d',
                                            color: '#fff',
                                            fontSize: '12px',
                                            fontWeight: 600
                                        }}>
                                            {solicitud.estado}
                                        </span>
                                    </td>
                                    <td>{formatDate(solicitud.createdAt)}</td>
                                    <td style={{ textAlign: 'center' }}>{solicitud.mensajes?.length || 0}</td>
                                    <td className="actions-cell">
                                        <div className="action-buttons">
                                            <button
                                                className="action-btn view-btn"
                                                onClick={() => setSelectedSolicitud(solicitud)}
                                                title="Ver detalles"
                                            >
                                                👁️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                isOpen={!!selectedSolicitud}
                onClose={() => setSelectedSolicitud(null)}
                title={`Solicitud de Representación - ${selectedSolicitud?.razonSocial || ''}`}
                size="large"
            >
                {selectedSolicitud && (
                    <SolicitudRepresentacionDetail
                        solicitud={selectedSolicitud}
                        onClose={() => setSelectedSolicitud(null)}
                        onUpdated={handleSolicitudUpdated}
                        onAccepted={handleAccepted}
                    />
                )}
            </Modal>
        </div>
    );
};

export default SolicitudRepresentacionList;
