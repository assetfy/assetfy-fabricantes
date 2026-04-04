import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import Modal from './Modal';
import Pagination from './Pagination';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ENTITY_LABELS = {
    producto: 'Producto',
    inventario: 'Item de inventario',
    representante: 'Representante',
    garantia: 'Garantia',
    marca: 'Marca',
    ubicacion: 'Ubicacion / Deposito',
    pieza: 'Pieza',
    configuracion: 'Configuracion',
    checklist: 'Checklist',
    portal: 'Portal de Registro'
};

const ACCION_LABELS = {
    creacion: 'Creacion',
    actualizacion: 'Actualizacion',
    eliminacion: 'Eliminacion'
};

const PERIODO_OPTIONS = [
    { value: 'todos', label: 'Todos' },
    { value: 'ultimo_mes', label: 'Ultimo mes' },
    { value: 'ultimos_3_meses', label: 'Ultimos 3 meses' },
    { value: 'ultimos_6_meses', label: 'Ultimos 6 meses' },
    { value: 'custom', label: 'Personalizado' }
];

const FIELD_LABELS = {
    modelo: 'Modelo',
    descripcion: 'Descripcion',
    precio: 'Precio',
    marca: 'Marca',
    fabricante: 'Fabricante',
    atributos: 'Atributos',
    garantia: 'Garantia',
    nombre: 'Nombre',
    estado: 'Estado',
    direccion: 'Direccion',
    telefono: 'Telefono',
    correo: 'Correo',
    cuit: 'CUIT',
    razonSocial: 'Razon Social',
    numeroSerie: 'Numero de serie',
    producto: 'Producto',
    pieza: 'Pieza',
    ubicacion: 'Ubicacion',
    representante: 'Representante',
    duracionNumero: 'Duracion (numero)',
    duracionUnidad: 'Duracion (unidad)',
    tipoCobertura: 'Tipo de cobertura',
    stockBajoUmbral: 'Umbral stock bajo',
    rangoNuevos: 'Rango nuevos',
    umbralGarantiaPorVencer: 'Umbral garantia por vencer',
    portalColor: 'Color del portal',
    requiereFecha: 'Requiere fecha',
    idPieza: 'ID Pieza',
    archivo: 'Archivo'
};

const formatDate = (date) => {
    if (!date) return '--';
    return new Date(date).toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatValue = (value) => {
    if (value === null || value === undefined) return '--';
    if (typeof value === 'boolean') return value ? 'Si' : 'No';
    if (Array.isArray(value)) {
        if (value.length === 0) return '(vacio)';
        return value.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(', ');
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

const AuditoriaLog = () => {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [searchTerm, setSearchTerm] = useState('');
    const [periodo, setPeriodo] = useState('todos');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);

    const fetchLogs = useCallback(async (page, search) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', itemsPerPage);
            if (search && search.trim()) params.append('search', search.trim());
            if (periodo !== 'todos') params.append('periodo', periodo);
            if (periodo === 'custom') {
                if (fechaDesde) params.append('fechaDesde', fechaDesde);
                if (fechaHasta) params.append('fechaHasta', fechaHasta);
            }

            const response = await api.get(`/apoderado/audit-log?${params.toString()}`);
            setLogs(response.data.logs || []);
            setTotal(response.data.total || 0);
            setTotalPages(response.data.totalPages || 0);
        } catch (err) {
            console.error('Error fetching audit logs:', err);
            setLogs([]);
        } finally {
            setIsLoading(false);
        }
    }, [itemsPerPage, periodo, fechaDesde, fechaHasta]);

    useEffect(() => {
        fetchLogs(currentPage, searchTerm);
    }, [currentPage, itemsPerPage, periodo, fechaDesde, fechaHasta, fetchLogs]);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (searchTimeout) clearTimeout(searchTimeout);
        setSearchTimeout(setTimeout(() => {
            setCurrentPage(1);
            fetchLogs(1, value);
        }, 400));
    };

    const handlePeriodoChange = (e) => {
        setPeriodo(e.target.value);
        setCurrentPage(1);
        if (e.target.value !== 'custom') {
            setFechaDesde('');
            setFechaHasta('');
        }
    };

    const handleViewDetail = async (logId) => {
        setDetailLoading(true);
        setShowDetailModal(true);
        try {
            const response = await api.get(`/apoderado/audit-log/${logId}`);
            setSelectedLog(response.data);
        } catch (err) {
            console.error('Error fetching audit detail:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm && searchTerm.trim()) params.append('search', searchTerm.trim());
            if (periodo !== 'todos') params.append('periodo', periodo);
            if (periodo === 'custom') {
                if (fechaDesde) params.append('fechaDesde', fechaDesde);
                if (fechaHasta) params.append('fechaHasta', fechaHasta);
            }

            const response = await api.get(`/apoderado/audit-log/export?${params.toString()}`);
            const data = response.data;

            if (!data || data.length === 0) {
                alert('No hay registros para exportar.');
                return;
            }

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Auditoria');
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const fecha = new Date().toISOString().split('T')[0];
            saveAs(blob, `auditoria_${fecha}.xlsx`);
        } catch (err) {
            console.error('Error exporting audit logs:', err);
            alert('Error al exportar los registros.');
        } finally {
            setExporting(false);
        }
    };

    const renderAccionBadge = (accion) => {
        const colors = {
            creacion: { bg: '#d4edda', color: '#155724' },
            actualizacion: { bg: '#fff3cd', color: '#856404' },
            eliminacion: { bg: '#f8d7da', color: '#721c24' }
        };
        const style = colors[accion] || { bg: '#e2e3e5', color: '#383d41' };
        return (
            <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: style.bg,
                color: style.color
            }}>
                {ACCION_LABELS[accion] || accion}
            </span>
        );
    };

    const renderDetailContent = () => {
        if (!selectedLog) return null;

        if (selectedLog.accion === 'creacion' && selectedLog.detalles) {
            const entries = Object.entries(selectedLog.detalles).filter(([key]) => key !== '__v' && key !== '_id');
            return (
                <div>
                    <p style={{ marginBottom: '12px', color: '#666' }}>
                        Campos del registro creado:
                    </p>
                    <table className="warranty-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Campo</th>
                                <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(([key, value]) => (
                                <tr key={key}>
                                    <td style={{ fontWeight: '600' }}>{FIELD_LABELS[key] || key}</td>
                                    <td>{formatValue(value)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        if (selectedLog.accion === 'actualizacion' && selectedLog.valorAnterior && selectedLog.valorNuevo) {
            const allKeys = [...new Set([
                ...Object.keys(selectedLog.valorAnterior || {}),
                ...Object.keys(selectedLog.valorNuevo || {})
            ])];
            return (
                <div>
                    <p style={{ marginBottom: '12px', color: '#666' }}>
                        Cambios realizados:
                    </p>
                    <table className="warranty-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Campo</th>
                                <th style={{ width: '35%' }}>Valor anterior</th>
                                <th style={{ width: '35%' }}>Valor nuevo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allKeys.map(key => (
                                <tr key={key} style={{ backgroundColor: '#fffde7' }}>
                                    <td style={{ fontWeight: '600' }}>{FIELD_LABELS[key] || key}</td>
                                    <td style={{ color: '#c62828' }}>{formatValue(selectedLog.valorAnterior[key])}</td>
                                    <td style={{ color: '#2e7d32' }}>{formatValue(selectedLog.valorNuevo[key])}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        if (selectedLog.accion === 'eliminacion') {
            return (
                <div>
                    <p style={{ color: '#666' }}>
                        Se elimino {ENTITY_LABELS[selectedLog.tipoEntidad] || selectedLog.tipoEntidad}: <strong>{selectedLog.descripcionEntidad}</strong>
                    </p>
                </div>
            );
        }

        return <p style={{ color: '#666' }}>No hay detalles disponibles para este registro.</p>;
    };

    return (
        <div>
            {/* Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 250px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#666' }}>Buscar</label>
                    <input
                        type="text"
                        placeholder="Buscar por usuario, descripcion, tipo..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
                <div style={{ flex: '0 0 180px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#666' }}>Periodo</label>
                    <select
                        value={periodo}
                        onChange={handlePeriodoChange}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                        }}
                    >
                        {PERIODO_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                {periodo === 'custom' && (
                    <>
                        <div style={{ flex: '0 0 160px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#666' }}>Desde</label>
                            <input
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => { setFechaDesde(e.target.value); setCurrentPage(1); }}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <div style={{ flex: '0 0 160px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#666' }}>Hasta</label>
                            <input
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => { setFechaHasta(e.target.value); setCurrentPage(1); }}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </>
                )}
                <div style={{ flex: '0 0 auto' }}>
                    <button
                        onClick={handleExport}
                        disabled={exporting || total === 0}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#5C2D91',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: total === 0 || exporting ? 'not-allowed' : 'pointer',
                            opacity: total === 0 || exporting ? 0.6 : 1,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {exporting ? 'Exportando...' : 'Exportar a Excel'}
                    </button>
                </div>
            </div>

            {/* Results count */}
            <div style={{ marginBottom: '8px', fontSize: '13px', color: '#666' }}>
                {total} registro(s) encontrado(s)
            </div>

            {/* Table */}
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Cargando...</div>
            ) : logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    No se encontraron registros de auditoria.
                </div>
            ) : (
                <div className="warranty-table-wrapper">
                    <table className="warranty-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Usuario</th>
                                <th>Accion</th>
                                <th>Tipo</th>
                                <th>Descripcion</th>
                                <th style={{ width: '80px', textAlign: 'center' }}>Detalle</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log._id}>
                                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(log.createdAt)}</td>
                                    <td>{log.nombreUsuario}</td>
                                    <td>{renderAccionBadge(log.accion)}</td>
                                    <td>{ENTITY_LABELS[log.tipoEntidad] || log.tipoEntidad}</td>
                                    <td>{log.descripcionEntidad || '--'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleViewDetail(log._id)}
                                            title="Ver detalle"
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '18px',
                                                padding: '4px'
                                            }}
                                        >
                                            👁️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalItems={total}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(newSize) => {
                        setItemsPerPage(newSize);
                        setCurrentPage(1);
                    }}
                />
            )}

            {/* Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => { setShowDetailModal(false); setSelectedLog(null); }}
                title="Detalle de Auditoria"
            >
                {detailLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>Cargando detalle...</div>
                ) : selectedLog ? (
                    <div>
                        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <p style={{ margin: '4px 0' }}>
                                <strong>Fecha:</strong> {formatDate(selectedLog.createdAt)}
                            </p>
                            <p style={{ margin: '4px 0' }}>
                                <strong>Usuario:</strong> {selectedLog.nombreUsuario}
                            </p>
                            <p style={{ margin: '4px 0' }}>
                                <strong>Accion:</strong> {renderAccionBadge(selectedLog.accion)}
                            </p>
                            <p style={{ margin: '4px 0' }}>
                                <strong>Tipo:</strong> {ENTITY_LABELS[selectedLog.tipoEntidad] || selectedLog.tipoEntidad}
                            </p>
                            {selectedLog.descripcionEntidad && (
                                <p style={{ margin: '4px 0' }}>
                                    <strong>Descripcion:</strong> {selectedLog.descripcionEntidad}
                                </p>
                            )}
                        </div>
                        {renderDetailContent()}
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};

export default AuditoriaLog;
