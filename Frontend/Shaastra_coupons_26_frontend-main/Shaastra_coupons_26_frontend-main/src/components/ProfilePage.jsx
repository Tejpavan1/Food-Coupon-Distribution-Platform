// src/components/ProfilePage.jsx
// ✅ FIXED: S-Pin Reset OTP Flow
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    Container, Card, Typography, Box, Button, CircularProgress, Divider,
    Modal, TextField, IconButton, InputAdornment
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import api from '../api';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 400 },
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  borderRadius: 4,
  boxShadow: 24,
  p: 4,
  textAlign: 'center',
  overflowY: 'auto'
};

const ProfilePage = () => {
  const { user, logout, isAuthenticated } = useAuth();

  // S-Pin Reset State
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Enter OTP+Pin
  const [otp, setOtp] = useState('');
  const [newSPin, setNewSPin] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSPin, setShowSPin] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    setStep(1);
    setMessage('');
    setOtp('');
    setNewSPin('');
  };
  
  const handleClose = () => {
    setOpen(false);
    setStep(1);
    setMessage('');
    setOtp('');
    setNewSPin('');
  };

  // ✅ FIX 1: Proper OTP Request Handler
  const handleRequestOtp = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await api.post('/api/auth/forgot-spin-otp',{ id: user.userId });
      setMessage(response.data.message || 'OTP sent to your email!');
      setStep(2);
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to send OTP';
      setMessage(errMsg);
      console.error('S-Pin OTP Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ IMPROVED ERROR HANDLING:
  const handleResetSpin = async (e) => {
    e.preventDefault();
    
    // Frontend validation
    if (!otp || otp.length !== 6) {
      setMessage('Please enter a valid 6-digit OTP');
      return;
    }
    
    if (!newSPin || newSPin.length !== 4 || !/^\d{4}$/.test(newSPin)) {
      setMessage('S-Pin must be exactly 4 digits');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const response = await api.post('/api/auth/reset-spin', { 
        otp, 
        newSPin 
      });
      
      setMessage(response.data.message || 'S-Pin reset successful!');
      
      setTimeout(() => {
        handleClose();
        // Optionally refresh the page or update user state
      }, 2000);
    } catch (error) {
      const errMsg = error.response?.data?.message || 'S-Pin reset failed';
      setMessage(errMsg);
      console.error('S-Pin Reset Error:', error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!isAuthenticated || !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading profile...</Typography>
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Card sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2 }}>
        <Typography component="h1" variant="h4" gutterBottom>
          User Profile
        </Typography>

        <Box sx={{ width: '100%', mt: 2 }}>
          <ProfileDetail label="Name" value={user.name} />
          <Divider sx={{ my: 1.5 }} />
          <ProfileDetail label="Roll Number (User ID)" value={user.userId} />
          <Divider sx={{ my: 1.5 }} />
          <ProfileDetail label="Designation (Role)" value={user.role} />
          <Divider sx={{ my: 1.5 }} />
          <ProfileDetail label="Department" value={user.department || 'N/A'} />
          <Divider sx={{ my: 1.5 }} />
          <ProfileDetail label="Contact Number" value={user.contact || 'N/A'} />
          <Divider sx={{ my: 1.5 }} />
          <ProfileDetail label="Smail ID" value={user.smail || 'N/A'} />
        </Box>

        <Button
           component={RouterLink}
           to="/dashboard"
           variant="contained"
           sx={{ mt: 4, width: '100%' }}
         >
           Back to Dashboard
         </Button>
         
        <Button
          variant="outlined"
          color="warning"
          onClick={handleOpen}
          sx={{ mt: 2, width: '100%' }}
        >
          Reset S-Pin
        </Button>

        <Button
          variant="outlined"
          color="error"
          onClick={handleLogout}
          sx={{ mt: 2, width: '100%' }}
        >
          Logout
        </Button>
      </Card>

      {/* ✅ FIXED S-PIN RESET MODAL */}
      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Typography component="h2" variant="h6" gutterBottom>
            Reset S-Pin
          </Typography>

          {loading && <CircularProgress sx={{ my: 2 }} />}

          {!loading && message && (
            <Typography
              color={
                message.includes('success') || message.includes('sent') 
                  ? 'success.main' 
                  : 'error.main'
              }
              align="center"
              variant="body2"
              sx={{ my: 2 }}
            >
              {message}
            </Typography>
          )}

          {/* STEP 1: Request OTP */}
          {!loading && step === 1 && (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                An OTP will be sent to your registered email: <strong>{user.smail}</strong>
              </Typography>
              <Button 
                variant="contained" 
                onClick={handleRequestOtp} 
                fullWidth
                disabled={loading}
              >
                Send OTP
              </Button>
            </>
          )}

          {/* STEP 2: Enter OTP + New S-Pin */}
          {!loading && step === 2 && (
            <Box component="form" onSubmit={handleResetSpin}>
              <TextField
                margin="normal"
                required
                fullWidth
                name="otp"
                label="6-Digit OTP from Email"
                type="text"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 6) setOtp(val);
                }}
                inputProps={{ 
                  maxLength: 6,
                  inputMode: 'numeric'
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="newSPin"
                label="New 4-Digit S-Pin"
                type={showSPin ? 'text' : 'password'}
                value={newSPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 4) setNewSPin(val);
                }}
                inputProps={{ 
                  maxLength: 4,
                  inputMode: 'numeric'
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowSPin(!showSPin)}
                        edge="end"
                      >
                        {showSPin ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button 
                type="submit" 
                variant="contained" 
                fullWidth 
                sx={{ mt: 2 }}
                disabled={loading || !otp || !newSPin}
              >
                Confirm & Reset S-Pin
              </Button>
            </Box>
          )}
        </Box>
      </Modal>
    </Container>
  );
};

const ProfileDetail = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
    <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
      {label}:
    </Typography>
    <Typography variant="body1">
      {value || 'N/A'}
    </Typography>
  </Box>
);

export default ProfilePage;