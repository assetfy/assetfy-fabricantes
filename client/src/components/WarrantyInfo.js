import React from 'react';

const WarrantyInfo = ({ 
    garantia, 
    onGarantiaChange, 
    allowEdit = false, 
    fechaVenta,
    onFechaVentaChange 
}) => {
    const handleChange = (field, value) => {
        if (!allowEdit) return;
        
        const newGarantia = { ...garantia, [field]: value };
        
        // Reset warranty period fields when switching to "Sin garantia"
        if (field === 'tipoGarantia' && value === 'Sin garantia') {
            newGarantia.plazoNumero = null;
            newGarantia.plazoUnidad = null;
        }
        
        onGarantiaChange(newGarantia);
    };

    const formatDate = (date) => {
        if (!date) return 'No establecida';
        return new Date(date).toLocaleDateString('es-ES');
    };

    const formatWarrantyPeriod = (numero, unidad) => {
        if (!numero || !unidad) return 'No establecido';
        return `${numero} ${unidad}`;
    };

    const isExpired = () => {
        if (!garantia?.fechaExpiracion) return false;
        return new Date(garantia.fechaExpiracion) < new Date();
    };

    const showPlazoFields = garantia?.tipoGarantia === 'Plazo desde fecha de venta';

    return (
        <div className="warranty-info">
            <div className="form-group">
                <label>Tipo de Garantía</label>
                {allowEdit ? (
                    <select
                        value={garantia?.tipoGarantia || 'Sin garantia'}
                        onChange={(e) => handleChange('tipoGarantia', e.target.value)}
                    >
                        <option value="Sin garantia">Sin garantía</option>
                        <option value="Plazo desde fecha de venta">Plazo desde fecha de venta</option>
                    </select>
                ) : (
                    <div className="readonly-field">{garantia?.tipoGarantia || 'Sin garantía'}</div>
                )}
            </div>

            {showPlazoFields && (
                <div className="warranty-period">
                    <div className="form-group">
                        <label>Plazo de Garantía</label>
                        {allowEdit ? (
                            <div className="warranty-period-inputs">
                                <input
                                    type="number"
                                    min="1"
                                    value={garantia?.plazoNumero || ''}
                                    onChange={(e) => handleChange('plazoNumero', parseInt(e.target.value) || null)}
                                    placeholder="Duración"
                                />
                                <select
                                    value={garantia?.plazoUnidad || ''}
                                    onChange={(e) => handleChange('plazoUnidad', e.target.value)}
                                >
                                    <option value="">Unidad</option>
                                    <option value="dias">Días</option>
                                    <option value="meses">Meses</option>
                                    <option value="años">Años</option>
                                </select>
                            </div>
                        ) : (
                            <div className="readonly-field">
                                {formatWarrantyPeriod(garantia?.plazoNumero, garantia?.plazoUnidad)}
                            </div>
                        )}
                    </div>

                    {fechaVenta && (
                        <div className="form-group">
                            <label>Fecha de Venta</label>
                            <div className="readonly-field">{formatDate(fechaVenta)}</div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Expiración de Garantía</label>
                        <div className={`readonly-field ${isExpired() ? 'warranty-expired' : 'warranty-active'}`}>
                            {formatDate(garantia?.fechaExpiracion)}
                            {isExpired() && <span className="expired-label"> (Expirada)</span>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarrantyInfo;