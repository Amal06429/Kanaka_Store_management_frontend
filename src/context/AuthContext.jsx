import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, getAuthToken } from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const loadUser = async () => {
      const token = getAuthToken();
      console.log('AuthContext: Token found:', !!token);
      if (token) {
        try {
          console.log('AuthContext: Fetching current user...');
          const userData = await authAPI.getCurrentUser();
          console.log('AuthContext: User loaded:', userData);
          setUser(userData);
        } catch (error) {
          console.error('AuthContext: Failed to load user:', error);
          authAPI.logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    authAPI.logout();
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const isUser = () => {
    return user && user.role === 'user';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
