import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import ClienteModal from './ClienteModal';

const ClientesList = ({ onOpenInventarioItem }) => {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [modalMode, setModalMode] = useState('view'); // 'view' or 'edit'

    const fetchClientes = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/apoderado/clientes');
            setClientes(res.data);
        } catch (err) {
            console.error('Error al cargar clientes:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClientes();
    }, [fetchClientes]);

    const filteredClientes = clientes.filter(c => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            c.nombreCompleto?.toLowerCase().includes(term) ||
            c.email?.toLowerCase().includes(term) ||
            c.telefono?.toLowerCase().includes(term) ||
            c.cuil?.toLowerCase().includes(term) ||
            c.provincia?.toLowerCase().includes(term)
        );
    });

    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('es-AR', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
    };

    const handleView = (cliente) => {
        setSelectedCliente(cliente);
        setModalMode('view');
    };

    const handleEdit = (cliente) => {
        setSelectedCliente(cliente);
        setModalMode('edit');
    };

    const handleClienteUpdated = () => {
        fetchClientes();
        setSelectedCliente(null);
    };

    if (loading) return <p>Cargando clientes...</p>;

    return (
        <div className="clientes-list">
            <div className="list-header">
                <div className="search-filter-container" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email, teléfono, CUIL o provincia..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ flex: 1, minWidth: '200px' }}
                    />
                    <span style={{ padding: '8px 0', color: '#666', fontSize: '13px' }}>
                        {filteredClientes.length} cliente{filteredClientes.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {filteredClientes.length === 0 ? (
                <div className="no-results">
                    {searchTerm
                        ? 'No se encontraron clientes que coincidan con la búsqueda.'
                        : 'No hay clientes registrados.'}
                </div>
            ) : (
                <div className="warranty-table-wrapper">
                    <table className="warranty-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Provincia</th>
                                <th>Productos</th>
                                <th>Primer Registro</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClientes.map((cliente) => (
                                <tr key={cliente.email}>
                                    <td>{cliente.nombreCompleto || '—'}</td>
                                    <td>{cliente.email}</td>
                                    <td>{cliente.telefono || '—'}</td>
                                    <td>{cliente.provincia || '—'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            backgroundColor: '#e8f4fd',
                                            color: '#0277bd',
                                            fontSize: '12px',
                                            fontWeight: 600
                                        }}>
                                            {cliente.productos?.length || 0}
                                        </span>
                                    </td>
                                    <td>{formatDate(cliente.primerRegistro)}</td>
                                    <td className="actions-cell">
                                        <button
                                            className="action-btn view-btn"
                                            onClick={() => handleView(cliente)}
                                            title="Ver detalles"
                                        >
                                            👁️
                                        </button>
                                        <button
                                            className="action-btn edit-btn"
                                            onClick={() => handleEdit(cliente)}
                                            title="Editar cliente"
                                        >
                                            ✏️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedCliente && (
                <ClienteModal
                    isOpen={!!selectedCliente}
                    onClose={() => setSelectedCliente(null)}
                    cliente={selectedCliente}
                    mode={modalMode}
                    onSaved={handleClienteUpdated}
                    onOpenInventarioItem={onOpenInventarioItem}
                />
            )}
        </div>
    );
};

export default ClientesList;
