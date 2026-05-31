import { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (token) {
          const res = await api.get('/user');
          setUser(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch user', error);
        sessionStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/login', { email, password });
    sessionStorage.setItem('token', res.data.access_token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password, password_confirmation) => {
    const res = await api.post('/register', { name, email, password, password_confirmation });
    return res.data;
  };

  const verifyOtp = async (email, otp) => {
    const res = await api.post('/verify-otp', { email, otp });
    sessionStorage.setItem('token', res.data.access_token);
    setUser(res.data.user);
    return res.data;
  };

  const resendOtp = async (email) => {
    const res = await api.post('/resend-otp', { email });
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      console.error(e);
    }
    sessionStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/user');
      setUser(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser, refreshUser, verifyOtp, resendOtp }}>
      {children}
    </AuthContext.Provider>
  );
};
