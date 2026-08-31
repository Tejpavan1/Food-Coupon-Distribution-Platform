// src/components/ResetBalancesModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Modal, Box, Typography, Button, Radio, RadioGroup,
  FormControlLabel, TextField, List, ListItem, Checkbox,
  Alert, CircularProgress, Divider, IconButton, InputAdornment,
  Chip, Paper, ListItemText
} from '@mui/material';
import {
  Warning, Upload, Close, Search, Visibility, VisibilityOff
} from '@mui/icons-material';
import api from '../api';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', sm: 600 },
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  borderRadius: 4,
  boxShadow: 24,
  p: 4,
  overflowY: 'auto'
};

const ResetBalancesModal = ({ open, onClose, onSuccess }) => {
  // State management
  const [step, setStep] = useState(1); // 1: Select, 2: Vendor List, 3: Confirm
  const [targetType, setTargetType] = useState('all');
  const [vendors, setVendors] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [csvUserIds, setCsvUserIds] = useState([]);
  const [sPin, setSPin] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSPin, setShowSPin] = useState(false);

  // Fetch vendors when modal opens
  useEffect(() => {
    if (open) {
      fetchVendors();
    }
  }, [open]);

  const fetchVendors = async () => {
    try {
      const response = await api.get('/api/user/by-role', { params: { role: 'Vendor' } });
      const vendorData = response.data.map(v => ({ ...v, selected: true }));
      setVendors(vendorData);
      setSelectedVendors(vendorData.map(v => v.userId));
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to fetch vendor list.');
    }
  };

  const handleTargetTypeChange = (e) => {
    setTargetType(e.target.value);
    setError('');
  };

  const handleVendorToggle = (userId) => {
    const newSelected = selectedVendors.includes(userId)
      ? selectedVendors.filter(id => id !== userId)
      : [...selectedVendors, userId];
    setSelectedVendors(newSelected);
  };

  const handleSelectAll = () => {
    const filtered = getFilteredVendors();
    const allIds = filtered.map(v => v.userId);
    setSelectedVendors(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedVendors([]);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Validate header
        const header = lines[0].toLowerCase().trim();
        if (header !== 'userid') {
          setError('Invalid CSV format. First row must contain "UserID" header.');
          setCsvFile(null);
          return;
        }
        
        // Extract and validate user IDs
        const userIds = lines.slice(1)
          .map(line => line.trim().toUpperCase())
          .filter(id => /^[A-Z]{2}\d{2}[A-Z]\d{3}$/.test(id));
        
        if (userIds.length === 0) {
          setError('No valid user IDs found in CSV.');
          setCsvFile(null);
          return;
        }
        
        setCsvUserIds(userIds);
        setError('');
      } catch (err) {
        setError('Error parsing CSV file.');
        setCsvFile(null);
      }
    };
    
    reader.readAsText(file);
  };

  const getFilteredVendors = () => {
    if (!searchQuery) return vendors;
    return vendors.filter(v => 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.userId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleNext = () => {
    if (targetType === 'vendors') {
      setStep(2);
    } else {
      setStep(3);
    }
  };

  const handleConfirm = async () => {
    if (!sPin || sPin.length !== 4) {
      setError('Please enter your 4-digit S-Pin.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let payload = {
        targetType,
        sPin,
        reason: reason || 'Balance reset by Finance Core'
      };

      if (targetType === 'vendors') {
        payload.userIds = selectedVendors;
      } else if (targetType === 'csv') {
        payload.userIds = csvUserIds;
      }

      const response = await api.post('/api/wallet/admin-reset-balances', payload);
      
      // Success!
      onSuccess(response.data);
      handleCloseModal();
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset balances.');
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setStep(1);
    setTargetType('all');
    setSelectedVendors([]);
    setCsvFile(null);
    setCsvUserIds([]);
    setSPin('');
    setReason('');
    setError('');
    setSearchQuery('');
    setLoading(false);
    onClose();
  };

  const getUserCount = () => {
    if (targetType === 'all') return 'All Users';
    if (targetType === 'vendors') return `${selectedVendors.length} Vendors`;
    if (targetType === 'csv') return `${csvUserIds.length} Users`;
    return '0';
  };

  return (
    <Modal open={open} onClose={handleCloseModal}>
      <Box sx={modalStyle}>
        <IconButton
          onClick={handleCloseModal}
          sx={{ position: 'absolute', right: 8, top: 8 }}
          disabled={loading}
        >
          <Close />
        </IconButton>

        {/* STEP 1: Selection Screen */}
        {step === 1 && (
          <>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              Reset User Balances to ₹0.00
            </Typography>

            <Alert severity="warning" sx={{ mb: 3 }}>
              <strong>WARNING:</strong> This will reset selected users' balances to zero.
              Transaction history will be preserved for audit purposes.
            </Alert>

            <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
              Select Target Group:
            </Typography>

            <RadioGroup value={targetType} onChange={handleTargetTypeChange}>
              <Paper sx={{ p: 2, mb: 2, border: targetType === 'all' ? '2px solid' : '1px solid', borderColor: targetType === 'all' ? 'primary.main' : 'divider' }}>
                <FormControlLabel
                  value="all"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        All Users (Except Finance Core)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        • Vendors, Cores, Heads, Coordinators, Volunteers
                      </Typography>
                    </Box>
                  }
                />
              </Paper>

              <Paper sx={{ p: 2, mb: 2, border: targetType === 'vendors' ? '2px solid' : '1px solid', borderColor: targetType === 'vendors' ? 'primary.main' : 'divider' }}>
                <FormControlLabel
                  value="vendors"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Vendors Only
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        • Select specific vendors from list
                      </Typography>
                      {vendors.length > 0 && (
                        <Chip label={`${vendors.length} vendors available`} size="small" sx={{ mt: 0.5 }} />
                      )}
                    </Box>
                  }
                />
              </Paper>

              <Paper sx={{ p: 2, mb: 2, border: targetType === 'csv' ? '2px solid' : '1px solid', borderColor: targetType === 'csv' ? 'primary.main' : 'divider' }}>
                <FormControlLabel
                  value="csv"
                  control={<Radio />}
                  label={
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Upload CSV (UserID column)
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        • CSV must have "UserID" as first column header
                      </Typography>
                      {targetType === 'csv' && (
                        <Button
                          component="label"
                          variant="outlined"
                          startIcon={<Upload />}
                          size="small"
                          sx={{ mt: 1 }}
                        >
                          Choose File
                          <input
                            type="file"
                            accept=".csv"
                            hidden
                            onChange={handleCSVUpload}
                          />
                        </Button>
                      )}
                      {csvFile && (
                        <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                          ✓ {csvFile.name} ({csvUserIds.length} valid IDs)
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </Paper>
            </RadioGroup>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button onClick={handleCloseModal} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={
                  loading ||
                  (targetType === 'csv' && csvUserIds.length === 0)
                }
              >
                Next →
              </Button>
            </Box>
          </>
        )}

        {/* STEP 2: Vendor Selection */}
        {step === 2 && (
          <>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
              Select Vendors to Reset
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {selectedVendors.length} of {vendors.length} selected
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={handleSelectAll}>Select All</Button>
                <Button size="small" onClick={handleDeselectAll}>Deselect All</Button>
              </Box>
            </Box>

            <TextField
              fullWidth
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ mb: 2 }}
            />

            <Paper sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid', borderColor: 'divider' }}>
              <List dense>
                {getFilteredVendors().map((vendor) => (
                  <ListItem
                    key={vendor.userId}
                    button
                    onClick={() => handleVendorToggle(vendor.userId)}
                  >
                    <Checkbox
                      checked={selectedVendors.includes(vendor.userId)}
                      tabIndex={-1}
                      disableRipple
                    />
                    <ListItemText
                      primary={vendor.name}
                      secondary={vendor.userId}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={() => setStep(1)} disabled={loading}>
                ← Back
              </Button>
              <Button
                variant="contained"
                onClick={() => setStep(3)}
                disabled={loading || selectedVendors.length === 0}
              >
                Confirm Selection
              </Button>
            </Box>
          </>
        )}

        {/* STEP 3: S-Pin Confirmation */}
        {step === 3 && (
          <>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              Confirm Balance Reset
            </Typography>

            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight={600}>
                You are about to reset balances for:
              </Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>
                {getUserCount()}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                This action cannot be undone.
              </Typography>
            </Alert>

            <TextField
              fullWidth
              label="S-Pin (4 digits)"
              type={showSPin ? 'text' : 'password'}
              value={sPin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 4) setSPin(value);
              }}
              inputProps={{ maxLength: 4, inputMode: 'numeric' }}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowSPin(!showSPin)} edge="end">
                      {showSPin ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Day 2 Reset - Jan 6, 2026"
              multiline
              rows={2}
              sx={{ mb: 3 }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setStep(targetType === 'vendors' ? 2 : 1)} disabled={loading}>
                ← Back
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleConfirm}
                disabled={loading || !sPin || sPin.length !== 4}
                startIcon={loading ? <CircularProgress size={20} /> : <Warning />}
              >
                {loading ? 'Resetting...' : 'Reset Balances'}
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default ResetBalancesModal;