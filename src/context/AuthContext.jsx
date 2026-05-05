import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../apiEndpoints/endpoints';
import axiosInstance, { setUnauthorizedHandler } from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const login = useCallback(async (email, password) => {
    const response = await axiosInstance.post(API_ENDPOINTS.LOGIN, { email, password });
    const authToken = response?.data?.authtoken;
    const loggedInUser = response?.data?.retUser;

    if (!authToken) {
      throw new Error('Token not received from server');
    }

    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser || null));

    setToken(authToken);
    setUser(loggedInUser || null);

    return response.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!token) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(API_ENDPOINTS.GET_ME);
        const currentUser = response?.data || user;
        if (currentUser) {
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
      } catch (error) {
        logout();
      } finally {
        setIsAuthLoading(false);
      }
    };

    loadCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, logout]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthLoading,
      login,
      logout,
    }),
    [user, token, isAuthLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
