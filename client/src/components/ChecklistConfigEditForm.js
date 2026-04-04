import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';

const ChecklistConfigEditForm = ({ item, fabricanteId, onEditFinished, onCancelEdit }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        requiereFecha: false
    });
    const { showSuccess, showError } = useNotification();

    useEffect(() => {
        if (item) {
            setFormData({
                nombre: item.nombre || '',
                requiereFecha: item.requiereFecha || false
            });
        }
    }, [item]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/apoderado/checklist-config/${item._id}`, {
                fabricanteId,
                nombre: formData.nombre,
                requiereFecha: formData.requiereFecha
            });
            showSuccess('Item de checklist actualizado!');
            if (onEditFinished) onEditFinished();
        } catch (err) {
            console.error('Error al actualizar item de checklist:', err);
            showError('Error: ' + (err.response?.data?.msg || 'Error al actualizar el item.'));
        }
    };

    return (
        <div className="form-container">
            <h3>Editar Item de Checklist</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Nombre del Item</label>
                    <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            name="requiereFecha"
                            checked={formData.requiereFecha}
                            onChange={handleChange}
                            style={{ width: 'auto' }}
                        />
                        Requiere Fecha
                    </label>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit">Actualizar</button>
                    <button type="button" onClick={onCancelEdit} style={{ background: '#6c757d' }}>
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChecklistConfigEditForm;
