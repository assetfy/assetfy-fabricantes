import React, { useState } from 'react';

const WarrantyList = ({ garantias, onEdit, onDelete, onView }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredGarantias = garantias.filter(garantia => 
        garantia.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        garantia.idGarantia.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDuration = (numero, unidad) => {
        if (!numero || !unidad) return 'No definido';
        return `${numero} ${unidad}`;
    };

    const formatArrayToString = (array) => {
        if (!array || array.length === 0) return 'Ninguno';
        return array.join(', ');
    };

    return (
        <div className="warranty-list">
            <div className="list-header">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {filteredGarantias.length === 0 ? (
                <div className="no-results">
                    {searchTerm ? 'No se encontraron garantías que coincidan con la búsqueda.' : 'No hay garantías registradas.'}
                </div>
            ) : (
                <div className="warranty-table-wrapper">
                    <table className="warranty-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Duración</th>
                                <th>Fecha Inicio</th>
                                <th>Costo</th>
                                <th>Cobertura</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGarantias.map((garantia) => (
                                <tr key={garantia._id}>
                                    <td className="id-cell">{garantia.idGarantia}</td>
                                    <td className="name-cell">
                                        <div className="name-container">
                                            <span className="name">{garantia.nombre}</span>
                                        </div>
                                    </td>
                                    <td>{formatDuration(garantia.duracionNumero, garantia.duracionUnidad)}</td>
                                    <td>{garantia.fechaInicio}</td>
                                    <td>
                                        <span className={`cost-badge ${garantia.costoGarantia === 'Incluido' ? 'included' : 'additional'}`}>
                                            {garantia.costoGarantia}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="coverage-summary">
                                            <div className="coverage-item">
                                                <strong>Partes:</strong> {garantia.partesCubiertas}
                                            </div>
                                            <div className="coverage-item">
                                                <strong>Tipos:</strong> {formatArrayToString(garantia.tipoCobertura)}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${garantia.estado.toLowerCase()}`}>
                                            {garantia.estado}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => onView(garantia)}
                                                className="action-btn view-btn"
                                                title="Ver detalles"
                                            >
                                                👁️
                                            </button>
                                            <button
                                                onClick={() => onEdit(garantia)}
                                                className="action-btn edit-btn"
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => onDelete(garantia)}
                                                className="action-btn delete-btn"
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
                </div>
            )}
        </div>
    );
};

export default WarrantyList;