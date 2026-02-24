import React, { useState } from 'react';
import api from '../api';

const PedidoGarantiaForm = ({ bien, onSubmit, onCancel }) => {
    const [descripcion, setDescripcion] = useState('');
    const [comentario, setComentario] = useState('');
    const [archivo, setArchivo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!descripcion.trim()) {
            setError('La descripción es requerida');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('bienId', bien._id);
            formData.append('descripcion', descripcion);
            if (comentario.trim()) {
                formData.append('comentario', comentario);
            }
            if (archivo) {
                formData.append('archivo', archivo);
            }
            const res = await api.post('/usuario/pedidos-garantia', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (onSubmit) onSubmit(res.data.pedido);
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al crear el pedido de garantía');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="pedido-garantia-form">
            <div className="form-group">
                <label><strong>Bien:</strong> {bien.nombre}</label>
            </div>

            <div className="form-group">
                <label>Descripción del problema *</label>
                <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Describa detalladamente el problema o motivo del pedido de garantía..."
                    rows={4}
                    required
                />
            </div>

            <div className="form-group">
                <label>Comentario adicional</label>
                <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Agregue cualquier comentario adicional..."
                    rows={3}
                />
            </div>

            <div className="form-group">
                <label>Adjuntar archivo (opcional)</label>
                <input
                    type="file"
                    onChange={(e) => setArchivo(e.target.files[0])}
                    accept="image/*,.pdf,.doc,.docx"
                />
                <small style={{ color: '#666' }}>Máximo 10MB. Imágenes, PDF o documentos Word.</small>
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div className="form-actions">
                <button type="submit" className="create-button" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar Pedido de Garantía'}
                </button>
                <button type="button" className="cancel-button" onClick={onCancel} disabled={loading}>
                    Cancelar
                </button>
            </div>
        </form>
    );
};

export default PedidoGarantiaForm;
