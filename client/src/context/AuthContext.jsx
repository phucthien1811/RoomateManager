import React, { createContext, useState, useCallback, useEffect } from 'react';
import authService from '../services/auth.service.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Listen for logout event from api.js interceptor
  useEffect(() => {
    const handleLogout = () => {
      logout();
    };

    window.addEventListener('logout', handleLogout);
    return () => {
      window.removeEventListener('logout', handleLogout);
    };
  }, []);

  // Login with real API
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const response = await authService.login(email, password);
      
      const userData = {
        id: response.user._id || response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store token and user in localStorage
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', 'true');
      
      return userData;
    } catch (err) {
      const errorMsg = err.message || 'Đăng nhập thất bại';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Register with real API
  const register = useCallback(async (name, email, password, confirmPassword) => {
    setLoading(true);
    setError('');
    try {
      const response = await authService.register(name, email, password, confirmPassword);
      
      const userData = {
        id: response.user._id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store token and user in localStorage
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', 'true');
      
      return userData;
    } catch (err) {
      const errorMsg = err.message || 'Đăng ký thất bại';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setError('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
  }, []);

  // Check auth on mount - verify token is still valid
  const checkAuth = useCallback(async () => {
    setLoading(true);
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        // Try to verify token with backend
        const userData = await authService.getCurrentUser();
        // Format userData to have 'id' field
        const formattedUser = {
          id: userData._id || userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
        };
        setUser(formattedUser);
        setIsAuthenticated(true);
      } catch (err) {
        // If token verification fails, use stored user data instead
        try {
          const parsedUser = JSON.parse(storedUser);
          // Ensure user has 'id' field
          if (parsedUser && (parsedUser.id || parsedUser._id)) {
            const formattedUser = {
              id: parsedUser.id || parsedUser._id,
              name: parsedUser.name,
              email: parsedUser.email,
              role: parsedUser.role,
            };
            setUser(formattedUser);
            setIsAuthenticated(true);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
    }
    setLoading(false);
  }, [logout]);

  // Initialize auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      error,
      login,
      register,
      logout,
      checkAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
