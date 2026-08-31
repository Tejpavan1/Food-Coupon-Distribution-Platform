// src/components/TransactionStatus.js
import React from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// --- ANIMATIONS ---

// 1. Success Checkmark Animation
const stroke = keyframes`
  100% { stroke-dashoffset: 0; }
`;

const scale = keyframes`
  0%, 100% { transform: none; }
  50% { transform: scale3d(1.1, 1.1, 1); }
`;

const fill = keyframes`
  100% { box-shadow: inset 0px 0px 0px 30px #4caf50; }
`;

// 2. Processing Ripple Animation
const ripple = keyframes`
  0% {
    top: 36px;
    left: 36px;
    width: 0;
    height: 0;
    opacity: 0;
  }
  4.9% {
    top: 36px;
    left: 36px;
    width: 0;
    height: 0;
    opacity: 0;
  }
  5% {
    top: 36px;
    left: 36px;
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    top: 0px;
    left: 0px;
    width: 72px;
    height: 72px;
    opacity: 0;
  }
`;

// --- STYLED COMPONENTS ---

const SuccessSvg = styled('svg')({
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  display: 'block',
  strokeWidth: 2,
  stroke: '#fff',
  strokeMiterlimit: 10,
  margin: '10% auto',
  boxShadow: 'inset 0px 0px 0px #4caf50',
  animation: `${fill} .4s ease-in-out .4s forwards, ${scale} .3s ease-in-out .9s both`,
});

const SuccessCircle = styled('circle')({
  strokeDasharray: 166,
  strokeDashoffset: 166,
  strokeWidth: 2,
  strokeMiterlimit: 10,
  stroke: '#4caf50',
  fill: 'none',
  animation: `${stroke} 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards`,
});

const SuccessCheck = styled('path')({
  transformOrigin: '50% 50%',
  strokeDasharray: 48,
  strokeDashoffset: 48,
  animation: `${stroke} 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards`,
});

const RippleContainer = styled(Box)({
  display: 'inline-block',
  position: 'relative',
  width: '80px',
  height: '80px',
  '& div': {
    position: 'absolute',
    border: '4px solid #1976d2',
    opacity: 1,
    borderRadius: '50%',
    animation: `${ripple} 1s cubic-bezier(0, 0.2, 0.8, 1) infinite`,
  },
  '& div:nth-of-type(2)': {
    animationDelay: '-0.5s',
  },
});

const TransactionStatus = ({ status, message }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px', py: 3 }}>
      
      {/* PROCESSING STATE */}
      {status === 'processing' && (
        <>
          <RippleContainer>
            <div />
            <div />
          </RippleContainer>
          <Typography variant="h6" sx={{ mt: 3, fontWeight: 600, color: 'primary.main' }}>
            Processing Payment...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Securely communicating with server
          </Typography>
        </>
      )}

      {/* SUCCESS STATE */}
      {status === 'success' && (
        <>
          <SuccessSvg viewBox="0 0 52 52">
            <SuccessCircle cx="26" cy="26" r="25" />
            <SuccessCheck fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </SuccessSvg>
          <Typography variant="h5" sx={{ mt: 2, fontWeight: 700, color: '#4caf50' }}>
            Payment Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {message || 'Transaction completed.'}
          </Typography>
        </>
      )}

      {/* ERROR STATE */}
      {status === 'error' && (
        <>
           <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
              <Box sx={{ 
                 width: 80, height: 80, borderRadius: '50%', bgcolor: '#ffebee', 
                 display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                  <Typography variant="h1" sx={{ fontSize: '40px' }}>❌</Typography>
              </Box>
           </Box>
           <Typography variant="h6" color="error" gutterBottom sx={{ fontWeight: 700 }}>
             Transaction Failed
           </Typography>
           <Typography color="text.secondary" sx={{ maxWidth: '80%', textAlign: 'center' }}>
             {message}
           </Typography>
        </>
      )}
    </Box>
  );
};

export default TransactionStatus;