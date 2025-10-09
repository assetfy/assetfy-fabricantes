import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import Tabs from './Tabs';
import WarrantyInfoReadOnly from './WarrantyInfoReadOnly';

const InventarioForm = ({ onInventarioAdded, productos, piezas = [], editingItem, onCancelEdit, readOnly = false }) => {
    const { showSuccess, showError } = useNotification();
    const [itemType, setItemType] = useState('producto'); // 'producto' or 'pieza'
    const [formData, setFormData] = useState({
        numeroSerie: '',
        estado: 'stock',
        producto: '',
        pieza: '',
        ubicacion: '',
        comprador: {
            nombreCompleto: '',
            correoElectronico: '',
            telefono: '',
        },
        atributos: [],
        fechaVenta: '',
        fechaInicioAlquiler: '',
        fechaFinAlquiler: '',
        registrado: 'No',

    });
    const [registrarDatos, setRegistrarDatos] = useState(false);
    const [ubicaciones, setUbicaciones] = useState([]);

    useEffect(() => {
        const fetchUbicaciones = async () => {
            try {
                const res = await api.get('/apoderado/ubicaciones');
                if (res && res.data) {
                    setUbicaciones(res.data);
                }
            } catch (err) {
                console.error('Error al obtener ubicaciones:', err);
            }
        };
        fetchUbicaciones();
    }, []);

    // Get the fabricante ID from the selected producto or pieza
    const getSelectedItemFabricante = () => {
        if (itemType === 'producto' && formData.producto) {
            const producto = productos.find(p => p._id === formData.producto);
            return producto?.marca?.fabricante?._id || producto?.fabricante?._id || null;
        } else if (itemType === 'pieza' && formData.pieza) {
            const pieza = piezas.find(p => p._id === formData.pieza);
            return pieza?.marca?.fabricante?._id || pieza?.fabricante?._id || null;
        }
        return null;
    };

    // Filter ubicaciones by fabricante associated with the selected item's marca
    const filteredUbicaciones = ubicaciones.filter(ubicacion => {
        const itemFabricante = getSelectedItemFabricante();
        // If no item selected, show all ubicaciones
        if (!itemFabricante) return true;
        // Show ubicaciones without fabricante or with matching fabricante
        return !ubicacion.fabricante || ubicacion.fabricante._id === itemFabricante;
    });

    useEffect(() => {
        if (editingItem) {
            // Determine if it's a producto or pieza item
            const isProducto = !!editingItem.producto;
            const isPieza = !!editingItem.pieza;
            
            setItemType(isPieza ? 'pieza' : 'producto');
            
            setFormData({
                numeroSerie: editingItem.numeroSerie || '',
                estado: editingItem.estado || 'stock',
                producto: isProducto && editingItem.producto?._id ? editingItem.producto._id : '',
                pieza: isPieza && editingItem.pieza?._id ? editingItem.pieza._id : '',
                ubicacion: editingItem.ubicacion?._id || '',
                comprador: {
                    nombreCompleto: editingItem.comprador?.nombreCompleto || '',
                    correoElectronico: editingItem.comprador?.correoElectronico || '',
                    telefono: editingItem.comprador?.telefono || '',
                },
                atributos: editingItem.atributos || [],
                fechaVenta: editingItem.fechaVenta ? new Date(editingItem.fechaVenta).toISOString().split('T')[0] : '',
                fechaInicioAlquiler: editingItem.fechaInicioAlquiler ? new Date(editingItem.fechaInicioAlquiler).toISOString().split('T')[0] : '',
                fechaFinAlquiler: editingItem.fechaFinAlquiler ? new Date(editingItem.fechaFinAlquiler).toISOString().split('T')[0] : '',
                registrado: editingItem.registrado || 'No',

            });
            setRegistrarDatos(editingItem.registrado === 'Si' || (editingItem.comprador?.nombreCompleto && editingItem.comprador?.nombreCompleto.trim() !== ''));
        }
    }, [editingItem]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('comprador.')) {
            const compradorField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                comprador: {
                    ...prev.comprador,
                    [compradorField]: value
                }
            }));
        } else {
            setFormData(prev => {
                const newFormData = {
                    ...prev,
                    [name]: value
                };
                
                // Set default date when estado changes to 'vendido'
                if (name === 'estado' && value === 'vendido' && !prev.fechaVenta) {
                    newFormData.fechaVenta = new Date().toISOString().split('T')[0];
                } else if (name === 'estado' && value !== 'vendido') {
                    newFormData.fechaVenta = '';
                }
                
                // Clear rental dates when estado is not 'alquilado'
                if (name === 'estado' && value !== 'alquilado') {
                    newFormData.fechaInicioAlquiler = '';
                    newFormData.fechaFinAlquiler = '';
                }
                
                return newFormData;
            });
        }
    };

    const handleItemChange = (e) => {
        const itemId = e.target.value;
        
        if (itemType === 'producto') {
            setFormData(prev => ({ ...prev, producto: itemId, pieza: '' }));
            
            // Load product attributes
            const selectedProduct = productos.find(p => p._id === itemId);
            if (selectedProduct && selectedProduct.atributos) {
                const newAtributos = selectedProduct.atributos.map(attr => ({
                    nombre: attr.nombre,
                    valor: attr.tipo === 'predefinido' ? attr.valor : ''
                }));
                setFormData(prev => ({ ...prev, atributos: newAtributos }));
            } else {
                setFormData(prev => ({ ...prev, atributos: [] }));
            }
        } else {
            setFormData(prev => ({ ...prev, pieza: itemId, producto: '' }));
            
            // Load pieza attributes
            const selectedPieza = piezas.find(p => p._id === itemId);
            if (selectedPieza && selectedPieza.atributos) {
                const newAtributos = selectedPieza.atributos.map(attr => ({
                    nombre: attr.nombre,
                    valor: attr.tipo === 'predefinido' ? attr.valor : ''
                }));
                setFormData(prev => ({ ...prev, atributos: newAtributos }));
            } else {
                setFormData(prev => ({ ...prev, atributos: [] }));
            }
        }
    };

    const handleToggleItemType = () => {
        if (!readOnly && !editingItem) {
            setItemType(prev => prev === 'producto' ? 'pieza' : 'producto');
            // Clear the selected item and attributes when toggling
            setFormData(prev => ({ ...prev, producto: '', pieza: '', atributos: [] }));
        }
    };

    const handleProductChange = (e) => {
        handleItemChange(e);
    };

    const handleAtributoChange = (index, value) => {
        const newAtributos = [...formData.atributos];
        newAtributos[index].valor = value;
        setFormData(prev => ({ ...prev, atributos: newAtributos }));
    };

    const handleRegistrarChange = (e) => {
        const isChecked = e.target.checked;
        setRegistrarDatos(isChecked);
        
        if (isChecked) {
            // When checkbox is checked, set registrado to 'Si'
            setFormData(prev => ({ ...prev, registrado: 'Si' }));
        } else {
            // When unchecked, set registrado to 'No' and clear buyer data
            setFormData(prev => ({ 
                ...prev, 
                registrado: 'No',
                comprador: {
                    nombreCompleto: '',
                    correoElectronico: '',
                    telefono: '',
                }
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const dataToSend = {
            ...formData
        };
        
        const apiCall = editingItem
            ? api.put(`/apoderado/inventario/${editingItem._id}`, dataToSend)
            : api.post('/apoderado/inventario/add', dataToSend);

        try {
            await apiCall;
            showSuccess(`Artículo de inventario ${editingItem ? 'actualizado' : 'creado'} con éxito!`);
            setFormData({
                numeroSerie: '',
                estado: 'stock',
                producto: '',
                pieza: '',
                comprador: {
                    nombreCompleto: '',
                    correoElectronico: '',
                    telefono: '',
                },
                atributos: [],
                fechaVenta: '',
                fechaInicioAlquiler: '',
                fechaFinAlquiler: '',
                registrado: 'No',

            });
            setRegistrarDatos(false);
            setItemType('producto'); // Reset to producto
            if (onInventarioAdded) {
                onInventarioAdded();
            }
        } catch (err) {
            console.error('Error al gestionar el inventario:', err.response?.data);
            showError('Error: ' + (err.response?.data || 'No se pudo completar la operación.'));
        }
    };

    const handleGenerateSerial = async () => {
        try {
            const response = await api.post('/apoderado/inventario/generate-serial');
            setFormData(prev => ({ ...prev, numeroSerie: response.data.numeroSerie }));
            showSuccess('Número de serie generado exitosamente!');
        } catch (err) {
            console.error('Error al generar número de serie:', err.response?.data);
            showError('Error: ' + (err.response?.data || 'No se pudo generar el número de serie.'));
        }
    };

    const selectedProduct = productos.find(p => p._id === formData.producto);
    const selectedPieza = piezas.find(p => p._id === formData.pieza);
    const selectedItem = itemType === 'producto' ? selectedProduct : selectedPieza;

    return (
        <div className="form-container">
            <h3>{readOnly ? 'Ver Artículo de Inventario' : (editingItem ? 'Editar Artículo de Inventario' : 'Agregar Artículo a Inventario')}</h3>
            <form onSubmit={handleSubmit}>
                <Tabs
                    tabs={[
                        {
                            label: "Información Básica",
                            content: (
                                <>
                                    <div className="form-group">
                                        <label>Número de Serie</label>
                                        <div className="input-with-button">
                                            <input
                                                type="text"
                                                name="numeroSerie"
                                                value={formData.numeroSerie}
                                                onChange={handleChange}
                                                required
                                                readOnly={readOnly}
                                            />
                                            {!readOnly && !editingItem && (
                                                <button
                                                    type="button"
                                                    onClick={handleGenerateSerial}
                                                    className="generate-serial-btn"
                                                    title="Autogenerar"
                                                >
                                                    +
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            {itemType === 'producto' ? 'Producto' : 'Pieza'}
                                            {!readOnly && !editingItem && (
                                                <button
                                                    type="button"
                                                    onClick={handleToggleItemType}
                                                    style={{
                                                        marginLeft: '10px',
                                                        padding: '5px 10px',
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                        border: '1px solid #ccc',
                                                        borderRadius: '4px',
                                                        background: '#f8f9fa',
                                                        color: '#007bff'
                                                    }}
                                                >
                                                    {itemType === 'producto' ? 'Cambiar a Pieza' : 'Cambiar a Producto'}
                                                </button>
                                            )}
                                        </label>
                                        <select
                                            name={itemType === 'producto' ? 'producto' : 'pieza'}
                                            value={itemType === 'producto' ? formData.producto : formData.pieza}
                                            onChange={handleProductChange}
                                            required
                                            disabled={readOnly}
                                        >
                                            <option value="">
                                                {itemType === 'producto' ? 'Selecciona un producto' : 'Selecciona una pieza'}
                                            </option>
                                            {itemType === 'producto' ? (
                                                productos && productos.length > 0 ? (
                                                    productos.map(p => (
                                                        <option key={p._id} value={p._id}>{p.modelo}</option>
                                                    ))
                                                ) : (
                                                    <option disabled>No hay productos disponibles</option>
                                                )
                                            ) : (
                                                piezas && piezas.length > 0 ? (
                                                    piezas.map(p => (
                                                        <option key={p._id} value={p._id}>{p.nombre} ({p.idPieza})</option>
                                                    ))
                                                ) : (
                                                    <option disabled>No hay piezas disponibles</option>
                                                )
                                            )}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Estado</label>
                                        <select
                                            name="estado"
                                            value={formData.estado}
                                            onChange={handleChange}
                                            required
                                            disabled={readOnly}
                                        >
                                            <option value="stock">En Stock</option>
                                            <option value="vendido">Vendido</option>
                                            <option value="alquilado">Alquilado</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Ubicación / Depósito (opcional)</label>
                                        <select
                                            name="ubicacion"
                                            value={formData.ubicacion}
                                            onChange={handleChange}
                                            disabled={readOnly}
                                        >
                                            <option value="">Sin ubicación asignada</option>
                                            {filteredUbicaciones && filteredUbicaciones.length > 0 ? filteredUbicaciones.map(u => (
                                                <option key={u._id} value={u._id}>{u.nombre}</option>
                                            )) : <option disabled>No hay ubicaciones disponibles</option>}
                                        </select>
                                    </div>

                                    {formData.estado === 'vendido' && (
                                        <div className="form-group">
                                            <label>Fecha de Venta</label>
                                            <input
                                                type="date"
                                                name="fechaVenta"
                                                value={formData.fechaVenta}
                                                onChange={handleChange}
                                                readOnly={readOnly}
                                            />
                                            <small style={{ color: '#6c757d' }}>
                                                Si se deja vacío, se asignará automáticamente la fecha actual
                                            </small>
                                        </div>
                                    )}

                                    {formData.estado === 'alquilado' && (
                                        <>
                                            <div className="form-group">
                                                <label>Inicio Alquiler</label>
                                                <input
                                                    type="date"
                                                    name="fechaInicioAlquiler"
                                                    value={formData.fechaInicioAlquiler}
                                                    onChange={handleChange}
                                                    readOnly={readOnly}
                                                />
                                                <small style={{ color: '#6c757d' }}>
                                                    Fecha de inicio del alquiler (opcional)
                                                </small>
                                            </div>
                                            <div className="form-group">
                                                <label>Fin Alquiler</label>
                                                <input
                                                    type="date"
                                                    name="fechaFinAlquiler"
                                                    value={formData.fechaFinAlquiler}
                                                    onChange={handleChange}
                                                    readOnly={readOnly}
                                                />
                                                <small style={{ color: '#6c757d' }}>
                                                    Fecha de fin del alquiler (opcional)
                                                </small>
                                            </div>
                                        </>
                                    )}

                                    {editingItem && editingItem.fechaRegistro && (
                                        <div className="form-group">
                                            <label>Fecha de Registro</label>
                                            <input
                                                type="date"
                                                value={new Date(editingItem.fechaRegistro).toISOString().split('T')[0]}
                                                readOnly
                                                style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                                            />
                                            <small style={{ color: '#6c757d' }}>Fecha de registro vía formulario público (solo lectura)</small>
                                        </div>
                                    )}

                                    {formData.estado === 'vendido' && !readOnly && (
                                        <div className="form-group form-group-checkbox">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={registrarDatos}
                                                    onChange={handleRegistrarChange}
                                                />
                                                Registrar
                                            </label>
                                        </div>
                                    )}

                                    {((formData.estado === 'vendido' && registrarDatos) || (formData.estado === 'alquilado')) && (
                                        <div className="comprador-fields">
                                            <h4>Información del Comprador/Inquilino</h4>
                                            <div className="form-group">
                                                <label>Nombre Completo</label>
                                                <input
                                                    type="text"
                                                    name="comprador.nombreCompleto"
                                                    value={formData.comprador.nombreCompleto}
                                                    onChange={handleChange}
                                                    required={((formData.estado === 'vendido' && registrarDatos) || formData.estado === 'alquilado')}
                                                    readOnly={readOnly}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Correo Electrónico</label>
                                                <input
                                                    type="email"
                                                    name="comprador.correoElectronico"
                                                    value={formData.comprador.correoElectronico}
                                                    onChange={handleChange}
                                                    required={((formData.estado === 'vendido' && registrarDatos) || formData.estado === 'alquilado')}
                                                    readOnly={readOnly}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Teléfono</label>
                                                <input
                                                    type="tel"
                                                    name="comprador.telefono"
                                                    value={formData.comprador.telefono}
                                                    onChange={handleChange}
                                                    required={((formData.estado === 'vendido' && registrarDatos) || formData.estado === 'alquilado')}
                                                    readOnly={readOnly}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )
                        },
                        {
                            label: "Atributos",
                            content: (
                                <div className="inventory-attributes">
                                    {selectedItem ? (
                                        <>
                                            <h4>Atributos {itemType === 'producto' ? `del Producto: ${selectedProduct.modelo}` : `de la Pieza: ${selectedPieza.nombre}`}</h4>
                                            {formData.atributos.length > 0 ? (
                                                <div className="attributes-form">
                                                    {formData.atributos.map((attr, index) => {
                                                        const itemAttr = selectedItem.atributos?.find(pa => pa.nombre === attr.nombre);
                                                        
                                                        if (itemAttr?.tipo === 'lista') {
                                                            return (
                                                                <div key={index} className="form-group">
                                                                    <label>{attr.nombre}</label>
                                                                    <select
                                                                        value={attr.valor}
                                                                        onChange={(e) => handleAtributoChange(index, e.target.value)}
                                                                        required
                                                                        disabled={readOnly}
                                                                    >
                                                                        <option value="">Selecciona {attr.nombre}</option>
                                                                        {itemAttr.valores.map((valor, vIndex) => (
                                                                            <option key={vIndex} value={valor}>{valor}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            );
                                                        } else if (itemAttr?.tipo === 'input') {
                                                            return (
                                                                <div key={index} className="form-group">
                                                                    <label>{attr.nombre}</label>
                                                                    <input
                                                                        type="text"
                                                                        value={attr.valor}
                                                                        onChange={(e) => handleAtributoChange(index, e.target.value)}
                                                                        placeholder={`Ingresa ${attr.nombre}`}
                                                                        required
                                                                        readOnly={readOnly}
                                                                    />
                                                                </div>
                                                            );
                                                        } else if (itemAttr?.tipo === 'predefinido') {
                                                            return (
                                                                <div key={index} className="form-group">
                                                                    <label>{attr.nombre}</label>
                                                                    <input
                                                                        type="text"
                                                                        value={attr.valor}
                                                                        readOnly
                                                                        style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                                                                    />
                                                                    <small style={{ color: '#6c757d' }}>Valor predefinido {itemType === 'producto' ? 'del producto' : 'de la pieza'}</small>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                                </div>
                                            ) : (
                                                <p>{itemType === 'producto' ? 'Este producto' : 'Esta pieza'} no tiene atributos definidos.</p>
                                            )}
                                        </>
                                    ) : (
                                        <p>Selecciona {itemType === 'producto' ? 'un producto' : 'una pieza'} para ver sus atributos.</p>
                                    )}
                                </div>
                            )
                        },
                        {
                            label: "Garantía",
                            content: (
                                <WarrantyInfoReadOnly 
                                    producto={selectedItem}
                                    fechaVenta={formData.fechaVenta}
                                />
                            )
                        }
                    ]}
                />
                {!readOnly && <button type="submit">{editingItem ? 'Actualizar Artículo' : 'Agregar a Inventario'}</button>}
                {editingItem && (
                    <button type="button" onClick={onCancelEdit}>{readOnly ? 'Cerrar' : 'Cancelar Edición'}</button>
                )}
                {!editingItem && readOnly && (
                    <button type="button" onClick={onCancelEdit}>Cerrar</button>
                )}
            </form>
        </div>
    );
};

export default InventarioForm;