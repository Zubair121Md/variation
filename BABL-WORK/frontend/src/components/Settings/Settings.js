import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Grid,
  Chip,
} from '@mui/material';
import {
  Person,
  Settings as SettingsIcon,
  Security,
  DataUsage,
} from '@mui/icons-material';
import { importTemplateAPI } from '../../services/api';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Settings() {
  const { user } = useSelector((state) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    full_name: user?.full_name || '',
  });
  const [preferences, setPreferences] = useState({
    theme: 'light',
    notifications: true,
    autoRefresh: true,
    dataRetention: '1year',
  });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
  });

  // Import templates state
  const [templates, setTemplates] = useState([]);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    file_type: 'invoice',
    description: '',
    required_columns: 'Pharmacy_Name, Product, Quantity, Amount',
    optional_columns: '',
  });
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setTemplateLoading(true);
        const res = await importTemplateAPI.listTemplates();
        setTemplates(res.data.templates || []);
      } catch (e) {
        console.error('Failed to load import templates', e);
        setTemplateError('Failed to load import templates');
      } finally {
        setTemplateLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePreferenceChange = (e) => {
    setPreferences({
      ...preferences,
      [e.target.name]: e.target.value,
    });
  };

  const handleSecurityChange = (e) => {
    setSecuritySettings({
      ...securitySettings,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = () => {
    // TODO: Implement profile update
    console.log('Saving profile:', profileData);
  };

  const handleSavePreferences = () => {
    // TODO: Implement preferences update
    console.log('Saving preferences:', preferences);
  };

  const handleSaveSecurity = () => {
    // TODO: Implement security settings update
    console.log('Saving security settings:', securitySettings);
  };

  const handleTemplateInputChange = (e) => {
    const { name, value } = e.target;
    setTemplateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateTemplate = async () => {
    try {
      setTemplateError(null);
      setTemplateLoading(true);
      const required = templateForm.required_columns
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const optional = templateForm.optional_columns
        ? templateForm.optional_columns
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      await importTemplateAPI.createTemplate({
        name: templateForm.name,
        file_type: templateForm.file_type,
        description: templateForm.description,
        required_columns: required,
        optional_columns: optional,
      });

      // Reload list
      const res = await importTemplateAPI.listTemplates();
      setTemplates(res.data.templates || []);
      setTemplateForm((prev) => ({
        ...prev,
        name: '',
        description: '',
      }));
    } catch (e) {
      console.error('Failed to create template', e);
      setTemplateError(
        e.response?.data?.detail || 'Failed to create template'
      );
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      setTemplateError(null);
      setTemplateLoading(true);
      await importTemplateAPI.deleteTemplate(id);
      const res = await importTemplateAPI.listTemplates();
      setTemplates(res.data.templates || []);
    } catch (e) {
      console.error('Failed to delete template', e);
      setTemplateError(
        e.response?.data?.detail || 'Failed to delete template'
      );
    } finally {
      setTemplateLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Manage your account settings and preferences.
      </Typography>

      <Card sx={{ mt: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<Person />} label="Profile" />
            <Tab icon={<SettingsIcon />} label="Preferences" />
            <Tab icon={<Security />} label="Security" />
            <Tab icon={<DataUsage />} label="Data Management" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={profileData.username}
                  onChange={handleProfileChange}
                  disabled
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="full_name"
                  value={profileData.full_name}
                  onChange={handleProfileChange}
                />
              </Grid>
            </Grid>
            <Box mt={3}>
              <Button variant="contained" onClick={handleSaveProfile}>
                Save Profile
              </Button>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box>
            <Typography variant="h6" gutterBottom>
              User Preferences
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Theme"
                  name="theme"
                  value={preferences.theme}
                  onChange={handlePreferenceChange}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Data Retention"
                  name="dataRetention"
                  value={preferences.dataRetention}
                  onChange={handlePreferenceChange}
                >
                  <option value="6months">6 Months</option>
                  <option value="1year">1 Year</option>
                  <option value="2years">2 Years</option>
                  <option value="5years">5 Years</option>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.notifications}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        notifications: e.target.checked,
                      })}
                    />
                  }
                  label="Enable Notifications"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.autoRefresh}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        autoRefresh: e.target.checked,
                      })}
                    />
                  }
                  label="Auto Refresh Data"
                />
              </Grid>
            </Grid>
            <Box mt={3}>
              <Button variant="contained" onClick={handleSavePreferences}>
                Save Preferences
              </Button>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.twoFactor}
                      onChange={(e) => setSecuritySettings({
                        ...securitySettings,
                        twoFactor: e.target.checked,
                      })}
                    />
                  }
                  label="Two-Factor Authentication"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Session Timeout (minutes)"
                  name="sessionTimeout"
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={handleSecurityChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Password Expiry (days)"
                  name="passwordExpiry"
                  type="number"
                  value={securitySettings.passwordExpiry}
                  onChange={handleSecurityChange}
                />
              </Grid>
            </Grid>
            <Box mt={3}>
              <Button variant="contained" onClick={handleSaveSecurity}>
                Save Security Settings
              </Button>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Data Management
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Define reusable import templates to standardize your Excel file formats
              for invoices and master data.
            </Alert>
            {templateError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {templateError}
              </Alert>
            )}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      New Import Template
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Specify required columns for your upload files.
                    </Typography>
                    <TextField
                      fullWidth
                      label="Template Name"
                      name="name"
                      value={templateForm.name}
                      onChange={handleTemplateInputChange}
                      sx={{ mt: 2 }}
                    />
                    <TextField
                      fullWidth
                      select
                      label="File Type"
                      name="file_type"
                      value={templateForm.file_type}
                      onChange={handleTemplateInputChange}
                      sx={{ mt: 2 }}
                    >
                      <option value="invoice">Invoice</option>
                      <option value="master">Master</option>
                      <option value="enhanced">Enhanced (both)</option>
                    </TextField>
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      value={templateForm.description}
                      onChange={handleTemplateInputChange}
                      sx={{ mt: 2 }}
                      multiline
                      minRows={2}
                    />
                    <TextField
                      fullWidth
                      label="Required Columns (comma-separated)"
                      name="required_columns"
                      value={templateForm.required_columns}
                      onChange={handleTemplateInputChange}
                      sx={{ mt: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Optional Columns (comma-separated)"
                      name="optional_columns"
                      value={templateForm.optional_columns}
                      onChange={handleTemplateInputChange}
                      sx={{ mt: 2 }}
                    />
                    <Box mt={3}>
                      <Button
                        variant="contained"
                        onClick={handleCreateTemplate}
                        disabled={templateLoading}
                      >
                        {templateLoading ? 'Saving...' : 'Save Template'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Existing Templates
                    </Typography>
                    {templateLoading && templates.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Loading templates...
                      </Typography>
                    ) : templates.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No templates defined yet.
                      </Typography>
                    ) : (
                      <Box>
                        {templates.map((t) => (
                          <Box
                            key={t.id}
                            sx={{
                              mb: 1,
                              p: 1,
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Box>
                              <Typography variant="subtitle2">
                                {t.name}{' '}
                                <Chip
                                  label={t.file_type}
                                  size="small"
                                  sx={{ ml: 1 }}
                                />
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Required: {t.required_columns.join(', ')}
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleDeleteTemplate(t.id)}
                            >
                              Delete
                            </Button>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Card>
    </Box>
  );
}

export default Settings;

