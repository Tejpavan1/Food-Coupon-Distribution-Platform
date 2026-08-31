// src/components/LoginPage.js
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Card,
    Typography,
    TextField,
    Button,
    Box,
    Link,
    IconButton, // --- 1. NEW IMPORT ---
    InputAdornment // --- 2. NEW IMPORT ---
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility'; // --- 3. NEW IMPORT ---
import VisibilityOff from '@mui/icons-material/VisibilityOff'; // --- 4. NEW IMPORT ---
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    // --- 5. NEW STATE AND HANDLERS ---
    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };
    // --- END NEW ---

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); 
        try {
            const normalizedUserId = userId.trim().toUpperCase();
            await login(normalizedUserId, password);
            navigate('/dashboard');

        } catch (errorMessage) {
            console.error("LoginPage: login error caught:", errorMessage); 
            setError(errorMessage || 'Login failed. Please check credentials.');
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
            <Card sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2 }}>
                <Typography component="h1" variant="h5">
                    Shaastra Wallet Login
                </Typography>
                <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="userId"
                        label="User ID (Roll Number)"
                        name="userId"
                        autoComplete="username"
                        autoFocus
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                    />
                    <TextField
                        // --- 6. MODIFIED TEXTFIELD ---
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'} // Toggle type
                        id="password"
                        autoComplete="current-password"
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

                    {error && (
                        <Typography color="error" align="center" variant="body2" sx={{ mt: 2 }}>
                            {error}
                        </Typography>
                    )}

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Login
                    </Button>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Link component={RouterLink} to="/forgot-password" variant="body2">
                            Forgot Password?
                        </Link>
                        <Link component={RouterLink} to="/register" variant="body2">
                            {"Don't have an account? Register"}
                        </Link>
                    </Box>
                </Box>
            </Card>
        </Container>
    );
};

export default LoginPage;