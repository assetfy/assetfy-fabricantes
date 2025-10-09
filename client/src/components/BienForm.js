import React, { useState } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import AttributesManager from './AttributesManager';

const BienForm = ({ onBienAdded }) => {
    const { showSuccess, showError } = useNotification();
    const [formData, setFormData] = useState({
        nombre: '',
        comentarios: '',
        atributos: []
    });
    const [imagen, setImagen] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImagen(e.target.files[0]);
        }
    };

    const handleAttributesChange = (newAtributos) => {
        setFormData({
            ...formData,
            atributos: newAtributos
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('nombre', formData.nombre);
            formDataToSend.append('comentarios', formData.comentarios);
            formDataToSend.append('atributos', JSON.stringify(formData.atributos));
            
            if (imagen) {
                formDataToSend.append('imagen', imagen);
            }

            const res = await api.post('/usuario/bienes/crear', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            showSuccess('Bien creado exitosamente');
            
            if (onBienAdded) {
                onBienAdded(res.data);
            }
        } catch (err) {
            console.error('Error al crear bien:', err);
            const errorMsg = err.response?.data?.msg || 'Error al crear el bien';
            setError(errorMsg);
            showError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Nombre del Bien *</label>
                    <input 
                        type="text" 
                        name="nombre" 
                        value={formData.nombre} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <div className="form-group">
                    <label>Imagen</label>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                    {imagen && (
                        <p className="file-selected">Archivo seleccionado: {imagen.name}</p>
                    )}
                </div>

                <div className="form-group">
                    <label>Comentarios</label>
                    <textarea
                        name="comentarios"
                        value={formData.comentarios}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Agrega comentarios sobre este bien..."
                    />
                </div>

                <div className="form-group">
                    <label>Atributos</label>
                    <AttributesManager
                        attributes={formData.atributos}
                        onChange={handleAttributesChange}
                        editable={true}
                    />
                </div>

                {error && <p className="error-message">{error}</p>}
                
                <div className="button-group">
                    <button type="submit" disabled={loading}>
                        {loading ? 'Creando...' : 'Crear Bien'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BienForm;
