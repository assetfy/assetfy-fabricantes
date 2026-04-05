import React, { useState } from 'react';
import Modal from './Modal';
import api from '../api';
import { useNotification } from './NotificationProvider';

const ExtenderGarantiaModal = ({ garantia, isOpen, onClose, onExtended }) => {
    const [nuevaFecha, setNuevaFecha] = useState('');
    const [comentarios, setComentarios] = useState('');
    const [saving, setSaving] = useState(false);
    const { showSuccess, showError } = useNotification();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nuevaFecha) {
            showError('Debe seleccionar una nueva fecha de expiración.');
            return;
        }

        setSaving(true);
        try {
            await api.post(`/apoderado/garantias-asignadas/${garantia._id}/extender`, {
                nuevaFechaExpiracion: nuevaFecha,
                comentarios
            });
            showSuccess('Garantía extendida exitosamente.');
            setNuevaFecha('');
            setComentarios('');
            if (onExtended) onExtended();
            onClose();
        } catch (err) {
            showError(err.response?.data?.message || 'Error al extender la garantía.');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('es-AR', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
    };

    // Min date: day after current expiration
    const minDate = garantia?.fechaExpiracion
        ? new Date(new Date(garantia.fechaExpiracion).getTime() + 86400000).toISOString().split('T')[0]
        : '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Extender Garantía">
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>ID Garantía</label>
                    <input type="text" value={garantia?.idGarantia || ''} readOnly />
                </div>

                <div className="form-group">
                    <label>Fecha de expiración actual</label>
                    <input type="text" value={formatDate(garantia?.fechaExpiracion)} readOnly />
                </div>

                <div className="form-group">
                    <label>Nueva fecha de expiración *</label>
                    <input
                        type="date"
                        value={nuevaFecha}
                        onChange={(e) => setNuevaFecha(e.target.value)}
                        min={minDate}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Comentarios</label>
                    <textarea
                        value={comentarios}
                        onChange={(e) => setComentarios(e.target.value)}
                        rows={4}
                        placeholder="Motivo de la extensión..."
                    />
                </div>

                <div className="form-actions-modal">
                    <button type="submit" className="modal-btn-primary" disabled={saving}>
                        {saving ? 'Guardando...' : 'Extender Garantía'}
                    </button>
                    <button type="button" className="modal-btn-primary" onClick={onClose} disabled={saving}>
                        Cancelar
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ExtenderGarantiaModal;
