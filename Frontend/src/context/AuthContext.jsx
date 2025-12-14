import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configure axios defaults
  axios.defaults.baseURL = 'http://localhost:7845'; // Adjust if backend runs on different port
  
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }

    // Add interceptor to handle token expiration/invalidation
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token]);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          // Verify token or get user profile
          // Since we don't have a dedicated "me" endpoint in the route list seen earlier,
          // we might assume validity or try to fetch profile.
          // For now, we'll decode the token or just trust it until a 401 happens.
          // Let's assume we decode it or fetch a user.
          // Since we don't have the "me" endpoint in the visible routes (only /users/:id),
          // We will implementing a rudimentary check or specific verify endpoint if available.
          
          // Looking at auth.route.js: /refresh-token is there.
          // Let's just persist the user if we have their data in localStorage, or fetch it.
          const storedUser = localStorage.getItem('user');
          if (storedUser && storedUser !== "undefined") {
            try {
              setUser(JSON.parse(storedUser));
            } catch (e) {
              console.error("Failed to parse stored user", e);
              localStorage.removeItem('user');
            }
          }
        } catch (error) {
          console.error("Auth check failed", error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/auth/login', { email, password });
      const { user, token } = res.data; 
      
      if (token && user) {
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return { success: true };
      } else {
        return { success: false, message: 'Invalid response from server' };
      }
    } catch (error) {
      console.error("Login error", error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const signup = async (userData) => {
    try {
      const res = await axios.post('/auth/signup', userData);
      // Depending on API, signup might return token or just success
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Signup error", error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Signup failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token, // Add token to context value
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
