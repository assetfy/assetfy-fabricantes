import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PanelMenu from './PanelMenu';

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

describe('PanelMenu', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
        // Clear localStorage before each test
        localStorage.clear();
    });

    test('renders hamburger button when there is only one panel option (apoderado user)', () => {
        const { container } = render(
            <PanelMenu userType="apoderado" hasFabricantePermissions={false} />
        );

        const hamburgerButton = container.querySelector('.hamburger-button');
        expect(hamburgerButton).toBeInTheDocument();
    });

    test('renders hamburger button when there is only one panel option (admin without fabricante permissions)', () => {
        const { container } = render(
            <PanelMenu userType="admin" hasFabricantePermissions={false} />
        );

        const hamburgerButton = container.querySelector('.hamburger-button');
        expect(hamburgerButton).toBeInTheDocument();
    });

    test('renders hamburger button when admin has fabricante permissions', () => {
        const { container } = render(
            <PanelMenu userType="admin" hasFabricantePermissions={true} />
        );

        const hamburgerButton = container.querySelector('.hamburger-button');
        expect(hamburgerButton).toBeInTheDocument();
    });

    test('opens dropdown menu when hamburger is clicked', () => {
        const { container } = render(
            <PanelMenu userType="admin" hasFabricantePermissions={true} />
        );

        const hamburgerButton = container.querySelector('.hamburger-button');
        fireEvent.click(hamburgerButton);

        const dropdown = container.querySelector('.panel-dropdown');
        expect(dropdown).toBeInTheDocument();
    });

    test('shows both panel options for admin with fabricante permissions', () => {
        // Set up localStorage with admin and apoderado roles
        localStorage.setItem('roles', JSON.stringify(['admin', 'apoderado']));
        
        const { container } = render(
            <PanelMenu userType="admin" hasFabricantePermissions={true} />
        );

        const hamburgerButton = container.querySelector('.hamburger-button');
        fireEvent.click(hamburgerButton);

        expect(screen.getByText('Assetfy Fabricantes')).toBeInTheDocument();
        expect(screen.getByText('Assetfy Admin')).toBeInTheDocument();
    });

    test('navigates to correct panel when panel item is clicked', () => {
        // Set up localStorage with admin and apoderado roles
        localStorage.setItem('roles', JSON.stringify(['admin', 'apoderado']));
        
        const { container } = render(
            <PanelMenu userType="admin" hasFabricantePermissions={true} />
        );

        const hamburgerButton = container.querySelector('.hamburger-button');
        fireEvent.click(hamburgerButton);

        const fabricantesPanel = screen.getByText('Assetfy Fabricantes');
        fireEvent.click(fabricantesPanel);

        expect(mockNavigate).toHaveBeenCalledWith('/apoderado');
    });

    test('closes dropdown when clicking outside', () => {
        const { container } = render(
            <PanelMenu userType="admin" hasFabricantePermissions={true} />
        );

        const hamburgerButton = container.querySelector('.hamburger-button');
        fireEvent.click(hamburgerButton);

        let dropdown = container.querySelector('.panel-dropdown');
        expect(dropdown).toBeInTheDocument();

        // Simulate clicking outside
        fireEvent.mouseDown(document.body);

        dropdown = container.querySelector('.panel-dropdown');
        expect(dropdown).toBeNull();
    });

    test('shows only fabricantes panel for apoderado user', () => {
        const { container } = render(
            <PanelMenu userType="apoderado" hasFabricantePermissions={false} />
        );

        const hamburgerButton = container.querySelector('.hamburger-button');
        fireEvent.click(hamburgerButton);

        expect(screen.getByText('Assetfy Fabricantes')).toBeInTheDocument();
        expect(screen.queryByText('Assetfy Admin')).not.toBeInTheDocument();
    });

    test('shows only admin panel for admin without fabricante permissions', () => {
        // Set up localStorage with only admin role
        localStorage.setItem('roles', JSON.stringify(['admin']));
        
        const { container } = render(
            <PanelMenu userType="admin" hasFabricantePermissions={false} />
        );

        const hamburgerButton = container.querySelector('.hamburger-button');
        fireEvent.click(hamburgerButton);

        expect(screen.getByText('Assetfy Admin')).toBeInTheDocument();
        expect(screen.queryByText('Assetfy Fabricantes')).not.toBeInTheDocument();
    });

    test('shows all three panels for user with all three roles', () => {
        // Set up localStorage with all three roles
        localStorage.setItem('roles', JSON.stringify(['admin', 'apoderado', 'usuario_bienes']));
        
        const { container } = render(
            <PanelMenu userType="admin" hasFabricantePermissions={true} />
        );

        const hamburgerButton = container.querySelector('.hamburger-button');
        fireEvent.click(hamburgerButton);

        expect(screen.getByText('Assetfy Admin')).toBeInTheDocument();
        expect(screen.getByText('Assetfy Fabricantes')).toBeInTheDocument();
        expect(screen.getByText('Assetfy Bienes')).toBeInTheDocument();
    });
});
