import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
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
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PictureAsPdf,
  Schedule,
  History,
  Add,
  Delete,
  Download,
  Refresh,
} from '@mui/icons-material';
import { reportingAPI } from '../../services/api';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Reporting() {
  const [tabValue, setTabValue] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [reportHistory, setReportHistory] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Generate report dialog
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    title: 'Analytics Report',
    report_type: 'analytics',
    start_date: '',
    end_date: '',
    template_id: null,
  });
  
  // Schedule report dialog
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    template_id: null,
    schedule_type: 'daily',
    recipients: [],
    is_active: true,
  });

  useEffect(() => {
    fetchTemplates();
    fetchReportHistory();
    fetchScheduledReports();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await reportingAPI.getTemplates();
      setTemplates(response.data.templates || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportHistory = async () => {
    setLoading(true);
    try {
      const response = await reportingAPI.getReportHistory(50);
      setReportHistory(response.data.reports || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch report history');
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledReports = async () => {
    setLoading(true);
    try {
      const response = await reportingAPI.getScheduledReports();
      setScheduledReports(response.data.scheduled_reports || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch scheduled reports');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setError(null);
      const response = await reportingAPI.generateReport(generateForm);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess('Report generated successfully');
      setGenerateDialogOpen(false);
      fetchReportHistory();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate report');
    }
  };

  const handleCreateScheduledReport = async () => {
    try {
      setError(null);
      await reportingAPI.createScheduledReport(scheduleForm);
      setSuccess('Scheduled report created successfully');
      setScheduleDialogOpen(false);
      fetchScheduledReports();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create scheduled report');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Advanced Reporting
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<PictureAsPdf />}
            onClick={() => setGenerateDialogOpen(true)}
          >
            Generate Report
          </Button>
          <Button
            variant="outlined"
            startIcon={<Schedule />}
            onClick={() => setScheduleDialogOpen(true)}
          >
            Schedule Report
          </Button>
        </Box>
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
            <Tab label="Report History" />
            <Tab label="Scheduled Reports" />
            <Tab label="Templates" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Report History</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={fetchReportHistory}
            >
              Refresh
            </Button>
          </Box>

          {loading ? (
            <CircularProgress />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Report Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Generated At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportHistory.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{report.report_name}</TableCell>
                      <TableCell>{report.report_type}</TableCell>
                      <TableCell>
                        <Chip
                          label={report.status}
                          color={report.status === 'completed' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {report.generated_at
                          ? new Date(report.generated_at).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {report.status === 'completed' && (
                          <Tooltip title="Download PDF">
                            <IconButton size="small">
                              <Download />
                            </IconButton>
                          </Tooltip>
                        )}
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
            Scheduled Reports
          </Typography>
          {loading ? (
            <CircularProgress />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Schedule</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Next Run</TableCell>
                    <TableCell>Last Run</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scheduledReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{report.name}</TableCell>
                      <TableCell>{report.schedule_type}</TableCell>
                      <TableCell>
                        <Chip
                          label={report.is_active ? 'Active' : 'Inactive'}
                          color={report.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {report.next_run
                          ? new Date(report.next_run).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {report.last_run
                          ? new Date(report.last_run).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="error">
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

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Report Templates
          </Typography>
          {loading ? (
            <CircularProgress />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>{template.name}</TableCell>
                      <TableCell>{template.template_type}</TableCell>
                      <TableCell>{template.description || '-'}</TableCell>
                      <TableCell>
                        {template.created_at
                          ? new Date(template.created_at).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="error">
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
      </Card>

      {/* Generate Report Dialog */}
      <Dialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Generate Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Report Title"
                value={generateForm.title}
                onChange={(e) => setGenerateForm({ ...generateForm, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={generateForm.report_type}
                  label="Report Type"
                  onChange={(e) => setGenerateForm({ ...generateForm, report_type: e.target.value })}
                >
                  <MenuItem value="analytics">Analytics</MenuItem>
                  <MenuItem value="revenue">Revenue</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={generateForm.start_date}
                onChange={(e) => setGenerateForm({ ...generateForm, start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={generateForm.end_date}
                onChange={(e) => setGenerateForm({ ...generateForm, end_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Template (Optional)</InputLabel>
                <Select
                  value={generateForm.template_id || ''}
                  label="Template (Optional)"
                  onChange={(e) => setGenerateForm({ ...generateForm, template_id: e.target.value || null })}
                >
                  <MenuItem value="">None</MenuItem>
                  {templates.map(t => (
                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleGenerateReport}>
            Generate PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Report Dialog */}
      <Dialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Schedule Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Report Name"
                value={scheduleForm.name}
                onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Schedule Type</InputLabel>
                <Select
                  value={scheduleForm.schedule_type}
                  label="Schedule Type"
                  onChange={(e) => setScheduleForm({ ...scheduleForm, schedule_type: e.target.value })}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Template</InputLabel>
                <Select
                  value={scheduleForm.template_id || ''}
                  label="Template"
                  onChange={(e) => setScheduleForm({ ...scheduleForm, template_id: e.target.value || null })}
                >
                  <MenuItem value="">None</MenuItem>
                  {templates.map(t => (
                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateScheduledReport}>
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Reporting;

