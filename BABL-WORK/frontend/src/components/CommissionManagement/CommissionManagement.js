import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Calculate,
  Payment,
  Refresh,
} from '@mui/icons-material';
import { commissionAPI } from '../../services/api';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function CommissionManagement() {
  const [tabValue, setTabValue] = useState(0);
  const [rates, setRates] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Rate dialog
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [rateForm, setRateForm] = useState({
    entity_type: 'doctor',
    entity_id: '',
    entity_name: '',
    rate_type: 'percentage',
    rate_value: '',
    min_amount: '',
    max_amount: '',
    effective_from: '',
    effective_to: '',
    is_active: true,
  });
  
  // Calculate dialog
  const [calculateDialogOpen, setCalculateDialogOpen] = useState(false);
  const [calculationResults, setCalculationResults] = useState(null);
  const [calculationForm, setCalculationForm] = useState({
    entity_type: 'doctor',
    period_start: '',
    period_end: '',
  });
  
  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    entity_type: 'doctor',
    entity_id: '',
    entity_name: '',
    period_start: '',
    period_end: '',
    total_revenue: '',
    commission_rate: '',
    commission_amount: '',
    payment_status: 'pending',
    payment_date: '',
    payment_reference: '',
    notes: '',
  });

  useEffect(() => {
    fetchRates();
    fetchPayments();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const response = await commissionAPI.getRates();
      setRates(response.data.rates || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch commission rates');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await commissionAPI.getPayments();
      setPayments(response.data.payments || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch commission payments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRate = () => {
    setEditingRate(null);
    setRateForm({
      entity_type: 'doctor',
      entity_id: '',
      entity_name: '',
      rate_type: 'percentage',
      rate_value: '',
      min_amount: '',
      max_amount: '',
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: '',
      is_active: true,
    });
    setRateDialogOpen(true);
  };

  const handleEditRate = (rate) => {
    setEditingRate(rate);
    setRateForm({
      entity_type: rate.entity_type,
      entity_id: rate.entity_id || '',
      entity_name: rate.entity_name || '',
      rate_type: rate.rate_type,
      rate_value: rate.rate_value,
      min_amount: rate.min_amount || '',
      max_amount: rate.max_amount || '',
      effective_from: rate.effective_from ? rate.effective_from.split('T')[0] : '',
      effective_to: rate.effective_to ? rate.effective_to.split('T')[0] : '',
      is_active: rate.is_active,
    });
    setRateDialogOpen(true);
  };

  const handleSaveRate = async () => {
    try {
      setError(null);
      const data = {
        ...rateForm,
        rate_value: parseFloat(rateForm.rate_value),
        min_amount: rateForm.min_amount ? parseFloat(rateForm.min_amount) : null,
        max_amount: rateForm.max_amount ? parseFloat(rateForm.max_amount) : null,
        effective_from: rateForm.effective_from,
        effective_to: rateForm.effective_to || null,
      };
      
      if (editingRate) {
        await commissionAPI.updateRate(editingRate.id, data);
        setSuccess('Commission rate updated successfully');
      } else {
        await commissionAPI.createRate(data);
        setSuccess('Commission rate created successfully');
      }
      
      setRateDialogOpen(false);
      fetchRates();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save commission rate');
    }
  };

  const handleDeleteRate = async (rateId) => {
    if (!window.confirm('Are you sure you want to delete this commission rate?')) {
      return;
    }
    
    try {
      await commissionAPI.deleteRate(rateId);
      setSuccess('Commission rate deleted successfully');
      fetchRates();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete commission rate');
    }
  };

  const handleCalculate = async () => {
    try {
      setError(null);
      const response = await commissionAPI.calculateCommissions(calculationForm);
      setCalculationResults(response.data);
      setSuccess('Commissions calculated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to calculate commissions');
    }
  };

  const handleCreatePayment = (commission) => {
    setEditingPayment(null);
    setPaymentForm({
      entity_type: commission.entity_type || 'doctor',
      entity_id: commission.entity_id,
      entity_name: commission.entity_name,
      period_start: calculationForm.period_start,
      period_end: calculationForm.period_end,
      total_revenue: commission.total_revenue,
      commission_rate: '',
      commission_amount: commission.commission_amount,
      payment_status: 'pending',
      payment_date: '',
      payment_reference: '',
      notes: '',
    });
    setPaymentDialogOpen(true);
  };

  const handleSavePayment = async () => {
    try {
      setError(null);
      const data = {
        ...paymentForm,
        total_revenue: parseFloat(paymentForm.total_revenue),
        commission_rate: parseFloat(paymentForm.commission_rate),
        commission_amount: parseFloat(paymentForm.commission_amount),
        period_start: paymentForm.period_start,
        period_end: paymentForm.period_end,
        payment_date: paymentForm.payment_date || null,
      };
      
      if (editingPayment) {
        await commissionAPI.updatePayment(editingPayment.id, data);
        setSuccess('Commission payment updated successfully');
      } else {
        await commissionAPI.createPayment(data);
        setSuccess('Commission payment created successfully');
      }
      
      setPaymentDialogOpen(false);
      fetchPayments();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save commission payment');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Commission Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => {
            fetchRates();
            fetchPayments();
          }}
        >
          Refresh
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

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Commission Rates" />
            <Tab label="Calculate Commissions" />
            <Tab label="Payment Records" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Commission Rates</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateRate}
            >
              Add Rate
            </Button>
          </Box>

          {loading ? (
            <CircularProgress />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Entity Type</TableCell>
                    <TableCell>Entity Name</TableCell>
                    <TableCell>Rate Type</TableCell>
                    <TableCell>Rate Value</TableCell>
                    <TableCell>Min/Max</TableCell>
                    <TableCell>Effective Period</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell>{rate.entity_type}</TableCell>
                      <TableCell>{rate.entity_name || rate.entity_id || 'General'}</TableCell>
                      <TableCell>{rate.rate_type}</TableCell>
                      <TableCell>
                        {rate.rate_type === 'percentage' ? `${rate.rate_value}%` : formatCurrency(rate.rate_value)}
                      </TableCell>
                      <TableCell>
                        {rate.min_amount || rate.max_amount
                          ? `${rate.min_amount ? formatCurrency(rate.min_amount) : '-'} / ${rate.max_amount ? formatCurrency(rate.max_amount) : '-'}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {rate.effective_from ? new Date(rate.effective_from).toLocaleDateString() : '-'}
                        {rate.effective_to ? ` - ${new Date(rate.effective_to).toLocaleDateString()}` : ' (ongoing)'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rate.is_active ? 'Active' : 'Inactive'}
                          color={rate.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEditRate(rate)}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteRate(rate.id)}>
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Calculate Commissions
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Entity Type</InputLabel>
                <Select
                  value={calculationForm.entity_type}
                  label="Entity Type"
                  onChange={(e) => setCalculationForm({ ...calculationForm, entity_type: e.target.value })}
                >
                  <MenuItem value="doctor">Doctor</MenuItem>
                  <MenuItem value="rep">Representative</MenuItem>
                  <MenuItem value="pharmacy">Pharmacy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Period Start"
                type="date"
                value={calculationForm.period_start}
                onChange={(e) => setCalculationForm({ ...calculationForm, period_start: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Period End"
                type="date"
                value={calculationForm.period_end}
                onChange={(e) => setCalculationForm({ ...calculationForm, period_end: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <Button
            variant="contained"
            startIcon={<Calculate />}
            onClick={handleCalculate}
            disabled={!calculationForm.period_start || !calculationForm.period_end}
          >
            Calculate Commissions
          </Button>

          {calculationResults && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Calculation Results
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Entity Name</TableCell>
                      <TableCell align="right">Total Revenue</TableCell>
                      <TableCell align="right">Commission Amount</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {calculationResults.commissions.map((comm, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{comm.entity_name}</TableCell>
                        <TableCell align="right">{formatCurrency(comm.total_revenue)}</TableCell>
                        <TableCell align="right">{formatCurrency(comm.commission_amount)}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            startIcon={<Payment />}
                            onClick={() => handleCreatePayment(comm)}
                          >
                            Create Payment
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Payment Records
          </Typography>
          {loading ? (
            <CircularProgress />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Entity Name</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Commission</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Payment Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.entity_name}</TableCell>
                      <TableCell>
                        {payment.period_start ? new Date(payment.period_start).toLocaleDateString() : '-'}
                        {' - '}
                        {payment.period_end ? new Date(payment.period_end).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(payment.total_revenue)}</TableCell>
                      <TableCell align="right">{formatCurrency(payment.commission_amount)}</TableCell>
                      <TableCell>
                        <Chip
                          label={payment.payment_status}
                          color={
                            payment.payment_status === 'paid' ? 'success' :
                            payment.payment_status === 'pending' ? 'warning' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingPayment(payment);
                            setPaymentForm({
                              entity_type: payment.entity_type,
                              entity_id: payment.entity_id,
                              entity_name: payment.entity_name,
                              period_start: payment.period_start,
                              period_end: payment.period_end,
                              total_revenue: payment.total_revenue,
                              commission_rate: payment.commission_rate,
                              commission_amount: payment.commission_amount,
                              payment_status: payment.payment_status,
                              payment_date: payment.payment_date ? payment.payment_date.split('T')[0] : '',
                              payment_reference: payment.payment_reference || '',
                              notes: payment.notes || '',
                            });
                            setPaymentDialogOpen(true);
                          }}
                        >
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Card>

      {/* Rate Dialog */}
      <Dialog open={rateDialogOpen} onClose={() => setRateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRate ? 'Edit' : 'Create'} Commission Rate</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Entity Type</InputLabel>
                <Select
                  value={rateForm.entity_type}
                  label="Entity Type"
                  onChange={(e) => setRateForm({ ...rateForm, entity_type: e.target.value })}
                >
                  <MenuItem value="doctor">Doctor</MenuItem>
                  <MenuItem value="rep">Representative</MenuItem>
                  <MenuItem value="pharmacy">Pharmacy</MenuItem>
                  <MenuItem value="product">Product</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Entity ID (optional)"
                value={rateForm.entity_id}
                onChange={(e) => setRateForm({ ...rateForm, entity_id: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Entity Name (optional)"
                value={rateForm.entity_name}
                onChange={(e) => setRateForm({ ...rateForm, entity_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rate Type</InputLabel>
                <Select
                  value={rateForm.rate_type}
                  label="Rate Type"
                  onChange={(e) => setRateForm({ ...rateForm, rate_type: e.target.value })}
                >
                  <MenuItem value="percentage">Percentage</MenuItem>
                  <MenuItem value="fixed">Fixed Amount</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={rateForm.rate_type === 'percentage' ? 'Rate (%)' : 'Fixed Amount'}
                type="number"
                value={rateForm.rate_value}
                onChange={(e) => setRateForm({ ...rateForm, rate_value: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Min Amount (optional)"
                type="number"
                value={rateForm.min_amount}
                onChange={(e) => setRateForm({ ...rateForm, min_amount: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max Amount (optional)"
                type="number"
                value={rateForm.max_amount}
                onChange={(e) => setRateForm({ ...rateForm, max_amount: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Effective From"
                type="date"
                value={rateForm.effective_from}
                onChange={(e) => setRateForm({ ...rateForm, effective_from: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Effective To (optional)"
                type="date"
                value={rateForm.effective_to}
                onChange={(e) => setRateForm({ ...rateForm, effective_to: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRate}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPayment ? 'Edit' : 'Create'} Commission Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Entity Name"
                value={paymentForm.entity_name}
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Period Start"
                type="date"
                value={paymentForm.period_start ? paymentForm.period_start.split('T')[0] : ''}
                onChange={(e) => setPaymentForm({ ...paymentForm, period_start: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Period End"
                type="date"
                value={paymentForm.period_end ? paymentForm.period_end.split('T')[0] : ''}
                onChange={(e) => setPaymentForm({ ...paymentForm, period_end: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Total Revenue"
                type="number"
                value={paymentForm.total_revenue}
                onChange={(e) => setPaymentForm({ ...paymentForm, total_revenue: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Commission Rate (%)"
                type="number"
                value={paymentForm.commission_rate}
                onChange={(e) => setPaymentForm({ ...paymentForm, commission_rate: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Commission Amount"
                type="number"
                value={paymentForm.commission_amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, commission_amount: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={paymentForm.payment_status}
                  label="Payment Status"
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_status: e.target.value })}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Payment Date"
                type="date"
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Payment Reference"
                value={paymentForm.payment_reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_reference: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePayment}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CommissionManagement;

