import React from 'react';
import { render } from '@testing-library/react';
import UserHeader from './UserHeader';

// Mock the ProfileEditModal component
jest.mock('./ProfileEditModal', () => {
    return function MockProfileEditModal() {
        return <div data-testid="profile-modal">Mock Profile Modal</div>;
    };
});

// Mock the PanelMenu component
jest.mock('./PanelMenu', () => {
    return function MockPanelMenu() {
        return <div data-testid="panel-menu">Mock Panel Menu</div>;
    };
});

describe('UserHeader', () => {
    beforeEach(() => {
        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(() => 'mock-token'),
                setItem: jest.fn(),
                removeItem: jest.fn(),
            },
            writable: true,
        });
    });

    test('renders without crashing when user has no profile image', () => {
        const user = {
            nombreCompleto: 'Test User'
        };

        expect(() => {
            render(<UserHeader user={user} userType="admin" />);
        }).not.toThrow();
    });

    test('handles string profile image URL correctly', () => {
        const user = {
            nombreCompleto: 'Test User',
            imagenPerfil: 'https://example.com/image.jpg'
        };

        expect(() => {
            render(<UserHeader user={user} userType="admin" />);
        }).not.toThrow();
    });

    test('handles object profile image with URL property correctly', () => {
        const user = {
            nombreCompleto: 'Test User',
            imagenPerfil: {
                url: 'https://example.com/image.jpg',
                s3Key: 'some-key'
            }
        };

        expect(() => {
            render(<UserHeader user={user} userType="admin" />);
        }).not.toThrow();
    });

    test('handles undefined/null profile image correctly', () => {
        const user = {
            nombreCompleto: 'Test User',
            imagenPerfil: null
        };

        expect(() => {
            render(<UserHeader user={user} userType="admin" />);
        }).not.toThrow();
    });

    test('handles non-string, non-object profile image correctly', () => {
        const user = {
            nombreCompleto: 'Test User',
            imagenPerfil: 123 // Invalid type
        };

        expect(() => {
            render(<UserHeader user={user} userType="admin" />);
        }).not.toThrow();
    });

    test('handles object profile image without URL property correctly', () => {
        const user = {
            nombreCompleto: 'Test User',
            imagenPerfil: {
                s3Key: 'some-key'
                // No url property
            }
        };

        expect(() => {
            render(<UserHeader user={user} userType="admin" />);
        }).not.toThrow();
    });
});