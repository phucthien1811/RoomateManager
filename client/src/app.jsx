import { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './login';
import Register from './register';
import FinancialDashboard from './financial.dashboard';
import PersonalDashboard from './personal.dashboard';
import './app.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#f093fb',
    },
    success: {
      main: '#43e97b',
    },
    warning: {
      main: '#FFB020',
    },
    error: {
      main: '#f5576c',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  const [currentPage, setCurrentPage] = useState('login'); // 'login', 'register', 'dashboard', 'personal'
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setCurrentPage('personal'); // Sau khi login vào personal dashboard
  };

  const handleRegister = (user) => {
    setCurrentUser(user);
    setCurrentPage('personal'); // Sau khi register vào personal dashboard
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('login');
  };

  const switchToRegister = () => {
    setCurrentPage('register');
  };

  const switchToLogin = () => {
    setCurrentPage('login');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {currentPage === 'login' && (
        <Login 
          onLogin={handleLogin} 
          onSwitchToRegister={switchToRegister}
        />
      )}

      {currentPage === 'register' && (
        <Register 
          onRegister={handleRegister} 
          onSwitchToLogin={switchToLogin}
        />
      )}

      {currentPage === 'personal' && currentUser && (
        <PersonalDashboard 
          user={currentUser} 
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'dashboard' && (
        <FinancialDashboard />
      )}
    </ThemeProvider>
  );
}

export default App;
