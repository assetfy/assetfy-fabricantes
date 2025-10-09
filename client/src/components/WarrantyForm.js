import React from 'react';

const WarrantyForm = ({ garantia, onGarantiaChange, readOnly = false }) => {
    const handleChange = (field, value) => {
        if (readOnly) return;
        
        const newGarantia = { ...garantia, [field]: value };
        
        // Reset warranty period fields when switching to "Sin garantia"
        if (field === 'tipoGarantia' && value === 'Sin garantia') {
            newGarantia.plazoNumero = null;
            newGarantia.plazoUnidad = null;
        }
        
        onGarantiaChange(newGarantia);
    };

    const showPlazoFields = garantia?.tipoGarantia === 'Plazo desde fecha de venta';

    return (
        <div className="warranty-form">
            <div className="form-group">
                <label>Tipo de Garantía</label>
                <select
                    value={garantia?.tipoGarantia || 'Sin garantia'}
                    onChange={(e) => handleChange('tipoGarantia', e.target.value)}
                    disabled={readOnly}
                >
                    <option value="Sin garantia">Sin garantía</option>
                    <option value="Plazo desde fecha de venta">Plazo desde fecha de venta</option>
                </select>
            </div>

            {showPlazoFields && (
                <div className="warranty-period">
                    <h4>Plazo de Garantía</h4>
                    <div className="form-group">
                        <label>Duración</label>
                        <input
                            type="number"
                            min="1"
                            value={garantia?.plazoNumero || ''}
                            onChange={(e) => handleChange('plazoNumero', parseInt(e.target.value) || null)}
                            placeholder="Ingrese duración"
                            disabled={readOnly}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Unidad</label>
                        <select
                            value={garantia?.plazoUnidad || ''}
                            onChange={(e) => handleChange('plazoUnidad', e.target.value)}
                            disabled={readOnly}
                            required
                        >
                            <option value="">Seleccione unidad</option>
                            <option value="dias">Días</option>
                            <option value="meses">Meses</option>
                            <option value="años">Años</option>
                        </select>
                    </div>
                </div>
            )}

            <div className="form-group form-group-checkbox">
                <label>
                    <input
                        type="checkbox"
                        checked={garantia?.permitirEdicion || false}
                        onChange={(e) => handleChange('permitirEdicion', e.target.checked)}
                        disabled={readOnly}
                    />
                    Permitir edición desde el artículo
                </label>
            </div>
        </div>
    );
};

export default WarrantyForm;