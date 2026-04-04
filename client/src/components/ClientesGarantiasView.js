import React, { useState, useEffect } from 'react';
import api from '../api';
import ClientesList from './ClientesList';
import GarantiasAsignadasList from './GarantiasAsignadasList';
import PedidoGarantiaList from './PedidoGarantiaList';

const RANGO_LABELS = {
    'ultima_semana': 'Última semana',
    'ultimas_2_semanas': 'Últimas 2 semanas',
    'ultimo_mes': 'Último mes',
    'ultimos_2_meses': 'Últimos 2 meses',
    'ultimos_3_meses': 'Últimos 3 meses',
    'ultimos_6_meses': 'Últimos 6 meses'
};

const ClientesGarantiasView = ({ onOpenInventarioItem }) => {
    const [activeView, setActiveView] = useState('clientes');
    const [contadores, setContadores] = useState({
        clientesTotal: 0,
        clientesNuevos: 0,
        garantiasAsignadasTotal: 0,
        garantiasAsignadasPendientes: 0,
        garantiasAsignadasValidadas: 0,
        garantiasTotal: 0,
        garantiasEnCurso: 0,
        garantiasCerradas: 0,
        rangoNuevos: 'ultimo_mes'
    });
    const [loadingContadores, setLoadingContadores] = useState(true);

    useEffect(() => {
        const fetchContadores = async () => {
            try {
                const res = await api.get('/apoderado/metricas');
                const data = res.data;
                setContadores({
                    clientesTotal: data.clientes?.total || 0,
                    clientesNuevos: data.clientes?.nuevos || 0,
                    garantiasAsignadasTotal: data.garantiasAsignadas?.total || 0,
                    garantiasAsignadasPendientes: data.garantiasAsignadas?.pendientes || 0,
                    garantiasAsignadasValidadas: data.garantiasAsignadas?.validadas || 0,
                    garantiasTotal: data.garantias?.total || 0,
                    garantiasEnCurso: data.garantias?.enCurso || 0,
                    garantiasCerradas: data.garantias?.cerradas || 0,
                    rangoNuevos: data.rangoNuevos || 'ultimo_mes'
                });
            } catch (err) {
                console.error('Error al cargar contadores:', err);
            } finally {
                setLoadingContadores(false);
            }
        };
        fetchContadores();
    }, []);

    const rangoLabel = RANGO_LABELS[contadores.rangoNuevos] || 'Último mes';

    return (
        <div>
            <div className="list-container">
                <div className="section-header">
                    <h3>Clientes</h3>
                    <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '13px' }}>
                        Gestión de clientes, productos registrados y pedidos de garantía.
                    </p>
                </div>
            </div>

            {/* Counter boxes */}
            <div className="representantes-counters">
                <div
                    className={`representante-counter-box ${activeView === 'clientes' ? 'active' : ''}`}
                    onClick={() => setActiveView('clientes')}
                >
                    <div className="representante-counter-title">Clientes</div>
                    <div className="representante-counter-number" style={{ color: '#3b82f6' }}>
                        {loadingContadores ? '...' : contadores.clientesTotal}
                    </div>
                    <div className="representante-counter-subtitle">Total registrados</div>
                    <div className="counter-box-details">
                        <div className="counter-box-detail-row">
                            <span className="detail-dot" style={{ backgroundColor: '#3b82f6' }}></span>
                            <span className="detail-label">Totales</span>
                            <span className="detail-value">{loadingContadores ? '...' : contadores.clientesTotal}</span>
                        </div>
                        <div className="counter-box-detail-row">
                            <span className="detail-dot" style={{ backgroundColor: '#22c55e' }}></span>
                            <span className="detail-label">Nuevos ({rangoLabel})</span>
                            <span className="detail-value">{loadingContadores ? '...' : contadores.clientesNuevos}</span>
                        </div>
                    </div>
                </div>

                <div
                    className={`representante-counter-box ${activeView === 'garantiasAsignadas' ? 'active' : ''}`}
                    onClick={() => setActiveView('garantiasAsignadas')}
                >
                    <div className="representante-counter-title">Garantías</div>
                    <div className="representante-counter-number" style={{ color: '#10b981' }}>
                        {loadingContadores ? '...' : contadores.garantiasAsignadasTotal}
                    </div>
                    <div className="representante-counter-subtitle">Total garantías</div>
                    <div className="counter-box-details">
                        <div className="counter-box-detail-row">
                            <span className="detail-dot" style={{ backgroundColor: '#f59e0b' }}></span>
                            <span className="detail-label">Pendientes</span>
                            <span className="detail-value">{loadingContadores ? '...' : contadores.garantiasAsignadasPendientes}</span>
                        </div>
                        <div className="counter-box-detail-row">
                            <span className="detail-dot" style={{ backgroundColor: '#22c55e' }}></span>
                            <span className="detail-label">Validadas</span>
                            <span className="detail-value">{loadingContadores ? '...' : contadores.garantiasAsignadasValidadas}</span>
                        </div>
                    </div>
                </div>

                <div
                    className={`representante-counter-box ${activeView === 'garantias' ? 'active' : ''}`}
                    onClick={() => setActiveView('garantias')}
                >
                    <div className="representante-counter-title">Pedidos de Garantía</div>
                    <div className="representante-counter-number" style={{ color: '#8b5cf6' }}>
                        {loadingContadores ? '...' : contadores.garantiasTotal}
                    </div>
                    <div className="representante-counter-subtitle">Total pedidos</div>
                    <div className="counter-box-details">
                        <div className="counter-box-detail-row">
                            <span className="detail-dot" style={{ backgroundColor: '#f59e0b' }}></span>
                            <span className="detail-label">En curso</span>
                            <span className="detail-value">{loadingContadores ? '...' : contadores.garantiasEnCurso}</span>
                        </div>
                        <div className="counter-box-detail-row">
                            <span className="detail-dot" style={{ backgroundColor: '#6c757d' }}></span>
                            <span className="detail-label">Cerrados</span>
                            <span className="detail-value">{loadingContadores ? '...' : contadores.garantiasCerradas}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content based on active view */}
            {activeView === 'clientes' && (
                <ClientesList onOpenInventarioItem={onOpenInventarioItem} />
            )}
            {activeView === 'garantiasAsignadas' && (
                <GarantiasAsignadasList />
            )}
            {activeView === 'garantias' && (
                <PedidoGarantiaList isFabricante={true} />
            )}
        </div>
    );
};

export default ClientesGarantiasView;
