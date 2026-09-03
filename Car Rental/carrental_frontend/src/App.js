import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import Navbar from './layouts/Navbar';
import Router from './routes/Router';
import { isBackendOffline } from './services/axiosInstance';
import './assets/index.css';

function App() {
    const [backendOffline, setBackendOffline] = useState(isBackendOffline);

    useEffect(() => {
        const showOfflineStatus = () => setBackendOffline(true);
        const hideOfflineStatus = () => setBackendOffline(false);

        window.addEventListener('backend:offline', showOfflineStatus);
        window.addEventListener('backend:online', hideOfflineStatus);
        return () => {
            window.removeEventListener('backend:offline', showOfflineStatus);
            window.removeEventListener('backend:online', hideOfflineStatus);
        };
    }, []);

    return (
        <BrowserRouter>
            <AuthProvider>
                {backendOffline ? (
                    <div
                        role="alert"
                        style={{
                            minHeight: '100vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2rem',
                            color: '#7f1d1d',
                            backgroundColor: '#fef2f2',
                            textAlign: 'center',
                            fontWeight: 600,
                        }}
                    >
                        Server Down please visit again
                    </div>
                ) : (
                    <>
                        <Navbar />
                        <main style={{ padding: '2rem 1rem' }}>
                            <div style={{ paddingTop: '3.5rem' }}>
                                <Router />
                            </div>
                        </main>
                    </>
                )}
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;