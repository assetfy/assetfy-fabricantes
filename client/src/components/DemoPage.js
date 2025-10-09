import React from 'react';
import { NotificationProvider } from './NotificationProvider';
import DemoProductList from './DemoProductList';
import logo from '../logo.png';

const DemoPage = () => {
    return (
        <NotificationProvider>
            <div style={{ 
                maxWidth: '1200px', 
                margin: '0 auto', 
                padding: '2rem',
                backgroundColor: '#f5f5f5',
                minHeight: '100vh'
            }}>
                <div style={{ 
                    textAlign: 'center', 
                    marginBottom: '2rem',
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                    <img src={logo} alt="Logo" style={{ height: '80px', marginBottom: '1rem' }} />
                    <h1 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>
                        Demo - Paginación y Vista de Cuadrícula
                    </h1>
                    <p style={{ color: '#666', margin: 0 }}>
                        Prueba las nuevas funcionalidades de paginación (25, 50, 100 elementos por página) y vista de cuadrícula para productos
                    </p>
                </div>
                
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden'
                }}>
                    <DemoProductList />
                </div>
            </div>
        </NotificationProvider>
    );
};

export default DemoPage;