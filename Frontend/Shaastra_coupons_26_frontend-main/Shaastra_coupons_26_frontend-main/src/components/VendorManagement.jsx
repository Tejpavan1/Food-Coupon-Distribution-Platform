// src/components/VendorManagement.jsx
// ✅ COMPLETE VERSION WITH DOWNLOAD FEATURE

import React, { useState } from 'react';
import {
  Container, Card, Typography, Box, TextField, Button, 
  CircularProgress, Alert, Paper, List, ListItem, 
  ListItemText, Divider, Grid, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, useTheme
} from '@mui/material';
import { 
  Search, Receipt, Download, TrendingUp, TrendingDown,
  AccountBalance, CalendarToday
} from '@mui/icons-material';
import api from '../api';

const VendorManagement = () => {
  const theme = useTheme();
  const [searchUserId, setSearchUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [statementData, setStatementData] = useState(null);
  const [activeView, setActiveView] = useState('search');

  const getQueryParams = () => {
    const params = {};
    if (startDate) params.startDate = new Date(startDate).toISOString();
    if (endDate) params.endDate = new Date(endDate).toISOString();
    return params;
  };

  const handleSearchTransactions = async () => {
    if (!searchUserId.trim()) {
      setError('Please enter a User ID');
      return;
    }

    setLoading(true);
    setError('');
    setUserData(null);
    setTransactions([]);

    try {
      const response = await api.get(`/api/vendor-management/user/${searchUserId.trim()}/transactions`, {
        params: getQueryParams()
      });
      
      setUserData(response.data.user);
      setTransactions(response.data.transactions);
      setActiveView('transactions');
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Download transactions for the searched user
  const handleDownloadTransactions = async () => {
    if (!searchUserId.trim() || !userData) {
      setError('Please search for a user first');
      return;
    }

    try {
      const response = await api.get(
        `/api/vendor-management/user/${searchUserId.trim()}/transactions/download`,
        {
          params: getQueryParams(),
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      const dateRangeText = (startDate && endDate) 
        ? `_${startDate.split('T')[0]}_to_${endDate.split('T')[0]}`
        : '_AllTime';
      
      link.setAttribute(
        'download', 
        `Transactions_${userData.userId}_${userData.name.replace(/\s+/g, '_')}${dateRangeText}_${timestamp}.csv`
      );
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download error:', error);
      setError(error.response?.data?.message || 'Failed to download transactions.');
    }
  };

  const handleGenerateStatement = async () => {
    if (!searchUserId.trim()) {
      setError('Please enter a User ID');
      return;
    }

    setLoading(true);
    setError('');
    setStatementData(null);

    try {
      const response = await api.get(`/api/vendor-management/user/${searchUserId.trim()}/statement`, {
        params: getQueryParams()
      });
      
      setStatementData(response.data);
      setActiveView('statement');
    } catch (err) {
      setError(err.response?.data?.message || 'Error generating statement');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!statementData) return;

    const printWindow = window.open('', '', 'height=800,width=1000');
    const html = generateStatementHTML(statementData, startDate, endDate);
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const generateStatementHTML = (data, start, end) => {
    const { user, summary, dateSummary, transactions } = data;
    
    const dateRangeText = (start && end) 
      ? `${new Date(start).toLocaleString('en-IN')} to ${new Date(end).toLocaleString('en-IN')}`
      : 'All Time';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Statement - ${user.name}</title>
        <style>
          @media print {
            body { margin: 0; }
            @page { margin: 1.5cm; }
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #1976d2;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo-text {
            font-size: 32px;
            font-weight: 800;
            color: #1976d2;
            margin: 0;
          }
          .subtitle {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
          }
          .user-info {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .user-info h3 {
            margin-top: 0;
            color: #1976d2;
            border-bottom: 2px solid #1976d2;
            padding-bottom: 10px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .info-item {
            padding: 8px 0;
          }
          .info-label {
            font-weight: 600;
            color: #666;
          }
          .summary-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
          }
          .summary-box h3 {
            margin-top: 0;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
          .summary-item {
            text-align: center;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
          }
          .summary-label {
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 5px;
          }
          .summary-value {
            font-size: 24px;
            font-weight: 700;
          }
          .net-positive { color: #4caf50; }
          .net-negative { color: #f44336; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background: #1976d2;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e0e0e0;
          }
          tr:hover {
            background: #f5f5f5;
          }
          .amount-received {
            color: #4caf50;
            font-weight: 600;
          }
          .amount-sent {
            color: #f44336;
            font-weight: 600;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            color: #666;
            font-size: 12px;
          }
          .period-badge {
            display: inline-block;
            background: #e3f2fd;
            color: #1565c0;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: bold;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="logo-text">SHAASTRA 2026</h1>
          <p class="subtitle">IIT Madras Technical Festival | Virtual Wallet Statement</p>
          <div class="period-badge">Statement Period: ${dateRangeText}</div>
          <p style="margin-top: 5px; font-size: 12px; color: #999;">
            Generated on: ${new Date().toLocaleString('en-IN')}
          </p>
        </div>

        <div class="user-info">
          <h3>User Details</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Name:</span> ${user.name}
            </div>
            <div class="info-item">
              <span class="info-label">User ID:</span> ${user.userId}
            </div>
            <div class="info-item">
              <span class="info-label">Role:</span> ${user.role}
            </div>
            <div class="info-item">
              <span class="info-label">Department:</span> ${user.department || 'N/A'}
            </div>
            <div class="info-item">
              <span class="info-label">Contact:</span> ${user.contact || 'N/A'}
            </div>
            <div class="info-item">
              <span class="info-label">Email:</span> ${user.smail || 'N/A'}
            </div>
          </div>
        </div>

        <div class="summary-box">
          <h3>Transaction Summary</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Received (in Period)</div>
              <div class="summary-value">₹${summary.totalReceived.toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Sent (in Period)</div>
              <div class="summary-value">₹${summary.totalSent.toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Net (in Period)</div>
              <div class="summary-value ${summary.netAmount >= 0 ? 'net-positive' : 'net-negative'}">
                ₹${summary.netAmount.toFixed(2)}
              </div>
            </div>
          </div>
          <div style="margin-top: 20px; text-align: center; font-size: 14px;">
            <span style="opacity: 0.9;">Current Wallet Balance:</span>
            <span style="font-size: 20px; font-weight: 700; margin-left: 10px;">
              ₹${user.balance.toFixed(2)}
            </span>
          </div>
        </div>

        <h3 style="color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">
          Date-wise Summary
        </h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Received</th>
              <th>Sent</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            ${dateSummary.map(ds => `
              <tr>
                <td>${ds.date}</td>
                <td class="amount-received">₹${ds.received.toFixed(2)}</td>
                <td class="amount-sent">₹${ds.sent.toFixed(2)}</td>
                <td class="${ds.net >= 0 ? 'amount-received' : 'amount-sent'}">
                  ₹${ds.net.toFixed(2)}
                </td>
              </tr>
            `).join('')}
            ${dateSummary.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No transactions found in this period.</td></tr>' : ''}
          </tbody>
        </table>

        <div style="page-break-after: always;"></div>

        <h3 style="color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">
          Transaction History (${transactions.length})
        </h3>
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Type</th>
              <th>From/To</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map(tx => {
              const isSender = tx.senderUserId === user.userId;
              const isTopUp = tx.senderUserId === tx.receiverUserId;
              
              let type = '';
              let counterparty = '';
              
              if (isTopUp) {
                type = 'Top-Up';
                counterparty = 'System';
              } else if (isSender) {
                type = 'Sent';
                counterparty = `${tx.receiverName} (${tx.receiverUserId})`;
              } else {
                type = 'Received';
                counterparty = `${tx.senderName} (${tx.senderUserId})`;
              }
              
              return `
                <tr>
                  <td>${new Date(tx.createdAt).toLocaleString('en-IN')}</td>
                  <td>${type}</td>
                  <td>${counterparty}</td>
                  <td class="${isSender && !isTopUp ? 'amount-sent' : 'amount-received'}">
                    ${isSender && !isTopUp ? '-' : '+'}₹${tx.amount.toFixed(2)}
                  </td>
                </tr>
              `;
            }).join('')}
            ${transactions.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No transactions found in this period.</td></tr>' : ''}
          </tbody>
        </table>

        <div class="footer">
          <p><strong>Shaastra 2026 - IIT Madras Technical Festival</strong></p>
          <p>This is a system-generated statement. For queries, contact the Finance Core team.</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, pb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
        Vendor & Transaction Management
      </Typography>

      <Card sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Search by User ID (Roll Number)"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              placeholder="e.g., CE23B073"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="From Date & Time"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="To Date & Time"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearchTransactions}
              disabled={loading}
              fullWidth
              sx={{ height: '100%' }}
            >
              View Transactions
            </Button>
          </Grid>
          
          {/* ✅ NEW: Download Button */}
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              color="success"
              startIcon={<Download />}
              onClick={handleDownloadTransactions}
              disabled={loading || !userData}
              fullWidth
              sx={{ height: '100%' }}
            >
              Download CSV
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              startIcon={<Receipt />}
              onClick={handleGenerateStatement}
              disabled={loading}
              fullWidth
              sx={{ height: '100%' }}
            >
              Generate Statement
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Card>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* VIEW 1: TRANSACTIONS LIST */}
      {activeView === 'transactions' && userData && (
        <>
          <Card sx={{ 
            p: 3, 
            mb: 3, 
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)'
              : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white' 
          }}>
            <Typography variant="h6" gutterBottom>User Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography><strong>Name:</strong> {userData.name}</Typography>
                <Typography><strong>User ID:</strong> {userData.userId}</Typography>
                <Typography><strong>Role:</strong> {userData.role}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography><strong>Department:</strong> {userData.department || 'N/A'}</Typography>
                <Typography><strong>Contact:</strong> {userData.contact || 'N/A'}</Typography>
                <Typography><strong>Balance:</strong> ₹{userData.balance.toFixed(2)}</Typography>
              </Grid>
            </Grid>
          </Card>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Transaction History ({transactions.length})
              </Typography>
              {(startDate || endDate) && (
                <Chip 
                  label="Filtered View" 
                  color="warning" 
                  size="small" 
                  variant="outlined"
                />
              )}
            </Box>
            
            <List>
              {transactions.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                  No transactions found for the selected criteria.
                </Typography>
              ) : (
                transactions.map((tx, index) => {
                  const isSender = tx.senderUserId === userData.userId;
                  const isTopUp = tx.senderUserId === tx.receiverUserId;
                  const isDebit = isSender && !isTopUp;

                  let primaryText = '';
                  if (isDebit) {
                    primaryText = `Sent to ${tx.receiverName} (${tx.receiverUserId})`;
                  } else if (isTopUp) {
                    primaryText = 'Wallet Top-Up';
                  } else {
                    primaryText = `Received from ${tx.senderName} (${tx.senderUserId})`;
                  }

                  return (
                    <React.Fragment key={tx.id}>
                      <ListItem>
                        <ListItemText
                          primary={primaryText}
                          secondary={new Date(tx.createdAt).toLocaleString('en-IN')}
                        />
                        <Chip
                          label={`${isDebit ? '-' : '+'}₹${tx.amount.toFixed(2)}`}
                          color={isDebit ? 'error' : 'success'}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </ListItem>
                      {index < transactions.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })
              )}
            </List>
          </Paper>
        </>
      )}

      {/* VIEW 2: STATEMENT */}
      {activeView === 'statement' && statementData && (
        <>
          <Card sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6">Account Statement</Typography>
                {(startDate || endDate) && (
                   <Typography variant="caption" color="text.secondary">
                     Period: {new Date(startDate).toLocaleString()} - {new Date(endDate).toLocaleString()}
                   </Typography>
                )}
              </Box>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleDownloadPDF}
                color="success"
              >
                Download PDF
              </Button>
            </Box>

            <Paper sx={{ 
              p: 2, 
              mb: 3, 
              bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50' 
            }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4}>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                  <Typography>{statementData.user.name}</Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="body2" color="text.secondary">User ID</Typography>
                  <Typography>{statementData.user.userId}</Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="body2" color="text.secondary">Role</Typography>
                  <Typography>{statementData.user.role}</Typography>
                </Grid>
              </Grid>
            </Paper>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUp />
                    <Typography variant="caption" sx={{ ml: 1 }}>Received (Period)</Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    ₹{statementData.summary.totalReceived.toFixed(2)}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ p: 2, bgcolor: 'error.light', color: 'white' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingDown />
                    <Typography variant="caption" sx={{ ml: 1 }}>Sent (Period)</Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    ₹{statementData.summary.totalSent.toFixed(2)}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  p: 2, 
                  bgcolor: statementData.summary.netAmount >= 0 ? 'success.main' : 'error.main',
                  color: 'white' 
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccountBalance />
                    <Typography variant="caption" sx={{ ml: 1 }}>Net (Period)</Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    ₹{statementData.summary.netAmount.toFixed(2)}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarToday />
                    <Typography variant="caption" sx={{ ml: 1 }}>Current Balance</Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    ₹{statementData.user.balance.toFixed(2)}
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Date-wise Summary
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Received</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Sent</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Net</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statementData.dateSummary.map((ds, index) => (
                    <TableRow key={index}>
                      <TableCell>{ds.date}</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                        ₹{ds.received.toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>
                        ₹{ds.sent.toFixed(2)}
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          color: ds.net >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 600 
                        }}
                      >
                        ₹{ds.net.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {statementData.dateSummary.length === 0 && (
                     <TableRow>
                       <TableCell colSpan={4} align="center">No activity in this period.</TableCell>
                     </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}
    </Container>
  );
};

export default VendorManagement;