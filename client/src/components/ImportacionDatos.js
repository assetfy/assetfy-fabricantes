import React, { useState } from 'react';
import api from '../api';
import { useNotification } from './NotificationProvider';
import * as XLSX from 'xlsx';

const ImportacionDatos = () => {
    const { showSuccess, showError } = useNotification();
    const [selectedType, setSelectedType] = useState('productos');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [validationResults, setValidationResults] = useState(null);
    const [validatedData, setValidatedData] = useState(null);

    const dataTypes = [
        { value: 'productos', label: 'Lista de Productos' },
        { value: 'marcas', label: 'Lista de Marcas' },
        { value: 'inventario', label: 'Artículos de Inventario' },
        { value: 'representantes', label: 'Lista de Representantes' }
    ];

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file);
        setValidationResults(null);
        setValidatedData(null);
    };

    const downloadTemplate = async () => {
        try {
            const response = await api.get(`/apoderado/template/${selectedType}`, {
                responseType: 'blob'
            });
            
            const blob = new Blob([response.data], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `plantilla_${selectedType}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            showSuccess('Plantilla descargada exitosamente');
        } catch (error) {
            console.error('Error al descargar plantilla:', error);
            showError('Error al descargar la plantilla');
        }
    };

    const parseFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsArrayBuffer(file);
        });
    };

    const validateData = async () => {
        if (!selectedFile) {
            showError('Por favor selecciona un archivo');
            return;
        }

        setIsValidating(true);
        setValidationResults(null);
        
        try {
            const parsedData = await parseFile(selectedFile);
            
            if (!parsedData || parsedData.length === 0) {
                showError('El archivo está vacío o no tiene el formato correcto');
                return;
            }

            const response = await api.post(`/apoderado/validate/${selectedType}`, {
                data: parsedData
            });

            setValidationResults(response.data);
            
            if (response.data.isValid) {
                setValidatedData(parsedData);
                showSuccess('Validación exitosa. Los datos están listos para importar.');
            } else {
                showError(`Se encontraron ${response.data.errors.length} errores en los datos.`);
            }
        } catch (error) {
            console.error('Error al validar datos:', error);
            showError('Error al validar los datos. Verifica el formato del archivo.');
        } finally {
            setIsValidating(false);
        }
    };

    const importData = async () => {
        if (!validatedData || !validationResults?.isValid) {
            showError('Primero debes validar los datos');
            return;
        }

        setIsImporting(true);
        
        try {
            const response = await api.post(`/apoderado/import/${selectedType}`, {
                data: validatedData
            });

            showSuccess(`Datos importados exitosamente. ${response.data.imported} registros procesados.`);
            
            // Reset form
            setSelectedFile(null);
            setValidationResults(null);
            setValidatedData(null);
            document.getElementById('fileInput').value = '';
            
        } catch (error) {
            console.error('Error al importar datos:', error);
            showError('Error al importar los datos. Por favor, intenta nuevamente.');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="importacion-datos">
            <div className="form-container">
                <h4>Importación de Datos</h4>
                <p>Selecciona el tipo de datos que deseas importar y sube tu archivo.</p>
                
                <div className="form-group">
                    <label htmlFor="importDataType">Tipo de Colección:</label>
                    <select 
                        id="importDataType"
                        value={selectedType} 
                        onChange={(e) => {
                            setSelectedType(e.target.value);
                            setValidationResults(null);
                            setValidatedData(null);
                        }}
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
                    <label>Plantilla de Ejemplo:</label>
                    <p>Descarga la plantilla con la estructura correcta para {dataTypes.find(t => t.value === selectedType)?.label}.</p>
                    <button 
                        onClick={downloadTemplate}
                        className="template-button"
                        type="button"
                    >
                        Descargar Plantilla (.xlsx)
                    </button>
                </div>

                <div className="form-group">
                    <label htmlFor="fileInput">Archivo a Importar:</label>
                    <input 
                        id="fileInput"
                        type="file" 
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        className="form-control"
                    />
                    {selectedFile && (
                        <p className="file-info">
                            Archivo seleccionado: <strong>{selectedFile.name}</strong>
                        </p>
                    )}
                </div>

                <div className="form-actions">
                    <button 
                        onClick={validateData}
                        disabled={!selectedFile || isValidating}
                        className="validate-button"
                    >
                        {isValidating ? 'Validando...' : 'Validar Datos'}
                    </button>
                    
                    {validationResults?.isValid && (
                        <button 
                            onClick={importData}
                            disabled={isImporting}
                            className="import-button"
                        >
                            {isImporting ? 'Importando...' : 'Importar Datos'}
                        </button>
                    )}
                </div>

                {validationResults && (
                    <div className={`validation-results ${validationResults.isValid ? 'success' : 'error'}`}>
                        <h5>Resultados de Validación:</h5>
                        {validationResults.isValid ? (
                            <div className="success-message">
                                <p>✅ Todos los datos son válidos</p>
                                <p>Registros válidos: {validationResults.validCount}</p>
                            </div>
                        ) : (
                            <div className="error-message">
                                <p>❌ Se encontraron errores en los datos:</p>
                                <ul>
                                    {validationResults.errors.map((error, index) => (
                                        <li key={index}>
                                            <strong>Fila {error.row}:</strong> {error.message}
                                        </li>
                                    ))}
                                </ul>
                                <p>Por favor, corrige los errores y vuelve a subir el archivo.</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="import-info">
                    <h5>Información sobre la importación:</h5>
                    <ul>
                        <li>Los archivos deben estar en formato Excel (.xlsx) o CSV</li>
                        <li>La primera fila debe contener los nombres de las columnas</li>
                        <li>Todos los campos obligatorios deben estar completados</li>
                        <li>Se validarán las referencias a otros datos (fabricantes, marcas, etc.)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ImportacionDatos;