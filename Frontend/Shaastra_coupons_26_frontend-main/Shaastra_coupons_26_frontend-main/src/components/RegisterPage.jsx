// src/components/RegisterPage.js
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

const RegisterPage = () => {
    const [step, setStep] = useState(1);
    const [smail, setSmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [sPin, setSPin] = useState(''); // This state already exists
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    // --- 5. NEW STATE AND HANDLERS (FOR BOTH FIELDS) ---
    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const [showSPin, setShowSPin] = useState(false);
    const handleClickShowSPin = () => setShowSPin((show) => !show);
    const handleMouseDownSPin = (event) => {
        event.preventDefault();
    };
    // --- END NEW ---

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const response = await api.post('/api/auth/request-otp', { smail });
            setMessage(response.data.message);
            setStep(2); 
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to request OTP. Please check the email and try again.');
            console.error("RegisterPage OTP Request error:", error.response?.data || error.message);
        }
    };

    const handleCompleteRegistration = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const body = { smail, otp, password, sPin }; // sPin is already here
            const response = await api.post('/api/auth/complete-registration', body);
            setMessage(response.data.message + ' Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Registration failed. Please check OTP and password.');
            console.error("RegisterPage Completion error:", error.response?.data || error.message);
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
            <Card sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2 }}>
                <Typography component="h1" variant="h5">
                    Register Account
                </Typography>

                {step === 1 ? (
                    // --- STEP 1: ENTER S-MAIL ---
                    <Box component="form" onSubmit={handleRequestOtp} sx={{ mt: 1, width: '100%' }}>
                        <Typography variant="body2" align="center" sx={{ mb: 2 }}>
                            Enter your official s-mail ID to receive a verification OTP.
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
                            Get OTP
                        </Button>
                    </Box>
                ) : (
                    // --- STEP 2: VERIFY OTP AND SET PASSWORD ---
                    <Box component="form" onSubmit={handleCompleteRegistration} sx={{ mt: 1, width: '100%' }}>
                         <Typography variant="body2" align="center" sx={{ mb: 2 }}>
                            Enter the OTP sent to {smail} and set your password.
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
                            // --- 6. MODIFIED "PASSWORD" TEXTFIELD ---
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="New Password"
                            type={showPassword ? 'text' : 'password'} // Toggle
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                        <TextField
                            // --- 7. MODIFIED "S-PIN" TEXTFIELD ---
                            margin="normal"
                            required
                            fullWidth
                            name="sPin"
                            label="New 4-Digit S-Pin"
                            type={showSPin ? 'text' : 'password'} // Toggle
                            inputProps={{ maxLength: 4, minLength: 4, inputMode: 'numeric', pattern: '[0-9]*' }}
                            autoComplete="new-password" 
                            value={sPin}
                            onChange={(e) => setSPin(e.target.value)}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    aria-label="toggle s-pin visibility"
                                    onClick={handleClickShowSPin}
                                    onMouseDown={handleMouseDownSPin}
                                    edge="end"
                                  >
                                    {showSPin ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                            // --- END MODIFICATION ---
                        />
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                            Complete Registration
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
                    Already have an account? Login
                </Link>
            </Card>
        </Container>
    );
};

export default RegisterPage;