import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import Modal from './Modal';
import PedidoGarantiaDetail from './PedidoGarantiaDetail';

const ESTADO_COLORS = {
    'Nuevo': '#007bff',
    'En Análisis': '#ffc107',
    'Cerrado': '#6c757d'
};

const PedidoGarantiaList = ({ isFabricante = true }) => {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPedido, setSelectedPedido] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('todos');

    const fetchPedidos = useCallback(async () => {
        try {
            const endpoint = isFabricante ? '/apoderado/pedidos-garantia' : '/usuario/pedidos-garantia';
            const res = await api.get(endpoint);
            setPedidos(res.data);
        } catch (err) {
            console.error('Error al cargar pedidos de garantía:', err);
        } finally {
            setLoading(false);
        }
    }, [isFabricante]);

    useEffect(() => {
        fetchPedidos();
    }, [fetchPedidos]);

    const handlePedidoUpdated = (updatedPedido) => {
        setPedidos(prev => prev.map(p => p._id === updatedPedido._id ? updatedPedido : p));
        setSelectedPedido(updatedPedido);
    };

    const filteredPedidos = pedidos.filter(p => {
        const matchesSearch = !searchTerm ||
            p.bien?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (isFabricante && p.usuario?.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEstado = estadoFilter === 'todos' || p.estado === estadoFilter;
        return matchesSearch && matchesEstado;
    });

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('es-AR', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
    };

    if (loading) return <p>Cargando pedidos de garantía...</p>;

    return (
        <div className="pedido-garantia-list">
            <div className="list-header">
                <div className="search-filter-container" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <input
                        type="text"
                        placeholder="Buscar por bien, usuario o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ flex: 1, minWidth: '200px' }}
                    />
                    <select
                        value={estadoFilter}
                        onChange={(e) => setEstadoFilter(e.target.value)}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="Nuevo">Nuevo</option>
                        <option value="En Análisis">En Análisis</option>
                        <option value="Cerrado">Cerrado</option>
                    </select>
                </div>
            </div>

            {filteredPedidos.length === 0 ? (
                <div className="no-results">
                    {searchTerm || estadoFilter !== 'todos'
                        ? 'No se encontraron pedidos que coincidan con los filtros.'
                        : 'No hay pedidos de garantía.'}
                </div>
            ) : (
                <div className="warranty-table-wrapper">
                    <table className="warranty-table">
                        <thead>
                            <tr>
                                <th>Bien</th>
                                {isFabricante && <th>Usuario</th>}
                                <th>Descripción</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th>Mensajes</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPedidos.map((pedido) => (
                                <tr key={pedido._id}>
                                    <td>{pedido.bien?.nombre || 'N/A'}</td>
                                    {isFabricante && <td>{pedido.usuario?.nombreCompleto || 'N/A'}</td>}
                                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {pedido.descripcion}
                                    </td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '3px 10px',
                                            borderRadius: '12px',
                                            backgroundColor: ESTADO_COLORS[pedido.estado] || '#6c757d',
                                            color: '#fff',
                                            fontSize: '12px',
                                            fontWeight: 600
                                        }}>
                                            {pedido.estado}
                                        </span>
                                    </td>
                                    <td>{formatDate(pedido.createdAt)}</td>
                                    <td style={{ textAlign: 'center' }}>{pedido.mensajes?.length || 0}</td>
                                    <td className="actions-cell">
                                        <button
                                            className="action-btn view-btn"
                                            onClick={() => setSelectedPedido(pedido)}
                                            title="Ver detalles"
                                        >
                                            👁️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                isOpen={!!selectedPedido}
                onClose={() => setSelectedPedido(null)}
                title={`Pedido de Garantía - ${selectedPedido?.bien?.nombre || ''}`}
                size="large"
            >
                {selectedPedido && (
                    <PedidoGarantiaDetail
                        pedido={selectedPedido}
                        isFabricante={isFabricante}
                        onClose={() => setSelectedPedido(null)}
                        onUpdated={handlePedidoUpdated}
                    />
                )}
            </Modal>
        </div>
    );
};

export default PedidoGarantiaList;
