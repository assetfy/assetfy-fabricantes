import React, { useState, useEffect } from 'react';
import api from '../api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CHART_COLORS = {
    representantes: ['#5C2D91', '#8B5CF6', '#A78BFA', '#C4B5FD', '#7C3AED', '#6D28D9', '#4C1D95', '#DDD6FE', '#EDE9FE', '#9333EA'],
    clientes: ['#2563EB', '#3b82f6', '#60a5fa', '#93bbfd', '#bfdbfe', '#1d4ed8', '#1e40af', '#dbeafe', '#6495ED', '#4169E1'],
    garantias: ['#DC2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#b91c1c', '#991b1b', '#fee2e2', '#E74C3C', '#CD5C5C']
};

const PieChartCard = ({ title, data, colors }) => {
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

    const chartData = Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }));

    return (
        <div className="dashboard-chart-card">
            <h4>{title}</h4>
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) =>
                            `${name.length > 10 ? name.substring(0, 10) + '.' : name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={true}
                    >
                        {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Cantidad']} />
                </PieChart>
            </ResponsiveContainer>
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
            <PieChartCard
                title="Distribución de Representantes por Provincia"
                data={data?.representantes}
                colors={CHART_COLORS.representantes}
            />
            <PieChartCard
                title="Distribución de Clientes por Provincia"
                data={data?.clientes}
                colors={CHART_COLORS.clientes}
            />
            <PieChartCard
                title="Cantidad de Garantías Activas por Provincia"
                data={data?.garantias}
                colors={CHART_COLORS.garantias}
            />
        </>
    );
};

export default DistribucionProvincias;
