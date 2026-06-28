import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../apis/axiosConfig';

// Create the context
export const AuthContext = createContext();

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('✅ User loaded from localStorage:', parsedUser);
        setUser(parsedUser);
        
        // Optionally verify token with backend
        if (parsedUser.token) {
          // You can add token verification here if needed
          // verifyToken(parsedUser.token);
        }
      } catch (error) {
        console.error('❌ Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    } else {
      // Try sessionStorage as fallback
      const sessionUser = sessionStorage.getItem('user');
      if (sessionUser) {
        try {
          const parsedUser = JSON.parse(sessionUser);
          console.log('✅ User loaded from sessionStorage:', parsedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('❌ Error parsing session user:', error);
          sessionStorage.removeItem('user');
        }
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosInstance.post('http://localhost:8093/api/auth/login', {
        email,
        password
      });
      
      console.log('🔍 Login response:', response.data);
      
      if (response.data.success && response.data.user) {
        const userData = response.data.user;
        
        // Ensure employee ID exists
        if (!userData.employeeId && !userData.id) {
          console.error('❌ No employee ID in user data');
          throw new Error('Employee ID missing from user data');
        }
        
        // Set employeeId if only id exists
        if (!userData.employeeId && userData.id) {
          userData.employeeId = userData.id;
        }
        
        console.log('✅ Login successful, user data:', userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return { success: true, user: userData };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    // Optionally call logout API
    // axiosInstance.post('http://localhost:8093/api/auth/logout');
  };

  // Update user data
  const updateUser = (updatedData) => {
    const newUserData = { ...user, ...updatedData };
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};