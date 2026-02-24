import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'https://backend-production-0325.up.railway.app'}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(null);

  const api = useCallback(() => {
    const instance = axios.create({
      baseURL: API_URL,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return instance;
  }, [token]);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await api().get('/auth/me');
      setUser(response.data);
      
      // Fetch organizations
      const orgsResponse = await api().get('/organizations');
      setOrganizations(orgsResponse.data);
      
      // Set current org from localStorage or first org
      const savedOrgId = localStorage.getItem('currentOrgId');
      const savedOrg = orgsResponse.data.find(o => o.org_id === savedOrgId);
      setCurrentOrg(savedOrg || orgsResponse.data[0] || null);
    } catch (error) {
      console.error('Auth error:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token, api]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const response = await api().post('/auth/login', { email, password });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    
    // Fetch organizations after login
    const orgsResponse = await axios.get(`${API_URL}/organizations`, {
      headers: { Authorization: `Bearer ${newToken}` }
    });
    setOrganizations(orgsResponse.data);
    setCurrentOrg(orgsResponse.data[0] || null);
    if (orgsResponse.data[0]) {
      localStorage.setItem('currentOrgId', orgsResponse.data[0].org_id);
    }
    
    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await api().post('/auth/register', { name, email, password });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    
    // Fetch organizations after register
    const orgsResponse = await axios.get(`${API_URL}/organizations`, {
      headers: { Authorization: `Bearer ${newToken}` }
    });
    setOrganizations(orgsResponse.data);
    setCurrentOrg(orgsResponse.data[0] || null);
    if (orgsResponse.data[0]) {
      localStorage.setItem('currentOrgId', orgsResponse.data[0].org_id);
    }
    
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentOrgId');
    setToken(null);
    setUser(null);
    setOrganizations([]);
    setCurrentOrg(null);
  };

  const switchOrganization = (org) => {
    setCurrentOrg(org);
    localStorage.setItem('currentOrgId', org.org_id);
  };

  const refreshOrganizations = async () => {
    if (token) {
      const orgsResponse = await api().get('/organizations');
      setOrganizations(orgsResponse.data);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      organizations,
      currentOrg,
      login,
      register,
      logout,
      switchOrganization,
      refreshOrganizations,
      api: api()
    }}>
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
