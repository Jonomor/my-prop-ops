import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const TenantAuthContext = createContext();

export const useTenantAuth = () => {
  const context = useContext(TenantAuthContext);
  if (!context) {
    throw new Error('useTenantAuth must be used within TenantAuthProvider');
  }
  return context;
};

export const TenantAuthProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  const api = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL || 'https://backend-production-0325.up.railway.app',
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('tenant_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('tenant_token');
        setTenant(null);
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('tenant_token');
      if (token) {
        try {
          const res = await api.get('/api/tenant-portal/me');
          setTenant(res.data);
        } catch (error) {
          localStorage.removeItem('tenant_token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/tenant-portal/login', { email, password });
    localStorage.setItem('tenant_token', res.data.token);
    setTenant(res.data.tenant);
    return res.data;
  };

  const register = async (data) => {
    const res = await api.post('/api/tenant-portal/register', data);
    localStorage.setItem('tenant_token', res.data.token);
    setTenant(res.data.tenant);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('tenant_token');
    setTenant(null);
  };

  const updateProfile = async (data) => {
    const res = await api.put('/api/tenant-portal/profile', data);
    setTenant(res.data);
    return res.data;
  };

  return (
    <TenantAuthContext.Provider value={{ tenant, setTenant, loading, login, register, logout, updateProfile, api }}>
      {children}
    </TenantAuthContext.Provider>
  );
};
