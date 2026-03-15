import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import MetricasPanel from './MetricasPanel';
import api from '../api';

jest.mock('../api');
jest.mock('react-router-dom', () => ({
    Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
    useNavigate: () => jest.fn()
}));

describe('MetricasPanel', () => {
    test('muestra productos activos y contadores de stock según los valores de métricas', async () => {
        api.get.mockResolvedValue({
            data: {
                productos: 10,
                piezas: 4,
                marcas: 2,
                inventario: 8,
                representantes: 1,
                stockBajo: { productos: 3, piezas: 1 },
                sinStock: { productos: 2, piezas: 0 },
                garantias: { total: 0, enCurso: 0, cerradas: 0, top5Bienes: [] },
                estadisticas: {
                    productosActivos: 6,
                    marcasActivas: 2,
                    inventarioDisponible: 8,
                    inventarioVendido: 0,
                    inventarioRegistrado: 8,
                    representantesActivos: 1,
                    representantesInactivos: 0,
                    representantesNuevosEsteMes: 0
                }
            }
        });

        render(<MetricasPanel />);

        await waitFor(() => expect(api.get).toHaveBeenCalledWith('/apoderado/metricas'));
        await screen.findByText('Estado de inventario - Productos');

        const productosCard = screen.getByText('Estado de inventario - Productos').closest('.inventory-card');
        expect(productosCard).toBeTruthy();

        expect(within(productosCard).getByText('6')).toBeInTheDocument();
        expect(within(productosCard).getByText('3')).toBeInTheDocument();
        expect(within(productosCard).getByText('2')).toBeInTheDocument();
    });
});
