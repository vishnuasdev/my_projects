
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import Navbar from './layouts/Navbar';
import Router from './routes/Router'; 
import './assets/index.css';
import './assets/dashboard.css';
import './assets/auth.css';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                    <>
                        <Navbar />
                        <main className="app-main">
                            <div className="app-main__content">
                                <Router />
                            </div>
                        </main>
                    </>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;