import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import Tabs from './Tabs';
import AttributesManager from './AttributesManager';
import WarrantySelector from './WarrantySelector';
import getAuthenticatedUrl from '../utils/getAuthenticatedUrl';

const PiezaEditForm = ({ pieza, productos, fabricantes, marcas, onEditFinished, onCancelEdit, readOnly = false }) => {
    const { showSuccess, showError } = useNotification();
    const [formData, setFormData] = useState({
        nombre: '',
        fabricante: '',
        marca: '',
        productosSeleccionados: []
    });
    const [existingImagen, setExistingImagen] = useState(null);
    const [newImagen, setNewImagen] = useState(null);
    const [atributos, setAtributos] = useState([]);
    const [garantia, setGarantia] = useState(null);

    useEffect(() => {
        if (pieza) {
            setFormData({
                nombre: pieza.nombre || '',
                fabricante: pieza.fabricante?._id || '',
                marca: pieza.marca?._id || '',
                productosSeleccionados: pieza.productos?.map(p => p._id) || []
            });
            setExistingImagen(pieza.imagen || null);
            setAtributos(pieza.atributos || []);
            setGarantia(pieza.garantia || null);
        }
    }, [pieza]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleProductosChange = (e) => {
        const options = e.target.options;
        const selected = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selected.push(options[i].value);
            }
        }
        setFormData({
            ...formData,
            productosSeleccionados: selected
        });
    };

    const handleImagenChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setNewImagen(e.target.files[0]);
        }
    };

    const handleDeleteImagen = async () => {
        if (!window.confirm('¿Está seguro de que desea eliminar la imagen?')) {
            return;
        }

        try {
            await api.delete(`/apoderado/piezas/${pieza._id}/imagen`);
            setExistingImagen(null);
            showSuccess('Imagen eliminada con éxito!');
        } catch (err) {
            console.error('Error al eliminar imagen:', err);
            showError('Error al eliminar la imagen');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                nombre: formData.nombre,
                fabricante: formData.fabricante || null,
                marca: formData.marca || null,
                productos: formData.productosSeleccionados,
                atributos: atributos,
                garantia: garantia?._id || null
            };

            await api.put(`/apoderado/piezas/${pieza._id}`, dataToSend);
            showSuccess('Pieza actualizada con éxito!');

            // Upload new image if provided
            if (newImagen) {
                const formDataImagen = new FormData();
                formDataImagen.append('imagen', newImagen);

                try {
                    await api.post(`/apoderado/piezas/${pieza._id}/imagen`, formDataImagen, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    showSuccess('Imagen actualizada con éxito!');
                } catch (imgErr) {
                    console.error('Error al subir imagen:', imgErr);
                    showError('Pieza actualizada, pero error al subir la imagen');
                }
            }

            if (onEditFinished) {
                onEditFinished();
            }
        } catch (err) {
            console.error('Error al actualizar la pieza:', err.response?.data);
            showError('Error: ' + (err.response?.data || 'No se pudo actualizar la pieza.'));
        }
    };

    return (
        <div className="form-container">
            <h3>{readOnly ? 'Ver Pieza' : 'Editar Pieza'}</h3>
            <form onSubmit={handleSubmit}>
                <Tabs
                    tabs={[
                        {
                            label: "Información Básica",
                            content: (
                                <>
                                    <div className="form-group">
                                        <label>ID Pieza</label>
                                        <input 
                                            type="text" 
                                            value={pieza?.idPieza || 'N/A'} 
                                            readOnly 
                                            disabled
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Nombre de la Pieza</label>
                                        <input 
                                            type="text" 
                                            name="nombre" 
                                            value={formData.nombre} 
                                            onChange={handleChange} 
                                            required 
                                            readOnly={readOnly}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Fabricante</label>
                                        <select 
                                            name="fabricante" 
                                            value={formData.fabricante} 
                                            onChange={handleChange}
                                            disabled={readOnly}
                                        >
                                            <option value="">Selecciona un fabricante (opcional)</option>
                                            {fabricantes && fabricantes.map(fab => (
                                                <option key={fab._id} value={fab._id}>{fab.razonSocial}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Marca</label>
                                        <select 
                                            name="marca" 
                                            value={formData.marca} 
                                            onChange={handleChange}
                                            disabled={readOnly || !formData.fabricante}
                                        >
                                            <option value="">Selecciona una marca (opcional)</option>
                                            {marcas && marcas.filter(m => m.fabricante._id === formData.fabricante).map(m => (
                                                <option key={m._id} value={m._id}>{m.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Imagen de la Pieza</label>
                                        {existingImagen && existingImagen.url && (
                                            <div className="existing-image">
                                                <img 
                                                    src={getAuthenticatedUrl(existingImagen.url)} 
                                                    alt="Imagen actual"
                                                    style={{ maxWidth: '200px', marginBottom: '10px' }}
                                                />
                                                {!readOnly && (
                                                    <button 
                                                        type="button" 
                                                        onClick={handleDeleteImagen}
                                                        className="delete-button"
                                                        style={{ display: 'block', marginTop: '5px' }}
                                                    >
                                                        Eliminar imagen actual
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {!readOnly && (
                                            <>
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={handleImagenChange}
                                                />
                                                {newImagen && <p>Nueva imagen seleccionada: {newImagen.name}</p>}
                                            </>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>Productos Asociados (múltiple selección)</label>
                                        <select 
                                            multiple 
                                            value={formData.productosSeleccionados}
                                            onChange={handleProductosChange}
                                            style={{ minHeight: '150px' }}
                                            disabled={readOnly}
                                        >
                                            {productos && productos
                                                .filter(producto => !formData.marca || producto.marca?._id === formData.marca)
                                                .map(producto => (
                                                    <option key={producto._id} value={producto._id}>
                                                        {producto.modelo} ({producto.marca?.nombre || 'Sin marca'})
                                                    </option>
                                                ))}
                                        </select>
                                        {!readOnly && <small>Mantenga presionado Ctrl (Cmd en Mac) para seleccionar múltiples productos</small>}
                                    </div>
                                </>
                            )
                        },
                        {
                            label: "Atributos",
                            content: (
                                <AttributesManager 
                                    atributos={atributos}
                                    onAtributosChange={setAtributos}
                                    readOnly={readOnly}
                                />
                            )
                        },
                        {
                            label: "Garantía",
                            content: (
                                <WarrantySelector 
                                    selectedWarranty={garantia}
                                    onWarrantyChange={setGarantia}
                                    readOnly={readOnly}
                                />
                            )
                        }
                    ]}
                />
                {!readOnly && <button type="submit">Actualizar Pieza</button>}
                <button type="button" onClick={onCancelEdit}>{readOnly ? 'Cerrar' : 'Cancelar'}</button>
            </form>
        </div>
    );
};

export default PiezaEditForm;
