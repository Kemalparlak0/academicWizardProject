import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Spells from './pages/Spells';
import Talismans from './pages/Talismans';
import Leaderboard from './pages/Leaderboard';
import Statistics from './pages/Statistics';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-violet-400 text-xl font-cinzel">Yükleniyor...</div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/auth" />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" /> : <AuthPage />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/spells" element={<ProtectedRoute><Spells /></ProtectedRoute>} />
      <Route path="/talismans" element={<ProtectedRoute><Talismans /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <AppRoutes />
          <Toaster richColors position="top-center" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;