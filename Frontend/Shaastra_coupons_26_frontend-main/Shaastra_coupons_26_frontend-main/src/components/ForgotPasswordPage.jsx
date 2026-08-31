// src/components/ForgotPasswordPage.js
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
    Container, Card, Typography, TextField, Button, Box, Link,
    IconButton, // --- 1. NEW IMPORT ---
    InputAdornment // --- 2. NEW IMPORT ---
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility'; // --- 3. NEW IMPORT ---
import VisibilityOff from '@mui/icons-material/VisibilityOff'; // --- 4. NEW IMPORT ---
import api from '../api'; 

const ForgotPasswordPage = () => {
    const [step, setStep] = useState(1);
    const [smail, setSmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    // --- 5. NEW STATE AND HANDLERS ---
    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };
    // --- END NEW ---

    const handleRequestReset = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const response = await api.post('/api/auth/forgot-password', { smail });
            setMessage(response.data.message);
            setStep(2); 
        } catch (error) {
            setMessage('If this email is registered, a password reset OTP has been sent.');
            console.error("ForgotPasswordPage Request error:", error.response?.data || error.message);
            setStep(2);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const body = { smail, otp, newPassword };
            const response = await api.post('/api/auth/reset-password', body);
            setMessage(response.data.message + ' Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Password reset failed. OTP might be invalid or expired.');
            console.error("ForgotPasswordPage Reset error:", error.response?.data || error.message);
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
            <Card sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2 }}>
                <Typography component="h1" variant="h5">
                    Reset Password
                </Typography>

                {step === 1 ? (
                    // --- STEP 1: ENTER S-MAIL ---
                    <Box component="form" onSubmit={handleRequestReset} sx={{ mt: 1, width: '100%' }}>
                        <Typography variant="body2" align="center" sx={{ mb: 2 }}>
                            Enter your official s-mail ID to receive a password reset OTP.
                        </Typography>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="smail"
                            label="Student Email (s-mail)"
                            name="smail"
                            type="email"
                            autoComplete="email"
                            autoFocus
                            value={smail}
                            onChange={(e) => setSmail(e.target.value)}
                        />
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                            Send Reset OTP
                        </Button>
                    </Box>
                ) : (
                    // --- STEP 2: VERIFY OTP AND SET NEW PASSWORD ---
                    <Box component="form" onSubmit={handleResetPassword} sx={{ mt: 1, width: '100%' }}>
                        <Typography variant="body2" align="center" sx={{ mb: 2 }}>
                            Enter the OTP sent to {smail} and set your new password.
                        </Typography>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Student Email (s-mail)"
                            name="smail"
                            value={smail}
                            disabled 
                            sx={{ mb: 1 }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="otp"
                            label="OTP"
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            sx={{ mb: 1 }}
                        />
                        <TextField
                            // --- 6. MODIFIED TEXTFIELD ---
                            margin="normal"
                            required
                            fullWidth
                            name="newPassword"
                            label="New Password"
                            type={showPassword ? 'text' : 'password'} // Toggle
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={handleClickShowPassword}
                                    onMouseDown={handleMouseDownPassword}
                                    edge="end"
                                  >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                            // --- END MODIFICATION ---
                        />
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                            Reset Password
                        </Button>
                    </Box>
                )}

                {message && (
                    <Typography
                        color={message.includes('successful') || message.includes('sent') ? 'success.main' : 'error'}
                        align="center"
                        variant="body2"
                        sx={{ mt: 2 }}
                    >
                        {message}
                    </Typography>
                )}

                <Link component={RouterLink} to="/login" variant="body2" sx={{ mt: 2 }}>
                    Back to Login
                </Link>
            </Card>
        </Container>
    );
};

export default ForgotPasswordPage;