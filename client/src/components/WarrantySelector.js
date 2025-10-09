import React, { useState, useEffect } from 'react';
import api from '../api';

const WarrantySelector = ({ selectedWarranty, onWarrantyChange, readOnly = false }) => {
    const [warranties, setWarranties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchWarranties();
    }, []);

    const fetchWarranties = async () => {
        try {
            const response = await api.get('/apoderado/garantias');
            setWarranties(response.data);
        } catch (err) {
            console.error('Error fetching warranties:', err);
            setError('Error al cargar las garantías');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const warrantyId = e.target.value;
        if (warrantyId === '') {
            onWarrantyChange(null);
        } else {
            const selectedWarrantyObj = warranties.find(w => w._id === warrantyId);
            onWarrantyChange(selectedWarrantyObj);
        }
    };

    const formatDuration = (numero, unidad) => {
        if (!numero || !unidad) return '';
        return `${numero} ${unidad}`;
    };

    if (loading) return <div>Cargando garantías...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="warranty-selector">
            <div className="form-group">
                <label>Garantía del Producto</label>
                <select
                    value={selectedWarranty?._id || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                >
                    <option value="">Sin garantía</option>
                    {warranties
                        .filter(warranty => warranty.estado === 'Activa')
                        .map(warranty => (
                            <option key={warranty._id} value={warranty._id}>
                                {warranty.nombre} - {formatDuration(warranty.duracionNumero, warranty.duracionUnidad)}
                            </option>
                        ))}
                </select>
            </div>

            {selectedWarranty && (
                <div className="warranty-preview">
                    <h4>Detalles de la Garantía Seleccionada:</h4>
                    <div className="warranty-details">
                        <p><strong>Nombre:</strong> {selectedWarranty.nombre}</p>
                        <p><strong>Duración:</strong> {formatDuration(selectedWarranty.duracionNumero, selectedWarranty.duracionUnidad)}</p>
                        <p><strong>Fecha de inicio:</strong> {selectedWarranty.fechaInicio}</p>
                        <p><strong>Costo:</strong> {selectedWarranty.costoGarantia}</p>
                        <p><strong>Partes cubiertas:</strong> {selectedWarranty.partesCubiertas}</p>
                        {selectedWarranty.tipoCobertura && selectedWarranty.tipoCobertura.length > 0 && (
                            <p><strong>Tipo de cobertura:</strong> {selectedWarranty.tipoCobertura.join(', ')}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarrantySelector;