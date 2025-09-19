import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PresenceProvider } from './contexts/PresenceContext';
import { ChatProvider } from './contexts/ChatContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <PresenceProvider>
        <ChatProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Auth />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <PublicRoute>
                      <Auth />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </Router>
        </ChatProvider>
      </PresenceProvider>
    </AuthProvider>
  );
}

export default App;
