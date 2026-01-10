import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  TrendingUp,
  Store,
  Person,
  AttachMoney,
  Refresh,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import {
  fetchDashboardData,
  fetchRevenueByPharmacy,
  fetchRevenueByDoctor,
  fetchRevenueByRep,
  clearAnalyticsCache,
  resetAnalyticsState,
} from '../../store/slices/analyticsSlice';
import { analyticsAPI, dashboardAPI } from '../../services/api';
import RevenueChart from './RevenueChart';
import MetricsCard from './MetricsCard';

function Dashboard() {
  const dispatch = useDispatch();
  const {
    dashboardData,
    revenueByPharmacy,
    revenueByDoctor,
    revenueByRep,
    loading,
    error,
  } = useSelector((state) => state.analytics);

  // Dashboard widget layout / visibility
  const defaultWidgets = useMemo(
    () => [
      { id: 'summary', label: 'Summary Metrics', visible: true },
      { id: 'pharmacyRevenue', label: 'Revenue by Pharmacy', visible: true },
      { id: 'doctorRevenue', label: 'Revenue by Doctor', visible: true },
      { id: 'repRevenue', label: 'Revenue by Representative', visible: true },
      { id: 'recentActivity', label: 'Recent Activity', visible: true },
    ],
    []
  );

  const [widgets, setWidgets] = useState(defaultWidgets);
  const [layoutDialogOpen, setLayoutDialogOpen] = useState(false);
  const [savingLayout, setSavingLayout] = useState(false);

  const refreshAllData = useCallback(() => {
    dispatch(fetchDashboardData());
    dispatch(fetchRevenueByPharmacy());
    dispatch(fetchRevenueByDoctor());
    dispatch(fetchRevenueByRep());
  }, [dispatch]);

  // Load dashboard layout preferences on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await dashboardAPI.getPreferences();
        if (!isMounted) return;
        if (res.data && Array.isArray(res.data.widgets) && res.data.widgets.length > 0) {
          setWidgets(res.data.widgets);
        }
      } catch (e) {
        console.error('Failed to load dashboard preferences, using defaults.', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleWidget = (id) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const handleSaveLayout = async () => {
    try {
      setSavingLayout(true);
      await dashboardAPI.savePreferences({ widgets });
      setLayoutDialogOpen(false);
    } catch (e) {
      console.error('Failed to save dashboard preferences', e);
    } finally {
      setSavingLayout(false);
    }
  };

  useEffect(() => {
    refreshAllData();
    
    // Listen for analytics data updates (e.g., after split rule changes)
    const handleAnalyticsUpdate = () => {
      console.log('Analytics data updated, refreshing dashboard...');
      refreshAllData();
    };
    
    window.addEventListener('analyticsDataUpdated', handleAnalyticsUpdate);
    
    return () => {
      window.removeEventListener('analyticsDataUpdated', handleAnalyticsUpdate);
    };
  }, [refreshAllData]);

  const handleRefresh = async () => {
    await dispatch(clearAnalyticsCache());
    dispatch(resetAnalyticsState());
    dispatch(fetchDashboardData());
    dispatch(fetchRevenueByPharmacy());
    dispatch(fetchRevenueByDoctor());
    dispatch(fetchRevenueByRep());
  };

  const handleSaveRevenue = async (newValue) => {
    try {
      const analysisId = dashboardData?.analysis_id;
      if (!analysisId) {
        throw new Error('No analysis ID available');
      }
      
      await analyticsAPI.setOverride(analysisId, parseFloat(newValue));
      
      // Refresh dashboard data to show updated value
      dispatch(fetchDashboardData());
      
      return Promise.resolve();
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to save revenue override');
    }
  };

  const handleCancelRevenue = () => {
    // Optionally refresh to get the original value
    dispatch(fetchDashboardData());
  };

  if (loading && !dashboardData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={handleRefresh}>
          Retry
        </Button>
      }>
        {typeof error === 'string' ? error : JSON.stringify(error)}
      </Alert>
    );
  }

  // Check if data requires analysis
  if (dashboardData?.requires_analysis) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h4" gutterBottom color="text.secondary">
          No Data Available
        </Typography>
        <Typography variant="body1" gutterBottom color="text.secondary" sx={{ mb: 4 }}>
          {dashboardData.message || "Please upload files and click 'Analyze' to generate analytics."}
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<Refresh />}
          onClick={() => window.location.href = '/upload'}
        >
          Go to File Upload
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            color="primary"
            aria-label="customize dashboard"
            onClick={() => setLayoutDialogOpen(true)}
          >
            <SettingsIcon />
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Summary Metrics */}
      {widgets.find((w) => w.id === 'summary' && w.visible) && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricsCard
              title="Total Revenue"
              value={dashboardData?.total_revenue || 0}
              icon={<AttachMoney />}
              color="primary"
              format="currency"
              editable={true}
              onSave={handleSaveRevenue}
              onCancel={handleCancelRevenue}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricsCard
              title="Total Pharmacies"
              value={dashboardData?.total_pharmacies || 0}
              icon={<Store />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricsCard
              title="Total Doctors"
              value={dashboardData?.total_doctors || 0}
              icon={<Person />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricsCard
              title="Growth Rate"
              value={dashboardData?.growth_rate || 0}
              icon={<TrendingUp />}
              color="warning"
              format="percentage"
              tooltip="Growth is computed vs the previous analysis snapshot. If none exists, growth is 0% (or 100% if current > 0 and previous = 0)."
            />
          </Grid>
        </Grid>
      )}

      {/* Charts */}
      <Grid container spacing={3}>
        {widgets.find((w) => w.id === 'pharmacyRevenue' && w.visible) && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue by Pharmacy
                </Typography>
                <RevenueChart
                  data={revenueByPharmacy}
                  type="bar"
                  xKey="name"
                  yKey="revenue"
                  height={600}
                  autoScale={true}
                  topN={15}
                />
              </CardContent>
            </Card>
          </Grid>
        )}
        {widgets.find((w) => w.id === 'doctorRevenue' && w.visible) && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue by Doctor
                </Typography>
                <RevenueChart
                  data={revenueByDoctor}
                  type="bar"
                  xKey="doctor_name"
                  yKey="revenue"
                  height={600}
                  autoScale={true}
                  topN={15}
                />
              </CardContent>
            </Card>
          </Grid>
        )}
        {widgets.find((w) => w.id === 'repRevenue' && w.visible) && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue by Representative
                </Typography>
                <RevenueChart
                  data={revenueByRep}
                  type="bar"
                  xKey="rep_name"
                  yKey="revenue"
                  height={600}
                  autoScale={true}
                  topN={15}
                />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Recent Activity */}
      {widgets.find((w) => w.id === 'recentActivity' && w.visible) && dashboardData?.recent_activity && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Box>
              {dashboardData.recent_activity.map((activity, index) => (
                <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2">
                    {activity.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(activity.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Layout customization dialog */}
      <Dialog
        open={layoutDialogOpen}
        onClose={() => setLayoutDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Customize Dashboard</DialogTitle>
        <DialogContent>
          {widgets.map((widget) => (
            <FormControlLabel
              key={widget.id}
              control={
                <Switch
                  checked={widget.visible}
                  onChange={() => handleToggleWidget(widget.id)}
                  color="primary"
                />
              }
              label={widget.label}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLayoutDialogOpen(false)} disabled={savingLayout}>
            Cancel
          </Button>
          <Button onClick={handleSaveLayout} variant="contained" disabled={savingLayout}>
            {savingLayout ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Dashboard;
