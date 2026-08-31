// src/components/DashboardPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Card, Typography, Button, TextField, Container, CircularProgress,
    Modal, List, ListItem, ListItemText, Divider, Paper,
    Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Grid,
    InputAdornment, IconButton
} from '@mui/material';
import {
    Warning
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { io } from 'socket.io-client';
import { useSnackbar } from 'notistack';
import SendIcon from '@mui/icons-material/Send';
import HistoryIcon from '@mui/icons-material/History';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddCardIcon from '@mui/icons-material/AddCard';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ReceiptIcon from '@mui/icons-material/Receipt';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import QRCode from 'react-qr-code';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import TransactionStatus from './TransactionStatus';
import ResetBalancesModal from './ResetBalancesModal';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// Responsive Modal Style
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

const DashboardPage = () => {
    const { user, logout } = useAuth();
    const { enqueueSnackbar } = useSnackbar(); 

    const [transactions, setTransactions] = useState([]);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [idModalOpen, setIdModalOpen] = useState(false);
    const [csvModalOpen, setCsvModalOpen] = useState(false);
    const [csvRecipients, setCsvRecipients] = useState([]);
    const [csvSummary, setCsvSummary] = useState({ totalAmount: 0, count: 0 });
    const [csvFile, setCsvFile] = useState(null);

    // ✅ NEW: Local state for Real-time Balance
    const [currentBalance, setCurrentBalance] = useState(0);

    // Animation Status: 'input' | 'processing' | 'success' | 'error'
    const [transactionStatus, setTransactionStatus] = useState('input');

    const socketRef = useRef(null);

    // Page Title component
    const PageTitle = () => (
        <Box sx={{ mb: 4, mt: 2, textAlign: 'center' }}>
            <Typography 
                variant="h5" 
                component="h1" 
                gutterBottom 
                sx={{ 
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 800,
                    background: 'linear-gradient(45deg, #007FFF, #0059B2)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px',
                    fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' }
                }}
            >
                Quick Actions
            </Typography>
        </Box>
    );

    // --- STATES ---
    const [open, setOpen] = useState(false);
    const [receiverId, setReceiverId] = useState('');
    const [amount, setAmount] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [topUpOpen, setTopUpOpen] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [receiveOpen, setReceiveOpen] = useState(false);
    const [groupOpen, setGroupOpen] = useState(false);
    const [targetRole, setTargetRole] = useState('');
    const [groupMembers, setGroupMembers] = useState([]);
    const [coresOpen, setCoresOpen] = useState(false);
    const [allCores, setAllCores] = useState([]);
    const [coresRecipients, setCoresRecipients] = useState({});
    const [coresCommonAmount, setCoresCommonAmount] = useState('');    
    const [recipients, setRecipients] = useState({});
    const [commonAmount, setCommonAmount] = useState('');
    
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [sPin, setSPin] = useState('');
    const [pendingTransaction, setPendingTransaction] = useState(null);
    const [showSPin, setShowSPin] = useState(false);
    const [resetModalOpen, setResetModalOpen] = useState(false);

    // --- HANDLERS ---
    const handleOpen = () => setOpen(true);
    const handleClose = () => { setOpen(false); setMessage(''); setReceiverId(''); setAmount(''); setIsScanning(false); };
    const handleTopUpOpen = () => setTopUpOpen(true);
    const handleTopUpClose = () => { setTopUpOpen(false); setMessage(''); setTopUpAmount(''); };
    
    const handleReceiveOpen = () => setReceiveOpen(true);
    const handleReceiveClose = () => setReceiveOpen(false);
    const handleGroupOpen = () => setGroupOpen(true);
    const handleGroupClose = () => {
        setGroupOpen(false); setMessage(''); setTargetRole('');
        setGroupMembers([]); setRecipients({}); setCommonAmount('');
    };
    const handleCoresOpen = () => setCoresOpen(true);
    const handleCoresClose = () => {
        setCoresOpen(false); 
        setMessage(''); 
        setAllCores([]); 
        setCoresRecipients({}); 
        setCoresCommonAmount('');
    };
    const handlePinModalClose = () => {
        // Prevent closing while processing or showing success animation
        if (transactionStatus === 'processing' || transactionStatus === 'success') return;
        
        setIsPinModalOpen(false);
        setMessage('');
        setMessageType('info');
        setSPin('');
        setPendingTransaction(null);
        setShowSPin(false);
        setTransactionStatus('input'); 
    }

    const handleIdClose = () => setIdModalOpen(false);
    
    const handleCopyId = async () => {
        try {
            await navigator.clipboard.writeText(user.rollNumber || user.userId || '');
            enqueueSnackbar('User ID copied to clipboard!', { variant: 'info' });
        } catch (err) {
            console.error('Copy failed', err);
            enqueueSnackbar('Failed to copy ID', { variant: 'error' });
        }
    };

    const handleClickShowSPin = () => setShowSPin((show) => !show);
    const handleMouseDownSPin = (event) => { event.preventDefault(); };
    const handleResetModalOpen = () => { setResetModalOpen(true); };
    const handleResetModalClose = () => { setResetModalOpen(false); };

    const handleResetSuccess = (result) => {
        enqueueSnackbar(
            `✅ Successfully reset ${result.usersWithBalance} users' balances. Total: ₹${result.totalAmountReset}`,
            { variant: 'success', autoHideDuration: 7000 }
        );
        fetchHistory();
        setTimeout(() => window.location.reload(), 2000);
    };
    const handleCsvModalOpen = () => setCsvModalOpen(true);
    const handleCsvModalClose = () => {
        setCsvModalOpen(false);
        setCsvRecipients([]);
        setCsvSummary({ totalAmount: 0, count: 0 });
        setCsvFile(null);
        setMessage('');
    };

    const handleCsvUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setCsvFile(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const lines = text.split(/\r\n|\n/);
                const parsed = [];
                let total = 0;
                
                // Parse CSV (Expected format: UserId, Amount)
                lines.forEach((line, index) => {
                    if (!line.trim()) return;
                    const parts = line.split(',');
                    if (parts.length < 2) return;
                    
                    const userId = parts[0].trim();
                    const amountStr = parts[1].trim();
                    
                    // Skip header row if it exists
                    if (index === 0 && userId.toLowerCase().includes('user') && isNaN(amountStr)) return;
                    
                    const amount = parseFloat(amountStr);
                    if (userId && !isNaN(amount) && amount > 0) {
                        parsed.push({ userId, amount });
                        total += amount;
                    }
                });

                if (parsed.length === 0) {
                    setMessage('No valid rows found in CSV. Format: UserId, Amount');
                    setMessageType('error');
                    return;
                }

                setCsvRecipients(parsed);
                setCsvSummary({ totalAmount: total, count: parsed.length });
                setMessage('');
                setMessageType('info');

            } catch (err) {
                console.error(err);
                setMessage('Error parsing CSV file.');
                setMessageType('error');
            }
        };
        reader.readAsText(file);
    };

    const handleSendBulkCsv = async (e) => {
        e.preventDefault();
        setMessage('');
        
        if (csvRecipients.length === 0) {
             setMessage('Please upload a valid CSV first.');
             setMessageType('error');
             return;
        }

        // Set pending transaction for the Confirmation Modal
        setPendingTransaction({ 
            type: 'bulk_csv', 
            payload: { recipients: csvRecipients, totalAmount: csvSummary.totalAmount, count: csvSummary.count } 
        });
        setSPin('');
        setTransactionStatus('input');
        setIsPinModalOpen(true);
        handleCsvModalClose();
    };

    const fetchHistory = useCallback(async () => {
        if (!user) return;
        try {
            const historyRes = await api.get('/api/wallet/history');
            const txData = historyRes.data.transactions || historyRes.data;
            setTransactions(txData);
        } catch (error) { 
            console.error('Failed to fetch history:', error); 
        }
    }, [user]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    // ✅ NEW: Sync local balance with user object on load
    useEffect(() => {
        if (user) {
            setCurrentBalance(user.balance);
        }
    }, [user]);



    // ============================================
    // 🔌 SOCKET LISTENER (NUCLEAR OPTION)
    // ============================================
    useEffect(() => {
        if (!user?.userId) return;

        // 1. GLOBAL DUPLICATE PREVENTION
        // This ensures that even if the component remounts, we remember the IDs.
        if (!window.processedTransactionIds) {
            window.processedTransactionIds = new Set();
        }

        console.log(`🔌 Initializing Socket for ${user.userId}...`);

        // 2. Setup Socket - ✅ POINTING TO PRODUCTION URL
        const newSocket = io("https://api.coupons.shaastra.org/", {
            transports: ['polling', 'websocket'],
            withCredentials: true,
            autoConnect: false
        });
        
        socketRef.current = newSocket;

        newSocket.on("connect", () => {
            console.log("✅ Socket Connected:", newSocket.id);
            newSocket.emit("join_room", user.userId.toUpperCase());
        });

        newSocket.on("transaction_received", (data) => {
            // DEBUG: See exactly what the server is sending
            console.log("📨 Raw Event Data:", data);

            // --- GLOBAL FILTER ---
            // If data.id is missing, use a fallback combined with amount/time to make it unique
            const txId = data.id || `${data.senderUserId}-${data.amount}-${Date.now()}`;

            if (window.processedTransactionIds.has(txId)) {
                console.warn("🚫 BLOCKED DUPLICATE Transaction ID:", txId);
                return;
            }
            
            // Mark as processed globally
            window.processedTransactionIds.add(txId);
            
            console.log("💰 PROCESSING Transaction:", txId);
            
            // Audio
            try { new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3').play(); } catch(e){}

            // ✅ NEW: Update Balance Instantly
            if (data.type === 'credit') {
                setCurrentBalance(prev => prev + Number(data.amount));
                enqueueSnackbar(`💸 RECEIVED ₹${data.amount} from ${data.senderName}`, { 
                    variant: 'success', 
                    autoHideDuration: 5000,
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                });
            } else if (data.type === 'debit') {
                setCurrentBalance(prev => prev - Number(data.amount));
                enqueueSnackbar(`✅ Sent ₹${data.amount} to ${data.receiverName}`, { 
                    variant: 'info', 
                    autoHideDuration: 5000,
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                });
            }

            // Update State (History List)
            setTransactions(prev => {
                // Double safety check
                if (prev.some(t => t.id === data.id)) return prev;
                return [{
                    id: data.id || Date.now(),
                    senderUserId: "live",
                    receiverUserId: user.userId,
                    senderName: data.senderName,
                    receiverName: data.receiverName || user.name,
                    amount: Number(data.amount),
                    createdAt: new Date().toISOString()
                }, ...prev];
            });
        });

        newSocket.on("balance_reset", (data) => {
            enqueueSnackbar(data.message, { variant: 'warning' });
            setTimeout(() => window.location.reload(), 2000);
        });

        newSocket.connect();

        return () => {
            // Cleanup: Disconnect but DO NOT clear the window.processedTransactionIds
            // This prevents duplicates if the user navigates away and back quickly.
            newSocket.disconnect();
        };

    }, [user?.userId, enqueueSnackbar]);

    // --- GROUP LOGIC ---
    useEffect(() => {
        if (groupOpen && targetRole) {
            const fetchDeptMembersByRole = async () => {
                setMessage(''); setGroupMembers([]); setRecipients({});
                try {
                    const res = await api.get(`/api/user/by-role-in-my-department?role=${targetRole}`);
                    const members = res.data || [];
                    setGroupMembers(members);
                    const initialRecipients = members.reduce((acc, member) => {
                        acc[member.userId] = { selected: true, amount: '' };
                        return acc;
                    }, {});
                    setRecipients(initialRecipients);
                    setMessageType('info');
                } catch (err) {
                    setMessage(err.response?.data?.message || 'Error fetching members.');
                    setMessageType('error');
                }
            };
            fetchDeptMembersByRole();
        } else {
            setGroupMembers([]); setRecipients({});
        }
    }, [groupOpen, targetRole]);

    // --- FETCH ALL CORES FOR FINANCE CORE ---
    useEffect(() => {
        if (coresOpen) {
            const fetchAllCores = async () => {
                setMessage(''); 
                setAllCores([]); 
                setCoresRecipients({});
                try {
                    const res = await api.get(`/api/user/all-cores`);
                    const cores = res.data || [];
                    setAllCores(cores);
                    const initialRecipients = cores.reduce((acc, core) => {
                        acc[core.userId] = { selected: true, amount: '' };
                        return acc;
                    }, {});
                    setCoresRecipients(initialRecipients);
                    setMessageType('info');
                } catch (err) {
                    setMessage(err.response?.data?.message || 'Error fetching cores.');
                    setMessageType('error');
                }
            };
            fetchAllCores();
        } else {
            setAllCores([]); 
            setCoresRecipients({});
        }
    }, [coresOpen]);

    const handleSelectAllDept = () => {
        const filtered = groupMembers;
        const allIds = filtered.reduce((acc, member) => {
            acc[member.userId] = { ...recipients[member.userId], selected: true };
            return acc;
        }, {});
        setRecipients(allIds);
    };

    const handleDeselectAllDept = () => {
        const filtered = groupMembers;
        const allIds = filtered.reduce((acc, member) => {
            acc[member.userId] = { ...recipients[member.userId], selected: false };
            return acc;
        }, {});
        setRecipients(allIds);
    };

    const handleRecipientToggle = (userId) => {
        setRecipients(prev => ({
            ...prev,
            [userId]: { ...prev[userId], selected: !prev[userId].selected }
        }));
    };

    const handleCoresRecipientToggle = (userId) => {
        setCoresRecipients(prev => ({
            ...prev,
            [userId]: { ...prev[userId], selected: !prev[userId].selected }
        }));
    };

    const handleCoresAmountChange = (userId, value) => {
        const sanitizedValue = value.match(/^\d*\.?\d*$/) ? value : coresRecipients[userId]?.amount || '';
        setCoresRecipients(prev => ({
            ...prev,
            [userId]: { ...prev[userId], amount: sanitizedValue }
        }));
    };

    const handleApplyCoresCommonAmount = () => {
        const amountToApply = coresCommonAmount.match(/^\d*\.?\d*$/) ? coresCommonAmount : '';
        if (amountToApply === '' || parseFloat(amountToApply) <= 0) {
            setMessage('Please enter a valid positive common amount.');
            setMessageType('error');
            return;
        }
        setCoresRecipients(prev => {
            const newRecipients = { ...prev };
            Object.keys(newRecipients).forEach(userId => {
                if (newRecipients[userId].selected) {
                    newRecipients[userId].amount = amountToApply;
                }
            });
            return newRecipients;
        });
        setMessage('');
        setMessageType('info');
    };

    const handleSelectAllCores = () => {
        setCoresRecipients(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(userId => {
                updated[userId].selected = true;
            });
            return updated;
        });
    };

    const handleDeselectAllCores = () => {
        setCoresRecipients(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(userId => {
                updated[userId].selected = false;
            });
            return updated;
        });
    };

    const handleSendCores = async (e) => {
        e.preventDefault(); 
        setMessage(''); 
        setMessageType('info');
        
        const finalRecipients = Object.entries(coresRecipients)
            .filter(([, data]) => data.selected && data.amount && parseFloat(data.amount) > 0)
            .map(([userId, data]) => ({ receiverId: userId, amount: Number(parseFloat(data.amount).toFixed(2)) }));
        
        if (finalRecipients.length === 0) { 
            setMessage('Please select cores and enter a valid positive amount.'); 
            setMessageType('error'); 
            return; 
        }
        
        const totalAmountToSend = finalRecipients.reduce((sum, r) => sum + r.amount, 0);
        
        if (user && user.balance < totalAmountToSend) { 
            setMessage(`Insufficient balance. Need: ₹${totalAmountToSend.toFixed(2)}`); 
            setMessageType('error'); 
            return; 
        }
        
        setPendingTransaction({ type: 'group', payload: { recipients: finalRecipients } });
        setSPin(''); 
        setTransactionStatus('input'); 
        setIsPinModalOpen(true); 
        handleCoresClose();
    }; 

    const handleAmountChange = (userId, value) => {
        const sanitizedValue = value.match(/^\d*\.?\d*$/) ? value : recipients[userId]?.amount || '';
        setRecipients(prev => ({
            ...prev,
            [userId]: { ...prev[userId], amount: sanitizedValue }
        }));
    };

    const handleApplyCommonAmount = () => {
        const amountToApply = commonAmount.match(/^\d*\.?\d*$/) ? commonAmount : '';
        if (amountToApply === '' || parseFloat(amountToApply) <= 0) {
            setMessage('Please enter a valid positive common amount.');
            setMessageType('error');
            return;
        }
        setRecipients(prev => {
            const newRecipients = { ...prev };
            Object.keys(newRecipients).forEach(userId => {
                if (newRecipients[userId].selected) {
                    newRecipients[userId].amount = amountToApply;
                }
            });
            return newRecipients;
        });
        setMessage('');
        setMessageType('info');
    };

    const handleScanResult = (result) => {
        try {
            let scannedData = null;
            if (typeof result === 'string') scannedData = result;
            else if (result?.data) scannedData = result.data;
            else if (result?.text) scannedData = result.text;
            else if (result?.rawValue) scannedData = result.rawValue;
            else if (Array.isArray(result) && result.length > 0) scannedData = result[0]?.rawValue || result[0]?.data || result[0];
            
            if (scannedData) {
                const trimmedData = scannedData.trim();
                if (trimmedData === user.userId || trimmedData === user.rollNumber) {
                    setMessage('Cannot send money to yourself.');
                    setMessageType('error');
                    return; 
                }
                setReceiverId(trimmedData);
                setIsScanning(false);
                setMessage('QR code scanned successfully! Please enter the amount.');
                setMessageType('success');
            } else {
                setMessage('Invalid QR code format. Please try again.');
                setMessageType('error');
            }
        } catch (error) {
            setMessage('Error reading QR code. Please try again or enter manually.');
            setMessageType('error');
        }
    };

    // --- PREPARE TRANSACTION HANDLERS ---
    const handleSendMoney = async (e) => {
        e.preventDefault(); setMessage(''); setMessageType('info');
        if (Number(amount) <= 0) { setMessage("Amount must be greater than 0."); setMessageType('error'); return; }
        if (receiverId.trim() === user.userId || receiverId.trim() === user.rollNumber) { setMessage("Cannot send money to yourself."); setMessageType('error'); return; }
        setPendingTransaction({ type: 'send', payload: { receiverId, amount: Number(amount) } });
        setSPin(''); setTransactionStatus('input'); setIsPinModalOpen(true); handleClose();
    };

    const handleTopUp = async (e) => {
        e.preventDefault(); setMessage(''); setMessageType('info');
        if (Number(topUpAmount) <= 0) { setMessage("Amount must be greater than 0."); setMessageType('error'); return; }
        setPendingTransaction({ type: 'topup', payload: { amount: Number(topUpAmount) } });
        setSPin(''); setTransactionStatus('input'); setIsPinModalOpen(true); handleTopUpClose();
    };

    const handleSendGroup = async (e) => {
        e.preventDefault(); setMessage(''); setMessageType('info');
        const finalRecipients = Object.entries(recipients)
            .filter(([, data]) => data.selected && data.amount && parseFloat(data.amount) > 0)
            .map(([userId, data]) => ({ receiverId: userId, amount: Number(parseFloat(data.amount).toFixed(2)) }));
        if (finalRecipients.length === 0) { setMessage('Please select recipients and enter a valid positive amount.'); setMessageType('error'); return; }
        const totalAmountToSend = finalRecipients.reduce((sum, r) => sum + r.amount, 0);
        if (user && user.balance < totalAmountToSend) { setMessage(`Insufficient balance. Need: ₹${totalAmountToSend.toFixed(2)}`); setMessageType('error'); return; }
        setPendingTransaction({ type: 'group', payload: { recipients: finalRecipients } });
        setSPin(''); setTransactionStatus('input'); setIsPinModalOpen(true); handleGroupClose();
    };

    // ============================================
    // ✅ CONFIRMATION LOGIC WITH ANIMATION
    // ============================================
    const handleConfirmTransaction = async (e) => {
        e.preventDefault();
        setMessage('');
        setMessageType('info');
        
        setTransactionStatus('processing');

        let apiEndpoint = '';
        let apiPayload = {};

        if (pendingTransaction.type === 'send') {
            apiEndpoint = '/api/wallet/send';
            apiPayload = { ...pendingTransaction.payload, sPin };
        } else if (pendingTransaction.type === 'topup') {
            apiEndpoint = '/api/wallet/topup';
            apiPayload = { ...pendingTransaction.payload, sPin };
        } else if (pendingTransaction.type === 'group') {
            apiEndpoint = '/api/wallet/send-group';
            apiPayload = { ...pendingTransaction.payload, sPin };
        }
        if (pendingTransaction.type === 'send') {
            // ...
        } else if (pendingTransaction.type === 'bulk_csv') {
            apiEndpoint = '/api/wallet/send-bulk-csv';
            apiPayload = { recipients: pendingTransaction.payload.recipients, sPin };
        }

        try {
            const start = Date.now();
            await api.post(apiEndpoint, apiPayload);
            const duration = Date.now() - start;
            const delay = Math.max(0, 1200 - duration);

            setTimeout(() => {
                setTransactionStatus('success');
                setMessage('Success!');
                setMessageType('success');
                
                setTimeout(async () => {
                    handlePinModalClose();
                    await fetchHistory();
                    // window.location.reload(); // ❌ REMOVED: No reload needed anymore!
                }, 2200); 
            }, delay);

        } catch (error) {
            console.error("Tx failed", error);
            setTransactionStatus('input'); 
            setMessage(error.response?.data?.message || 'Transaction failed. Check S-Pin.');
            setMessageType('error');
            setSPin('');
        }
    };

    const handleLogout = () => { logout(); };

    if (!user) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="sm" sx={{ mt: 4, pb: 4 }}>
            <PageTitle />
            
            {/* Balance Card */}
            <Card sx={{ p: 3, mb: 4, backgroundColor: '#6da9d2ff', color: 'white', borderRadius: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                        {user.rollNumber || user.userId || 'Not Available'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    {/* ✅ UPDATED: Uses currentBalance instead of user.balance */}
                    <Typography variant="h3" sx={{ fontWeight: 700, textAlign: 'center', fontSize: '1.5rem' }}>
                        ₹{currentBalance.toFixed(2)}
                    </Typography>
                </Box>
            </Card>

            {/* Quick Actions */}
            <Typography variant="h6" align="left" gutterBottom sx={{ mb: 2 }}>Quick Actions</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid size={{ xs: 6, sm: 4 }}><Button variant="contained" startIcon={<SendIcon />} onClick={handleOpen} fullWidth>Send</Button></Grid>
                <Grid size={{ xs: 6, sm: 4 }}><Button variant="outlined" startIcon={<ArrowDownwardIcon />} onClick={handleReceiveOpen} fullWidth>Receive</Button></Grid>
                <Grid size={{ xs: 6, sm: 4 }}><Button component={Link} to="/history" variant="outlined" startIcon={<HistoryIcon />} fullWidth>History</Button></Grid>
                {((user.department === 'Finance' ) && user.role === 'Core') && (
                      <Grid size={{ xs: 6, sm: 4 }}><Button variant="contained" color="success" startIcon={<AddCardIcon />} onClick={handleTopUpOpen} fullWidth>Top Up</Button></Grid>
                )}
                {/* MODIFICATION 6: SEND TO ALL CORES BUTTON */}
                {((user.department === 'Finance' ) && user.role === 'Core') && (
                    <Grid size={{ xs: 6, sm: 4 }}>
                        <Button variant="contained" color="primary" startIcon={<GroupAddIcon />} onClick={handleCoresOpen} fullWidth>
                            Send to All Cores
                        </Button>
                    </Grid>
                )}
                 {(user.role === 'Core' || user.role === 'Finance Core') && user.department && (
                      <Grid size={{ xs: 6, sm: 4 }}><Button variant="contained" color="secondary" startIcon={<GroupAddIcon />} onClick={handleGroupOpen} fullWidth>Send to Dept Team</Button></Grid>
                 )}
                 {((user.department === 'Finance' ) && user.role === 'Core') && (
                      <Grid size={{ xs: 6, sm: 4 }}><Button component={Link} to="/vendor-management" variant="outlined" startIcon={<ReceiptIcon />} fullWidth>Vendor Management</Button></Grid>
                 )}
                {((user.department === 'Finance' ) && user.role === 'Core') && (
                    <Grid size={{ xs: 6, sm: 4 }}>
                        <Button variant="contained" color="warning" startIcon={<Warning />} onClick={handleResetModalOpen} fullWidth>Reset Balances</Button>
                    </Grid>
                )}  
                {((user.department === 'Finance') && user.role === 'Core') && (
                    <Grid size={{ xs: 6, sm: 4 }}>
                        <Button variant="contained" color="secondary" startIcon={<CloudUploadIcon />} onClick={handleCsvModalOpen} fullWidth>
                            Bulk Send (CSV)
                        </Button>
                    </Grid>
                )}              
            </Grid>

            {/* Recent Transactions */}
            <Typography variant="h6" align="left" gutterBottom sx={{ mt: 4 }}>Recent Transactions</Typography>
            <Paper elevation={2} sx={{ borderRadius: 2 }}>
                <List sx={{ p: 0 }}>
                    {transactions.length > 0 ? transactions.slice(0, 5).map((tx, index) => (
                        <React.Fragment key={tx.id}>
                            {(() => {
                                const isSender = tx.senderUserId === user.userId;
                                const isTopUp = tx.senderUserId === tx.receiverUserId;
                                const isDebit = isSender && !isTopUp;
                                let primaryText = isDebit ? `Sent to ${tx.receiverName}` : isTopUp ? `Wallet Top-Up` : `Received from ${tx.senderName}`;
                                return (
                                    <>
                                        <ListItem>
                                            <ListItemText primary={primaryText} secondary={new Date(tx.createdAt).toLocaleString()} />
                                            <Typography color={isDebit ? 'error' : 'success.main'} sx={{ fontWeight: 'bold' }}>
                                                {isDebit ? '-' : '+'}₹{tx.amount.toFixed(2)} 
                                            </Typography>
                                        </ListItem>
                                        {index < transactions.slice(0, 5).length - 1 && <Divider />}
                                    </>
                                );
                            })()}
                        </React.Fragment>
                    )) : (<ListItem><ListItemText primary="No transactions yet." /></ListItem>)}
                </List>
            </Paper>

            {/* Modals */}
            <Modal open={open} onClose={handleClose}>
                <Box sx={modalStyle}>
                    {isScanning ? (
                      <>
                        <Typography variant="h6" component="h2" gutterBottom>Scan Recipient QR Code</Typography>
                        <Scanner 
                            onScan={handleScanResult}
                            onError={(error) => { setMessage('Failed to scan QR code.'); setMessageType('error'); }}
                            constraints={{ facingMode: 'environment', aspectRatio: 1 }}
                            containerStyle={{ width: '100%' }}
                            scanDelay={300}
                        />
                        {message && <Typography sx={{ mt: 2, color: messageType === 'error' ? 'error.main' : messageType === 'success' ? 'success.main' : 'text.secondary' }}>{message}</Typography>}
                        <Button onClick={() => { setIsScanning(false); setMessage(''); }} sx={{ mt: 2 }}>Enter Manually</Button>
                      </>
                    ) : (
                      <>
                          <Typography variant="h6" component="h2" gutterBottom>Send Money</Typography>
                          <Box component="form" onSubmit={handleSendMoney}>
                            <TextField label="Recipient's User ID" fullWidth required sx={{ mb: 2 }} value={receiverId} onChange={(e) => setReceiverId(e.target.value)} />
                            <TextField label="Amount" type="number" fullWidth required sx={{ mb: 2 }} value={amount} onChange={(e) => setAmount(e.target.value)} InputProps={{ inputProps: { min: 0.01, step: 0.01 } }}/>
                            <Button type="submit" variant="contained" fullWidth size="large">Next</Button>
                            {message && <Typography sx={{ mt: 2, color: messageType === 'error' ? 'error.main' : messageType === 'success' ? 'success.main' : 'text.secondary' }}>{message}</Typography>}
                        </Box>
                        <Divider sx={{ my: 2 }}>OR</Divider>
                        <Button variant="outlined" startIcon={<QrCodeScannerIcon />} fullWidth onClick={() => setIsScanning(true)}>Scan QR Code</Button>
                      </>
                    )}
                 </Box>
            </Modal>
            <Modal open={topUpOpen} onClose={handleTopUpClose}>
                 <Box sx={modalStyle}>
                    <Typography variant="h6" component="h2" gutterBottom>Top Up Your Wallet</Typography>
                    <Box component="form" onSubmit={handleTopUp}>
                        <TextField label="Amount to Add" type="number" fullWidth required sx={{ mb: 2 }} value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} InputProps={{ inputProps: { min: 0.01, step: 0.01 } }}/>
                        <Button type="submit" variant="contained" color="success" fullWidth size="large">Next</Button>
                        {message && <Typography sx={{ mt: 2, color: messageType === 'error' ? 'error.main' : messageType === 'success' ? 'success.main' : 'text.secondary' }}>{message}</Typography>}
                    </Box>
                </Box>
            </Modal>
            <Modal open={receiveOpen} onClose={handleReceiveClose}>
                <Box sx={modalStyle}>
                    <Typography variant="h6" component="h2" gutterBottom>Receive Money</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>Others can scan this code or use your User ID.</Typography>
                    <Box sx={{ p: 2, backgroundColor: (theme) => theme.palette.background.paper, display: 'inline-block', borderRadius: 1 }}>
                        <QRCode value={user.userId} size={200} />
                    </Box>
                    <Typography variant="h6" sx={{ mt: 2, fontWeight: 'bold' }}>Your User ID: {user.userId}</Typography>
                </Box>
            </Modal>
            <Modal open={idModalOpen} onClose={handleIdClose}>
                <Box sx={modalStyle}>
                    <Typography variant="h6" gutterBottom>User ID</Typography>
                    <Typography sx={{ mb: 2, fontWeight: 600 }}>{user.rollNumber || user.userId || 'Not Available'}</Typography>
                    <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={handleCopyId}>Copy</Button>
                </Box>
            </Modal>
            <Modal open={groupOpen} onClose={handleGroupClose}>
                <Box sx={{ ...modalStyle, width: { xs: '90%', md: 600 } }}>
                      <Typography variant="h6" gutterBottom>Send to Department Team</Typography>
                      <FormControl fullWidth sx={{ my: 2 }}>
                        <InputLabel>Select Target Role</InputLabel>
                        <Select value={targetRole} label="Select Target Role" onChange={(e) => setTargetRole(e.target.value)}>
                            <MenuItem value={'Head'}>Heads</MenuItem>
                            <MenuItem value={'Coordinator'}>Coordinators</MenuItem>
                            <MenuItem value={'Volunteer'}>Volunteers</MenuItem>
                        </Select>
                    </FormControl>
                    {groupMembers.length > 0 && (
                        <Box component="form" onSubmit={handleSendGroup}>
                            {/* MODIFICATION 7: SELECT/DESELECT ALL GROUP */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {Object.values(recipients).filter(r => r.selected).length} of {groupMembers.length} selected
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button size="small" onClick={handleSelectAllDept}>Select All</Button>
                                    <Button size="small" onClick={handleDeselectAllDept}>Deselect All</Button>
                                </Box>
                            </Box>
                            
                            <Grid container spacing={1} alignItems="center" sx={{mb: 2}}>
                                <Grid size={{ xs: 8 }}>
                                    <TextField label="Set Amount for All Selected" type="number" fullWidth size="small" value={commonAmount} onChange={e => setCommonAmount(e.target.value)} InputProps={{ inputProps: { min: 0.01, step: 0.01 } }}/>
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <Button onClick={handleApplyCommonAmount} variant="outlined" size="medium" fullWidth>Apply</Button>
                                </Grid>
                            </Grid>
                            <Paper sx={{ maxHeight: 300, overflow: 'auto', mb: 2, textAlign: 'left' }}>
                                <List dense>
                                    {groupMembers.map(member => (
                                        <ListItem key={member.userId} divider sx={{py: 0.5}}>
                                            <FormControlLabel control={ <Checkbox checked={recipients[member.userId]?.selected || false} onChange={() => handleRecipientToggle(member.userId)} size="small"/> } label={`${member.name} (${member.userId})`} sx={{ flexGrow: 1, mr: 1 }} />
                                            <TextField label="Amount" type="number" size="small" variant="outlined" value={recipients[member.userId]?.amount || ''} onChange={(e) => handleAmountChange(member.userId, e.target.value)} sx={{ width: '100px' }} InputProps={{ inputProps: { min: 0.01, step: 0.01 } }} disabled={!recipients[member.userId]?.selected} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                            <Button type="submit" variant="contained" fullWidth>Next</Button>
                        </Box>
                    )}
                    {message && <Typography sx={{ mt: 2, color: messageType === 'error' ? 'error.main' : messageType === 'success' ? 'success.main' : 'text.secondary' }}>{message}</Typography>}
                </Box>
            </Modal>

            {/* MODIFICATION 8: CORES DRAWDOWN MODAL */}
            <Modal open={coresOpen} onClose={handleCoresClose}>
                <Box sx={{ ...modalStyle, width: { xs: '90%', md: 600 } }}>
                    <Typography variant="h6" gutterBottom>Send to All Department Cores</Typography>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        Send money to all Cores from different departments (Finance Cores excluded)
                    </Typography>
                    
                    {allCores.length > 0 && (
                        <Box component="form" onSubmit={handleSendCores}>
                            {/* SELECT/DESELECT ALL */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {Object.values(coresRecipients).filter(r => r.selected).length} of {allCores.length} selected
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button size="small" onClick={handleSelectAllCores}>Select All</Button>
                                    <Button size="small" onClick={handleDeselectAllCores}>Deselect All</Button>
                                </Box>
                            </Box>
                            
                            {/* COMMON AMOUNT INPUT */}
                            <Grid container spacing={1} alignItems="center" sx={{mb: 2}}>
                                <Grid size={{ xs: 8 }}>
                                    <TextField 
                                        label="Set Amount for All Selected" 
                                        type="number" 
                                        fullWidth 
                                        size="small" 
                                        value={coresCommonAmount} 
                                        onChange={e => setCoresCommonAmount(e.target.value)} 
                                        InputProps={{ inputProps: { min: 0.01, step: 0.01 } }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <Button onClick={handleApplyCoresCommonAmount} variant="outlined" size="medium" fullWidth>
                                        Apply
                                    </Button>
                                </Grid>
                            </Grid>
                            
                            {/* CORES LIST */}
                            <Paper sx={{ maxHeight: 300, overflow: 'auto', mb: 2, textAlign: 'left' }}>
                                <List dense>
                                    {allCores.map(core => (
                                        <ListItem key={core.userId} divider sx={{py: 0.5}}>
                                            <FormControlLabel 
                                                control={
                                                    <Checkbox 
                                                        checked={coresRecipients[core.userId]?.selected || false} 
                                                        onChange={() => handleCoresRecipientToggle(core.userId)} 
                                                        size="small"
                                                    />
                                                } 
                                                label={`${core.name} (${core.userId}) - ${core.department}`} 
                                                sx={{ flexGrow: 1, mr: 1 }} 
                                            />
                                            <TextField 
                                                label="Amount" 
                                                type="number" 
                                                size="small" 
                                                variant="outlined" 
                                                value={coresRecipients[core.userId]?.amount || ''} 
                                                onChange={(e) => handleCoresAmountChange(core.userId, e.target.value)} 
                                                sx={{ width: '100px' }} 
                                                InputProps={{ inputProps: { min: 0.01, step: 0.01 } }} 
                                                disabled={!coresRecipients[core.userId]?.selected} 
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                            
                            <Button type="submit" variant="contained" fullWidth>Next</Button>
                        </Box>
                    )}
                    
                    {message && (
                        <Typography sx={{ mt: 2, color: messageType === 'error' ? 'error.main' : messageType === 'success' ? 'success.main' : 'text.secondary' }}>
                            {message}
                        </Typography>
                    )}
                </Box>
            </Modal>

            {/* S-Pin Confirmation Modal */}
            <Modal open={isPinModalOpen} onClose={handlePinModalClose}>
                <Box sx={modalStyle}>
                    {transactionStatus !== 'input' ? (
                        <TransactionStatus status={transactionStatus} message={transactionStatus === 'success' ? 'Transaction Completed!' : ''} />
                    ) : (
                        <>
                        {pendingTransaction && (
                            <Box sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100', p: 2, borderRadius: 2, mb: 3, border: (theme) => `1px solid ${theme.palette.divider}` }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>Transaction Details</Typography>
                                <Divider sx={{ my: 1 }} />
                                
                                {pendingTransaction.type === 'send' && (
                                    <>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                                                    <Typography color="text.secondary">To:</Typography>
                                                    <Typography fontWeight="600" color="text.primary">{pendingTransaction.payload.receiverId}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                                                    <Typography color="text.secondary">Amount:</Typography>
                                                    <Typography fontWeight="600" color="text.primary">₹{pendingTransaction.payload.amount.toFixed(2)}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                                                    <Typography color="text.secondary">Your Balance:</Typography>
                                                    <Typography fontWeight="600" color="text.primary">₹{user.balance.toFixed(2)}</Typography>
                                                </Box>
                                                <Divider sx={{ my: 1 }} />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                                                    <Typography color="text.secondary" fontWeight="600">Balance After:</Typography>
                                                    <Typography fontWeight="700" color={(user.balance - pendingTransaction.payload.amount) < 0 ? 'error.main' : 'success.main'}>
                                                        ₹{(user.balance - pendingTransaction.payload.amount).toFixed(2)}
                                                    </Typography>
                                                </Box>
                                    </>
                                )}

                                {pendingTransaction.type === 'topup' && (
                                    <>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                                                    <Typography color="text.secondary">Top-Up Amount:</Typography>
                                                    <Typography fontWeight="600" color="text.primary">₹{pendingTransaction.payload.amount.toFixed(2)}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                                                    <Typography color="text.secondary">Current Balance:</Typography>
                                                    <Typography fontWeight="600" color="text.primary">₹{user.balance.toFixed(2)}</Typography>
                                                </Box>
                                                <Divider sx={{ my: 1 }} />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                                                    <Typography color="text.secondary" fontWeight="600">Balance After:</Typography>
                                                    <Typography fontWeight="700" color="success.main">₹{(user.balance + pendingTransaction.payload.amount).toFixed(2)}</Typography>
                                                </Box>
                                    </>
                                )}
                                {/* ... existing send/topup views ... */}

                                {pendingTransaction.type === 'bulk_csv' && (
                                    <>
                                        <Box sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText', borderRadius: 1, mb: 2 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Warning fontSize="small" /> WARNING
                                            </Typography>
                                            <Typography variant="body2">
                                                You are about to send <b>₹{pendingTransaction.payload.totalAmount.toFixed(2)}</b> to <b>{pendingTransaction.payload.count}</b> users.
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                                            <Typography color="text.secondary">Total Amount:</Typography>
                                            <Typography fontWeight="600" color="text.primary">₹{pendingTransaction.payload.totalAmount.toFixed(2)}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                                            <Typography color="text.secondary">Your Balance:</Typography>
                                            <Typography fontWeight="600" color="text.primary">₹{user.balance.toFixed(2)}</Typography>
                                        </Box>
                                        <Divider sx={{ my: 1 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                                            <Typography color="text.secondary" fontWeight="600">Balance After:</Typography>
                                            <Typography fontWeight="700" color={(user.balance - pendingTransaction.payload.totalAmount) < 0 ? 'error.main' : 'success.main'}>
                                                ₹{(user.balance - pendingTransaction.payload.totalAmount).toFixed(2)}
                                            </Typography>
                                        </Box>
                                    </>
                                )}

                                {pendingTransaction.type === 'group' && (
                                    <>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                                                    <Typography color="text.secondary">Recipients:</Typography>
                                                    <Typography fontWeight="600" color="text.primary">{pendingTransaction.payload.recipients.length}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                                                    <Typography color="text.secondary">Total Amount:</Typography>
                                                    <Typography fontWeight="600" color="text.primary">₹{pendingTransaction.payload.recipients.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                                                    <Typography color="text.secondary">Your Balance:</Typography>
                                                    <Typography fontWeight="600" color="text.primary">₹{user.balance.toFixed(2)}</Typography>
                                                </Box>
                                                <Divider sx={{ my: 1 }} />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                                                    <Typography color="text.secondary" fontWeight="600">Balance After:</Typography>
                                                    <Typography fontWeight="700" color="success.main">₹{(user.balance - pendingTransaction.payload.recipients.reduce((sum, r) => sum + r.amount, 0)).toFixed(2)}</Typography>
                                                </Box>
                                    </>
                                )}
                            </Box>
                        )}


                            <Typography variant="h6" component="h2" gutterBottom>Enter S-Pin to Confirm</Typography>
                            <Box component="form" onSubmit={handleConfirmTransaction}>
                                <TextField
                                    label="S-Pin" type={showSPin ? 'text' : 'password'} fullWidth required autoFocus
                                    value={sPin} onChange={(e) => setSPin(e.target.value)}
                                    inputProps={{ maxLength: 4, inputMode: 'numeric', pattern: '[0-9]*' }}
                                    sx={{ mb: 2 }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={handleClickShowSPin} onMouseDown={handleMouseDownSPin} edge="end">
                                                    {showSPin ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Button type="submit" variant="contained" fullWidth size="large">Confirm & Pay</Button>
                                {message && <Typography sx={{ mt: 2, color: messageType === 'error' ? 'error.main' : messageType === 'success' ? 'success.main' : 'text.secondary' }}>{message}</Typography>}
                            </Box>
                        </>
                    )}
                </Box>
            </Modal>
            {/* CSV Bulk Send Modal */}
            <Modal open={csvModalOpen} onClose={handleCsvModalClose}>
                <Box sx={modalStyle}>
                    <Typography variant="h6" gutterBottom>Bulk Send via CSV</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Upload a CSV with format: <b>UserId, Amount</b>
                    </Typography>
                    
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUploadIcon />}
                        fullWidth
                        sx={{ mb: 2 }}
                    >
                        Upload File
                        <input type="file" hidden accept=".csv" onChange={handleCsvUpload} />
                    </Button>
                    
                    {csvFile && <Typography variant="caption" display="block" sx={{ mb: 2 }}>Selected: {csvFile.name}</Typography>}
                    
                    {csvRecipients.length > 0 && (
                        <Paper sx={{ p: 2, bgcolor: 'background.default', mb: 2 }}>
                            <Typography variant="subtitle2">Summary:</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Typography>Total Users:</Typography>
                                <Typography fontWeight="bold">{csvSummary.count}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography>Total Amount:</Typography>
                                <Typography fontWeight="bold" color="primary">₹{csvSummary.totalAmount.toFixed(2)}</Typography>
                            </Box>
                        </Paper>
                    )}

                    {csvRecipients.length > 0 && (
                         <Button variant="contained" color="primary" fullWidth onClick={handleSendBulkCsv}>
                            Proceed to Verify
                         </Button>
                    )}
                    
                    {message && (
                        <Typography sx={{ mt: 2, color: messageType === 'error' ? 'error.main' : 'text.secondary' }}>
                            {message}
                        </Typography>
                    )}
                </Box>
            </Modal>

            <Button variant="outlined" color="error" onClick={handleLogout} sx={{ mt: 4 }} fullWidth>Logout</Button>
            <ResetBalancesModal open={resetModalOpen} onClose={handleResetModalClose} onSuccess={handleResetSuccess} />

        </Container>
    );
};
     
export default DashboardPage;