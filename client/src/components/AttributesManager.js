import React, { useState } from 'react';

const AttributesManager = ({ atributos = [], onAtributosChange, readOnly = false }) => {
    const [newAtributo, setNewAtributo] = useState({
        nombre: '',
        tipo: 'lista',
        valores: [''],
        valor: ''
    });

    const handleAddAtributo = () => {
        if (!newAtributo.nombre.trim()) return;
        
        const atributoToAdd = {
            nombre: newAtributo.nombre.trim(),
            tipo: newAtributo.tipo,
            valores: newAtributo.tipo === 'lista' ? newAtributo.valores.filter(v => v.trim()) : [],
            valor: newAtributo.tipo === 'predefinido' ? newAtributo.valor.trim() : ''
        };

        onAtributosChange([...atributos, atributoToAdd]);
        
        // Reset form
        setNewAtributo({
            nombre: '',
            tipo: 'lista',
            valores: [''],
            valor: ''
        });
    };

    const handleRemoveAtributo = (index) => {
        const updatedAtributos = atributos.filter((_, i) => i !== index);
        onAtributosChange(updatedAtributos);
    };

    const handleValorChange = (valorIndex, value) => {
        const newValores = [...newAtributo.valores];
        newValores[valorIndex] = value;
        setNewAtributo({ ...newAtributo, valores: newValores });
    };

    const handleAddValor = () => {
        setNewAtributo({ ...newAtributo, valores: [...newAtributo.valores, ''] });
    };

    const handleRemoveValor = (valorIndex) => {
        const newValores = newAtributo.valores.filter((_, i) => i !== valorIndex);
        setNewAtributo({ ...newAtributo, valores: newValores });
    };

    const renderAtributoType = (atributo) => {
        switch (atributo.tipo) {
            case 'lista':
                return `Lista: ${atributo.valores.join(', ')}`;
            case 'predefinido':
                return `Predefinido: ${atributo.valor}`;
            case 'input':
                return 'Input del usuario';
            default:
                return atributo.tipo;
        }
    };

    if (readOnly) {
        return (
            <div className="attributes-display">
                <h4>Atributos del Producto</h4>
                {atributos.length === 0 ? (
                    <p>Este producto no tiene atributos definidos.</p>
                ) : (
                    <div className="attributes-list">
                        {atributos.map((atributo, index) => (
                            <div key={index} className="attribute-item">
                                <strong>{atributo.nombre}:</strong> {renderAtributoType(atributo)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="attributes-manager">
            <h4>Gestión de Atributos</h4>
            
            {/* Lista de atributos existentes */}
            {atributos.length > 0 && (
                <div className="existing-attributes">
                    <h5>Atributos definidos:</h5>
                    {atributos.map((atributo, index) => (
                        <div key={index} className="attribute-item">
                            <span>
                                <strong>{atributo.nombre}:</strong> {renderAtributoType(atributo)}
                            </span>
                            <button 
                                type="button" 
                                onClick={() => handleRemoveAtributo(index)}
                                className="remove-btn"
                            >
                                Eliminar
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Formulario para agregar nuevo atributo */}
            <div className="add-attribute">
                <h5>Cargar Nuevo Atributo:</h5>
                
                <div className="form-group">
                    <label>Nombre del Atributo</label>
                    <input
                        type="text"
                        value={newAtributo.nombre}
                        onChange={(e) => setNewAtributo({ ...newAtributo, nombre: e.target.value })}
                        placeholder="Ej: Color, Tamaño, Material..."
                    />
                </div>

                <div className="form-group">
                    <label>Tipo de Atributo</label>
                    <select
                        value={newAtributo.tipo}
                        onChange={(e) => setNewAtributo({ 
                            ...newAtributo, 
                            tipo: e.target.value,
                            valores: [''],
                            valor: ''
                        })}
                    >
                        <option value="lista">Lista (usuario elige de opciones)</option>
                        <option value="predefinido">Predefinido (valor fijo)</option>
                        <option value="input">Input (usuario ingresa valor)</option>
                    </select>
                </div>

                {newAtributo.tipo === 'lista' && (
                    <div className="form-group">
                        <label>Valores Posibles</label>
                        {newAtributo.valores.map((valor, index) => (
                            <div key={index} className="valor-input">
                                <input
                                    type="text"
                                    value={valor}
                                    onChange={(e) => handleValorChange(index, e.target.value)}
                                    placeholder={`Valor ${index + 1}`}
                                />
                                {newAtributo.valores.length > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveValor(index)}
                                        className="remove-valor-btn"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                        <button 
                            type="button" 
                            onClick={handleAddValor}
                            className="add-valor-btn"
                        >
                            Agregar Valor
                        </button>
                    </div>
                )}

                {newAtributo.tipo === 'predefinido' && (
                    <div className="form-group">
                        <label>Valor</label>
                        <input
                            type="text"
                            value={newAtributo.valor}
                            onChange={(e) => setNewAtributo({ ...newAtributo, valor: e.target.value })}
                            placeholder="Ej: Cuero, Acero inoxidable..."
                        />
                    </div>
                )}

                <button 
                    type="button" 
                    onClick={handleAddAtributo}
                    className="add-attribute-btn"
                    disabled={!newAtributo.nombre.trim() || 
                        (newAtributo.tipo === 'lista' && !newAtributo.valores.some(v => v.trim())) ||
                        (newAtributo.tipo === 'predefinido' && !newAtributo.valor.trim())
                    }
                >
                    Cargar Atributo
                </button>
            </div>
        </div>
    );
};

export default AttributesManager;