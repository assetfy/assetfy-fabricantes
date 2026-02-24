import React, { useState } from 'react';
import api from '../api';

const ESTADO_COLORS = {
    'Nuevo': '#007bff',
    'En Análisis': '#ffc107',
    'Cerrado': '#6c757d'
};

const PedidoGarantiaDetail = ({ pedido, onClose, onUpdated, isFabricante }) => {
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [nuevoEstado, setNuevoEstado] = useState(pedido.estado);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleResponder = async () => {
        if (!nuevoMensaje.trim()) {
            setError('El mensaje no puede estar vacío');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const endpoint = isFabricante
                ? `/apoderado/pedidos-garantia/${pedido._id}/responder`
                : `/usuario/pedidos-garantia/${pedido._id}/mensaje`;
            const res = await api.post(endpoint, { contenido: nuevoMensaje });
            setNuevoMensaje('');
            if (onUpdated) onUpdated(res.data.pedido);
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al enviar el mensaje');
        } finally {
            setLoading(false);
        }
    };

    const handleCambiarEstado = async () => {
        if (nuevoEstado === pedido.estado) return;
        setLoading(true);
        setError('');
        try {
            const res = await api.put(`/apoderado/pedidos-garantia/${pedido._id}/estado`, { estado: nuevoEstado });
            if (onUpdated) onUpdated(res.data.pedido);
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al cambiar el estado');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('es-AR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const estadoColor = ESTADO_COLORS[pedido.estado] || '#6c757d';

    return (
        <div className="pedido-garantia-detail">
            <div className="pedido-header" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        backgroundColor: estadoColor,
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '13px'
                    }}>
                        {pedido.estado}
                    </span>
                    <span style={{ color: '#666', fontSize: '13px' }}>
                        Creado: {formatDate(pedido.createdAt)}
                    </span>
                </div>

                <div style={{ marginTop: '10px' }}>
                    <strong>Bien:</strong> {pedido.bien?.nombre || 'N/A'}
                </div>
                {isFabricante && pedido.bien?.inventario && (
                    <div style={{ marginTop: '4px' }}>
                        <strong>ID de Inventario:</strong>{' '}
                        <a
                            href={`/apoderado/inventario?search=${encodeURIComponent(pedido.bien.inventario.idInventario)}`}
                            style={{ fontFamily: 'monospace', fontWeight: 600 }}
                        >
                            {pedido.bien.inventario.idInventario}
                        </a>
                    </div>
                )}
                {isFabricante && (
                    <div style={{ marginTop: '4px' }}>
                        <strong>Usuario:</strong> {pedido.usuario?.nombreCompleto || 'N/A'} ({pedido.usuario?.correoElectronico || ''})
                    </div>
                )}
                <div style={{ marginTop: '10px' }}>
                    <strong>Descripción:</strong>
                    <p style={{ margin: '4px 0', color: '#444' }}>{pedido.descripcion}</p>
                </div>
                {pedido.archivo?.url && (
                    <div style={{ marginTop: '8px' }}>
                        <strong>Archivo adjunto:</strong>{' '}
                        <a href={pedido.archivo.url} target="_blank" rel="noopener noreferrer">
                            {pedido.archivo.originalName || 'Ver archivo'}
                        </a>
                    </div>
                )}
            </div>

            <div className="pedido-mensajes" style={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '16px',
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: '#f9f9f9',
                marginBottom: '16px'
            }}>
                <h4 style={{ margin: '0 0 12px 0' }}>Historial de mensajes</h4>
                {pedido.mensajes.length === 0 ? (
                    <p style={{ color: '#888', fontSize: '14px' }}>Sin mensajes aún.</p>
                ) : (
                    pedido.mensajes.map((msg, idx) => (
                        <div key={idx} style={{
                            marginBottom: '12px',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            backgroundColor: msg.autor === 'fabricante' ? '#e3f2fd' : '#fff',
                            border: '1px solid',
                            borderColor: msg.autor === 'fabricante' ? '#90caf9' : '#e0e0e0',
                            alignSelf: msg.autor === 'fabricante' ? 'flex-end' : 'flex-start'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <strong style={{ fontSize: '13px', color: msg.autor === 'fabricante' ? '#1565c0' : '#333' }}>
                                    {msg.autor === 'fabricante' ? '🏭 Fabricante' : '👤 Usuario'}
                                </strong>
                                <span style={{ fontSize: '12px', color: '#888' }}>{formatDate(msg.fecha)}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>{msg.contenido}</p>
                        </div>
                    ))
                )}
            </div>

            {pedido.estado !== 'Cerrado' && (
                <div className="pedido-respuesta" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                        {isFabricante ? 'Responder al usuario' : 'Agregar comentario'}
                    </label>
                    <textarea
                        value={nuevoMensaje}
                        onChange={(e) => setNuevoMensaje(e.target.value)}
                        placeholder="Escriba su mensaje..."
                        rows={3}
                        style={{ width: '100%', boxSizing: 'border-box', marginBottom: '8px' }}
                    />
                    {error && <p style={{ color: 'red', margin: '4px 0' }}>{error}</p>}
                    <button
                        className="create-button"
                        onClick={handleResponder}
                        disabled={loading || !nuevoMensaje.trim()}
                    >
                        {loading ? 'Enviando...' : isFabricante ? 'Enviar respuesta' : 'Enviar comentario'}
                    </button>
                </div>
            )}

            {isFabricante && (
                <div className="pedido-estado" style={{ borderTop: '1px solid #e0e0e0', paddingTop: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                        Cambiar estado
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                            value={nuevoEstado}
                            onChange={(e) => setNuevoEstado(e.target.value)}
                        >
                            <option value="Nuevo">Nuevo</option>
                            <option value="En Análisis">En Análisis</option>
                            <option value="Cerrado">Cerrado</option>
                        </select>
                        <button
                            className="create-button"
                            onClick={handleCambiarEstado}
                            disabled={loading || nuevoEstado === pedido.estado}
                        >
                            {loading ? 'Guardando...' : 'Guardar estado'}
                        </button>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button className="cancel-button" onClick={onClose}>
                    Cerrar
                </button>
            </div>
        </div>
    );
};

export default PedidoGarantiaDetail;
