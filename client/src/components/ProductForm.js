import React, { useState } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import Tabs from './Tabs';
import AttributesManager from './AttributesManager';
import WarrantySelector from './WarrantySelector';
import MultimediaForm from './MultimediaForm';

const ProductForm = ({ onProductAdded, fabricantes, marcas }) => {
    const { showSuccess, showError } = useNotification();
    const [formData, setFormData] = useState({
        modelo: '',
        descripcion: '',
        precio: '',
        fabricante: '',
        marca: '',
        estado: 'Activo'
    });
    const [createdProductId, setCreatedProductId] = useState(null);
    const [atributos, setAtributos] = useState([]);
    const [garantia, setGarantia] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                ...formData,
                atributos: atributos,
                garantia: garantia?._id || null
            };
            
            const response = await api.post('/apoderado/productos/add', dataToSend);
            showSuccess('Producto creado con éxito!');
            
            // Store the created product ID for multimedia uploads
            setCreatedProductId(response.data.producto._id);

            setFormData({ modelo: '', descripcion: '', precio: '', fabricante: '', marca: '', estado: 'Activo' });
            setAtributos([]);
            setGarantia(null);
            
            if (onProductAdded) {
                onProductAdded();
            }
        } catch (err) {
            console.error('Error al crear el producto:', err.response.data);
            showError('Error: ' + (err.response.data || 'Error al crear el producto.'));
        }
    };

    return (
        <div className="form-container">
            <h3>Crear Nuevo Producto</h3>
            <form onSubmit={handleSubmit}>
                <Tabs
                    tabs={[
                        {
                            label: "Información Básica",
                            content: (
                                <>
                                    <div className="form-group">
                                        <label>Modelo del Producto</label>
                                        <input type="text" name="modelo" value={formData.modelo} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Descripción</label>
                                        <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Precio</label>
                                        <input type="number" name="precio" value={formData.precio} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Fabricante</label>
                                        <select name="fabricante" value={formData.fabricante} onChange={handleChange} required>
                                            <option value="">Selecciona un fabricante</option>
                                            {fabricantes.map(fab => (
                                                <option key={fab._id} value={fab._id}>{fab.razonSocial}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Marca</label>
                                        <select name="marca" value={formData.marca} onChange={handleChange} required>
                                            <option value="">Selecciona una marca</option>
                                            {marcas.filter(m => m.fabricante._id === formData.fabricante).map(m => (
                                                <option key={m._id} value={m._id}>{m.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Estado</label>
                                        <select name="estado" value={formData.estado} onChange={handleChange} required>
                                            <option value="Activo">Activo</option>
                                            <option value="Descontinuado">Descontinuado</option>
                                        </select>
                                    </div>
                                </>
                            )
                        },
                        {
                            label: "Multimedia",
                            content: (
                                <MultimediaForm 
                                    productId={createdProductId}
                                    multimedia={null}
                                    manuales={null}
                                    onMultimediaChange={() => {}}
                                    onManualesChange={() => {}}
                                />
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
                <button type="submit">Crear Producto</button>
            </form>
        </div>
    );
};

export default ProductForm;