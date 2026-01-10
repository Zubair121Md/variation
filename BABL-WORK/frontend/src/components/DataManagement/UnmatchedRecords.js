import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Autocomplete,
  Checkbox,
} from '@mui/material';
import {
  Refresh,
  Map,
  Block,
  Search,
  FilterList,
  Delete,
  CheckBox,
  CheckBoxOutlineBlank,
} from '@mui/icons-material';
import { unmatchedAPI, masterDataAPI } from '../../services/api';

function UnmatchedRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [mappingData, setMappingData] = useState({
    master_pharmacy_id: '',
    master_product_name: '',
    doctor_names: '',
    doctor_id: '',
    rep_names: '',
    hq: '',
    area: '',
    notes: '',
  });
  const [pharmacyProducts, setPharmacyProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [uniqueValues, setUniqueValues] = useState({
    doctor_names: [],
    rep_names: [],
    hqs: [],
    areas: [],
  });
  const [loadingUniqueValues, setLoadingUniqueValues] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [masterPharmacies, setMasterPharmacies] = useState([]);
  const [pharmacySearchQuery, setPharmacySearchQuery] = useState('');
  const [filteredPharmacies, setFilteredPharmacies] = useState([]);
  // Load sort option from localStorage, default to 'created_desc' if not set
  const [sortOption, setSortOption] = useState(() => {
    const saved = localStorage.getItem('unmatchedRecordsSortOption');
    return saved || 'created_desc';
  });
  const [selectedRecords, setSelectedRecords] = useState(new Set());
  const [bulkMapDialogOpen, setBulkMapDialogOpen] = useState(false);
  const [bulkMasterPharmacyId, setBulkMasterPharmacyId] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    fetchUnmatchedRecords();
  }, []);

  // Save sort option to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('unmatchedRecordsSortOption', sortOption);
  }, [sortOption]);

  const fetchUnmatchedRecords = async () => {
    try {
      setLoading(true);
      const response = await unmatchedAPI.getUnmatchedRecords();
      setRecords(response.data);
    } catch (error) {
      setError('Failed to fetch unmatched records');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await unmatchedAPI.exportExcel();
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'unmatched_records.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.detail || 'Export failed');
    }
  };

  const fetchMasterPharmacies = async (query = '') => {
    try {
      const response = await unmatchedAPI.getMasterPharmacies(query);
      setMasterPharmacies(response.data);
      setFilteredPharmacies(response.data);
    } catch (error) {
      console.error('Failed to fetch master pharmacies:', error);
    }
  };

  useEffect(() => {
    if (openDialog) {
      // Filter pharmacies based on search query
      if (pharmacySearchQuery.trim() === '') {
        setFilteredPharmacies(masterPharmacies);
      } else {
        const filtered = masterPharmacies.filter(pharmacy =>
          (pharmacy.pharmacy_name || '').toLowerCase().includes(pharmacySearchQuery.toLowerCase()) ||
          (pharmacy.pharmacy_id || '').toLowerCase().includes(pharmacySearchQuery.toLowerCase())
        );
        setFilteredPharmacies(filtered);
      }
    }
  }, [pharmacySearchQuery, masterPharmacies, openDialog]);

  const fetchUniqueValues = async () => {
    try {
      setLoadingUniqueValues(true);
      const response = await masterDataAPI.getUniqueValues();
      setUniqueValues({
        doctor_names: response.data.doctor_names || [],
        rep_names: response.data.rep_names || [],
        hqs: response.data.hqs || [],
        areas: response.data.areas || [],
      });
    } catch (error) {
      console.error('Failed to fetch unique values:', error);
    } finally {
      setLoadingUniqueValues(false);
    }
  };

  const handleMapRecord = (record) => {
    setSelectedRecord(record);
    setMappingData({
      master_pharmacy_id: '',
      master_product_name: '',
      doctor_names: '',
      doctor_id: '',
      rep_names: '',
      hq: '',
      area: '',
      notes: '',
    });
    setPharmacySearchQuery('');
    setPharmacyProducts([]);
    fetchMasterPharmacies();
    fetchUniqueValues();
    setOpenDialog(true);
  };

  const fetchPharmacyProducts = async (pharmacyId) => {
    if (!pharmacyId) {
      setPharmacyProducts([]);
      return;
    }
    try {
      setLoadingProducts(true);
      const response = await unmatchedAPI.getPharmacyProducts(pharmacyId);
      setPharmacyProducts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch pharmacy products:', error);
      setPharmacyProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRecords(new Set(sortedRecords.map(r => r.id)));
    } else {
      setSelectedRecords(new Set());
    }
  };

  const handleSelectRecord = (recordId) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedRecords(newSelected);
  };

  const handleBulkMap = async () => {
    if (!bulkMasterPharmacyId) {
      setError('Please select a master pharmacy');
      return;
    }
    
    if (selectedRecords.size === 0) {
      setError('Please select at least one record');
      return;
    }
    
    setBulkProcessing(true);
    setError(null);
    
    try {
      const response = await unmatchedAPI.bulkMap(Array.from(selectedRecords), bulkMasterPharmacyId);
      setSuccess(response.data.message || `Successfully mapped ${response.data.success_count} record(s)`);
      if (response.data.errors && response.data.errors.length > 0) {
        setError(`Some records failed: ${response.data.errors.join(', ')}`);
      }
      setSelectedRecords(new Set());
      setBulkMapDialogOpen(false);
      setBulkMasterPharmacyId('');
      fetchUnmatchedRecords();
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to bulk map records');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkIgnore = async () => {
    if (selectedRecords.size === 0) {
      setError('Please select at least one record');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to ignore ${selectedRecords.size} record(s)?`)) {
      return;
    }
    
    setBulkProcessing(true);
    setError(null);
    
    try {
      const response = await unmatchedAPI.bulkIgnore(Array.from(selectedRecords));
      setSuccess(response.data.message || `Successfully ignored ${response.data.success_count} record(s)`);
      if (response.data.errors && response.data.errors.length > 0) {
        setError(`Some records failed: ${response.data.errors.join(', ')}`);
      }
      setSelectedRecords(new Set());
      fetchUnmatchedRecords();
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to bulk ignore records');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRecords.size === 0) {
      setError('Please select at least one record');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${selectedRecords.size} record(s)? This action cannot be undone.`)) {
      return;
    }
    
    setBulkProcessing(true);
    setError(null);
    
    try {
      const response = await unmatchedAPI.bulkDelete(Array.from(selectedRecords));
      setSuccess(response.data.message || `Successfully deleted ${response.data.success_count} record(s)`);
      if (response.data.errors && response.data.errors.length > 0) {
        setError(`Some records failed: ${response.data.errors.join(', ')}`);
      }
      setSelectedRecords(new Set());
      fetchUnmatchedRecords();
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to bulk delete records');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleIgnoreRecord = async (recordId) => {
    if (window.confirm('Are you sure you want to ignore this record?')) {
      try {
        await unmatchedAPI.ignoreRecord(recordId);
        fetchUnmatchedRecords();
      } catch (error) {
        setError('Failed to ignore record');
      }
    }
  };

  const handleMappingSubmit = async () => {
    if (!mappingData.master_pharmacy_id) {
      setError('Please select a master pharmacy');
      return;
    }
    
    // Product selection is optional - backend will try to match by product name if not provided
    // But we'll still send it if selected for better accuracy
    try {
      setError(null);
      const mappingBody = {
        master_pharmacy_id: mappingData.master_pharmacy_id,
      };
      if (mappingData.master_product_name) {
        mappingBody.master_product_name = mappingData.master_product_name;
      }
      if (mappingData.doctor_names) {
        mappingBody.doctor_names = mappingData.doctor_names;
      }
      if (mappingData.doctor_id) {
        mappingBody.doctor_id = mappingData.doctor_id;
      }
      if (mappingData.rep_names) {
        mappingBody.rep_names = mappingData.rep_names;
      }
      if (mappingData.hq) {
        mappingBody.hq = mappingData.hq;
      }
      if (mappingData.area) {
        mappingBody.area = mappingData.area;
      }
      await unmatchedAPI.mapRecord(selectedRecord.id, mappingBody);
      setOpenDialog(false);
      fetchUnmatchedRecords();
      setSuccess('Record mapped successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to map record');
      console.error('Mapping error:', error);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRecord(null);
    setMappingData({
      master_pharmacy_id: '',
      master_product_name: '',
      doctor_names: '',
      doctor_id: '',
      rep_names: '',
      hq: '',
      area: '',
      notes: '',
    });
    setPharmacySearchQuery('');
    setPharmacyProducts([]);
    setError(null);
  };

  const filteredRecords = records.filter(record => {
    const matchesFilter = filter === 'all' || record.status === filter;
    const matchesSearch = record.pharmacy_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sortedRecords = useMemo(() => {
    const recordsCopy = [...filteredRecords];
    const parseDate = (value) => {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    };

    switch (sortOption) {
      case 'name_asc':
        recordsCopy.sort((a, b) => a.pharmacy_name.localeCompare(b.pharmacy_name));
        break;
      case 'name_desc':
        recordsCopy.sort((a, b) => b.pharmacy_name.localeCompare(a.pharmacy_name));
        break;
      case 'quantity_desc':
        recordsCopy.sort((a, b) => (Number(b.quantity || 0) - Number(a.quantity || 0)));
        break;
      case 'quantity_asc':
        recordsCopy.sort((a, b) => (Number(a.quantity || 0) - Number(b.quantity || 0)));
        break;
      case 'revenue_desc':
        recordsCopy.sort((a, b) => (Number(b.amount || 0) - Number(a.amount || 0)));
        break;
      case 'revenue_asc':
        recordsCopy.sort((a, b) => (Number(a.amount || 0) - Number(b.amount || 0)));
        break;
      case 'created_asc':
        recordsCopy.sort((a, b) => parseDate(a.created_at) - parseDate(b.created_at));
        break;
      case 'created_desc':
      default:
        recordsCopy.sort((a, b) => parseDate(b.created_at) - parseDate(a.created_at));
        break;
    }

    return recordsCopy;
  }, [filteredRecords, sortOption]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'mapped':
        return 'success';
      case 'ignored':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading && !records.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Unmatched Records
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchUnmatchedRecords}
        >
          Refresh
        </Button>
      </Box>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        Review and manage pharmacy records that couldn't be automatically matched.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Box display="flex" gap={2} mb={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search pharmacy names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Filter</InputLabel>
              <Select
                value={filter}
                label="Filter"
                onChange={(e) => setFilter(e.target.value)}
              >
                <MenuItem value="all">All Records</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="mapped">Mapped</MenuItem>
                <MenuItem value="ignored">Ignored</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortOption}
                label="Sort By"
                onChange={(e) => setSortOption(e.target.value)}
              >
                <MenuItem value="created_desc">Newest first</MenuItem>
                <MenuItem value="created_asc">Oldest first</MenuItem>
                <MenuItem value="name_asc">Name A → Z</MenuItem>
                <MenuItem value="name_desc">Name Z → A</MenuItem>
                <MenuItem value="quantity_desc">Quantity high → low</MenuItem>
                <MenuItem value="quantity_asc">Quantity low → high</MenuItem>
                <MenuItem value="revenue_desc">Revenue high → low</MenuItem>
                <MenuItem value="revenue_asc">Revenue low → high</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper}>
            <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
              <Box display="flex" gap={1} alignItems="center">
                {selectedRecords.size > 0 && (
                  <>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                      {selectedRecords.size} selected
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<Map />}
                      onClick={() => {
                        fetchMasterPharmacies();
                        setBulkMapDialogOpen(true);
                      }}
                      disabled={bulkProcessing}
                    >
                      Bulk Map
                    </Button>
                    <Button
                      variant="outlined"
                      color="warning"
                      size="small"
                      startIcon={<Block />}
                      onClick={handleBulkIgnore}
                      disabled={bulkProcessing}
                    >
                      Bulk Ignore
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<Delete />}
                      onClick={handleBulkDelete}
                      disabled={bulkProcessing}
                    >
                      Bulk Delete
                    </Button>
                  </>
                )}
              </Box>
              <Button variant="outlined" onClick={handleExportExcel}>Export Excel</Button>
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedRecords.size > 0 && selectedRecords.size < sortedRecords.length}
                      checked={sortedRecords.length > 0 && selectedRecords.size === sortedRecords.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Pharmacy Name</TableCell>
                  <TableCell>Generated ID</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedRecords.map((record) => (
                  <TableRow key={record.id} selected={selectedRecords.has(record.id)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedRecords.has(record.id)}
                        onChange={() => handleSelectRecord(record.id)}
                      />
                    </TableCell>
                    <TableCell>{record.pharmacy_name}</TableCell>
                    <TableCell>{record.generated_id}</TableCell>
                    <TableCell>{record.product || '-'}</TableCell>
                    <TableCell align="right">{Number(record.quantity || 0)}</TableCell>
                    <TableCell align="right">{Number(record.amount || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={record.status}
                        color={getStatusColor(record.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(record.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Map to existing pharmacy">
                        <IconButton
                          size="small"
                          onClick={() => handleMapRecord(record)}
                          disabled={record.status === 'mapped'}
                        >
                          <Map />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ignore record">
                        <IconButton
                          size="small"
                          onClick={() => handleIgnoreRecord(record.id)}
                          disabled={record.status === 'ignored'}
                          color="error"
                        >
                          <Block />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredRecords.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                No unmatched records found
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Mapping Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Map Pharmacy Record
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {selectedRecord && (
            <Box>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Unmatched Record:</strong>
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Pharmacy: <strong>{selectedRecord.pharmacy_name}</strong>
                </Typography>
                {selectedRecord.product && (
                  <Typography variant="body2" gutterBottom>
                    Product: <strong>{selectedRecord.product}</strong>
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  Generated ID: {selectedRecord.generated_id}
                </Typography>
              </Box>
              
              <Autocomplete
                fullWidth
                sx={{ mt: 2 }}
                options={filteredPharmacies}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return `${option.pharmacy_name || ''} (${option.pharmacy_id || ''})`;
                }}
                value={masterPharmacies.find(p => p.pharmacy_id === mappingData.master_pharmacy_id) || null}
                onChange={(event, newValue) => {
                  const pharmacyId = newValue ? newValue.pharmacy_id : '';
                  setMappingData(prev => ({
                    ...prev,
                    master_pharmacy_id: pharmacyId,
                    master_product_name: '', // Reset product when pharmacy changes
                  }));
                  // Fetch products for selected pharmacy
                  fetchPharmacyProducts(pharmacyId);
                }}
                onInputChange={(event, newInputValue, reason) => {
                  setPharmacySearchQuery(newInputValue);
                  // Fetch pharmacies as user types
                  if (reason === 'input' && newInputValue.trim().length >= 2) {
                    fetchMasterPharmacies(newInputValue);
                  }
                }}
                inputValue={pharmacySearchQuery}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.pharmacy_id}>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {option.pharmacy_name || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {option.pharmacy_id || 'N/A'}
                        {option.area && ` • Area: ${option.area}`}
                        {option.hq && ` • HQ: ${option.hq}`}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Master Pharmacy to Map To"
                    placeholder="Type to search by pharmacy name or ID..."
                    variant="outlined"
                    required
                    helperText="Select an existing master pharmacy from the dropdown"
                  />
                )}
                noOptionsText="No pharmacies found. Try a different search term."
                loading={loading}
                filterOptions={(options, state) => {
                  // Filter by name or ID
                  const searchTerm = state.inputValue.toLowerCase();
                  if (!searchTerm) return options;
                  return options.filter(option =>
                    (option.pharmacy_name || '').toLowerCase().includes(searchTerm) ||
                    (option.pharmacy_id || '').toLowerCase().includes(searchTerm) ||
                    (option.area || '').toLowerCase().includes(searchTerm)
                  );
                }}
              />
              
              {/* Product Selection - Always visible */}
              <Autocomplete
                freeSolo
                fullWidth
                sx={{ mt: 2 }}
                options={mappingData.master_pharmacy_id ? pharmacyProducts : []}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return option.product_name || 'N/A';
                }}
                value={mappingData.master_product_name || null}
                onChange={(event, newValue) => {
                  // Handle both string (typed) and object (selected) values
                  const productName = typeof newValue === 'string' ? newValue : (newValue ? newValue.product_name : '');
                  setMappingData(prev => ({
                    ...prev,
                    master_product_name: productName,
                  }));
                }}
                onInputChange={(event, newInputValue, reason) => {
                  // Only update on user input, not on selection
                  if (reason === 'input' || reason === 'clear') {
                    setMappingData(prev => ({
                      ...prev,
                      master_product_name: newInputValue || '',
                    }));
                  }
                }}
                disabled={!mappingData.master_pharmacy_id}
                renderOption={(props, option) => {
                  if (typeof option === 'string') {
                    return <Box component="li" {...props} key={option}>{option}</Box>;
                  }
                  return (
                    <Box component="li" {...props} key={`${option.product_name}_${option.product_id}`}>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {option.product_name || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {option.product_id && `ID: ${option.product_id}`}
                          {option.product_price && ` • Price: ₹${option.product_price.toFixed(2)}`}
                          {option.doctor_name && ` • Doctor: ${option.doctor_name}`}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select or Type Product Name *"
                    placeholder={mappingData.master_pharmacy_id ? "Select from dropdown or type a new product name..." : "Select a pharmacy first to see products"}
                    variant="outlined"
                    required
                    helperText={selectedRecord?.product ? `Unmatched product: "${selectedRecord.product}" - Select existing or type new product name` : "Select the product to map this record to, or type a new product name"}
                  />
                )}
                noOptionsText={!mappingData.master_pharmacy_id ? "Select a pharmacy first" : (loadingProducts ? "Loading products..." : "No products found. Type to add a new product name")}
                loading={loadingProducts}
              />
              
              {/* Additional manual product input */}
              <TextField
                fullWidth
                sx={{ mt: 2 }}
                label="Or Type Product Name Manually"
                placeholder="Type any product name here..."
                variant="outlined"
                value={mappingData.master_product_name || ''}
                onChange={(e) => {
                  setMappingData(prev => ({
                    ...prev,
                    master_product_name: e.target.value,
                  }));
                }}
                helperText="You can also type the product name directly here"
              />
              
              {/* Doctor Selection */}
              <Autocomplete
                freeSolo
                fullWidth
                sx={{ mt: 2 }}
                options={uniqueValues.doctor_names}
                value={mappingData.doctor_names || null}
                onChange={(event, newValue) => {
                  const doctorName = typeof newValue === 'string' ? newValue : (newValue || '');
                  setMappingData(prev => ({
                    ...prev,
                    doctor_names: doctorName,
                  }));
                }}
                onInputChange={(event, newInputValue, reason) => {
                  if (reason === 'input' || reason === 'clear') {
                    setMappingData(prev => ({
                      ...prev,
                      doctor_names: newInputValue || '',
                    }));
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Doctor Name"
                    placeholder="Select or type doctor name..."
                    variant="outlined"
                    helperText="Optional: Select or type a doctor name"
                  />
                )}
                noOptionsText="Type to add a new doctor name"
                loading={loadingUniqueValues}
              />
              
              {/* Representative Selection */}
              <Autocomplete
                freeSolo
                fullWidth
                sx={{ mt: 2 }}
                options={uniqueValues.rep_names}
                value={mappingData.rep_names || null}
                onChange={(event, newValue) => {
                  const repName = typeof newValue === 'string' ? newValue : (newValue || '');
                  setMappingData(prev => ({
                    ...prev,
                    rep_names: repName,
                  }));
                }}
                onInputChange={(event, newInputValue, reason) => {
                  if (reason === 'input' || reason === 'clear') {
                    setMappingData(prev => ({
                      ...prev,
                      rep_names: newInputValue || '',
                    }));
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Representative Name"
                    placeholder="Select or type representative name..."
                    variant="outlined"
                    helperText="Optional: Select or type a representative name"
                  />
                )}
                noOptionsText="Type to add a new representative name"
                loading={loadingUniqueValues}
              />
              
              {/* HQ Selection */}
              <Autocomplete
                freeSolo
                fullWidth
                sx={{ mt: 2 }}
                options={uniqueValues.hqs}
                value={mappingData.hq || null}
                onChange={(event, newValue) => {
                  const hq = typeof newValue === 'string' ? newValue : (newValue || '');
                  setMappingData(prev => ({
                    ...prev,
                    hq: hq,
                  }));
                }}
                onInputChange={(event, newInputValue, reason) => {
                  if (reason === 'input' || reason === 'clear') {
                    setMappingData(prev => ({
                      ...prev,
                      hq: newInputValue || '',
                    }));
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="HQ"
                    placeholder="Select or type HQ..."
                    variant="outlined"
                    helperText="Optional: Select or type an HQ"
                  />
                )}
                noOptionsText="Type to add a new HQ"
                loading={loadingUniqueValues}
              />
              
              {/* Area Selection */}
              <Autocomplete
                freeSolo
                fullWidth
                sx={{ mt: 2 }}
                options={uniqueValues.areas}
                value={mappingData.area || null}
                onChange={(event, newValue) => {
                  const area = typeof newValue === 'string' ? newValue : (newValue || '');
                  setMappingData(prev => ({
                    ...prev,
                    area: area,
                  }));
                }}
                onInputChange={(event, newInputValue, reason) => {
                  if (reason === 'input' || reason === 'clear') {
                    setMappingData(prev => ({
                      ...prev,
                      area: newInputValue || '',
                    }));
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Area"
                    placeholder="Select or type area..."
                    variant="outlined"
                    helperText="Optional: Select or type an area"
                  />
                )}
                noOptionsText="Type to add a new area"
                loading={loadingUniqueValues}
              />
              
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={3}
                value={mappingData.notes}
                onChange={(e) => setMappingData({
                  ...mappingData,
                  notes: e.target.value,
                })}
                sx={{ mt: 2 }}
                placeholder="Add any notes about this mapping"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleMappingSubmit} variant="contained">
            Map Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Map Dialog */}
      <Dialog
        open={bulkMapDialogOpen}
        onClose={() => {
          setBulkMapDialogOpen(false);
          setBulkMasterPharmacyId('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Bulk Map {selectedRecords.size} Record(s)</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              fullWidth
              options={filteredPharmacies}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return `${option.pharmacy_name || ''} (${option.pharmacy_id || ''})`;
              }}
              value={masterPharmacies.find(p => p.pharmacy_id === bulkMasterPharmacyId) || null}
              onChange={(event, newValue) => {
                setBulkMasterPharmacyId(newValue ? newValue.pharmacy_id : '');
              }}
              onInputChange={(event, newInputValue, reason) => {
                setPharmacySearchQuery(newInputValue);
                // Fetch pharmacies as user types
                if (reason === 'input' && newInputValue.trim().length >= 2) {
                  fetchMasterPharmacies(newInputValue);
                }
              }}
              inputValue={pharmacySearchQuery}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.pharmacy_id}>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {option.pharmacy_name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {option.pharmacy_id || 'N/A'}
                      {option.area && ` • Area: ${option.area}`}
                      {option.hq && ` • HQ: ${option.hq}`}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Master Pharmacy to Map To"
                  variant="outlined"
                  placeholder="Type to search by pharmacy name or ID..."
                  required
                  helperText="Select an existing master pharmacy from the dropdown"
                />
              )}
              noOptionsText="No pharmacies found. Try a different search term."
              loading={loading}
              filterOptions={(options, state) => {
                // Filter by name or ID
                const searchTerm = state.inputValue.toLowerCase();
                if (!searchTerm) return options;
                return options.filter(option =>
                  (option.pharmacy_name || '').toLowerCase().includes(searchTerm) ||
                  (option.pharmacy_id || '').toLowerCase().includes(searchTerm) ||
                  (option.area || '').toLowerCase().includes(searchTerm)
                );
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setBulkMapDialogOpen(false);
            setBulkMasterPharmacyId('');
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleBulkMap}
            disabled={!bulkMasterPharmacyId || bulkProcessing}
          >
            {bulkProcessing ? 'Mapping...' : `Map ${selectedRecords.size} Record(s)`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UnmatchedRecords;

