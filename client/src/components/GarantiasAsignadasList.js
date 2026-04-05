import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import GarantiaAsignadaDetailModal from './GarantiaAsignadaDetailModal';
import ExtenderGarantiaModal from './ExtenderGarantiaModal';
import { useNotification } from './NotificationProvider';

const ESTADO_COLORS = {
    'Pendiente': '#f59e0b',
    'Validada': '#22c55e',
    'Rechazada': '#ef4444'
};

const GarantiasAsignadasList = () => {
    const [garantias, setGarantias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('todos');
    const [selectedGarantia, setSelectedGarantia] = useState(null);
    const [extendTarget, setExtendTarget] = useState(null);
    const { showSuccess, showError } = useNotification();

    const fetchGarantias = useCallback(async () => {
        try {
            const res = await api.get('/apoderado/garantias-asignadas');
            setGarantias(res.data);
        } catch (err) {
            console.error('Error al cargar garantías asignadas:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGarantias();
    }, [fetchGarantias]);

    const handleEstadoChange = async (garantiaId, nuevoEstado) => {
        try {
            const res = await api.put(`/apoderado/garantias-asignadas/${garantiaId}/estado`, { estado: nuevoEstado });
            setGarantias(prev => prev.map(g => g._id === garantiaId ? res.data : g));
            showSuccess(`Garantía ${nuevoEstado.toLowerCase()} exitosamente.`);
        } catch (err) {
            showError(err.response?.data?.message || 'Error al cambiar el estado.');
        }
    };

    const handleViewDetail = async (garantia) => {
        try {
            const res = await api.get(`/apoderado/garantias-asignadas/${garantia._id}`);
            setSelectedGarantia(res.data);
        } catch (err) {
            setSelectedGarantia(garantia);
        }
    };

    const filteredGarantias = garantias.filter(g => {
        const matchesSearch = !searchTerm ||
            g.idGarantia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.clienteFinal?.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.clienteFinal?.correoElectronico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.productoRepuesto?.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.numeroSerie?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEstado = estadoFilter === 'todos' || g.estado === estadoFilter;
        return matchesSearch && matchesEstado;
    });

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('es-AR', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
    };

    if (loading) return <p>Cargando garantías...</p>;

    return (
        <div className="garantias-asignadas-list">
            <div className="list-header">
                <div className="search-filter-container" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <input
                        type="text"
                        placeholder="Buscar por cliente, número de serie, SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ flex: 1, minWidth: '200px' }}
                    />
                    <select
                        value={estadoFilter}
                        onChange={(e) => setEstadoFilter(e.target.value)}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Validada">Validada</option>
                        <option value="Rechazada">Rechazada</option>
                    </select>
                </div>
            </div>

            {filteredGarantias.length === 0 ? (
                <div className="no-results">
                    {searchTerm || estadoFilter !== 'todos'
                        ? 'No se encontraron garantías que coincidan con los filtros.'
                        : 'No hay garantías asignadas.'}
                </div>
            ) : (
                <div className="warranty-table-wrapper">
                    <table className="warranty-table">
                        <thead>
                            <tr>
                                <th>ID Garantía</th>
                                <th>Cliente Final</th>
                                <th>Producto / Repuesto</th>
                                <th>Número de Serie</th>
                                <th>Fecha de Registro</th>
                                <th>Canal</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGarantias.map((garantia) => (
                                <tr key={garantia._id}>
                                    <td style={{ fontWeight: 600, color: '#8b5cf6' }}>{garantia.idGarantia}</td>
                                    <td>
                                        <div>{garantia.clienteFinal?.nombreCompleto || 'N/A'}</div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>{garantia.clienteFinal?.correoElectronico || ''}</div>
                                    </td>
                                    <td>
                                        <div>{garantia.productoRepuesto?.modelo || 'N/A'}</div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>{garantia.productoRepuesto?.tipo} · {garantia.productoRepuesto?.sku || ''}</div>
                                    </td>
                                    <td>{garantia.numeroSerie}</td>
                                    <td>{formatDate(garantia.fechaRegistro)}</td>
                                    <td>{garantia.canal}</td>
                                    <td>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '3px 10px',
                                            borderRadius: '12px',
                                            backgroundColor: `${ESTADO_COLORS[garantia.estado]}20`,
                                            color: ESTADO_COLORS[garantia.estado],
                                            fontSize: '12px',
                                            fontWeight: 600
                                        }}>
                                            {garantia.estado === 'Validada' && <span>&#10003;</span>}
                                            {garantia.estado}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <div className="action-buttons">
                                            <button
                                                className="action-btn view-btn"
                                                onClick={() => handleViewDetail(garantia)}
                                                title="Ver detalles"
                                            >
                                                &#128065;
                                            </button>
                                            {garantia.estado === 'Validada' && (
                                                <button
                                                    className="action-btn edit-btn"
                                                    onClick={() => setExtendTarget(garantia)}
                                                    title="Extender garantía"
                                                >
                                                    &#128197;
                                                </button>
                                            )}
                                            {garantia.estado === 'Pendiente' && (
                                                <>
                                                    <button
                                                        className="action-btn"
                                                        onClick={() => handleEstadoChange(garantia._id, 'Validada')}
                                                        title="Validar"
                                                    >
                                                        &#10003;
                                                    </button>
                                                    <button
                                                        className="action-btn"
                                                        onClick={() => handleEstadoChange(garantia._id, 'Rechazada')}
                                                        title="Rechazar"
                                                    >
                                                        &#10007;
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <GarantiaAsignadaDetailModal
                garantia={selectedGarantia}
                isOpen={!!selectedGarantia}
                onClose={() => setSelectedGarantia(null)}
            />

            {extendTarget && (
                <ExtenderGarantiaModal
                    garantia={extendTarget}
                    isOpen={!!extendTarget}
                    onClose={() => setExtendTarget(null)}
                    onExtended={fetchGarantias}
                />
            )}
        </div>
    );
};

export default GarantiasAsignadasList;
