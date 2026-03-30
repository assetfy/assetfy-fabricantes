import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';

const TIPO_LABELS = {
    'producto_registrado': 'Producto Registrado',
    'garantia_por_vencer': 'Garantía por Vencer',
    'pedido_garantia': 'Pedido de Garantía',
    'solicitud_representacion': 'Solicitud de Representación'
};

const TIPO_COLORS = {
    'producto_registrado': '#22c55e',
    'garantia_por_vencer': '#f59e0b',
    'pedido_garantia': '#3b82f6',
    'solicitud_representacion': '#8b5cf6'
};

const AlertasPanel = () => {
    const [contadores, setContadores] = useState(null);
    const [notificaciones, setNotificaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingNotificaciones, setLoadingNotificaciones] = useState(true);
    const [filtroTipo, setFiltroTipo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [noLeidas, setNoLeidas] = useState(0);
    const { showSuccess, showError } = useNotification();

    const fetchContadores = async () => {
        try {
            const res = await api.get('/apoderado/alertas/contadores');
            setContadores(res.data);
        } catch (err) {
            console.error('Error al obtener contadores:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotificaciones = async (page = 1, tipo = '') => {
        setLoadingNotificaciones(true);
        try {
            const params = { page, limit: 15 };
            if (tipo) params.tipo = tipo;
            const res = await api.get('/apoderado/alertas', { params });
            setNotificaciones(res.data.notificaciones);
            setTotalPages(res.data.totalPages);
            setTotal(res.data.total);
            setNoLeidas(res.data.noLeidas);
            setCurrentPage(res.data.page);
        } catch (err) {
            console.error('Error al obtener notificaciones:', err);
        } finally {
            setLoadingNotificaciones(false);
        }
    };

    useEffect(() => {
        fetchContadores();
        fetchNotificaciones();
    }, []);

    useEffect(() => {
        fetchNotificaciones(1, filtroTipo);
    }, [filtroTipo]);

    const handleMarcarLeida = async (id) => {
        try {
            await api.put(`/apoderado/alertas/${id}/leer`);
            setNotificaciones(prev => prev.map(n => n._id === id ? { ...n, leida: true } : n));
            setNoLeidas(prev => Math.max(0, prev - 1));
        } catch (err) {
            showError('Error al marcar como leída');
        }
    };

    const handleMarcarTodasLeidas = async () => {
        try {
            await api.put('/apoderado/alertas/leer-todas');
            setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
            setNoLeidas(0);
            showSuccess('Todas las notificaciones marcadas como leídas');
        } catch (err) {
            showError('Error al marcar todas como leídas');
        }
    };

    const handlePageChange = (page) => {
        fetchNotificaciones(page, filtroTipo);
    };

    const formatFecha = (fecha) => {
        const d = new Date(fecha);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="metricas-panel">
            <div className="section-header">
                <h3>Alertas & Notificaciones</h3>
            </div>

            {/* 4 Counters */}
            <div className="dashboard-boxes-grid">
                <div className="dashboard-box">
                    <div className="dashboard-box-title">Pedidos de Garantía</div>
                    <div className="dashboard-box-number" style={{ color: '#3b82f6' }}>
                        {loading ? '...' : (contadores?.pedidosGarantia || 0)}
                    </div>
                    <div className="dashboard-box-subtitle">Nuevos sin revisar</div>
                </div>

                <div className="dashboard-box">
                    <div className="dashboard-box-title">Garantías por Vencer</div>
                    <div className="dashboard-box-number" style={{ color: '#f59e0b' }}>
                        {loading ? '...' : (contadores?.garantiasPorVencer || 0)}
                    </div>
                    <div className="dashboard-box-subtitle">Dentro del umbral configurado</div>
                </div>

                <div className="dashboard-box">
                    <div className="dashboard-box-title">Solicitudes de Representación</div>
                    <div className="dashboard-box-number" style={{ color: '#8b5cf6' }}>
                        {loading ? '...' : (contadores?.solicitudesRepresentacion || 0)}
                    </div>
                    <div className="dashboard-box-subtitle">Pendientes de revisión</div>
                </div>

                <div className="dashboard-box">
                    <div className="dashboard-box-title">Productos Registrados</div>
                    <div className="dashboard-box-number" style={{ color: '#22c55e' }}>
                        {loading ? '...' : (contadores?.productosRegistrados || 0)}
                    </div>
                    <div className="dashboard-box-subtitle">Total registrados</div>
                </div>
            </div>

            {/* Notifications List */}
            <div style={{ marginTop: '24px' }}>
                <div className="section-header" style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h3 style={{ margin: 0 }}>Notificaciones</h3>
                        {noLeidas > 0 && (
                            <span style={{
                                backgroundColor: '#ef4444',
                                color: '#fff',
                                borderRadius: '12px',
                                padding: '2px 10px',
                                fontSize: '12px',
                                fontWeight: '600'
                            }}>
                                {noLeidas} sin leer
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                            value={filtroTipo}
                            onChange={e => setFiltroTipo(e.target.value)}
                            style={{ fontSize: '13px' }}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="producto_registrado">Productos Registrados</option>
                            <option value="garantia_por_vencer">Garantías por Vencer</option>
                            <option value="pedido_garantia">Pedidos de Garantía</option>
                            <option value="solicitud_representacion">Solicitudes de Representación</option>
                        </select>
                        {noLeidas > 0 && (
                            <button
                                className="create-button"
                                onClick={handleMarcarTodasLeidas}
                                style={{ fontSize: '12px', padding: '6px 12px' }}
                            >
                                Marcar todas como leídas
                            </button>
                        )}
                    </div>
                </div>

                {loadingNotificaciones ? (
                    <p>Cargando notificaciones...</p>
                ) : notificaciones.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                        <p>No hay notificaciones{filtroTipo ? ' de este tipo' : ''}.</p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {notificaciones.map(notif => (
                                <div
                                    key={notif._id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        backgroundColor: notif.leida ? '#fff' : '#f0f4ff',
                                        border: '1px solid',
                                        borderColor: notif.leida ? '#e5e7eb' : '#c7d2fe',
                                        borderRadius: '8px',
                                        cursor: notif.leida ? 'default' : 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onClick={() => !notif.leida && handleMarcarLeida(notif._id)}
                                >
                                    <span style={{
                                        display: 'inline-block',
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: notif.leida ? '#d1d5db' : TIPO_COLORS[notif.tipo] || '#6b7280',
                                        marginTop: '6px',
                                        flexShrink: 0
                                    }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                color: TIPO_COLORS[notif.tipo] || '#6b7280',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {TIPO_LABELS[notif.tipo] || notif.tipo}
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#9ca3af', flexShrink: 0 }}>
                                                {formatFecha(notif.createdAt)}
                                            </span>
                                        </div>
                                        <div style={{ fontWeight: notif.leida ? '400' : '600', fontSize: '14px', marginTop: '2px' }}>
                                            {notif.titulo}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                                            {notif.mensaje}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                                <button
                                    className="create-button"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                    style={{ fontSize: '12px', padding: '6px 12px' }}
                                >
                                    Anterior
                                </button>
                                <span style={{ fontSize: '13px', color: '#666' }}>
                                    Página {currentPage} de {totalPages} ({total} total)
                                </span>
                                <button
                                    className="create-button"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                    style={{ fontSize: '12px', padding: '6px 12px' }}
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AlertasPanel;
