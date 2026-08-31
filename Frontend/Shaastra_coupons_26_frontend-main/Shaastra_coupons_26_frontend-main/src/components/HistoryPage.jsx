// src/components/HistoryPage.jsx - WITH DOWNLOAD FEATURE FOR VENDORS
import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Divider,
    CircularProgress,
    Box,
    Button,
    Chip,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Pagination,
    InputAdornment
} from '@mui/material';
import { 
    CallReceived, 
    CallMade, 
    AddCard,
    ArrowBack,
    Search,
    FilterList,
    Warning,
    Download // ✅ NEW IMPORT
} from '@mui/icons-material';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const HistoryPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user, isAuthenticated } = useAuth();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTransactions, setTotalTransactions] = useState(0);

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [txType, setTxType] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const fetchTransactions = async () => {
        if (!isAuthenticated || !user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: 20
            };

            if (searchQuery) params.search = searchQuery;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (txType) params.type = txType;

            const historyRes = await api.get('/api/wallet/history', { params });
            
            setTransactions(historyRes.data.transactions || historyRes.data);
            
            if (historyRes.data.pagination) {
                setTotalPages(historyRes.data.pagination.totalPages);
                setTotalTransactions(historyRes.data.pagination.totalTransactions);
            } else {
                setTransactions(historyRes.data);
            }
            
            setError('');
        } catch (err) {
            setError('Failed to fetch transaction history.');
            console.error("HistoryPage fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [currentPage, user, isAuthenticated]);

    const handleApplyFilters = () => {
        setCurrentPage(1);
        fetchTransactions();
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setStartDate('');
        setEndDate('');
        setTxType('');
        setCurrentPage(1);
        setTimeout(fetchTransactions, 100);
    };

    // ✅ NEW: Download transactions as CSV
    const handleDownloadTransactions = async () => {
        try {
            const params = {};
            if (searchQuery) params.search = searchQuery;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (txType) params.type = txType;

            const response = await api.get('/api/wallet/history/download', {
                params,
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            const timestamp = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `Shaastra_Transactions_${user.userId}_${timestamp}.csv`);
            
            document.body.appendChild(link);
            link.click();
            
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Download error:', error);
            alert(error.response?.data?.message || 'Failed to download transactions.');
        }
    };

    const handlePageChange = (event, value) => {
        setCurrentPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading && transactions.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, pb: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    Please log in to view your transaction history.
                </Typography>
                <Button component={RouterLink} to="/login" variant="contained" sx={{ mt: 2 }}>
                    Go to Login
                </Button>
            </Container>
        );
    }

    if (error && transactions.length === 0) {
       return (
            <Container maxWidth="md" sx={{ mt: 4, pb: 4, textAlign: 'center' }}>
                <Typography color="error">{error}</Typography>
                 <Button component={RouterLink} to="/dashboard" variant="outlined" sx={{ mt: 2 }}>
                    Back to Dashboard
                </Button>
            </Container>
       );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, pb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button 
                    component={RouterLink} 
                    to="/dashboard" 
                    startIcon={<ArrowBack />}
                    sx={{ mr: 2 }}
                >
                    Back
                </Button>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700, flexGrow: 1 }}>
                    Transaction History
                </Typography>
                
                <Button 
                    variant="outlined" 
                    startIcon={<FilterList />}
                    onClick={() => setShowFilters(!showFilters)}
                    size="small"
                >
                    {showFilters ? 'Hide Filters' : 'Filters'}
                </Button>

                {/* ✅ NEW: Download Button - Only for Vendors */}
                {user && user.role === 'Vendor' && (
                    <Button 
                        variant="contained" 
                        startIcon={<Download />}
                        onClick={handleDownloadTransactions}
                        size="small"
                        color="success"
                        sx={{ ml: 1 }}
                    >
                        Download CSV
                    </Button>
                )}
            </Box>

            {showFilters && (
                <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>Search & Filter</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Search by name/ID"
                                fullWidth
                                size="small"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Enter name or user ID"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Transaction Type</InputLabel>
                                <Select
                                    value={txType}
                                    label="Transaction Type"
                                    onChange={(e) => setTxType(e.target.value)}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="sent">Sent</MenuItem>
                                    <MenuItem value="received">Received</MenuItem>
                                    <MenuItem value="topup">Top-Up</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="From Date & Time"
                                type="datetime-local"
                                fullWidth
                                size="small"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="To Date & Time"
                                type="datetime-local"
                                fullWidth
                                size="small"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button 
                                    variant="contained" 
                                    onClick={handleApplyFilters}
                                    fullWidth
                                >
                                    Apply Filters
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    onClick={handleClearFilters}
                                    fullWidth
                                >
                                    Clear All
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    {totalTransactions > 0 ? `Showing ${transactions.length} of ${totalTransactions} transactions` : 'No transactions found'}
                </Typography>
                {(searchQuery || startDate || endDate || txType) && (
                    <Chip 
                        label="Filtered" 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        onDelete={handleClearFilters}
                    />
                )}
            </Box>

            <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
                <List sx={{ p: 0 }}>
                    {transactions.length > 0 ? (
                        transactions.map((tx, index) => (
                            <React.Fragment key={tx.id}>
                                {(() => {
                                    const isTopUp = (tx.senderId === tx.receiverId) || (tx.senderUserId === 'FINANCE_TOPUP');
                                    const isSender = tx.senderUserId === user.userId;
                                    const isDebit = isSender && !isTopUp;
                                    const isAdminReset = tx.type === 'ADMIN_RESET' || tx.receiverUserId === 'ADMIN_RESET';

                                    let primaryText = '';
                                    let secondaryText = '';
                                    let IconComponent = null;
                                    let avatarColor = '';
                                    let amountColor = '';

                                    // ============================================
                                    // ✅ HANDLE ADMIN RESET DISPLAY
                                    // ============================================
                                    if (isAdminReset) {
                                        primaryText = 'Balance Reset by Admin';
                                        secondaryText = tx.metadata?.reason || 'Balance reset to ₹0.00';
                                        IconComponent = Warning;
                                        avatarColor = '#ff9800'; // Orange
                                        amountColor = '#ed6c02'; // Warning color
                                    } else if (isTopUp) {
                                        primaryText = 'Wallet Top-Up';
                                        secondaryText = 'Credit added to wallet';
                                        IconComponent = AddCard;
                                        avatarColor = '#7c4dff';
                                        amountColor = '#7c4dff';
                                    } else if (isDebit) {
                                        primaryText = `Sent to ${tx.receiverName}`;
                                        secondaryText = `ID: ${tx.receiverUserId}`;
                                        IconComponent = CallMade;
                                        avatarColor = '#ff5252';
                                        amountColor = '#d32f2f';
                                    } else {
                                        primaryText = `Received from ${tx.senderName}`;
                                        secondaryText = `ID: ${tx.senderUserId}`;
                                        IconComponent = CallReceived;
                                        avatarColor = '#4caf50';
                                        amountColor = '#2e7d32';
                                    }

                                    return (
                                        <ListItem sx={{ py: 2, '&:hover': { bgcolor: 'action.hover' } }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: avatarColor }}>
                                                    <IconComponent />
                                                </Avatar>
                                            </ListItemAvatar>
                                            
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="subtitle1" fontWeight="600">
                                                            {primaryText}
                                                        </Typography>
                                                        {isTopUp && (
                                                            <Chip 
                                                                label="TOP UP" 
                                                                size="small" 
                                                                sx={{ 
                                                                    height: 20, 
                                                                    fontSize: '0.65rem', 
                                                                    fontWeight: 'bold',
                                                                    bgcolor: '#ede7f6',
                                                                    color: '#673ab7'
                                                                }} 
                                                            />
                                                        )}
                                                        {isAdminReset && (
                                                            <Chip 
                                                                label="RESET" 
                                                                size="small" 
                                                                icon={<Warning sx={{ fontSize: '0.8rem !important' }} />}
                                                                sx={{ 
                                                                    height: 20, 
                                                                    fontSize: '0.65rem', 
                                                                    fontWeight: 'bold',
                                                                    bgcolor: '#fff3e0',
                                                                    color: '#e65100'
                                                                }} 
                                                            />
                                                        )}                             
                                                    </Box>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography variant="body2" component="span" display="block" color="text.secondary">
                                                            {secondaryText}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.disabled">
                                                            {new Date(tx.createdAt).toLocaleString('en-IN', {
                                                                month: 'short', day: 'numeric', 
                                                                hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                            
                                            <Typography
                                                variant="h6"
                                                sx={{ 
                                                    fontWeight: 'bold', 
                                                    color: amountColor,
                                                    minWidth: '80px',
                                                    textAlign: 'right'
                                                }}
                                            >
                                                {isDebit ? '-' : '+'}₹{parseFloat(String(tx.amount).replace(/[^0-9.-]/g, '')).toFixed(2)}
                                            </Typography>
                                        </ListItem>
                                    );
                                })()}
                                {index < transactions.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))
                    ) : (
                        <ListItem sx={{ py: 4, justifyContent: 'center' }}>
                            <ListItemText 
                                primary="No transactions found" 
                                secondary={
                                    (searchQuery || startDate || endDate || txType) 
                                        ? "Try adjusting your filters"
                                        : "Your activity will appear here"
                                }
                                sx={{ textAlign: 'center' }}
                            />
                        </ListItem>
                    )}
                </List>
            </Paper>

            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination 
                        count={totalPages} 
                        page={currentPage} 
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            )}

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            )}
        </Container>
    );
};

export default HistoryPage;