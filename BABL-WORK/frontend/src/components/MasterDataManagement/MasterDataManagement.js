import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Grid,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Checkbox,
} from '@mui/material';
import {
  CloudUpload,
  Refresh,
  Search,
  Clear,
  Upload as UploadIcon,
  Edit,
  Save,
  Cancel,
  Delete,
  Add,
  Download,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import api, { masterDataAPI, generatorAPI } from '../../services/api';

function MasterDataManagement() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [allMasterData, setAllMasterData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchingAll, setFetchingAll] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({
    pharmacy_id: '',
    pharmacy_names: '',
    product_names: '',
    product_id: '',
    product_price: '',
    doctor_names: '',
    doctor_id: '',
    rep_names: '',
    hq: '',
    area: '',
  });
  const [uniqueValues, setUniqueValues] = useState({
    pharmacy_ids: [],
    pharmacy_names: [],
    product_names: [],
    product_ids: [],
    doctor_names: [],
    doctor_ids: [],
    rep_names: [],
    hqs: [],
    areas: [],
  });
  const [mappings, setMappings] = useState({
    pharmacy_id_to_name: {},
    pharmacy_name_to_id: {},
    product_name_to_id: {},
    product_id_to_name: {},
    doctor_name_to_id: {},
    doctor_id_to_name: {},
  });
  const [loadingUniqueValues, setLoadingUniqueValues] = useState(false);
  const [selectedMasterRecords, setSelectedMasterRecords] = useState(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Fetch all data for search (with pagination if needed)
  const fetchAllMasterData = useCallback(async () => {
    setFetchingAll(true);
    setError(null);
    try {
      let allData = [];
      let skip = 0;
      let hasMore = true;

      // Fetch all data in batches
      while (hasMore) {
        const response = await masterDataAPI.getMasterData(skip, 1000);
        allData = [...allData, ...response.data.data];
        skip += 1000;
        hasMore = response.data.data.length === 1000 && allData.length < response.data.total;
      }

      setAllMasterData(allData);
      setTotal(allData.length);
    } catch (err) {
      setError('Failed to fetch master data');
      console.error('Error fetching master data:', err);
    } finally {
      setFetchingAll(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllMasterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Smart search function - searches across all fields
  const searchInData = useCallback((data, query) => {
    if (!query.trim()) return data;

    const lowerQuery = query.toLowerCase().trim();
    const queryTerms = lowerQuery.split(/\s+/).filter(term => term.length > 0);

    return data.filter((row) => {
      // Create a searchable string from all fields
      const searchableText = [
        row.pharmacy_id || '',
        row.pharmacy_names || '',
        row.product_names || '',
        row.product_id || '',
        row.product_price?.toString() || '',
        row.doctor_names || '',
        row.doctor_id || '',
        row.rep_names || '',
        row.hq || '',
        row.area || '',
      ]
        .join(' ')
        .toLowerCase();

      // Check if all query terms are found in the searchable text
      return queryTerms.every(term => searchableText.includes(term));
    });
  }, []);

  // Filtered and paginated data
  const filteredData = useMemo(() => {
    return searchInData(allMasterData, searchQuery);
  }, [allMasterData, searchQuery, searchInData]);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredData.slice(startIndex, startIndex + limit);
  }, [filteredData, page, limit]);

  // Highlight matching text
  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} style={{ backgroundColor: '#ffeb3b', padding: '2px 0' }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Edit functions
  const handleEdit = (row) => {
    setEditingId(row.id);
    setEditData({
      pharmacy_id: row.pharmacy_id || '',
      pharmacy_names: row.pharmacy_names || '',
      product_names: row.product_names || '',
      product_id: row.product_id || '',
      product_price: row.product_price || '',
      doctor_names: row.doctor_names || '',
      doctor_id: row.doctor_id || '',
      rep_names: row.rep_names || '',
      hq: row.hq || '',
      area: row.area || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSaveEdit = async (recordId) => {
    setSaving(true);
    setError(null);
    try {
      const updateData = {};
      
      // Only include changed fields
      Object.keys(editData).forEach(key => {
        if (editData[key] !== undefined && editData[key] !== null) {
          updateData[key] = editData[key];
        }
      });

      const response = await masterDataAPI.updateMasterData(recordId, updateData);
      
      // Update the local state
      setAllMasterData(prevData =>
        prevData.map(item =>
          item.id === recordId ? response.data : item
        )
      );

      setSuccess('Record updated successfully!');
      setEditingId(null);
      setEditData({});
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update record');
      console.error('Error updating record:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await masterDataAPI.deleteMasterData(recordId);
      
      // Remove from local state
      setAllMasterData(prevData => prevData.filter(item => item.id !== recordId));
      setTotal(prev => prev - 1);

      setSuccess('Record deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete record');
      console.error('Error deleting record:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMasterRecords.size === 0) {
      setError('Please select at least one record');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${selectedMasterRecords.size} record(s)? This action cannot be undone.`)) {
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const response = await masterDataAPI.bulkDeleteMasterData(Array.from(selectedMasterRecords));
      setSuccess(response.data.message || `Successfully deleted ${response.data.success_count} record(s)`);
      if (response.data.errors && response.data.errors.length > 0) {
        setError(`Some records failed: ${response.data.errors.join(', ')}`);
      }
      setSelectedMasterRecords(new Set());
      setBulkDeleteDialogOpen(false);
      fetchAllMasterData();
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to bulk delete records');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddNew = async () => {
    setNewRecord({
      pharmacy_id: '',
      pharmacy_names: '',
      product_names: '',
      product_id: '',
      product_price: '',
      doctor_names: '',
      doctor_id: '',
      rep_names: '',
      hq: '',
      area: '',
    });
    setError(null);
    setAddDialogOpen(true);
    
    // Fetch unique values for dropdowns
    setLoadingUniqueValues(true);
    try {
      const response = await masterDataAPI.getUniqueValues();
      setUniqueValues(response.data);
      if (response.data.mappings) {
        setMappings(response.data.mappings);
      }
    } catch (err) {
      console.error('Error fetching unique values:', err);
      // Continue anyway - user can still type manually
    } finally {
      setLoadingUniqueValues(false);
    }
  };

  // Auto-fill handlers
  const handlePharmacyNameChange = async (newValue) => {
    handleNewRecordChange('pharmacy_names', newValue || '');
    // Auto-fill pharmacy ID if mapping exists
    if (newValue && mappings.pharmacy_name_to_id[newValue]) {
      handleNewRecordChange('pharmacy_id', mappings.pharmacy_name_to_id[newValue]);
    }
    // Also try to generate pharmacy ID from API
    if (newValue && newValue.trim()) {
      try {
        const response = await generatorAPI.generateId(newValue.trim(), 'pharmacy');
        if (response.data && response.data.generated_id) {
          handleNewRecordChange('pharmacy_id', response.data.generated_id);
        }
      } catch (error) {
        // Silently fail - user can enter manually
        console.debug('Could not auto-generate pharmacy ID:', error);
      }
    }
  };

  const handlePharmacyIdChange = (newValue) => {
    handleNewRecordChange('pharmacy_id', newValue || '');
    // Auto-fill pharmacy name if mapping exists
    if (newValue && mappings.pharmacy_id_to_name[newValue]) {
      handleNewRecordChange('pharmacy_names', mappings.pharmacy_id_to_name[newValue]);
    }
  };

  const handleProductNameChange = async (newValue) => {
    handleNewRecordChange('product_names', newValue || '');
    // Auto-fill product ID if mapping exists
    if (newValue && mappings.product_name_to_id[newValue]) {
      handleNewRecordChange('product_id', mappings.product_name_to_id[newValue]);
    }
    // Also try to get product ID and price from API
    if (newValue && newValue.trim()) {
      try {
        const response = await generatorAPI.generateId(newValue.trim(), 'product');
        if (response.data && response.data.generated_id) {
          handleNewRecordChange('product_id', response.data.generated_id);
          // Auto-populate price if available in metadata
          if (response.data.metadata && response.data.metadata.price) {
            handleNewRecordChange('product_price', response.data.metadata.price.toString());
          }
        }
      } catch (error) {
        // Silently fail - user can enter manually
        console.debug('Could not auto-generate product ID/price:', error);
      }
    }
  };

  const handleProductIdChange = (newValue) => {
    handleNewRecordChange('product_id', newValue || '');
    // Auto-fill product name if mapping exists
    if (newValue && mappings.product_id_to_name[newValue]) {
      handleNewRecordChange('product_names', mappings.product_id_to_name[newValue]);
    }
  };

  const handleDoctorNameChange = async (newValue) => {
    handleNewRecordChange('doctor_names', newValue || '');
    // Auto-fill doctor ID if mapping exists
    if (newValue && mappings.doctor_name_to_id[newValue]) {
      handleNewRecordChange('doctor_id', mappings.doctor_name_to_id[newValue]);
    }
    // Also try to generate doctor ID from API
    if (newValue && newValue.trim()) {
      try {
        const response = await generatorAPI.generateId(newValue.trim(), 'doctor');
        if (response.data && response.data.generated_id) {
          handleNewRecordChange('doctor_id', response.data.generated_id);
        }
      } catch (error) {
        // Silently fail - user can enter manually
        console.debug('Could not auto-generate doctor ID:', error);
      }
    }
  };

  const handleDoctorIdChange = (newValue) => {
    handleNewRecordChange('doctor_id', newValue || '');
    // Auto-fill doctor name if mapping exists
    if (newValue && mappings.doctor_id_to_name[newValue]) {
      handleNewRecordChange('doctor_names', mappings.doctor_id_to_name[newValue]);
    }
  };

  // Refs for debounce timeouts
  const pharmacyIdTimeoutRef = useRef(null);
  const doctorIdTimeoutRef = useRef(null);
  const productIdTimeoutRef = useRef(null);

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setNewRecord({
      pharmacy_id: '',
      pharmacy_names: '',
      product_names: '',
      product_id: '',
      product_price: '',
      doctor_names: '',
      doctor_id: '',
      rep_names: '',
      hq: '',
      area: '',
    });
    setError(null);
  };

  const handleSaveNew = async () => {
    // Validate required fields
    if (!newRecord.pharmacy_id || !newRecord.pharmacy_names) {
      setError('Pharmacy ID and Pharmacy Name are required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const recordData = {
        pharmacy_id: newRecord.pharmacy_id,
        pharmacy_names: newRecord.pharmacy_names,
        product_names: newRecord.product_names || null,
        product_id: newRecord.product_id || null,
        product_price: newRecord.product_price ? parseFloat(newRecord.product_price) : null,
        doctor_names: newRecord.doctor_names || null,
        doctor_id: newRecord.doctor_id || null,
        rep_names: newRecord.rep_names || null,
        hq: newRecord.hq || null,
        area: newRecord.area || null,
      };

      const response = await masterDataAPI.createMasterData(recordData);
      
      // Add to local state
      setAllMasterData(prevData => [response.data, ...prevData]);
      setTotal(prev => prev + 1);

      setSuccess('New record created successfully!');
      setAddDialogOpen(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create record');
      console.error('Error creating record:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleNewRecordChange = useCallback((field, value) => {
    setNewRecord(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Debounced handlers for ID generation (defined after handleNewRecordChange)
  const debouncedGeneratePharmacyId = useCallback((pharmacyName) => {
    if (pharmacyIdTimeoutRef.current) {
      clearTimeout(pharmacyIdTimeoutRef.current);
    }
    
    pharmacyIdTimeoutRef.current = setTimeout(async () => {
      if (!pharmacyName || !pharmacyName.trim()) return;
      
      // Skip if already exists in mappings
      if (mappings.pharmacy_name_to_id && mappings.pharmacy_name_to_id[pharmacyName]) {
        return;
      }
      
      try {
        const response = await generatorAPI.generateId(pharmacyName.trim(), 'pharmacy');
        if (response.data && response.data.generated_id) {
          handleNewRecordChange('pharmacy_id', response.data.generated_id);
        }
      } catch (error) {
        console.debug('Could not auto-generate pharmacy ID:', error);
      }
    }, 500);
  }, [mappings, handleNewRecordChange]);

  const debouncedGenerateDoctorId = useCallback((doctorName) => {
    if (doctorIdTimeoutRef.current) {
      clearTimeout(doctorIdTimeoutRef.current);
    }
    
    doctorIdTimeoutRef.current = setTimeout(async () => {
      if (!doctorName || !doctorName.trim()) return;
      
      // Skip if already exists in mappings
      if (mappings.doctor_name_to_id && mappings.doctor_name_to_id[doctorName]) {
        return;
      }
      
      try {
        const response = await generatorAPI.generateId(doctorName.trim(), 'doctor');
        if (response.data && response.data.generated_id) {
          handleNewRecordChange('doctor_id', response.data.generated_id);
        }
      } catch (error) {
        console.debug('Could not auto-generate doctor ID:', error);
      }
    }, 500);
  }, [mappings, handleNewRecordChange]);

  const debouncedGenerateProductIdAndPrice = useCallback((productName) => {
    if (productIdTimeoutRef.current) {
      clearTimeout(productIdTimeoutRef.current);
    }
    
    productIdTimeoutRef.current = setTimeout(async () => {
      if (!productName || !productName.trim()) return;
      
      // Skip if already exists in mappings
      if (mappings.product_name_to_id && mappings.product_name_to_id[productName]) {
        return;
      }
      
      try {
        const response = await generatorAPI.generateId(productName.trim(), 'product');
        if (response.data && response.data.generated_id) {
          handleNewRecordChange('product_id', response.data.generated_id);
          // Auto-populate price if available in metadata
          if (response.data.metadata && response.data.metadata.price) {
            handleNewRecordChange('product_price', response.data.metadata.price.toString());
          }
        }
      } catch (error) {
        console.debug('Could not auto-generate product ID/price:', error);
      }
    }, 500);
  }, [mappings, handleNewRecordChange]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (pharmacyIdTimeoutRef.current) {
        clearTimeout(pharmacyIdTimeoutRef.current);
      }
      if (doctorIdTimeoutRef.current) {
        clearTimeout(doctorIdTimeoutRef.current);
      }
      if (productIdTimeoutRef.current) {
        clearTimeout(productIdTimeoutRef.current);
      }
    };
  }, []);

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploading(true);
      setError(null);
      setSuccess(null);

      try {
        const formData = new FormData();
        formData.append('file', file);

        // Don't set Content-Type manually - axios will set it automatically with boundary
        // Production FastAPI strictly validates multipart/form-data and requires the boundary parameter
        const response = await api.post('/api/v1/upload/master-only', formData, {
          timeout: 120000, // 2 minutes for large files
        });

        setSuccess(`Master file uploaded successfully! Processed ${response.data.rows_processed || 0} rows.`);
        
        // Refresh the master data list
        setTimeout(() => {
          fetchAllMasterData();
          setSearchQuery(''); // Clear search after upload
        }, 1000);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to upload master file');
        console.error('Error uploading master file:', err);
      } finally {
        setUploading(false);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
    disabled: uploading,
  });

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to first page when searching
  };

  const clearSearch = () => {
    setSearchQuery('');
    setPage(1);
  };

  const handleExportExcel = async () => {
    try {
      setError(null);
      const res = await masterDataAPI.exportExcel();
      const url = window.URL.createObjectURL(
        new Blob([res.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `master_data_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccess('Master data exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to export master data');
      console.error('Error exporting master data:', err);
    }
  };


  const EditableCell = ({ value, field, recordId, editing, onChange }) => {
    if (editing) {
      return (
        <TextField
          size="small"
          value={value || ''}
          onChange={(e) => onChange(field, e.target.value)}
          variant="outlined"
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '0.875rem',
            },
          }}
        />
      );
    }
    return <Typography variant="body2">{value || '-'}</Typography>;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Master Data Management
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Upload and manage master data files containing pharmacy, product, doctor, and rep mappings. Click edit to modify records.
      </Typography>

      {/* Upload Section */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <UploadIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Upload Master Data File
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddNew}
              disabled={saving || uploading}
            >
              Add New Record
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            Upload Excel files containing master data with pharmacy mappings, products, doctors, and reps.
          </Typography>

          <Card
            {...getRootProps()}
            sx={{
              p: 4,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              bgcolor: isDragActive ? 'action.hover' : 'background.paper',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1,
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: uploading ? 'grey.300' : 'primary.main',
                bgcolor: uploading ? 'background.paper' : 'action.hover',
                transform: uploading ? 'none' : 'translateY(-2px)',
              },
            }}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <CircularProgress sx={{ mb: 2 }} />
            ) : (
              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            )}
            <Typography variant="h6" gutterBottom>
              {uploading
                ? 'Uploading...'
                : isDragActive
                ? 'Drop the master file here...'
                : 'Drag & drop a master data file here, or click to select'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supports .xlsx and .xls files
            </Typography>
          </Card>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Master Data Display Section */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search across all fields (pharmacy, product, doctor, rep, HQ, area, IDs...)"
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="clear search"
                        onClick={clearSearch}
                        edge="end"
                        size="small"
                      >
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
                <Button
                  startIcon={<Download />}
                  onClick={handleExportExcel}
                  disabled={fetchingAll || loading || allMasterData.length === 0}
                  variant="contained"
                  color="primary"
                  sx={{ flex: 1 }}
                >
                  Export Excel
                </Button>
                <Button
                  startIcon={<Refresh />}
                  onClick={fetchAllMasterData}
                  disabled={fetchingAll || loading}
                  variant="outlined"
                  sx={{ flex: 1 }}
                >
                  {fetchingAll ? 'Refreshing...' : 'Refresh'}
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Search Results Info */}
          {searchQuery && (
            <Box sx={{ mb: 2 }}>
              <Chip
                label={`Found ${filteredData.length} result${filteredData.length !== 1 ? 's' : ''} for "${searchQuery}"`}
                color="primary"
                variant="outlined"
                onDelete={clearSearch}
                sx={{ mb: 1 }}
              />
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Master Data
              {searchQuery ? (
                <Chip
                  label={`${filteredData.length} of ${total} records`}
                  size="small"
                  sx={{ ml: 1 }}
                />
              ) : (
                <Chip
                  label={`${total} total records`}
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
          </Box>

          {fetchingAll || loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : allMasterData.length === 0 ? (
            <Alert severity="info">
              No master data found. Please upload a master data file.
            </Alert>
          ) : filteredData.length === 0 ? (
            <Alert severity="warning">
              No results found for "{searchQuery}". Try a different search term.
            </Alert>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '70vh' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"></TableCell>
                      <TableCell><strong>Source</strong></TableCell>
                      <TableCell><strong>Pharmacy Name</strong></TableCell>
                      <TableCell><strong>Pharmacy ID</strong></TableCell>
                      <TableCell><strong>Product Name</strong></TableCell>
                      <TableCell><strong>Product ID</strong></TableCell>
                      <TableCell><strong>Price</strong></TableCell>
                      <TableCell><strong>Doctor Name</strong></TableCell>
                      <TableCell><strong>Doctor ID</strong></TableCell>
                      <TableCell><strong>Rep Name</strong></TableCell>
                      <TableCell><strong>HQ</strong></TableCell>
                      <TableCell><strong>Area</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.map((row) => {
                      const isEditing = editingId === row.id;
                      const isManual = row.source === 'manual_mapping';
                      
                      return (
                        <TableRow key={row.id} hover selected={selectedMasterRecords.has(row.id)} sx={{ bgcolor: isEditing ? 'action.hover' : 'inherit' }}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedMasterRecords.has(row.id)}
                              onChange={() => {
                                const newSelected = new Set(selectedMasterRecords);
                                if (newSelected.has(row.id)) {
                                  newSelected.delete(row.id);
                                } else {
                                  newSelected.add(row.id);
                                }
                                setSelectedMasterRecords(newSelected);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={isManual ? 'Manual' : 'File Upload'}
                              color={isManual ? 'secondary' : 'default'}
                              size="small"
                              variant={isManual ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <EditableCell
                                value={editData.pharmacy_names}
                                field="pharmacy_names"
                                recordId={row.id}
                                editing={isEditing}
                                onChange={handleFieldChange}
                              />
                            ) : (
                              highlightText(row.pharmacy_names || '-', searchQuery)
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <EditableCell
                                value={editData.pharmacy_id}
                                field="pharmacy_id"
                                recordId={row.id}
                                editing={isEditing}
                                onChange={handleFieldChange}
                              />
                            ) : (
                              highlightText(row.pharmacy_id || '-', searchQuery)
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <EditableCell
                                value={editData.product_names}
                                field="product_names"
                                recordId={row.id}
                                editing={isEditing}
                                onChange={handleFieldChange}
                              />
                            ) : (
                              highlightText(row.product_names || '-', searchQuery)
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <EditableCell
                                value={editData.product_id}
                                field="product_id"
                                recordId={row.id}
                                editing={isEditing}
                                onChange={handleFieldChange}
                              />
                            ) : (
                              highlightText(row.product_id || '-', searchQuery)
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                type="number"
                                value={editData.product_price || ''}
                                onChange={(e) => handleFieldChange('product_price', parseFloat(e.target.value) || 0)}
                                variant="outlined"
                                inputProps={{ step: '0.01', min: '0' }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    fontSize: '0.875rem',
                                  },
                                }}
                              />
                            ) : (
                              <Typography variant="body2">
                                {row.product_price ? `₹${row.product_price.toFixed(2)}` : '-'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <EditableCell
                                value={editData.doctor_names}
                                field="doctor_names"
                                recordId={row.id}
                                editing={isEditing}
                                onChange={handleFieldChange}
                              />
                            ) : (
                              highlightText(row.doctor_names || '-', searchQuery)
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <EditableCell
                                value={editData.doctor_id}
                                field="doctor_id"
                                recordId={row.id}
                                editing={isEditing}
                                onChange={handleFieldChange}
                              />
                            ) : (
                              highlightText(row.doctor_id || '-', searchQuery)
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <EditableCell
                                value={editData.rep_names}
                                field="rep_names"
                                recordId={row.id}
                                editing={isEditing}
                                onChange={handleFieldChange}
                              />
                            ) : (
                              highlightText(row.rep_names || '-', searchQuery)
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <EditableCell
                                value={editData.hq}
                                field="hq"
                                recordId={row.id}
                                editing={isEditing}
                                onChange={handleFieldChange}
                              />
                            ) : (
                              highlightText(row.hq || '-', searchQuery)
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <EditableCell
                                value={editData.area}
                                field="area"
                                recordId={row.id}
                                editing={isEditing}
                                onChange={handleFieldChange}
                              />
                            ) : (
                              highlightText(row.area || '-', searchQuery)
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="Save">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleSaveEdit(row.id)}
                                    disabled={saving}
                                  >
                                    <Save fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Cancel">
                                  <IconButton
                                    size="small"
                                    color="default"
                                    onClick={handleCancelEdit}
                                    disabled={saving}
                                  >
                                    <Cancel fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            ) : (
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleEdit(row)}
                                    disabled={editingId !== null}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDelete(row.id)}
                                    disabled={editingId !== null || saving}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {filteredData.length > limit && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={Math.ceil(filteredData.length / limit)}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add New Record Dialog */}
      <Dialog open={addDialogOpen} onClose={handleCloseAddDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Add color="primary" />
            <Typography variant="h6">Add New Master Data Record</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {loadingUniqueValues && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={uniqueValues.pharmacy_ids || []}
                value={newRecord.pharmacy_id || null}
                onChange={(event, newValue) => {
                  // When selecting from dropdown, auto-fill related field
                  handlePharmacyIdChange(newValue);
                }}
                onInputChange={(event, newInputValue, reason) => {
                  // Only update on manual typing (not when selecting from dropdown)
                  if (reason === 'input') {
                    handleNewRecordChange('pharmacy_id', newInputValue || '');
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Pharmacy ID *"
                    variant="outlined"
                    required
                  />
                )}
                loading={loadingUniqueValues}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={uniqueValues.pharmacy_names || []}
                value={newRecord.pharmacy_names || null}
                onChange={(event, newValue) => {
                  // When selecting from dropdown, auto-fill related field
                  handlePharmacyNameChange(newValue);
                }}
                onInputChange={(event, newInputValue, reason) => {
                  // Update the field value
                  handleNewRecordChange('pharmacy_names', newInputValue || '');
                  
                  // Only generate ID on manual typing (not when selecting from dropdown)
                  if (reason === 'input' && newInputValue && newInputValue.trim()) {
                    // First check if it exists in mappings
                    if (mappings.pharmacy_name_to_id && mappings.pharmacy_name_to_id[newInputValue]) {
                      handleNewRecordChange('pharmacy_id', mappings.pharmacy_name_to_id[newInputValue]);
                    } else {
                      // Generate ID for new name
                      debouncedGeneratePharmacyId(newInputValue);
                    }
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Pharmacy Name *"
                    variant="outlined"
                    required
                  />
                )}
                loading={loadingUniqueValues}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={uniqueValues.product_names || []}
                value={newRecord.product_names || null}
                onChange={(event, newValue) => handleProductNameChange(newValue)}
                onInputChange={(event, newInputValue, reason) => {
                  // Update the field value
                  handleNewRecordChange('product_names', newInputValue || '');
                  
                  // Only generate ID/price on manual typing (not when selecting from dropdown)
                  if (reason === 'input' && newInputValue && newInputValue.trim()) {
                    // First check if it exists in mappings
                    if (mappings.product_name_to_id && mappings.product_name_to_id[newInputValue]) {
                      handleNewRecordChange('product_id', mappings.product_name_to_id[newInputValue]);
                    } else {
                      // Generate ID and price for new product name
                      debouncedGenerateProductIdAndPrice(newInputValue);
                    }
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Product Name"
                    variant="outlined"
                  />
                )}
                loading={loadingUniqueValues}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={uniqueValues.product_ids || []}
                value={newRecord.product_id || null}
                onChange={(event, newValue) => handleProductIdChange(newValue)}
                onInputChange={(event, newInputValue, reason) => {
                  if (reason === 'input') {
                    handleNewRecordChange('product_id', newInputValue || '');
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Product ID"
                    variant="outlined"
                  />
                )}
                loading={loadingUniqueValues}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Price"
                type="number"
                value={newRecord.product_price}
                onChange={(e) => handleNewRecordChange('product_price', e.target.value)}
                variant="outlined"
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={uniqueValues.doctor_names || []}
                value={newRecord.doctor_names || null}
                onChange={(event, newValue) => handleDoctorNameChange(newValue)}
                onInputChange={(event, newInputValue, reason) => {
                  // Update the field value
                  handleNewRecordChange('doctor_names', newInputValue || '');
                  
                  // Only generate ID on manual typing (not when selecting from dropdown)
                  if (reason === 'input' && newInputValue && newInputValue.trim()) {
                    // First check if it exists in mappings
                    if (mappings.doctor_name_to_id && mappings.doctor_name_to_id[newInputValue]) {
                      handleNewRecordChange('doctor_id', mappings.doctor_name_to_id[newInputValue]);
                    } else {
                      // Generate ID for new name
                      debouncedGenerateDoctorId(newInputValue);
                    }
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Doctor Name"
                    variant="outlined"
                  />
                )}
                loading={loadingUniqueValues}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={uniqueValues.doctor_ids || []}
                value={newRecord.doctor_id || null}
                onChange={(event, newValue) => handleDoctorIdChange(newValue)}
                onInputChange={(event, newInputValue, reason) => {
                  if (reason === 'input') {
                    handleNewRecordChange('doctor_id', newInputValue || '');
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Doctor ID"
                    variant="outlined"
                  />
                )}
                loading={loadingUniqueValues}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={uniqueValues.rep_names || []}
                value={newRecord.rep_names || null}
                onChange={(event, newValue) => handleNewRecordChange('rep_names', newValue || '')}
                onInputChange={(event, newInputValue) => handleNewRecordChange('rep_names', newInputValue || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Rep Name"
                    variant="outlined"
                  />
                )}
                loading={loadingUniqueValues}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={uniqueValues.hqs || []}
                value={newRecord.hq || null}
                onChange={(event, newValue) => handleNewRecordChange('hq', newValue || '')}
                onInputChange={(event, newInputValue) => handleNewRecordChange('hq', newInputValue || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="HQ"
                    variant="outlined"
                  />
                )}
                loading={loadingUniqueValues}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={uniqueValues.areas || []}
                value={newRecord.area || null}
                onChange={(event, newValue) => handleNewRecordChange('area', newValue || '')}
                onInputChange={(event, newInputValue) => handleNewRecordChange('area', newInputValue || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Area"
                    variant="outlined"
                  />
                )}
                loading={loadingUniqueValues}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSaveNew} variant="contained" disabled={saving}>
            {saving ? 'Creating...' : 'Create Record'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedMasterRecords.size} record(s)? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleBulkDelete}
            disabled={saving}
          >
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MasterDataManagement;
