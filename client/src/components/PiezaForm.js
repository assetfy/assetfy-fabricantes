import React, { useState } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import Tabs from './Tabs';
import AttributesManager from './AttributesManager';
import WarrantySelector from './WarrantySelector';

const PiezaForm = ({ onPiezaAdded, productos, fabricantes, marcas }) => {
    const { showSuccess, showError } = useNotification();
    const [formData, setFormData] = useState({
        nombre: '',
        idPieza: '',
        fabricante: '',
        marca: '',
        productosSeleccionados: []
    });
    const [imagen, setImagen] = useState(null);
    const [atributos, setAtributos] = useState([]);
    const [garantia, setGarantia] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleGenerateId = async () => {
        try {
            const response = await api.post('/apoderado/piezas/generate-id');
            setFormData({
                ...formData,
                idPieza: response.data.idPieza
            });
            showSuccess('ID de pieza generado!');
        } catch (err) {
            console.error('Error al generar ID:', err);
            showError('Error al generar el ID de la pieza');
        }
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
            setImagen(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                nombre: formData.nombre,
                idPieza: formData.idPieza,
                fabricante: formData.fabricante || null,
                marca: formData.marca || null,
                productos: formData.productosSeleccionados,
                atributos: atributos,
                garantia: garantia?._id || null
            };

            const response = await api.post('/apoderado/piezas/add', dataToSend);
            showSuccess('Pieza creada con éxito!');

            const piezaId = response.data.pieza._id;

            // Upload image if provided
            if (imagen) {
                const formDataImagen = new FormData();
                formDataImagen.append('imagen', imagen);

                try {
                    await api.post(`/apoderado/piezas/${piezaId}/imagen`, formDataImagen, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    showSuccess('Imagen subida con éxito!');
                } catch (imgErr) {
                    console.error('Error al subir imagen:', imgErr);
                    showError('Pieza creada, pero error al subir la imagen');
                }
            }

            // Reset form
            setFormData({ nombre: '', idPieza: '', fabricante: '', marca: '', productosSeleccionados: [] });
            setImagen(null);
            setAtributos([]);
            setGarantia(null);

            if (onPiezaAdded) {
                onPiezaAdded();
            }
        } catch (err) {
            console.error('Error al crear la pieza:', err.response?.data);
            showError('Error: ' + (err.response?.data || 'Error al crear la pieza.'));
        }
    };

    return (
        <div className="form-container">
            <h3>Crear Nueva Pieza</h3>
            <form onSubmit={handleSubmit}>
                <Tabs
                    tabs={[
                        {
                            label: "Información Básica",
                            content: (
                                <>
                                    <div className="form-group">
                                        <label>Nombre de la Pieza</label>
                                        <input 
                                            type="text" 
                                            name="nombre" 
                                            value={formData.nombre} 
                                            onChange={handleChange} 
                                            required 
                                            placeholder="Ej: Batería, Motor, etc."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>ID Pieza (Alfanumérico)</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input 
                                                type="text" 
                                                name="idPieza" 
                                                value={formData.idPieza} 
                                                onChange={handleChange}
                                                placeholder="Generado automáticamente o ingrese uno"
                                                style={{ flex: 1 }}
                                            />
                                            <button 
                                                type="button" 
                                                onClick={handleGenerateId}
                                                className="generate-button"
                                            >
                                                Generar ID
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Fabricante</label>
                                        <select 
                                            name="fabricante" 
                                            value={formData.fabricante} 
                                            onChange={handleChange}
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
                                            disabled={!formData.fabricante}
                                        >
                                            <option value="">Selecciona una marca (opcional)</option>
                                            {marcas && marcas.filter(m => m.fabricante._id === formData.fabricante).map(m => (
                                                <option key={m._id} value={m._id}>{m.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Imagen de la Pieza</label>
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={handleImagenChange}
                                        />
                                        {imagen && <p>Archivo seleccionado: {imagen.name}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label>Productos Asociados (múltiple selección)</label>
                                        <select 
                                            multiple 
                                            value={formData.productosSeleccionados}
                                            onChange={handleProductosChange}
                                            style={{ minHeight: '150px' }}
                                        >
                                            {productos && productos
                                                .filter(producto => !formData.marca || producto.marca?._id === formData.marca)
                                                .map(producto => (
                                                    <option key={producto._id} value={producto._id}>
                                                        {producto.modelo} ({producto.marca?.nombre || 'Sin marca'})
                                                    </option>
                                                ))}
                                        </select>
                                        <small>Mantenga presionado Ctrl (Cmd en Mac) para seleccionar múltiples productos</small>
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
                                />
                            )
                        },
                        {
                            label: "Garantía",
                            content: (
                                <WarrantySelector 
                                    selectedWarranty={garantia}
                                    onWarrantyChange={setGarantia}
                                />
                            )
                        }
                    ]}
                />
                <button type="submit">Crear Pieza</button>
            </form>
        </div>
    );
};

export default PiezaForm;
