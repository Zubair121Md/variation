import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Autocomplete,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { productVariationsAPI } from '../../services/api';

function ProductVariations() {
  const [variations, setVariations] = useState([]);
  const [canonicalNames, setCanonicalNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    canonical_product_name: '',
    variation_name: '',
  });

  useEffect(() => {
    fetchVariations();
    fetchCanonicalNames();
  }, []);

  const fetchVariations = async () => {
    try {
      setLoading(true);
      const response = await productVariationsAPI.getVariations();
      setVariations(response.data.variations || []);
    } catch (err) {
      setError('Failed to load product variations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCanonicalNames = async () => {
    try {
      const response = await productVariationsAPI.getCanonicalNames();
      setCanonicalNames(response.data.canonical_names || []);
    } catch (err) {
      console.error('Failed to load canonical names:', err);
    }
  };

  const handleOpenDialog = (variation = null) => {
    if (variation) {
      setEditingId(variation.id);
      setFormData({
        canonical_product_name: variation.canonical_product_name,
        variation_name: variation.variation_name,
      });
    } else {
      setEditingId(null);
      setFormData({
        canonical_product_name: '',
        variation_name: '',
      });
    }
    setOpenDialog(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setFormData({
      canonical_product_name: '',
      variation_name: '',
    });
    setError(null);
  };

  const handleSave = async () => {
    try {
      setError(null);
      setLoading(true);

      if (!formData.canonical_product_name || !formData.variation_name) {
        setError('Both canonical name and variation name are required');
        return;
      }

      if (editingId) {
        await productVariationsAPI.updateVariation(editingId, formData);
        setSuccess('Product variation updated successfully');
      } else {
        await productVariationsAPI.createVariation(formData);
        setSuccess('Product variation created successfully');
      }

      handleCloseDialog();
      fetchVariations();
      fetchCanonicalNames();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save product variation');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product variation?')) {
      return;
    }

    try {
      setLoading(true);
      await productVariationsAPI.deleteVariation(id);
      setSuccess('Product variation deleted successfully');
      fetchVariations();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete product variation');
    } finally {
      setLoading(false);
    }
  };

  // Group variations by canonical name
  const groupedVariations = variations.reduce((acc, variation) => {
    const canonical = variation.canonical_product_name;
    if (!acc[canonical]) {
      acc[canonical] = [];
    }
    acc[canonical].push(variation);
    return acc;
  }, {});

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Product Name Variations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Map different product name variations to canonical product names. 
            This ensures that variations like "BRETHNOL SP 100's" will match to "BRETHNOL SYP" automatically.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Variation
        </Button>
      </Box>

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

      {loading && variations.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : Object.keys(groupedVariations).length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              No product variations defined yet. Click "Add Variation" to create one.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedVariations).map(([canonical, vars]) => (
          <Card key={canonical} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  {canonical}
                </Typography>
                <Chip label={`${vars.length} variation${vars.length !== 1 ? 's' : ''}`} size="small" />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Variation Name</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vars.map((variation) => (
                      <TableRow key={variation.id}>
                        <TableCell>{variation.variation_name}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(variation)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(variation.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Product Variation' : 'Add Product Variation'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Box sx={{ pt: 2 }}>
            <Autocomplete
              freeSolo
              options={canonicalNames}
              value={formData.canonical_product_name}
              onInputChange={(event, newValue) => {
                setFormData({ ...formData, canonical_product_name: newValue });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Canonical Product Name"
                  placeholder="e.g., BRETHNOL SYP"
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                  helperText="The standard product name that variations will map to"
                />
              )}
            />
            <TextField
              fullWidth
              label="Variation Name"
              placeholder="e.g., BRETHNOL SP 100's, BRETHNOL SP"
              value={formData.variation_name}
              onChange={(e) => setFormData({ ...formData, variation_name: e.target.value })}
              required
              helperText="The product name variation that will be mapped to the canonical name"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading || !formData.canonical_product_name || !formData.variation_name}
          >
            {loading ? <CircularProgress size={20} /> : editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProductVariations;
