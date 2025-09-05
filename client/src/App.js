import './App.css';
import { Routes, Route, Navigate } from "react-router-dom";
import Home from './components/Home';
import EditorPage from './components/EditorPage';
import Auth from './components/Auth';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div>
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#fff',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }
          }}
        />
      </div>
      <Routes>
        <Route 
          path="/auth" 
          element={!user ? <Auth onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/" 
          element={user ? <Home user={user} onLogout={handleLogout} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/editor/:roomId" 
          element={user ? <EditorPage user={user} onLogout={handleLogout} /> : <Navigate to="/auth" />} 
        />
      </Routes>
    </>
  );
}

export default App;