// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material'; // Import loading components

const ProtectedRoute = () => {
  // Get authentication status AND loading status from context
  const { isAuthenticated, loading } = useAuth();

  // Show loading spinner while the context is verifying the token
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // After loading is complete, check authentication
  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If loading is complete AND user is authenticated, render the requested route
  return <Outlet />;
};

export default ProtectedRoute;