import React, { useState, useEffect } from 'react';
import api from '../api';

const CHART_COLORS = {
    representantes: '#5C2D91',
    clientes: '#2563EB',
    garantias: '#DC2626'
};

const BarChart = ({ title, data, color }) => {
    if (!data || Object.keys(data).length === 0) {
        return (
            <div className="dashboard-chart-card">
                <h4>{title}</h4>
                <div style={{ textAlign: 'center', color: 'var(--text-gray)', fontSize: '0.75rem', padding: '1rem 0' }}>
                    Sin datos disponibles
                </div>
            </div>
        );
    }

    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const maxValue = Math.max(...entries.map(e => e[1]));

    return (
        <div className="dashboard-chart-card">
            <h4>{title}</h4>
            <div className="chart-bar-container">
                {entries.map(([provincia, count]) => (
                    <div className="chart-bar-row" key={provincia}>
                        <span className="chart-bar-label" title={provincia}>
                            {provincia.length > 10 ? provincia.substring(0, 10) + '.' : provincia}
                        </span>
                        <div className="chart-bar-track">
                            <div
                                className="chart-bar-fill"
                                style={{
                                    width: `${(count / maxValue) * 100}%`,
                                    backgroundColor: color
                                }}
                            />
                        </div>
                        <span className="chart-bar-value">{count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DistribucionProvincias = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/apoderado/distribucion-provincias');
                setData(response.data);
            } catch (err) {
                console.error('Error al obtener distribución por provincia:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <>
                <div className="dashboard-chart-card">
                    <h4>Cargando...</h4>
                </div>
            </>
        );
    }

    return (
        <>
            <BarChart
                title="Distribución de Representantes por Provincia"
                data={data?.representantes}
                color={CHART_COLORS.representantes}
            />
            <BarChart
                title="Distribución de Clientes por Provincia"
                data={data?.clientes}
                color={CHART_COLORS.clientes}
            />
            <BarChart
                title="Cantidad de Garantías Activas por Provincia"
                data={data?.garantias}
                color={CHART_COLORS.garantias}
            />
        </>
    );
};

export default DistribucionProvincias;
