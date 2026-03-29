import React from 'react';
import ExportacionDatos from './ExportacionDatos';

const ReportesPanel = () => {
    return (
        <div className="administracion-panel">
            <h3>Reportes</h3>
            <p>Genera y exporta reportes de datos de tu sistema.</p>
            <ExportacionDatos />
        </div>
    );
};

export default ReportesPanel;
