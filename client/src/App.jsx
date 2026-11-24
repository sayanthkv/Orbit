import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './app/ThemeContext';
import { ToastProvider } from './components/Toast';
import { AuthProvider } from './app/AuthContext';
import AppRouter from './app/router';

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
