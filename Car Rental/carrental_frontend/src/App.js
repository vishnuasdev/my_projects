import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import Navbar from './layouts/Navbar';
import Router from './routes/Router';
import './assets/index.css';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Navbar />
                <main style={{ padding: '2rem 1rem' }}>
                    <div style={{ paddingTop: '3.5rem' }}>
                        <Router />
                    </div>
                </main>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;