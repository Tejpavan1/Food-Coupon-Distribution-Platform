// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { CircularProgress, Box } from '@mui/material';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const logoutTimerRef = useRef(null);

  const logout = useCallback(() => {
    // console.log("Logging out..."); // Keep if helpful for debugging logout triggers
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    let previousTimer = logoutTimerRef.current;
    if (previousTimer) {
      clearTimeout(previousTimer);
      logoutTimerRef.current = null;
    }

    const checkTokenAndUser = async () => {
      if (!token) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

  let profileFetchedSuccessfully = false;

      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp < currentTime) {
          console.log("AuthContext: Token expired on load.");
          if (isMounted) logout();
          return;
        }

  const expiresIn = (decodedToken.exp * 1000) - Date.now();
        console.log(`AuthContext: Token valid, expires in ${Math.round(expiresIn / 1000 / 60)} minutes. Scheduling logout.`);
        logoutTimerRef.current = setTimeout(() => {
          console.log("AuthContext: Auto-logout timer fired.");
          logout();
        }, expiresIn);

        try {
          const response = await api.get('/api/user/profile');
          if (isMounted) {
            setUser(response.data);
            profileFetchedSuccessfully = true;
          }
        } catch (profileError) {
          console.error("AuthContext: Profile fetch failed:", profileError?.response?.data || profileError.message);
          if (isMounted) logout();
          return;
        }

      } catch (decodeError) {
        console.error("AuthContext: Invalid token format:", decodeError);
        if (isMounted) logout();
        return;
      } finally {
         if (isMounted && (profileFetchedSuccessfully || !token)) {
             setLoading(false);
         } else if (isMounted) {
             setLoading(false); // Fallback for error cases before re-run
         }
      }
    };

    checkTokenAndUser();

    return () => {
      isMounted = false;
      let currentTimer = logoutTimerRef.current;
      if (currentTimer) {
        clearTimeout(currentTimer);
        // Only nullify if the timer hasn't been replaced by a newer effect run
        if (logoutTimerRef.current === currentTimer) {
           logoutTimerRef.current = null;
        }
      }
    };
  }, [token, logout]);

  const login = async (userId, password) => {
    try {
      const response = await api.post('/api/auth/login', { userId, password });
      const { token: newToken } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken); // Triggers useEffect
    } catch (error) {
      // Re-throw for LoginPage to handle
      throw error.response?.data?.message || 'Login failed';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};