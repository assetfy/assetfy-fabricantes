import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const PERIODOS = [
    { value: 'ultimo_mes', label: 'Último mes' },
    { value: 'ultimos_3_meses', label: 'Últimos 3 meses' },
    { value: 'ultimos_6_meses', label: 'Últimos 6 meses' },
    { value: 'ultimo_anio', label: 'Último año' },
    { value: 'sin_filtro', label: 'Sin filtro de fechas' },
    { value: 'personalizado', label: 'Personalizado' }
];

const CHART_TYPES = [
    { value: 'tabla', label: 'Tabla', icon: '▤' },
    { value: 'tarta', label: 'Tarta', icon: '◕' },
    { value: 'barras_v', label: 'Barras V', icon: '▥' },
    { value: 'barras_h', label: 'Barras H', icon: '▤' }
];

const COLORS = [
    '#5C2D91', '#8B5CF6', '#A78BFA', '#C4B5FD', '#7C3AED',
    '#6D28D9', '#4C1D95', '#DDD6FE', '#EDE9FE', '#9333EA',
    '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4',
    '#ec4899', '#84cc16', '#f97316', '#14b8a6', '#6366f1'
];

const getDateRange = (periodo) => {
    const now = new Date();
    let desde = null;
    switch (periodo) {
        case 'ultimo_mes':
            desde = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
        case 'ultimos_3_meses':
            desde = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
        case 'ultimos_6_meses':
            desde = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
            break;
        case 'ultimo_anio':
            desde = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
        case 'sin_filtro':
            return { desde: null, hasta: null };
        default:
            return null; // personalizado
    }
    return { desde: desde?.toISOString().split('T')[0], hasta: now.toISOString().split('T')[0] };
};

const ReportGadget = ({ title, data, dimensionLabel, badge }) => {
    const [chartType, setChartType] = useState('tabla');

    const downloadExcel = () => {
        if (!data || data.length === 0) return;
        const wsData = data.map(row => ({
            'Fabricante': row.fabricante,
            [dimensionLabel]: row.dimension,
            'Cantidad de ventas': row.count
        }));
        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `${title.replace(/\s+/g, '_')}.xlsx`);
    };

    const chartData = (data || []).map(d => ({
        name: `${d.fabricante} - ${d.dimension}`,
        shortName: d.dimension.length > 20 ? d.dimension.substring(0, 20) + '...' : d.dimension,
        fabricante: d.fabricante,
        value: d.count
    }));

    const renderChart = () => {
        if (!data || data.length === 0) {
            return <div className="ventas-empty">No hay datos para el período seleccionado</div>;
        }

        switch (chartType) {
            case 'tabla':
                return (
                    <div className="ventas-table-wrapper">
                        <table className="ventas-table">
                            <thead>
                                <tr>
                                    <th>Fabricante</th>
                                    <th>{dimensionLabel}</th>
                                    <th>Cant. Ventas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, i) => (
                                    <tr key={i}>
                                        <td>{row.fabricante}</td>
                                        <td>{row.dimension}</td>
                                        <td className="ventas-count-cell">{row.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'tarta':
                return (
                    <div className="ventas-chart-container">
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={120}
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    labelLine={true}
                                >
                                    {chartData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                );
            case 'barras_v':
                return (
                    <div className="ventas-chart-container">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="shortName" angle={-35} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ''} />
                                <Legend />
                                <Bar dataKey="value" name="Ventas" fill="#5C2D91" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                );
            case 'barras_h':
                return (
                    <div className="ventas-chart-container">
                        <ResponsiveContainer width="100%" height={Math.max(350, chartData.length * 40)}>
                            <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 120, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis type="category" dataKey="shortName" width={110} tick={{ fontSize: 11 }} />
                                <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ''} />
                                <Legend />
                                <Bar dataKey="value" name="Ventas" fill="#7C3AED" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="ventas-gadget">
            {badge && <div className="ventas-gadget-badge" style={{ margin: '0.75rem 1.25rem 0' }}>{badge}</div>}
            <div className="ventas-gadget-header">
                <h4 className="ventas-gadget-title">{title}</h4>
                <div className="ventas-gadget-controls">
                    <div className="ventas-chart-selector">
                        {CHART_TYPES.map(ct => (
                            <button
                                key={ct.value}
                                className={`ventas-chart-btn ${chartType === ct.value ? 'active' : ''}`}
                                onClick={() => setChartType(ct.value)}
                                title={ct.label}
                            >
                                {ct.icon}
                            </button>
                        ))}
                    </div>
                    <button
                        className="ventas-download-btn"
                        onClick={downloadExcel}
                        title="Descargar Excel"
                        disabled={!data || data.length === 0}
                    >
                        ⬇
                    </button>
                </div>
            </div>
            <div className="ventas-gadget-body">
                {renderChart()}
            </div>
        </div>
    );
};

const VentasReportPanel = () => {
    const [periodo, setPeriodo] = useState('sin_filtro');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let desde, hasta;
            if (periodo === 'personalizado') {
                desde = fechaDesde || undefined;
                hasta = fechaHasta || undefined;
            } else {
                const range = getDateRange(periodo);
                desde = range?.desde || undefined;
                hasta = range?.hasta || undefined;
            }
            const params = {};
            if (desde) params.desde = desde;
            if (hasta) params.hasta = hasta;
            const response = await api.get('/apoderado/reportes/ventas', { params });
            setData(response.data);
        } catch (err) {
            console.error('Error al obtener datos de ventas:', err);
            setError('Error al cargar los datos de ventas');
        } finally {
            setLoading(false);
        }
    }, [periodo, fechaDesde, fechaHasta]);

    useEffect(() => {
        if (periodo !== 'personalizado') {
            fetchData();
        }
    }, [periodo, fetchData]);

    const handleApplyCustomDates = () => {
        if (fechaDesde || fechaHasta) {
            fetchData();
        }
    };

    if (error) {
        return (
            <div className="ventas-report-panel">
                <div className="error-message"><p>{error}</p></div>
            </div>
        );
    }

    return (
        <div className="ventas-report-panel">
            <div className="section-header">
                <h3>Ventas</h3>
            </div>

            <div className="ventas-filters">
                <div className="ventas-periodo-group">
                    <label className="ventas-label">Período:</label>
                    <select
                        className="ventas-periodo-select"
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)}
                    >
                        {PERIODOS.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>
                </div>

                {periodo === 'personalizado' && (
                    <div className="ventas-custom-dates">
                        <div className="ventas-date-field">
                            <label className="ventas-label">Desde:</label>
                            <input
                                type="date"
                                className="ventas-date-input"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                            />
                        </div>
                        <div className="ventas-date-field">
                            <label className="ventas-label">Hasta:</label>
                            <input
                                type="date"
                                className="ventas-date-input"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                            />
                        </div>
                        <button className="ventas-apply-btn" onClick={handleApplyCustomDates}>
                            Aplicar
                        </button>
                    </div>
                )}

                {data && (
                    <div className="ventas-total-badge">
                        Total ventas: <strong>{data.totalVentas}</strong>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="ventas-loading">Cargando datos de ventas...</div>
            ) : (
                <div className="ventas-gadgets-grid">
                    <ReportGadget
                        title="Ventas por Fabricante por Provincia"
                        data={data?.porProvincia}
                        dimensionLabel="Provincia"
                        badge="Geograf\u00eda"
                    />
                    <ReportGadget
                        title="Ventas por Fabricante por Ciudad"
                        data={data?.porCiudad}
                        dimensionLabel="Ciudad"
                        badge="Localidad"
                    />
                    <ReportGadget
                        title="Ventas por Fabricante por Representante"
                        data={data?.porRepresentante}
                        dimensionLabel="Representante"
                        badge="Canal Comercial"
                    />
                </div>
            )}
        </div>
    );
};

export default VentasReportPanel;
