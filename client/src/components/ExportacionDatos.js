import React, { useState } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ExportacionDatos = () => {
    const { showSuccess, showError } = useNotification();
    const [selectedType, setSelectedType] = useState('productos');
    const [selectedFormat, setSelectedFormat] = useState('csv');
    const [isExporting, setIsExporting] = useState(false);

    const dataTypes = [
        { value: 'productos', label: 'Lista de Productos' },
        { value: 'marcas', label: 'Lista de Marcas' },
        { value: 'inventario', label: 'Artículos de Inventario' },
        { value: 'representantes', label: 'Lista de Representantes' }
    ];

    const formatTypes = [
        { value: 'csv', label: 'CSV' },
        { value: 'excel', label: 'Excel (.xlsx)' }
    ];

    const handleExport = async () => {
        setIsExporting(true);
        
        try {
            const response = await api.get(`/apoderado/export/${selectedType}`);
            const data = response.data;

            if (!data || data.length === 0) {
                showError('No hay datos para exportar');
                return;
            }

            const filename = `${selectedType}_${new Date().toISOString().split('T')[0]}`;
            
            if (selectedFormat === 'csv') {
                exportToCSV(data, `${filename}.csv`);
            } else {
                exportToExcel(data, `${filename}.xlsx`);
            }

            showSuccess(`Datos exportados exitosamente en formato ${selectedFormat.toUpperCase()}`);
        } catch (error) {
            console.error('Error al exportar datos:', error);
            showError('Error al exportar los datos. Por favor, intenta nuevamente.');
        } finally {
            setIsExporting(false);
        }
    };

    const exportToCSV = (data, filename) => {
        // Convert data to CSV format
        const headers = Object.keys(data[0]).join(',');
        const csvContent = [
            headers,
            ...data.map(row => 
                Object.values(row).map(value => 
                    typeof value === 'string' && value.includes(',') 
                        ? `"${value}"` 
                        : value
                ).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, filename);
    };

    const exportToExcel = (data, filename) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, selectedType);
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, filename);
    };

    return (
        <div className="exportacion-datos">
            <div className="form-container">
                <h4>Exportación de Datos</h4>
                <p>Selecciona el tipo de datos que deseas exportar y el formato de archivo.</p>
                
                <div className="form-group">
                    <label htmlFor="dataType">Tipo de Colección:</label>
                    <select 
                        id="dataType"
                        value={selectedType} 
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="form-control"
                    >
                        {dataTypes.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="formatType">Formato de Exportación:</label>
                    <select 
                        id="formatType"
                        value={selectedFormat} 
                        onChange={(e) => setSelectedFormat(e.target.value)}
                        className="form-control"
                    >
                        {formatTypes.map(format => (
                            <option key={format.value} value={format.value}>
                                {format.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-actions">
                    <button 
                        onClick={handleExport}
                        disabled={isExporting}
                        className="export-button"
                    >
                        {isExporting ? 'Exportando...' : 'Exportar Datos'}
                    </button>
                </div>

                <div className="export-info">
                    <h5>Información sobre la exportación:</h5>
                    <ul>
                        <li><strong>Productos:</strong> Incluye modelo, descripción, precio, fabricante, marca, estado y atributos</li>
                        <li><strong>Marcas:</strong> Incluye nombre, fabricante y estado</li>
                        <li><strong>Inventario:</strong> Incluye número de serie, producto, estado, comprador y garantía</li>
                        <li><strong>Representantes:</strong> Incluye razón social, nombre, CUIT, cobertura y contacto</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ExportacionDatos;